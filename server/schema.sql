DROP DATABASE IF EXISTS dormitory_db;

CREATE DATABASE dormitory_db
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE dormitory_db;

CREATE TABLE STUDENT (
  student_id CHAR(8) PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  gender VARCHAR(10),
  department VARCHAR(50),
  phone VARCHAR(15) UNIQUE,
  email VARCHAR(100)
);

CREATE TABLE ADMINISTRATOR (
  admin_id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL,
  phone VARCHAR(15),
  position VARCHAR(50)
);

CREATE TABLE DORMITORY (
  dorm_id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL UNIQUE,
  address VARCHAR(100),
  gender_limit VARCHAR(10)
);

CREATE TABLE ROOM (
  room_id VARCHAR(10) PRIMARY KEY,
  dorm_id INT,
  room_number VARCHAR(10),
  floor INT,
  capacity INT CHECK (capacity > 0),
  FOREIGN KEY (dorm_id) REFERENCES DORMITORY(dorm_id)
);

CREATE TABLE BED (
  bed_id VARCHAR(10) PRIMARY KEY,
  room_id VARCHAR(10),
  bed_number INT,
  availability ENUM('空床', '已入住', '維修中') DEFAULT '空床',
  FOREIGN KEY (room_id) REFERENCES ROOM(room_id)
);

CREATE TABLE CHECKIN (
  checkin_id INT PRIMARY KEY AUTO_INCREMENT,
  student_id CHAR(8),
  student_snapshot_id CHAR(8),
  student_snapshot_name VARCHAR(50),
  bed_id VARCHAR(10),
  checkin_date DATE NOT NULL,
  checkout_date DATE,
  status VARCHAR(20),
  change_reason VARCHAR(100),
  FOREIGN KEY (student_id) REFERENCES STUDENT(student_id),
  FOREIGN KEY (bed_id) REFERENCES BED(bed_id),
  CHECK (checkout_date IS NULL OR checkout_date >= checkin_date)
);

CREATE TABLE REPAIR (
  repair_id INT PRIMARY KEY AUTO_INCREMENT,
  student_id CHAR(8),
  room_id VARCHAR(10),
  admin_id INT NULL,
  description TEXT,
  photo_data LONGTEXT,
  equipment_type VARCHAR(50),
  submit_date DATETIME NOT NULL,
  finish_date DATETIME,
  status ENUM('待處理', '處理中', '已完成') DEFAULT '待處理',
  priority ENUM('低', '中', '高') DEFAULT '中',
  result_comment TEXT,
  FOREIGN KEY (student_id) REFERENCES STUDENT(student_id),
  FOREIGN KEY (room_id) REFERENCES ROOM(room_id),
  FOREIGN KEY (admin_id) REFERENCES ADMINISTRATOR(admin_id),
  CHECK (finish_date IS NULL OR finish_date >= submit_date)
);

CREATE TABLE REPAIR_MESSAGE (
  message_id INT PRIMARY KEY AUTO_INCREMENT,
  repair_id INT NOT NULL,
  sender_role ENUM('admin', 'student') NOT NULL,
  sender_name VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (repair_id) REFERENCES REPAIR(repair_id) ON DELETE CASCADE
);

INSERT INTO STUDENT (student_id, name, gender, department, phone, email)
VALUES
  ('11204501', '陳子瑄', '女', '資訊工程學系', '0912345678', 'tzuhsuan.c@univ.edu.tw'),
  ('11204522', '李柏宏', '男', '工商管理學系', '0923888123', 'bohong.lee@univ.edu.tw');

INSERT INTO ADMINISTRATOR (name, phone, position)
VALUES
  ('陳管理員', '0900000000', '學務處行政端');

INSERT INTO DORMITORY (name, address, gender_limit)
VALUES
  ('A 棟宿舍', '校本部 A 區', '女'),
  ('B 棟宿舍', '校本部 B 區', '男');

INSERT INTO ROOM (room_id, dorm_id, room_number, floor, capacity)
VALUES
  ('A101', 1, '101', 1, 4),
  ('A102', 1, '102', 1, 4),
  ('A103', 1, '103', 1, 4),
  ('A104', 1, '104', 1, 4),
  ('A105', 1, '105', 1, 4),
  ('A201', 1, '201', 2, 4),
  ('A202', 1, '202', 2, 4),
  ('A203', 1, '203', 2, 4),
  ('A204', 1, '204', 2, 4),
  ('A205', 1, '205', 2, 4),
  ('B101', 2, '101', 1, 4),
  ('B102', 2, '102', 1, 4),
  ('B103', 2, '103', 1, 4),
  ('B104', 2, '104', 1, 4),
  ('B105', 2, '105', 1, 4),
  ('B201', 2, '201', 2, 4),
  ('B202', 2, '202', 2, 4),
  ('B203', 2, '203', 2, 4),
  ('B204', 2, '204', 2, 4),
  ('B205', 2, '205', 2, 4);

INSERT INTO BED (bed_id, room_id, bed_number, availability)
SELECT
  CONCAT(room_id, '-', bed_number),
  room_id,
  bed_number,
  '空床'
FROM ROOM
CROSS JOIN (
  SELECT 1 AS bed_number
  UNION ALL SELECT 2
  UNION ALL SELECT 3
  UNION ALL SELECT 4
) bed_numbers;
