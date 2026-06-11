import express from "express";
import mysql from "mysql2/promise";
import cors from "cors";
import { existsSync, readFileSync } from "fs";

if (existsSync(".env")) {
  const envText = readFileSync(".env", "utf8");

  for (const line of envText.split(/\r?\n/)) {
    const trimmedLine = line.trim();

    if (!trimmedLine || trimmedLine.startsWith("#")) {
      continue;
    }

    const [key, ...valueParts] = trimmedLine.split("=");
    const value = valueParts.join("=").trim().replace(/^["']|["']$/g, "");

    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

const app = express();
const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || "0.0.0.0";
const allowedOrigin = process.env.FRONTEND_URL || true;

app.use(cors({ origin: allowedOrigin }));
app.use(express.json({ limit: "5mb" }));

const pool = mysql.createPool({
  host: process.env.DB_HOST || process.env.MYSQLHOST || "localhost",
  port: Number(process.env.DB_PORT || process.env.MYSQLPORT || 3306),
  user: process.env.DB_USER || process.env.MYSQLUSER || "root",
  password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || "",
  database: process.env.DB_NAME || process.env.MYSQLDATABASE || "dormitory_db",
  waitForConnections: true,
  connectionLimit: 10,
  namedPlaceholders: true
});

function normalizeStudent(row) {
  return {
    id: row.student_id,
    name: row.name,
    gender: row.gender || "",
    department: row.department || "",
    phone: row.phone || "",
    email: row.email || "",
    bed: row.bed || "",
    status: row.status || ""
  };
}

function getStudentPayload(body) {
  return {
    id: String(body.id || "").trim(),
    name: String(body.name || "").trim(),
    gender: String(body.gender || "").trim(),
    department: String(body.department || "").trim(),
    phone: String(body.phone || "").trim(),
    email: String(body.email || "").trim(),
    bed: String(body.bed || "").trim(),
    status: String(body.status || "").trim(),
    checkinDate: String(body.checkinDate || "").trim()
  };
}

function nullable(value) {
  return value || null;
}

function createBuildingRooms(building, dormName) {
  const rooms = [];

  for (let floor = 1; floor <= 2; floor += 1) {
    for (let roomNumber = 1; roomNumber <= 5; roomNumber += 1) {
      const displayRoomNumber = `${floor}${String(roomNumber).padStart(2, "0")}`;

      rooms.push({
        id: `${building}${displayRoomNumber}`,
        dormName,
        number: displayRoomNumber,
        floor,
        capacity: 4
      });
    }
  }

  return rooms;
}

async function ensureDormLayout() {
  const dorms = [
    { name: "A 棟宿舍", address: "校本部 A 區", gender: "女" },
    { name: "B 棟宿舍", address: "校本部 B 區", gender: "男" }
  ];

  for (const dorm of dorms) {
    await pool.execute(
      `INSERT INTO DORMITORY (name, address, gender_limit)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE
         address = VALUES(address),
         gender_limit = VALUES(gender_limit)`,
      [dorm.name, dorm.address, dorm.gender]
    );
  }

  const dormRooms = [
    ...createBuildingRooms("A", "A 棟宿舍"),
    ...createBuildingRooms("B", "B 棟宿舍")
  ];

  for (const room of dormRooms) {
    await pool.execute(
      `INSERT IGNORE INTO ROOM (room_id, dorm_id, room_number, floor, capacity)
       SELECT ?, dorm_id, ?, ?, ?
       FROM DORMITORY
       WHERE name = ?`,
      [room.id, room.number, room.floor, room.capacity, room.dormName]
    );

    for (let bedNumber = 1; bedNumber <= room.capacity; bedNumber += 1) {
      await pool.execute(
        `INSERT IGNORE INTO BED (bed_id, room_id, bed_number, availability)
         VALUES (?, ?, ?, '空床')`,
        [`${room.id}-${bedNumber}`, room.id, bedNumber]
      );
    }
  }
}

async function ensureRepairPhotoColumn() {
  const [columns] = await pool.execute(
    `SHOW COLUMNS FROM REPAIR LIKE 'photo_data'`
  );

  if (columns.length === 0) {
    await pool.execute(
      `ALTER TABLE REPAIR ADD COLUMN photo_data LONGTEXT NULL AFTER description`
    );
  }
}

async function syncStudentCheckin(connection, student) {
  if (!student.status && !student.bed) {
    return;
  }

  const [[currentCheckin]] = await connection.execute(
    `SELECT checkin_id, bed_id
     FROM CHECKIN
     WHERE student_id = ? AND checkout_date IS NULL
     ORDER BY checkin_id DESC
     LIMIT 1`,
    [student.id]
  );

  if (student.status === "已退宿") {
    if (currentCheckin) {
      await connection.execute(
        `UPDATE CHECKIN
         SET checkout_date = CASE
               WHEN CURRENT_DATE > checkin_date THEN CURRENT_DATE
               ELSE DATE_ADD(checkin_date, INTERVAL 1 DAY)
             END,
             status = '已退宿'
         WHERE checkin_id = ?`,
        [currentCheckin.checkin_id]
      );

      await connection.execute(
        `UPDATE BED SET availability = '空床' WHERE bed_id = ?`,
        [currentCheckin.bed_id]
      );
    }

    return;
  }

  if (student.status === "入住中" && student.bed) {
    const checkinDate = student.checkinDate || null;
    const [[bed]] = await connection.execute(
      "SELECT bed_id FROM BED WHERE bed_id = ?",
      [student.bed]
    );

    if (!bed) {
      throw new Error("床位不存在");
    }

    if (currentCheckin) {
      if (currentCheckin.bed_id !== student.bed) {
        await connection.execute(
          `UPDATE BED SET availability = '空床' WHERE bed_id = ?`,
          [currentCheckin.bed_id]
        );

        await connection.execute(
          `UPDATE CHECKIN
           SET checkout_date = CASE
                 WHEN COALESCE(?, CURRENT_DATE) >= checkin_date THEN COALESCE(?, CURRENT_DATE)
                 ELSE checkin_date
               END,
               status = '已換房',
               change_reason = ?
           WHERE checkin_id = ?`,
          [checkinDate, checkinDate, `換房至 ${student.bed}`, currentCheckin.checkin_id]
        );

        await connection.execute(
          `INSERT INTO CHECKIN (student_id, bed_id, checkin_date, status, change_reason)
           VALUES (?, ?, COALESCE(?, CURRENT_DATE), '入住中', ?)`,
          [student.id, student.bed, checkinDate, `由 ${currentCheckin.bed_id} 換房入住`]
        );
      } else {
        await connection.execute(
          `UPDATE CHECKIN
           SET status = '入住中'
           WHERE checkin_id = ?`,
          [currentCheckin.checkin_id]
        );
      }
    } else {
      await connection.execute(
        `INSERT INTO CHECKIN (student_id, bed_id, checkin_date, status)
         VALUES (?, ?, COALESCE(?, CURRENT_DATE), '入住中')`,
        [student.id, student.bed, checkinDate]
      );
    }

    await connection.execute(
      `UPDATE BED SET availability = '已入住' WHERE bed_id = ?`,
      [student.bed]
    );
  }
}

app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ ok: true, database: "connected" });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: "MySQL 連線失敗",
      error: error.message
    });
  }
});

