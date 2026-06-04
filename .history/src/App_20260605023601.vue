<script setup>
import { ref, watch, computed } from "vue"

const searchKeyword = ref("")
const currentPage = ref("dashboard")

const menu = [
  { id: "dashboard", name: "總覽儀表板" },
  { id: "students", name: "學生名單" },
  { id: "rooms", name: "房型管理" },
  { id: "beds", name: "空餘床位" },
  { id: "checkin", name: "入住辦理" },
  { id: "repair", name: "維修申請" },
  { id: "status", name: "狀態追蹤" }
]

const students = ref(
  JSON.parse(
    localStorage.getItem("students")
  ) || [
    {
      id: "11204501",
      name: "陳子瑄",
      department: "資訊工程學系",
      phone: "0912-345-678",
      email: "tzuhsuan.c@univ.edu.tw"
    },
    {
      id: "11204522",
      name: "李柏宏",
      department: "工商管理學系",
      phone: "0923-888-123",
      email: "bohong.lee@univ.edu.tw"
    }
  ]
)

const emptyBeds = [
  { room: "A101", bed: "B002" },
  { room: "A102", bed: "B004" },
  { room: "B201", bed: "B007" }
]

const repairs = ref(
  JSON.parse(
    localStorage.getItem("repairs")
  ) || [
    {
      room: "A101",
      item: "冷氣",
      status: "待處理"
    }
  ]
)

const rooms = [
  {
    room: "A101",
    floor: 1,
    capacity: 4,
    occupied: 3
  },
  {
    room: "A102",
    floor: 1,
    capacity: 4,
    occupied: 2
  },
  {
    room: "B201",
    floor: 2,
    capacity: 4,
    occupied: 4
  },
  {
    room: "B202",
    floor: 2,
    capacity: 4,
    occupied: 1
  }
]

const newStudent = ref({
  id: "",
  name: "",
  department: "",
  phone: "",
  email: ""
})

function addStudent() {

  if (
    !newStudent.value.id ||
    !newStudent.value.name
  ) {
    alert("請輸入學號與姓名")
    return
  }

  students.value.push({
    id: newStudent.value.id,
    name: newStudent.value.name,
    department: newStudent.value.department,
    phone: newStudent.value.phone,
    email: newStudent.value.email
  })

  alert("新增成功")

  newStudent.value = {
    id: "",
    name: "",
    department: "",
    phone: "",
    email: ""
  }
}

const filteredStudents = computed(() => {

  if (!searchKeyword.value) {
    return students.value
  }

  return students.value.filter(student =>
    student.id.includes(searchKeyword.value) ||
    student.name.includes(searchKeyword.value) ||
    student.department.includes(searchKeyword.value)
  )

})

function deleteStudent(id) {
  const result = confirm("確定要刪除這位學生嗎？")

  if (!result) {
    return
  }

  students.value = students.value.filter(
    student => student.id !== id
  )
}

function editStudent(id) {
  const student = students.value.find(
    student => student.id === id
  )

  if (!student) {
    return
  }

  const newName = prompt("請輸入新的姓名", student.name)
  const newDepartment = prompt("請輸入新的系所", student.department)
  const newPhone = prompt("請輸入新的電話", student.phone)
  const newEmail = prompt("請輸入新的 Email", student.email)

  if (newName !== null) {
    student.name = newName
  }

  if (newDepartment !== null) {
    student.department = newDepartment
  }

  if (newPhone !== null) {
    student.phone = newPhone
  }

  if (newEmail !== null) {
    student.email = newEmail
  }

  alert("學生資料已更新")
}

function checkoutStudent(id) {
  const student = students.value.find(
    student => student.id === id
  )

  if (!student) {
    return
  }

  const result = confirm("確定要辦理退宿嗎？")

  if (!result) {
    return
  }

  student.status = "已退宿"
}

const repairForm = ref({
  room: "",
  item: "",
  status: "待處理"
})

function addRepair() {

  if (
    !repairForm.value.room ||
    !repairForm.value.item
  ) {
    alert("請輸入房號與設備")
    return
  }

  repairs.value.push({
    room: repairForm.value.room,
    item: repairForm.value.item,
    status: repairForm.value.status
  })

  alert("報修已建立")

  repairForm.value = {
    room: "",
    item: "",
    status: "待處理"
  }
}

