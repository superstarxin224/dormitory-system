<script setup>
import { ref } from "vue"

const currentPage = ref("students")

const menu = [
  { id: "students", name: "學生名單" },
  { id: "rooms", name: "房型管理" },
  { id: "beds", name: "空餘床位" },
  { id: "checkin", name: "入住辦理" },
  { id: "repair", name: "維修申請" },
  { id: "status", name: "狀態追蹤" }
]

const students = [
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
  },
  {
    id: "11103241",
    name: "王小明",
    department: "外國語文學系",
    phone: "0934-111-222",
    email: "xiaoming.w@univ.edu.tw"
  }
]

const emptyBeds = [
  { room: "A101", bed: "B002" },
  { room: "A102", bed: "B004" },
  { room: "B201", bed: "B007" }
]

const repairs = [
  {
    room: "A101",
    item: "冷氣",
    status: "待處理"
  },
  {
    room: "A102",
    item: "電燈",
    status: "處理中"
  },
  {
    room: "B201",
    item: "水龍頭",
    status: "已完成"
  }
]
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

        <template v-if="currentPage === 'students'">

          <div class="page-header">
            <h1>學生資料管理</h1>
            <button>＋ 新增學生</button>
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
                </tr>
              </thead>

              <tbody>
                <tr
                  v-for="student in students"
                  :key="student.id"
                >
                  <td>{{ student.id }}</td>
                  <td>{{ student.name }}</td>
                  <td>{{ student.department }}</td>
                  <td>{{ student.phone }}</td>
                  <td>{{ student.email }}</td>
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
                  <td>{{ repair.status }}</td>
                </tr>
              </tbody>
            </table>

          </div>

        </template>

        <template
          v-if="
            currentPage === 'rooms' ||
            currentPage === 'checkin' ||
            currentPage === 'repair'
          "
        >
          <h1>{{ menu.find(m=>m.id===currentPage)?.name }}</h1>

          <div class="placeholder">
            此頁面待開發
          </div>
        </template>

      </div>

    </main>

  </div>
</template>