app.get("/api/students", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
         s.student_id,
         s.name,
         s.gender,
         s.department,
         s.phone,
         s.email,
         c.bed_id AS bed,
         c.status
       FROM STUDENT s
       LEFT JOIN CHECKIN c
         ON c.student_id = s.student_id
        AND c.checkout_date IS NULL
       ORDER BY s.student_id`
    );

    res.json(rows.map(normalizeStudent));
  } catch (error) {
    res.status(500).json({
      message: "讀取學生資料失敗",
      error: error.message
    });
  }
});

app.post("/api/students", async (req, res) => {
  const student = getStudentPayload(req.body);

  if (!student.id || !student.name) {
    return res.status(400).json({ message: "請輸入學號與姓名" });
  }

  try {
    await pool.execute(
      `INSERT INTO STUDENT
       (student_id, name, gender, department, phone, email)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        student.id,
        student.name,
        nullable(student.gender),
        nullable(student.department),
        nullable(student.phone),
        nullable(student.email)
      ]
    );

    res.status(201).json(student);
  } catch (error) {
    const status = error.code === "ER_DUP_ENTRY" ? 409 : 500;
    res.status(status).json({
      message: status === 409 ? "學號已存在" : "新增學生資料失敗",
      error: error.message
    });
  }
});

app.put("/api/students/:id", async (req, res) => {
  const student = getStudentPayload({
    ...req.body,
    id: req.params.id
  });

  if (!student.name) {
    return res.status(400).json({ message: "請輸入姓名" });
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [result] = await connection.execute(
      `UPDATE STUDENT
       SET name = ?,
           gender = ?,
           department = ?,
           phone = ?,
           email = ?
       WHERE student_id = ?`,
      [
        student.name,
        nullable(student.gender),
        nullable(student.department),
        nullable(student.phone),
        nullable(student.email),
        student.id
      ]
    );

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "找不到學生資料" });
    }

    await syncStudentCheckin(connection, student);
    await connection.commit();

    res.json(student);
  } catch (error) {
    await connection.rollback();

    res.status(500).json({
      message: "更新學生資料失敗",
      error: error.message
    });
  } finally {
    connection.release();
  }
});