const checkinForm = ref({
  studentId: "",
  bedId: "",
  date: ""
})

function createCheckin() {

  if (
    !checkinForm.value.studentId ||
    !checkinForm.value.bedId
  ) {
    alert("請輸入學號與床位")
    return
  }

  const student = students.find(
    s => s.id === checkinForm.value.studentId
  )

  if (!student) {
    alert("找不到學生")
    return
  }

  const bed = emptyBeds.find(
    b => b.bed === checkinForm.value.bedId
  )

  if (!bed) {
    alert("床位不存在或已被使用")
    return
  }

  student.status = "入住中"

  alert("入住成功")

  checkinForm.value = {
    studentId: "",
    bedId: "",
    date: ""
  }
}

watch(
  students,
  () => {
    localStorage.setItem(
      "students",
      JSON.stringify(students.value)
    )
  },
  { deep: true }
)

watch(
  repairs,
  () => {
    localStorage.setItem(
      "repairs",
      JSON.stringify(repairs.value)
    )
  },
  { deep: true }
)

</script>

<template>
  <div class="layout">

    <aside class="sidebar">

      <div class="logo">
        <div class="logo-icon">🏢</div>

        <div>
          <h2>宿舍管理系統</h2>
          <p>學務處行政端</p>
        </div>
      </div>

      <button
        v-for="item in menu"
        :key="item.id"
        :class="['menu-btn', currentPage === item.id ? 'active' : '']"
        @click="currentPage = item.id"
      >
        {{ item.name }}
      </button>

    </aside>

    <main class="content">

      <header class="topbar">

        <input
          type="text"
          placeholder="搜尋學生姓名、學號或系所..."
        />

        <div class="user">
          <span>幫助中心</span>
          <button>匯出數據</button>
          <strong>陳管理員</strong>
        </div>

      </header>

      <div class="page">

      <template v-if="currentPage === 'dashboard'">

  <h1>總覽儀表板</h1>

  <div class="dashboard-grid">

    <div class="dashboard-card">
      <p>學生總數</p>
      <h2>{{ students.length }}</h2>
    </div>

    <div class="dashboard-card">
      <p>空床位數</p>
      <h2>{{ emptyBeds.length }}</h2>
    </div>

    <div class="dashboard-card">
      <p>報修案件</p>
      <h2>{{ repairs.length }}</h2>
    </div>

    <div class="dashboard-card">
      <p>系統狀態</p>
      <h2>正常</h2>
    </div>

  </div>

  <div class="card chart-card">
  <h2>宿舍入住率分析</h2>

  <div class="progress-row">
    <span>目前入住率</span>
    <div class="progress-bar">
      <div class="progress-fill" style="width: 75%"></div>
    </div>
    <strong>75%</strong>
  </div>

  <div class="progress-row">
    <span>空床比例</span>
    <div class="progress-bar">
      <div class="progress-fill green-fill" style="width: 25%"></div>
    </div>
    <strong>25%</strong>
  </div>

  <div class="progress-row">
    <span>報修完成率</span>
    <div class="progress-bar">
      <div class="progress-fill orange-fill" style="width: 40%"></div>
    </div>
    <strong>40%</strong>
  </div>
