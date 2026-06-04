<script setup>
import { ref } from "vue"

const currentPage = ref("dashboard")

const menuItems = [
  { key: "dashboard", label: "總覽儀表板" },
  { key: "students", label: "學生資料" },
  { key: "rooms", label: "房間床位" },
  { key: "checkin", label: "入住管理" },
  { key: "repairs", label: "設備報修" }
]

const students = [
  { id: "D1348893", name: "黃子薇", department: "資訊工程系", phone: "0912-345-678", room: "A101", bed: "B001", status: "入住中" },
  { id: "D1321132", name: "蔡昕茹", department: "資訊工程系", phone: "0923-888-123", room: "A102", bed: "B003", status: "入住中" },
  { id: "D1321305", name: "許淑茹", department: "資訊工程系", phone: "0934-111-222", room: "B201", bed: "B006", status: "入住中" },
  { id: "D1349567", name: "邱子芹", department: "資訊工程系", phone: "0945-666-777", room: "尚未分配", bed: "-", status: "待分配" }
]

const beds = [
  { id: "B001", dorm: "第一宿舍", room: "A101", floor: 1, status: "已入住" },
  { id: "B002", dorm: "第一宿舍", room: "A101", floor: 1, status: "空床" },
  { id: "B003", dorm: "第一宿舍", room: "A102", floor: 1, status: "已入住" },
  { id: "B004", dorm: "第一宿舍", room: "A102", floor: 1, status: "空床" },
  { id: "B005", dorm: "第二宿舍", room: "B201", floor: 2, status: "維修中" },
  { id: "B006", dorm: "第二宿舍", room: "B201", floor: 2, status: "已入住" }
]

const repairs = [
  { id: "R001", student: "黃子薇", room: "A101", type: "冷氣", priority: "高", status: "待處理", date: "2026-05-01" },
  { id: "R002", student: "蔡昕茹", room: "A102", type: "電燈", priority: "中", status: "處理中", date: "2026-05-03" },
  { id: "R003", student: "許淑茹", room: "B201", type: "水龍頭", priority: "低", status: "已完成", date: "2026-05-05" }
]

const emptyBeds = beds.filter(bed => bed.status === "空床")
</script>

<template>
  <div class="admin-layout">
    <aside class="sidebar">
      <div class="brand">
        <div class="brand-icon">🏢</div>
        <div>
          <h2>宿舍管理系統</h2>
          <p>Dormitory System</p>
        </div>
      </div>

      <nav>
        <button
          v-for="item in menuItems"
          :key="item.key"
          :class="{ active: currentPage === item.key }"
          @click="currentPage = item.key"
        >
          {{ item.label }}
        </button>
      </nav>
    </aside>

    <main class="main">
      <header class="topbar">
        <div>
          <h1>大學宿舍管理資料庫系統</h1>
          <p>University Dormitory Management Database System</p>
        </div>
        <input placeholder="搜尋學生、房間、報修案件..." />
      </header>

      <section v-if="currentPage === 'dashboard'" class="page">
        <div class="stats">
          <div class="stat-card">
            <p>學生總數</p>
            <h2>{{ students.length }}</h2>
          </div>
          <div class="stat-card">
            <p>床位總數</p>
            <h2>{{ beds.length }}</h2>
          </div>
          <div class="stat-card">
            <p>空床位</p>
            <h2>{{ emptyBeds.length }}</h2>
          </div>
          <div class="stat-card">
            <p>報修案件</p>
            <h2>{{ repairs.length }}</h2>
          </div>
        </div>

        <div class="grid-two">
          <div class="panel">
            <h2>目前空床位</h2>
            <div v-for="bed in emptyBeds" :key="bed.id" class="list-row">
              <span>{{ bed.dorm }}｜{{ bed.room }}｜{{ bed.id }}</span>
              <b class="green">可入住</b>
            </div>
          </div>

          <div class="panel">
            <h2>近期報修</h2>
            <div v-for="repair in repairs" :key="repair.id" class="list-row">
              <span>{{ repair.room }}｜{{ repair.type }}</span>
              <b>{{ repair.status }}</b>
            </div>
          </div>
        </div>
      </section>

      <section v-if="currentPage === 'students'" class="page">
        <div class="page-title">
          <h2>學生資料管理</h2>
          <button>＋ 新增學生</button>
        </div>

        <div class="panel">
          <table>
            <thead>
              <tr>
                <th>學號</th>
                <th>姓名</th>
                <th>系所</th>
                <th>電話</th>
                <th>房間</th>
                <th>床位</th>
                <th>狀態</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="student in students" :key="student.id">
                <td>{{ student.id }}</td>
                <td>{{ student.name }}</td>
                <td>{{ student.department }}</td>
                <td>{{ student.phone }}</td>
                <td>{{ student.room }}</td>
                <td>{{ student.bed }}</td>
                <td>
                  <span class="badge">{{ student.status }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section v-if="currentPage === 'rooms'" class="page">
        <div class="page-title">
          <h2>房間與床位管理</h2>
          <button>＋ 新增床位</button>
        </div>

        <div class="bed-grid">
          <div v-for="bed in beds" :key="bed.id" class="bed-card">
            <h3>{{ bed.room }} - {{ bed.id }}</h3>
            <p>{{ bed.dorm }}｜{{ bed.floor }} 樓</p>
            <span :class="['status', bed.status]">{{ bed.status }}</span>
          </div>
        </div>
      </section>

      <section v-if="currentPage === 'checkin'" class="page">
        <div class="page-title">
          <h2>入住管理</h2>
        </div>

        <div class="form-panel">
          <label>學生學號</label>
          <input placeholder="例如：D1348893" />

          <label>床位 ID</label>
          <input placeholder="例如：B002" />

          <label>入住日期</label>
          <input type="date" />

          <button>建立入住紀錄</button>
        </div>
      </section>

      <section v-if="currentPage === 'repairs'" class="page">
        <div class="page-title">
          <h2>設備報修管理</h2>
          <button>＋ 新增報修</button>
        </div>

        <div class="panel">
          <table>
            <thead>
              <tr>
                <th>報修 ID</th>
                <th>學生</th>
                <th>房間</th>
                <th>設備類型</th>
                <th>優先級</th>
                <th>狀態</th>
                <th>提交日期</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="repair in repairs" :key="repair.id">
                <td>{{ repair.id }}</td>
                <td>{{ repair.student }}</td>
                <td>{{ repair.room }}</td>
                <td>{{ repair.type }}</td>
                <td>{{ repair.priority }}</td>
                <td>
                  <span class="badge">{{ repair.status }}</span>
                </td>
                <td>{{ repair.date }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </main>
  </div>
</template>

<style>
* {
  box-sizing: border-box;
}

html,
body,
#app {
  margin: 0;
  width: 100%;
  min-width: 1200px;
  min-height: 100vh;
  font-family: "Microsoft JhengHei", Arial, sans-serif;
  background: #eef3f9;
  color: #172033;
}

.admin-layout {
  display: flex;
  width: 100%;
  min-height: 100vh;
}

.sidebar {
  width: 240px;
  min-width: 240px;
  background: #ffffff;
  border-right: 1px solid #d6deea;
  padding: 24px 18px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 36px;
}

.brand-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: #1d6fe9;
  color: white;
  display: grid;
  place-items: center;
  font-size: 22px;
}