app.delete("/api/students/:id", async (req, res) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    await connection.execute(
      `UPDATE BED b
       JOIN CHECKIN c ON c.bed_id = b.bed_id
       SET b.availability = '空床'
       WHERE c.student_id = ?`,
      [req.params.id]
    );

    await connection.execute(
      `DELETE FROM CHECKIN WHERE student_id = ?`,
      [req.params.id]
    );

    await connection.execute(
      `DELETE FROM REPAIR WHERE student_id = ?`,
      [req.params.id]
    );

    const [result] = await connection.execute(
      `DELETE FROM STUDENT WHERE student_id = ?`,
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "找不到學生資料" });
    }

    await connection.commit();
    res.json({ ok: true });
  } catch (error) {
    await connection.rollback();

    res.status(500).json({
      message: "刪除學生資料失敗",
      error: error.message
    });
  } finally {
    connection.release();
  }
});

function normalizeRepair(row) {
  return {
    id: row.repair_id,
    studentId: row.student_id || "",
    room: row.room_id || "",
    item: row.equipment_type || "",
    status: row.status || "待處理",
    description: row.description || "",
    photoData: row.photo_data || "",
    submitDate: row.submit_date
  };
}

function normalizeCheckinHistory(row) {
  return {
    id: row.checkin_id,
    studentId: row.student_id,
    studentName: row.student_name || "",
    bed: row.bed_id || "",
    room: row.room_id || "",
    dormitory: row.dormitory_name || "",
    checkinDate: row.checkin_date,
    checkoutDate: row.checkout_date,
    status: row.status || "",
    changeReason: row.change_reason || ""
  };
}