</div>

  <div class="dashboard-section">

    <div class="card">
      <h2>近期空床位</h2>

      <table>
        <thead>
          <tr>
            <th>房號</th>
            <th>床位</th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="bed in emptyBeds"
            :key="bed.bed"
          >
            <td>{{ bed.room }}</td>
            <td>{{ bed.bed }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="card">
      <h2>近期報修案件</h2>

      <table>
        <thead>
          <tr>
            <th>房號</th>
            <th>設備</th>
            <th>狀態</th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="repair in repairs"
            :key="repair.room + repair.item"
          >
            <td>{{ repair.room }}</td>
            <td>{{ repair.item }}</td>
            <td>
  <span :class="['status-badge', repair.status]">
    {{ repair.status }}
  </span>
</td>
          </tr>
        </tbody>
      </table>
    </div>

  </div>

</template>

        <template v-if="currentPage === 'students'">

          <div class="page-header">
            <h1>學生資料管理</h1>
            <button>＋ 新增學生</button>
          </div>

          <div class="card search-card">

  <input
    v-model="searchKeyword"
    placeholder="搜尋學號、姓名、系所..."
  />

</div>

          <div class="card student-form">

  <input
    v-model="newStudent.id"
    placeholder="學號"
  />

  <input
    v-model="newStudent.name"
    placeholder="姓名"
  />

  <input
    v-model="newStudent.department"
    placeholder="系所"
  />

  <input
    v-model="newStudent.phone"
    placeholder="電話"
  />

  <input
    v-model="newStudent.email"
    placeholder="Email"
  />

  <button @click="addStudent">
    新增學生
  </button>

</div>

          <div class="card">

            <table>

              <thead>
                <tr>
                  <th>學號</th>
                  <th>姓名</th>
                  <th>系所</th>
                  <th>電話</th>
                  <th>Email</th>
                  <th>狀態</th>
                  <th>操作</th>
                </tr>
              </thead>

              <tbody>
                <tr
                  v-for="student in filteredStudents"
                  :key="student.id"
                >
                  <td>{{ student.id }}</td>
                  <td>{{ student.name }}</td>
                  <td>{{ student.department }}</td>
                  <td>{{ student.phone }}</td>
                  <td>{{ student.email }}</td>
                  <td>{{ student.status }}</td>
                  <td>

  <button
    class="checkout-btn"
    @click="checkoutStudent(student.id)"
  >
    退宿
  </button>

  <button
    class="edit-btn"
    @click="editStudent(student.id)"
  >
    編輯
  </button>

  <button
    class="delete-btn"
    @click="deleteStudent(student.id)"
  >
    刪除
  </button>
</td>
                </tr>
              </tbody>

            </table>

          </div>

        </template>

        <template v-if="currentPage === 'beds'">

          <h1>空床位查詢</h1>

          <div class="card-list">

            <div
              class="small-card"
              v-for="bed in emptyBeds"
              :key="bed.bed"
            >
              <h3>{{ bed.room }}</h3>
              <p>{{ bed.bed }}</p>
            </div>

          </div>

        </template>

        <template v-if="currentPage === 'status'">

          <h1>報修狀態查詢</h1>

          <div class="card">

            <table>
              <thead>
                <tr>
                  <th>房間</th>
                  <th>設備</th>
                  <th>狀態</th>
                </tr>
              </thead>

              <tbody>
                <tr
                  v-for="repair in repairs"
                  :key="repair.room"
                >
                  <td>{{ repair.room }}</td>
                  <td>{{ repair.item }}</td>
                  <td>
  <span :class="['status-badge', repair.status]">
    {{ repair.status }}
  </span>
</td>
                </tr>
              </tbody>
            </table>

          </div>

        </template>

        <template v-if="currentPage === 'rooms'">

  <h1>房型管理</h1>

  <div class="card">

    <table>

      <thead>
        <tr>
          <th>房號</th>
          <th>樓層</th>
          <th>容量</th>
          <th>已入住</th>
        </tr>
      </thead>

      <tbody>

        <tr
          v-for="room in rooms"
          :key="room.room"
        >
          <td>{{ room.room }}</td>
          <td>{{ room.floor }}</td>
          <td>{{ room.capacity }}</td>
          <td>{{ room.occupied }}</td>
        </tr>

      </tbody>

    </table>

  </div>

</template>

<template v-if="currentPage === 'checkin'">

  <h1>入住辦理</h1>

  <div class="card">

  <div class="form-group">

    <label>學生學號</label>

    <input
      v-model="checkinForm.studentId"
      placeholder="例如：11204501"
    />

    <label>床位 ID</label>

    <input
      v-model="checkinForm.bedId"
      placeholder="例如：B002"
    />

    <label>入住日期</label>

    <input
      type="date"
      v-model="checkinForm.date"
    />

    <button
      class="submit-btn"
      @click="createCheckin"
    >
      建立入住
    </button>

  </div>

</div>

</template>

<template v-if="currentPage === 'repair'">

  <h1>維修申請</h1>

  <div class="card">

  <div class="repair-form">

    <input
      v-model="repairForm.room"
      placeholder="房號，例如 A101"
    />

    <input
      v-model="repairForm.item"
      placeholder="設備，例如 冷氣"
    />

    <select v-model="repairForm.status">
      <option>待處理</option>
      <option>處理中</option>
      <option>已完成</option>
    </select>

    <button @click="addRepair">
      送出報修
    </button>

  </div>

</div>

</template>

      </div>

    </main>

  </div>
</template>