.brand h2 {
  margin: 0;
  font-size: 18px;
  color: #1557b0;
}

.brand p {
  margin: 4px 0 0;
  font-size: 12px;
  color: #6b7280;
}

nav {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

nav button {
  width: 100%;
  border: none;
  background: transparent;
  padding: 14px 18px;
  text-align: left;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 700;
  color: #24324a;
  cursor: pointer;
}

nav button.active {
  background: #e4edff;
  color: #1557b0;
  border-left: 5px solid #1d6fe9;
}

.main {
  flex: 1;
  min-width: 0;
}

.topbar {
  height: 86px;
  background: #ffffff;
  border-bottom: 1px solid #d6deea;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 34px;
}

.topbar h1 {
  margin: 0;
  font-size: 24px;
}

.topbar p {
  margin: 6px 0 0;
  color: #6b7280;
}

.topbar input {
  width: 360px;
  height: 44px;
  border: 1px solid #c9d4e5;
  border-radius: 999px;
  padding: 0 18px;
  font-size: 15px;
}

.page {
  padding: 30px 34px;
}

.stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 22px;
  margin-bottom: 26px;
}

.stat-card,
.panel,
.form-panel,
.bed-card {
  background: #ffffff;
  border: 1px solid #d6deea;
  border-radius: 18px;
  box-shadow: 0 8px 24px rgba(40, 65, 100, 0.06);
}

.stat-card {
  padding: 24px;
}

.stat-card p {
  margin: 0 0 10px;
  color: #6b7280;
}

.stat-card h2 {
  margin: 0;
  font-size: 38px;
  color: #1557b0;
}

.grid-two {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 22px;
}

.panel {
  padding: 24px;
}

.panel h2 {
  margin-top: 0;
}

.list-row {
  display: flex;
  justify-content: space-between;
  padding: 14px 0;
  border-bottom: 1px solid #e5eaf2;
}

.green {
  color: #059669;
}

.page-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 22px;
}

.page-title h2 {
  margin: 0;
  font-size: 30px;
}

.page-title button,
.form-panel button {
  border: none;
  background: #1d6fe9;
  color: white;
  padding: 12px 22px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  padding: 16px 18px;
  border-bottom: 1px solid #e5eaf2;
  text-align: left;
  font-size: 15px;
}

th {
  color: #64748b;
  background: #f8fbff;
}

.badge {
  display: inline-block;
  background: #e4edff;
  color: #1557b0;
  padding: 6px 12px;
  border-radius: 999px;
  font-weight: 700;
}

.bed-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 22px;
}

.bed-card {
  padding: 24px;
}

.bed-card h3 {
  margin: 0 0 10px;
  font-size: 22px;
}

.bed-card p {
  color: #6b7280;
}

.status {
  display: inline-block;
  padding: 7px 14px;
  border-radius: 999px;
  font-weight: 700;
}

.status.空床 {
  background: #dcfce7;
  color: #15803d;
}

.status.已入住 {
  background: #dbeafe;
  color: #1d4ed8;
}

.status.維修中 {
  background: #fee2e2;
  color: #b91c1c;
}

.form-panel {
  width: 520px;
  padding: 28px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.form-panel label {
  font-weight: 700;
}

.form-panel input {
  height: 44px;
  border: 1px solid #c9d4e5;
  border-radius: 10px;
  padding: 0 14px;
  font-size: 15px;
}

.form-panel button {
  margin-top: 12px;
}
</style>