app.get("/api/checkin-history", async (req, res) => {
  const studentId = String(req.query.studentId || "").trim();

  try {
    const params = [];
    let where = "";

    if (studentId) {
      where = "WHERE c.student_id = ?";
      params.push(studentId);
    }

    const [rows] = await pool.execute(
      `SELECT
         c.checkin_id,
         c.student_id,
         s.name AS student_name,
         c.bed_id,
         b.room_id,
         d.name AS dormitory_name,
         c.checkin_date,
         c.checkout_date,
         c.status,
         c.change_reason
       FROM CHECKIN c
       JOIN STUDENT s ON s.student_id = c.student_id
       JOIN BED b ON b.bed_id = c.bed_id
       JOIN ROOM r ON r.room_id = b.room_id
       JOIN DORMITORY d ON d.dorm_id = r.dorm_id
       ${where}
       ORDER BY c.checkin_date DESC, c.checkin_id DESC`,
      params
    );

    res.json(rows.map(normalizeCheckinHistory));
  } catch (error) {
    res.status(500).json({
      message: "讀取歷史住宿資料失敗",
      error: error.message
    });
  }
});

app.get("/api/repairs", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT repair_id, student_id, room_id, equipment_type, description, photo_data, status, submit_date
       FROM REPAIR
       ORDER BY submit_date DESC, repair_id DESC`
    );

    res.json(rows.map(normalizeRepair));
  } catch (error) {
    res.status(500).json({
      message: "讀取報修資料失敗",
      error: error.message
    });
  }
});

app.post("/api/repairs", async (req, res) => {
  const repair = {
    room: String(req.body.room || "").trim(),
    item: String(req.body.item || "").trim(),
    description: String(req.body.description || "").trim(),
    photoData: String(req.body.photoData || "").trim(),
    studentId: String(req.body.studentId || "").trim(),
    status: String(req.body.status || "待處理").trim()
  };

  if (!repair.room || !repair.item || !repair.description) {
    return res.status(400).json({ message: "請輸入房號、設備與報修原因" });
  }

  if (!["待處理", "處理中", "已完成"].includes(repair.status)) {
    return res.status(400).json({ message: "報修狀態不正確" });
  }

  try {
    const [[room]] = await pool.execute(
      "SELECT room_id FROM ROOM WHERE room_id = ?",
      [repair.room]
    );

    if (!room) {
      return res.status(404).json({ message: "找不到房號" });
    }

    const [result] = await pool.execute(
      `INSERT INTO REPAIR
       (student_id, room_id, equipment_type, description, photo_data, submit_date, status, priority)
       VALUES (?, ?, ?, ?, ?, NOW(), ?, '中')`,
      [nullable(repair.studentId), repair.room, repair.item, repair.description, nullable(repair.photoData), repair.status]
    );

    res.status(201).json({
      id: result.insertId,
      studentId: repair.studentId,
      room: repair.room,
      item: repair.item,
      status: repair.status,
      description: repair.description,
      photoData: repair.photoData,
      submitDate: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      message: "建立報修資料失敗",
      error: error.message
    });
  }
});

app.put("/api/repairs/:id", async (req, res) => {
  const status = String(req.body.status || "").trim();

  if (!["待處理", "處理中", "已完成"].includes(status)) {
    return res.status(400).json({ message: "報修狀態不正確" });
  }

  try {
    const [result] = await pool.execute(
      `UPDATE REPAIR
       SET status = ?,
           finish_date = CASE WHEN ? = '已完成' THEN NOW() ELSE NULL END
       WHERE repair_id = ?`,
      [status, status, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "找不到報修資料" });
    }

    res.json({ id: Number(req.params.id), status });
  } catch (error) {
    res.status(500).json({
      message: "更新報修狀態失敗",
      error: error.message
    });
  }
});

app.delete("/api/repairs/:id", async (req, res) => {
  try {
    const [result] = await pool.execute(
      "DELETE FROM REPAIR WHERE repair_id = ?",
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "找不到報修資料" });
    }

    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({
      message: "刪除報修資料失敗",
      error: error.message
    });
  }
});

Promise.all([ensureDormLayout(), ensureRepairPhotoColumn()])
  .then(() => {
    app.listen(port, host, () => {
      console.log(`Server running on http://${host}:${port}`);
    });
  })
  .catch(error => {
    console.error("初始化宿舍房間與床位失敗", error);
    process.exit(1);
  });
