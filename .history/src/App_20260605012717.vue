<script setup>
const students = [
  { id: "11204501", name: "陳子瑄", department: "資訊工程學系", phone: "0912-345-678", email: "tzuhsuan.c@univ.edu.tw" },
  { id: "11204522", name: "李柏宏", department: "工商管理學系", phone: "0923-888-123", email: "bohong.lee@univ.edu.tw" },
  { id: "11103241", name: "王小明", department: "外國語文學系", phone: "0934-111-222", email: "xiaoming.w@univ.edu.tw" },
  { id: "11103289", name: "林雅婷", department: "建築與設計學系", phone: "0945-666-777", email: "yating.lin@univ.edu.tw" }
]

const beds = [
  { bed_id: "B001", room: "A101", floor: 1, status: "已入住" },
  { bed_id: "B002", room: "A101", floor: 1, status: "空床" },
  { bed_id: "B003", room: "A102", floor: 1, status: "空床" },
  { bed_id: "B004", room: "B201", floor: 2, status: "維修中" }
]

const repairs = [
  { id: "R001", room: "A101", type: "冷氣", date: "2026-05-01", status: "待處理" },
  { id: "R002", room: "B201", type: "水龍頭", date: "2026-05-03", status: "處理中" },
  { id: "R003", room: "A102", type: "電燈", date: "2026-05-05", status: "已完成" }
]
</script>

<template>
  <div class="layout">
    <aside class="sidebar">
      <div class="logo">
        <div class="logo-icon">▦</div>
        <div>
          <h2>宿舍管理系統</h2>
          <p>學務處行政端</p>
        </div>
      </div>

      <nav>
        <a class="active">學生名單</a>
        <a>房型管理</a>
        <a>空餘床位</a>
        <a>入住辦理</a>
        <a>維修申請</a>
        <a>狀態追蹤</a>
      </nav>

      <div class="bottom">
        <p>⚙ 設置</p>
        <p>？ 幫助</p>
      </div>
    </aside>

    <main class="main">
      <header class="topbar">
        <input placeholder="搜尋學生姓名、學號或系所..." />
        <div class="user">
          <span>幫助中心</span>
          <button>匯出數據</button>
          <strong>陳管理員</strong>
        </div>
      </header>

      <section class="content">
        <p class="breadcrumb">首頁 › 學生資料管理</p>

        <div class="title-row">
          <h1>學生資料管理</h1>
          <button class="add-btn">＋ 新增學生</button>
        </div>

        <div class="filters">
          <span>系所篩選</span>
          <button>全部系所⌄</button>
          <span>入學年度</span>
          <button>112學年⌄</button>
          <p>共 1,248 筆資料</p>
        </div>

        <div class="table-card">
          <table>
            <thead>
              <tr>
                <th>學號</th>
                <th>姓名</th>
                <th>系所</th>
                <th>電話</th>
                <th>Email</th>
                <th>操作</th>
              </tr>
            </thead>

            <tbody>
              <tr v-for="student in students" :key="student.id">
                <td>{{ student.id }}</td>
                <td>
                  <span class="avatar">{{ student.name[0] }}</span>
                  {{ student.name }}
                </td>
                <td>{{ student.department }}</td>
                <td>{{ student.phone }}</td>
                <td>{{ student.email }}</td>
                <td>⋯</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="cards">
          <div class="small-card">
            <h3>空床位查詢</h3>
            <div v-for="bed in beds" :key="bed.bed_id" class="bed-row">
              <span>{{ bed.room }} - {{ bed.bed_id }}</span>
              <b :class="bed.status">{{ bed.status }}</b>
            </div>
          </div>

          <div class="small-card">
            <h3>報修狀態查詢</h3>
            <div v-for="repair in repairs" :key="repair.id" class="repair-row">
              <span>{{ repair.room }}｜{{ repair.type }}</span>
              <b>{{ repair.status }}</b>
            </div>
          </div>

          <div class="analysis-card">
            <h2>數據視覺化分析</h2>
            <p>本學期新生入住率已達 92%，較去年同期增長 5%。系統可協助管理員掌握學生住宿、空床與維修狀態。</p>
            <button>查看完整報告</button>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<style>
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: Arial, "Microsoft JhengHei", sans-serif;
  background: #f5f7fb;
  color: #1f2937;
}

.layout {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  width: 260px;
  background: #f8fafc;
  border-right: 1px solid #dbe3ef;
  padding: 28px 18px;
  display: flex;
  flex-direction: column;
}

.logo {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 42px;
}

.logo-icon {
  background: #0b63ce;
  color: white;
  width: 38px;
  height: 38px;
  border-radius: 8px;
  display: grid;
  place-items: center;
  font-size: 22px;
}

.logo h2 {
  font-size: 20px;
  color: #0b63ce;
  margin: 0;
}

.logo p {
  margin: 4px 0 0;
  color: #6b7280;
}

nav {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

nav a {
  padding: 14px 18px;
  border-radius: 8px;
  color: #374151;
  font-weight: 600;
}

nav a.active {
  background: #dfe8ff;
  color: #0b63ce;
  border-left: 4px solid #0b63ce;
}

.bottom {
  margin-top: auto;
  color: #4b5563;
}

.main {
  flex: 1;
}

.topbar {
  height: 70px;
  background: white;
  border-bottom: 1px solid #dbe3ef;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 34px;
}

.topbar input {
  width: 460px;
  padding: 14px 20px;
  border: 1px solid #c7d2e2;
  border-radius: 24px;
  font-size: 15px;
}

.user {
  display: flex;
  align-items: center;
  gap: 22px;
}

.user button,
.add-btn,
.analysis-card button {
  background: #0b63ce;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px 22px;
  font-size: 15px;
}

.content {
  padding: 34px;
}

.breadcrumb {
  color: #6b7280;
}

.title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title-row h1 {
  font-size: 36px;
  margin: 8px 0 28px;
}

.add-btn {
  background: #dbe6ff;
  color: #123b75;
}

.filters {
  background: white;
  border: 1px solid #c7d2e2;
  border-radius: 12px;
  padding: 18px;
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 26px;
}

.filters button {
  background: white;
  border: 1px solid #c7d2e2;
  border-radius: 8px;
  padding: 10px 18px;
}

.filters p {
  margin-left: auto;
  color: #6b7280;
}

.table-card {
  background: white;
  border: 1px solid #c7d2e2;
  border-radius: 12px;
  overflow: hidden;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th {
  background: #f8fafc;
  color: #6b7280;
  text-align: left;
  font-size: 13px;
}

th,
td {
  padding: 18px 24px;
  border-bottom: 1px solid #dbe3ef;
}

.avatar {
  display: inline-grid;
  place-items: center;
  width: 34px;
  height: 34px;
  background: #dbe6ff;
  color: #0b63ce;
  border-radius: 50%;
  margin-right: 10px;
}

.cards {
  display: grid;
  grid-template-columns: 1fr 1fr 2fr;
  gap: 24px;
  margin-top: 26px;
}

.small-card,
.analysis-card {
  background: white;
  border: 1px solid #c7d2e2;
  border-radius: 12px;
  padding: 24px;
}

.bed-row,
.repair-row {
  display: flex;
  justify-content: space-between;
  margin: 14px 0;
}

.空床 {
  color: #059669;
}

.已入住 {
  color: #0b63ce;
}

.維修中 {
  color: #dc2626;
}

.analysis-card {
  background: linear-gradient(120deg, white, #eaf1ff);
}

.analysis-card h2 {
  color: #0b63ce;
  font-size: 28px;
}
</style>