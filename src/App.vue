<script setup>
import { computed, onMounted, ref, watch } from "vue"
import {
  fetchStudents,
  fetchCheckinHistory,
  createStudent,
  updateStudent,
  removeStudent,
  fetchRepairs,
  createRepair,
  updateRepairStatus as saveRepairStatus,
  removeRepair
} from "./api"

const AUTH_KEY = "dormitory-auth"
const REPAIR_OWNER_KEY = "dormitory-repair-owners"
const REPAIR_NOTIFICATION_KEY = "dormitory-repair-notifications-read"
const ADMIN_ACCOUNT = {
  username: "admin",
  password: "admin123",
  name: "陳管理員"
}

const searchKeyword = ref("")
const currentPage = ref("dashboard")
const selectedDormId = ref("")
const selectedRoomId = ref("")
const showDashboardEmptyBeds = ref(false)
const authUser = ref(null)
const loginForm = ref({
  account: "",
  password: ""
})
const loginError = ref("")

const students = ref([])
const isLoadingStudents = ref(false)
const studentError = ref("")
const repairs = ref([])
const repairError = ref("")
const repairOwners = ref(readRepairOwners())
const readRepairNotifications = ref(readRepairNotificationState())
const showRepairNotifications = ref(false)
const checkinHistory = ref([])
const historyError = ref("")
const isLoadingHistory = ref(false)

const rooms = createDormRooms()
const allBeds = createBeds(rooms)

const dormitories = [
  { id: "female", name: "女生宿舍", building: "A 棟宿舍" },
  { id: "male", name: "男生宿舍", building: "B 棟宿舍" }
]

const adminMenu = [
  { id: "dashboard", name: "總覽儀表板" },
  { id: "students", name: "學生資料管理" },
  { id: "rooms", name: "宿舍管理" },
  { id: "checkin", name: "入住辦理" },
  { id: "history", name: "歷史住宿查詢" },
  { id: "repair", name: "維修管理" }
]

const studentMenu = [
  { id: "my-room", name: "我的住宿" },
  { id: "history", name: "歷史住宿" },
  { id: "repair", name: "維修管理" }
]

const isLoggedIn = computed(() => Boolean(authUser.value))
const isAdmin = computed(() => authUser.value?.role === "admin")
const menu = computed(() => (isAdmin.value ? adminMenu : studentMenu))

const currentStudent = computed(() => {
  if (!authUser.value || authUser.value.role !== "student") {
    return null
  }

  return students.value.find(student => student.id === authUser.value.id) || null
})

const visibleStudents = computed(() => {
  if (isAdmin.value) {
    return students.value
  }

  return currentStudent.value ? [currentStudent.value] : []
})

const visibleRepairs = computed(() => {
  if (isAdmin.value) {
    return repairs.value
  }

  if (!currentStudent.value) {
    return []
  }

  return repairs.value.filter(repair => repair.studentId === currentStudent.value.id)
})

const completedStudentRepairs = computed(() => {
  if (isAdmin.value || !currentStudent.value) return []

  return repairs.value.filter(repair =>
    repair.studentId === currentStudent.value.id &&
    repair.status === "已完成"
  )
})

const unreadRepairNotifications = computed(() => {
  if (!currentStudent.value) return []

  const readIds = readRepairNotifications.value[currentStudent.value.id] || []

  return completedStudentRepairs.value.filter(repair => !readIds.includes(String(repair.id)))
})

const unreadRepairNotificationCount = computed(() => unreadRepairNotifications.value.length)

const visibleCheckinHistory = computed(() => {
  if (isAdmin.value) {
    return checkinHistory.value
  }

  if (!currentStudent.value) {
    return []
  }

  return checkinHistory.value.filter(record => record.studentId === currentStudent.value.id)
})

const topSearchPlaceholder = computed(() => {
  if (currentPage.value === "students") return "搜尋學生姓名、學號或系所..."
  if (currentPage.value === "history") return "搜尋學號、姓名、宿舍、房號或床位..."
  if (currentPage.value === "repair") return "搜尋房號、設備或報修狀態..."
  if (currentPage.value === "rooms") return "搜尋房號、樓層或床位..."
  return "搜尋資料..."
})

const newStudent = ref({
  id: "",
  name: "",
  gender: "",
  department: "",
  phone: "",
  email: ""
})

const editingStudentId = ref("")
const editingStudentForm = ref({
  name: "",
  gender: "",
  department: "",
  phone: "",
  email: ""
})

const repairForm = ref({
  room: "",
  item: "",
  description: "",
  photoData: "",
  status: "待處理"
})
const isReadingRepairPhoto = ref(false)

const editingRepairId = ref("")
const editingRepairStatus = ref("待處理")

const checkinForm = ref({
  studentId: "",
  roomId: "",
  bedId: "",
  date: ""
})

const checkinStudentForm = ref({
  name: "",
  gender: "",
  department: "",
  phone: "",
  email: ""
})

const filteredStudents = computed(() => {
  if (!searchKeyword.value) return visibleStudents.value

  return visibleStudents.value.filter(student =>
    student.id.includes(searchKeyword.value) ||
    student.name.includes(searchKeyword.value) ||
    student.department.includes(searchKeyword.value)
  )
})

const checkinStudent = computed(() => {
  const studentId = checkinForm.value.studentId.trim()
  return students.value.find(student => student.id === studentId) || null
})

const checkinGender = computed(() => {
  return checkinStudent.value?.gender || checkinStudentForm.value.gender
})

const isNewCheckinStudent = computed(() => {
  return Boolean(checkinForm.value.studentId.trim()) && !checkinStudent.value
})

const checkinDorm = computed(() => {
  if (!checkinGender.value) return null

  if (checkinGender.value === "女") {
    return dormitories.find(dorm => dorm.id === "female") || null
  }

  if (checkinGender.value === "男") {
    return dormitories.find(dorm => dorm.id === "male") || null
  }

  return null
})

const checkinRooms = computed(() => {
  if (!checkinForm.value.studentId.trim()) return []
  if (!checkinDorm.value) return rooms
  return rooms.filter(room => room.dormId === checkinDorm.value.id)
})

const checkinRoomBeds = computed(() => {
  if (!checkinForm.value.roomId) return []
  return emptyBeds.value.filter(bed => bed.room === checkinForm.value.roomId)
})

const filteredRooms = computed(() => {
  const targetRooms = currentDormRooms.value

  if (!searchKeyword.value) return targetRooms

  return targetRooms.filter(room =>
    room.room.includes(searchKeyword.value) ||
    String(room.floor).includes(searchKeyword.value) ||
    getRoomEmptyBeds(room.room).some(bed => bed.bed.includes(searchKeyword.value))
  )
})

const currentDorm = computed(() => {
  return dormitories.find(dorm => dorm.id === selectedDormId.value) || null
})

const currentDormRooms = computed(() => {
  if (!currentDorm.value) return []
  return rooms.filter(room => room.dormId === currentDorm.value.id)
})

const selectedRoom = computed(() => {
  return currentDormRooms.value.find(room => room.room === selectedRoomId.value) || null
})

const selectedRoomEmptyBeds = computed(() => {
  if (!selectedRoom.value) return []

  const beds = getRoomEmptyBeds(selectedRoom.value.room)

  if (!searchKeyword.value) return beds

  return beds.filter(bed =>
    bed.room.includes(searchKeyword.value) ||
    bed.bed.includes(searchKeyword.value)
  )
})

const selectedRoomStudents = computed(() => {
  if (!selectedRoom.value) return []

  return students.value.filter(student =>
    student.status === "入住中" &&
    student.bed &&
    findRoomByBed(student.bed) === selectedRoom.value.room
  )
})

const currentDormStats = computed(() => {
  if (!currentDorm.value) {
    return {
      roomCount: 0,
      totalBeds: 0,
      emptyBeds: 0,
      occupancyRate: 0
    }
  }

  return getDormStats(currentDorm.value.id)
})

const emptyBeds = computed(() => {
  const occupiedBedIds = new Set(
    students.value
      .filter(student => student.status === "入住中" && student.bed)
      .map(student => student.bed)
  )

  return allBeds.filter(bed => !occupiedBedIds.has(bed.bed))
})

const dormCards = computed(() => {
  return dormitories.map(dorm => ({
    ...dorm,
    stats: getDormStats(dorm.id)
  }))
})

function getDormStats(dormId) {
  const dormRooms = rooms.filter(room => room.dormId === dormId)
  const roomNames = dormRooms.map(room => room.room)
  const totalBedsCount = dormRooms.reduce((sum, room) => sum + room.capacity, 0)
  const occupiedCount = dormRooms.reduce((sum, room) => sum + getRoomOccupiedCount(room.room), 0)
  const emptyBedCount = emptyBeds.value.filter(bed => roomNames.includes(bed.room)).length

  return {
    roomCount: dormRooms.length,
    totalBeds: totalBedsCount,
    emptyBeds: emptyBedCount,
    occupancyRate: totalBedsCount === 0 ? 0 : Math.round((occupiedCount / totalBedsCount) * 100)
  }
}

function getRoomEmptyBeds(roomId) {
  return emptyBeds.value.filter(bed => bed.room === roomId)
}

function getRoomEmptyBedCount(roomId) {
  return getRoomEmptyBeds(roomId).length
}

function getRoomOccupiedCount(roomId) {
  return students.value.filter(student =>
    student.status === "入住中" &&
    student.bed &&
    findRoomByBed(student.bed) === roomId
  ).length
}

function formatDateOnly(value) {
  if (!value) return ""
  return String(value).slice(0, 10)
}

const filteredRepairs = computed(() => {
  if (!searchKeyword.value) return visibleRepairs.value

  return visibleRepairs.value.filter(repair =>
    repair.room.includes(searchKeyword.value) ||
    repair.item.includes(searchKeyword.value) ||
    repair.description.includes(searchKeyword.value) ||
    repair.status.includes(searchKeyword.value)
  )
})

const filteredCheckinHistory = computed(() => {
  if (!searchKeyword.value) return visibleCheckinHistory.value

  return visibleCheckinHistory.value.filter(record =>
    record.studentId.includes(searchKeyword.value) ||
    record.studentName.includes(searchKeyword.value) ||
    record.dormitory.includes(searchKeyword.value) ||
    record.room.includes(searchKeyword.value) ||
    record.bed.includes(searchKeyword.value) ||
    record.status.includes(searchKeyword.value)
  )
})

const totalBeds = computed(() => allBeds.length)
const occupiedCount = computed(() => students.value.filter(s => s.status === "入住中").length)
const occupancyRate = computed(() => totalBeds.value === 0 ? 0 : Math.round((occupiedCount.value / totalBeds.value) * 100))
const emptyBedRate = computed(() => totalBeds.value === 0 ? 0 : Math.round((emptyBeds.value.length / totalBeds.value) * 100))
const repairDoneRate = computed(() => {
  if (repairs.value.length === 0) return 0
  return Math.round((repairs.value.filter(r => r.status === "已完成").length / repairs.value.length) * 100)
})
const pendingRepairCount = computed(() => repairs.value.filter(repair => repair.status === "待處理").length)

function createDormRooms() {
  return [
    ...createBuildingRooms("A", "female"),
    ...createBuildingRooms("B", "male")
  ]
}

function createBuildingRooms(building, dormId) {
  const buildingRooms = []

  for (let floor = 1; floor <= 2; floor += 1) {
    for (let roomNumber = 1; roomNumber <= 5; roomNumber += 1) {
      const room = `${building}${floor}${String(roomNumber).padStart(2, "0")}`

      buildingRooms.push({
        room,
        dormId,
        floor,
        capacity: 4,
        occupied: 0
      })
    }
  }

  return buildingRooms
}

function createBeds(roomList) {
  return roomList.flatMap(room =>
    Array.from({ length: room.capacity }, (_, index) => ({
      room: room.room,
      bed: `${room.room}-${index + 1}`
    }))
  )
}

function readRepairOwners() {
  try {
    return JSON.parse(localStorage.getItem(REPAIR_OWNER_KEY) || "{}")
  } catch {
    return {}
  }
}

function saveRepairOwners() {
  localStorage.setItem(REPAIR_OWNER_KEY, JSON.stringify(repairOwners.value))
}

function readRepairNotificationState() {
  try {
    return JSON.parse(localStorage.getItem(REPAIR_NOTIFICATION_KEY) || "{}")
  } catch {
    return {}
  }
}

function saveRepairNotificationState() {
  localStorage.setItem(REPAIR_NOTIFICATION_KEY, JSON.stringify(readRepairNotifications.value))
}

function attachRepairOwner(repair) {
  return {
    ...repair,
    studentId: repair.studentId || repairOwners.value[String(repair.id)] || ""
  }
}

function toggleRepairNotifications() {
  showRepairNotifications.value = !showRepairNotifications.value

  if (!showRepairNotifications.value || !currentStudent.value) return

  const studentId = currentStudent.value.id
  const readIds = new Set(readRepairNotifications.value[studentId] || [])

  for (const repair of completedStudentRepairs.value) {
    readIds.add(String(repair.id))
  }

  readRepairNotifications.value = {
    ...readRepairNotifications.value,
    [studentId]: Array.from(readIds)
  }
  saveRepairNotificationState()
}

function rememberAuth(user) {
  authUser.value = user
  localStorage.setItem(AUTH_KEY, JSON.stringify(user))
}

function restoreAuth() {
  try {
    const savedUser = JSON.parse(localStorage.getItem(AUTH_KEY) || "null")

    if (savedUser?.role) {
      authUser.value = savedUser
      currentPage.value = savedUser.role === "admin" ? "dashboard" : "my-room"
    }
  } catch {
    localStorage.removeItem(AUTH_KEY)
  }
}

async function loadStudents() {
  isLoadingStudents.value = true
  studentError.value = ""

  try {
    students.value = await fetchStudents()
  } catch (error) {
    studentError.value = error.message
  } finally {
    isLoadingStudents.value = false
  }
}

async function loadRepairs() {
  repairError.value = ""

  try {
    const data = await fetchRepairs()
    repairs.value = data.map(attachRepairOwner)
  } catch (error) {
    repairError.value = error.message
  }
}

async function loadCheckinHistory() {
  isLoadingHistory.value = true
  historyError.value = ""

  try {
    const studentId = isAdmin.value ? "" : authUser.value?.id || ""
    checkinHistory.value = await fetchCheckinHistory(studentId)
  } catch (error) {
    historyError.value = error.message
  } finally {
    isLoadingHistory.value = false
  }
}

async function login() {
  loginError.value = ""
  const account = loginForm.value.account.trim()
  const password = loginForm.value.password.trim()

  if (!account || !password) {
    loginError.value = "請輸入帳號與密碼"
    return
  }

  if (account === ADMIN_ACCOUNT.username && password === ADMIN_ACCOUNT.password) {
    rememberAuth({
      role: "admin",
      name: ADMIN_ACCOUNT.name
    })
    currentPage.value = "dashboard"
    loginForm.value = { account: "", password: "" }
    await loadCheckinHistory()
    return
  }

  if (students.value.length === 0 && !studentError.value) {
    await loadStudents()
  }

  const student = students.value.find(item => item.id === account)

  if (student && (student.phone === password || student.email === password)) {
    rememberAuth({
      role: "student",
      id: student.id,
      name: student.name
    })
    currentPage.value = "my-room"
    loginForm.value = { account: "", password: "" }
    await loadCheckinHistory()
    return
  }

  loginError.value = "帳號或密碼錯誤"
}

function logout() {
  authUser.value = null
  localStorage.removeItem(AUTH_KEY)
  searchKeyword.value = ""
  showRepairNotifications.value = false
  currentPage.value = "dashboard"
}

function changePage(pageId) {
  currentPage.value = pageId
  searchKeyword.value = ""
  showRepairNotifications.value = false

  if (pageId !== "rooms") {
    selectedDormId.value = ""
    selectedRoomId.value = ""
  }

  if (pageId === "repair" && !isAdmin.value && currentStudent.value) {
    repairForm.value.room = currentStudent.value.bed ? findRoomByBed(currentStudent.value.bed) : ""
    repairForm.value.status = "待處理"
  }
}

function selectDorm(dormId) {
  selectedDormId.value = dormId
  selectedRoomId.value = ""
  searchKeyword.value = ""
}

function backToDormList() {
  selectedDormId.value = ""
  selectedRoomId.value = ""
  searchKeyword.value = ""
}

function selectRoom(roomId) {
  selectedRoomId.value = roomId
}

function backToRoomList() {
  selectedRoomId.value = ""
}

function findRoomByBed(bedId) {
  return allBeds.find(bed => bed.bed === bedId)?.room || currentStudent.value?.bed?.slice(0, 4) || ""
}

async function addStudent() {
  if (!newStudent.value.id || !newStudent.value.name) {
    alert("請輸入學號與姓名")
    return
  }

  try {
    const student = await createStudent({
      ...newStudent.value,
      bed: "",
      status: ""
    })

    students.value.push(student)
    alert("新增成功")
    newStudent.value = { id: "", name: "", gender: "", department: "", phone: "", email: "" }
  } catch (error) {
    alert(error.message)
  }
}

async function deleteStudent(id) {
  if (!confirm("確定要刪除這位學生嗎？")) return

  try {
    await removeStudent(id)
    students.value = students.value.filter(student => student.id !== id)
    checkinHistory.value = checkinHistory.value.filter(record => record.studentId !== id)
  } catch (error) {
    alert(error.message)
  }
}

function editStudent(id) {
  const student = students.value.find(item => item.id === id)
  if (!student) return

  editingStudentId.value = id
  editingStudentForm.value = {
    name: student.name || "",
    gender: student.gender || "",
    department: student.department || "",
    phone: student.phone || "",
    email: student.email || ""
  }
}

function cancelStudentEdit() {
  editingStudentId.value = ""
  editingStudentForm.value = {
    name: "",
    gender: "",
    department: "",
    phone: "",
    email: ""
  }
}

async function saveStudentEdit(student) {
  const updatedStudent = {
    ...student,
    name: editingStudentForm.value.name.trim(),
    gender: editingStudentForm.value.gender,
    department: editingStudentForm.value.department.trim(),
    phone: editingStudentForm.value.phone.trim(),
    email: editingStudentForm.value.email.trim()
  }

  if (!updatedStudent.name) {
    alert("姓名不能空白")
    return
  }

  try {
    const savedStudent = await updateStudent(student.id, updatedStudent)
    Object.assign(student, updatedStudent, savedStudent)
    checkinHistory.value = checkinHistory.value.map(record =>
      record.studentId === student.id
        ? { ...record, studentName: student.name }
        : record
    )
    cancelStudentEdit()
    alert("學生資料已更新")
  } catch (error) {
    alert(error.message)
  }
}

async function checkoutStudent(id) {
  const student = students.value.find(item => item.id === id)
  if (!student || !confirm("確定要辦理退宿嗎？")) return

  try {
    const savedStudent = await updateStudent(id, {
      ...student,
      status: "已退宿",
      bed: ""
    })

    Object.assign(student, savedStudent)
    await loadCheckinHistory()
  } catch (error) {
    alert(error.message)
  }
}

async function addRepair() {
  const studentId = isAdmin.value ? "" : currentStudent.value?.id || ""
  const room = isAdmin.value ? repairForm.value.room.trim() : (currentStudent.value?.bed ? findRoomByBed(currentStudent.value.bed) : repairForm.value.room.trim())
  const status = isAdmin.value ? repairForm.value.status : "待處理"

  if (!room || !repairForm.value.item.trim() || !repairForm.value.description.trim()) {
    alert("請輸入房號、設備與報修原因")
    return
  }

  if (isReadingRepairPhoto.value) {
    alert("照片讀取中，請稍候再送出")
    return
  }

  const photoData = repairForm.value.photoData

  try {
    const repair = await createRepair({
      room,
      item: repairForm.value.item.trim(),
      description: repairForm.value.description.trim(),
      photoData,
      status,
      studentId
    })

    const ownedRepair = attachRepairOwner({
      ...repair,
      studentId,
      photoData: repair.photoData || photoData
    })

    if (studentId) {
      repairOwners.value[String(ownedRepair.id)] = studentId
      saveRepairOwners()
    }

    repairError.value = ""
    repairs.value.unshift(ownedRepair)
    alert("報修已建立")
    repairForm.value = {
      room: isAdmin.value ? "" : room,
      item: "",
      description: "",
      photoData: "",
      status: "待處理"
    }
  } catch (error) {
    repairError.value = error.message
    alert(error.message)
  }
}

function handleRepairPhotoChange(event) {
  const file = event.target.files?.[0]
  isReadingRepairPhoto.value = false

  if (!file) {
    repairForm.value.photoData = ""
    return
  }

  if (!file.type.startsWith("image/")) {
    alert("請選擇圖片檔")
    event.target.value = ""
    return
  }

  if (file.size > 2 * 1024 * 1024) {
    alert("圖片不可超過 2MB")
    event.target.value = ""
    return
  }

  isReadingRepairPhoto.value = true
  const reader = new FileReader()

  reader.onload = () => {
    repairForm.value.photoData = String(reader.result || "")
    isReadingRepairPhoto.value = false
  }

  reader.onerror = () => {
    repairForm.value.photoData = ""
    isReadingRepairPhoto.value = false
    event.target.value = ""
    alert("照片讀取失敗，請重新選擇")
  }

  reader.readAsDataURL(file)
}

async function updateRepairStatus(repair, newStatus) {
  if (!isAdmin.value) return

  if (!["待處理", "處理中", "已完成"].includes(newStatus)) {
    alert("狀態只能輸入：待處理、處理中、已完成")
    return
  }

  try {
    await saveRepairStatus(repair.id, newStatus)
    repairError.value = ""
    repair.status = newStatus
    cancelRepairStatusEdit()
  } catch (error) {
    repairError.value = error.message
    alert(error.message)
  }
}

function editRepairStatus(repair) {
  editingRepairId.value = repair.id
  editingRepairStatus.value = repair.status
}

function cancelRepairStatusEdit() {
  editingRepairId.value = ""
  editingRepairStatus.value = "待處理"
}

function canCancelRepair(repair) {
  return isAdmin.value || (repair.studentId === currentStudent.value?.id && repair.status !== "已完成")
}

async function deleteRepair(repair) {
  const message = isAdmin.value ? "確定要刪除這筆報修案件嗎？" : "確定要取消這筆報修嗎？"

  if (!confirm(message)) return

  try {
    await removeRepair(repair.id)
    repairError.value = ""
    repairs.value = repairs.value.filter(item => item.id !== repair.id)
    delete repairOwners.value[String(repair.id)]
    saveRepairOwners()
  } catch (error) {
    repairError.value = error.message
    alert(error.message)
  }
}

async function createCheckin() {
  if (!checkinForm.value.studentId || !checkinForm.value.roomId || !checkinForm.value.bedId) {
    alert("請選擇學生、房間與床位")
    return
  }

  let student = checkinStudent.value
  const bed = checkinRoomBeds.value.find(b => b.bed === checkinForm.value.bedId)

  if (!student) {
    if (!checkinStudentForm.value.name || !checkinStudentForm.value.gender) {
      alert("新學生請至少填寫姓名與性別")
      return
    }

    try {
      student = await createStudent({
        id: checkinForm.value.studentId,
        name: checkinStudentForm.value.name,
        gender: checkinStudentForm.value.gender,
        department: checkinStudentForm.value.department,
        phone: checkinStudentForm.value.phone,
        email: checkinStudentForm.value.email,
        bed: "",
        status: ""
      })

      students.value.push(student)
    } catch (error) {
      alert(error.message)
      return
    }
  }

  if (!checkinRooms.value.some(room => room.room === checkinForm.value.roomId)) {
    alert("請選擇可用房間")
    return
  }

  if (!bed) {
    alert("床位不存在或已被使用")
    return
  }

  try {
    const savedStudent = await updateStudent(student.id, {
      ...student,
      status: "入住中",
      bed: checkinForm.value.bedId,
      checkinDate: checkinForm.value.date
    })

    Object.assign(student, {
      ...savedStudent,
      status: "入住中",
      bed: checkinForm.value.bedId
    })
    await loadCheckinHistory()
    alert("入住成功")
    checkinForm.value = { studentId: "", roomId: "", bedId: "", date: "" }
    checkinStudentForm.value = { name: "", gender: "", department: "", phone: "", email: "" }
  } catch (error) {
    alert(error.message)
  }
}

function exportData() {
  if (!isAdmin.value) return

  const data = {
    students: students.value,
    repairs: repairs.value,
    checkinHistory: checkinHistory.value,
    rooms,
    emptyBeds: emptyBeds.value
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json"
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")

  link.href = url
  link.download = "dormitory-system-data.json"
  link.click()
  URL.revokeObjectURL(url)
}

function resetData() {
  if (!isAdmin.value || !confirm("確定要重置所有資料嗎？")) return

  repairOwners.value = {}
  readRepairNotifications.value = {}
  localStorage.removeItem(REPAIR_OWNER_KEY)
  localStorage.removeItem(REPAIR_NOTIFICATION_KEY)
  repairs.value = []
  loadStudents()
  loadRepairs()
}

watch(menu, availableMenu => {
  if (isLoggedIn.value && !availableMenu.some(item => item.id === currentPage.value)) {
    currentPage.value = availableMenu[0]?.id || "dashboard"
  }
})

watch(() => checkinForm.value.studentId, () => {
  checkinForm.value.roomId = ""
  checkinForm.value.bedId = ""
  checkinStudentForm.value = { name: "", gender: "", department: "", phone: "", email: "" }
})

watch(() => checkinForm.value.roomId, () => {
  checkinForm.value.bedId = ""
})

watch(() => checkinStudentForm.value.gender, () => {
  if (isNewCheckinStudent.value) {
    checkinForm.value.roomId = ""
    checkinForm.value.bedId = ""
  }
})

onMounted(async () => {
  restoreAuth()
  await Promise.all([loadStudents(), loadRepairs()])

  if (isLoggedIn.value) {
    await loadCheckinHistory()
  }
})
</script>

<template>
  <div v-if="!isLoggedIn" class="login-page">
    <section class="login-panel">
      <div class="login-brand">
        <div class="logo-icon">宿</div>
        <div>
          <h1>宿舍管理系統</h1>
          <p>學生與管理員登入</p>
        </div>
      </div>

      <div class="login-form">
        <label>
          帳號
          <input v-model="loginForm.account" type="text" placeholder="學生學號或 admin" @keyup.enter="login" />
        </label>

        <label>
          密碼
          <input v-model="loginForm.password" type="password" placeholder="學生電話 / Email 或 admin123" @keyup.enter="login" />
        </label>

        <p v-if="loginError" class="error-notice">{{ loginError }}</p>
        <p v-if="studentError" class="error-notice">{{ studentError }}</p>

        <button class="submit-btn" @click="login">登入</button>
      </div>
    </section>
  </div>

  <div v-else class="layout">
    <aside class="sidebar">
      <div class="logo">
        <div class="logo-icon">宿</div>
        <div>
          <h2>宿舍管理系統</h2>
          <p>{{ isAdmin ? "學務處行政端" : "學生服務端" }}</p>
        </div>
      </div>

      <button
        v-for="item in menu"
        :key="item.id"
        :class="['menu-btn', currentPage === item.id ? 'active' : '']"
        @click="changePage(item.id)"
      >
        <span>{{ item.name }}</span>
        <span
          v-if="isAdmin && item.id === 'repair' && pendingRepairCount > 0"
          class="menu-badge"
          aria-label="待處理報修數量"
        >
          {{ pendingRepairCount }}
        </span>
      </button>
    </aside>

    <main class="content">
      <header class="topbar">
        <input
          v-if="currentPage !== 'dashboard' && currentPage !== 'my-room' && (currentPage !== 'rooms' || currentDorm)"
          v-model="searchKeyword"
          type="text"
          :placeholder="topSearchPlaceholder"
        />
        <div v-else></div>

        <div class="user">
          <button v-if="isAdmin" @click="exportData">匯出數據</button>
          <button v-if="isAdmin" class="reset-btn" @click="resetData">重置資料</button>
          <div v-if="!isAdmin" class="notification-wrap">
            <button
              class="notification-btn"
              type="button"
              aria-label="報修完成通知"
              @click="toggleRepairNotifications"
            >
              <span aria-hidden="true">🔔</span>
              <span v-if="unreadRepairNotificationCount > 0" class="notification-count">
                {{ unreadRepairNotificationCount }}
              </span>
            </button>

            <div v-if="showRepairNotifications" class="notification-panel">
              <h3>報修通知</h3>
              <p v-if="completedStudentRepairs.length === 0" class="notification-empty">
                目前沒有已完成的報修通知
              </p>
              <div
                v-for="repair in completedStudentRepairs.slice(0, 5)"
                :key="repair.id"
                class="notification-item"
              >
                <strong>{{ repair.item || "維修案件" }} 已完成</strong>
                <span>{{ repair.room }}｜{{ repair.description || "報修項目已處理完成" }}</span>
              </div>
            </div>
          </div>
          <strong>{{ authUser.name }}</strong>
          <button class="logout-btn" @click="logout">登出</button>
        </div>
      </header>

      <div class="page">
        <template v-if="currentPage === 'dashboard' && isAdmin">
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
                <div class="progress-fill" :style="{ width: occupancyRate + '%' }"></div>
              </div>
              <strong>{{ occupancyRate }}%</strong>
            </div>
            <div class="progress-row">
              <span>空床比例</span>
              <div class="progress-bar">
                <div class="progress-fill green-fill" :style="{ width: emptyBedRate + '%' }"></div>
              </div>
              <strong>{{ emptyBedRate }}%</strong>
            </div>
            <div class="progress-row">
              <span>報修完成率</span>
              <div class="progress-bar">
                <div class="progress-fill orange-fill" :style="{ width: repairDoneRate + '%' }"></div>
              </div>
              <strong>{{ repairDoneRate }}%</strong>
            </div>
          </div>

          <div class="dashboard-section">
            <div class="card">
              <div class="page-header compact-header">
                <div>
                  <h2>近期空床位</h2>
                  <p class="muted-text">共 {{ emptyBeds.length }} 個空床位</p>
                </div>
                <button @click="showDashboardEmptyBeds = !showDashboardEmptyBeds">
                  {{ showDashboardEmptyBeds ? "收合" : "點開查閱" }}
                </button>
              </div>

              <table v-if="showDashboardEmptyBeds">
                <thead>
                  <tr>
                    <th>房號</th>
                    <th>床位</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="bed in emptyBeds" :key="bed.bed">
                    <td>{{ bed.room }}</td>
                    <td>{{ bed.bed }}</td>
                  </tr>
                </tbody>
              </table>

              <p v-else class="empty-bed-summary">
                點開後會一次顯示所有空餘床位。
              </p>
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
                  <tr v-for="repair in repairs.slice(0, 5)" :key="repair.id">
                    <td>{{ repair.room }}</td>
                    <td>{{ repair.item }}</td>
                    <td>{{ repair.status }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </template>

        <template v-if="currentPage === 'my-room' && !isAdmin">
          <h1>我的住宿資料</h1>

          <p v-if="isLoadingStudents" class="notice">學生資料載入中...</p>
          <p v-if="studentError" class="error-notice">{{ studentError }}</p>

          <div v-if="currentStudent" class="card detail-card">
            <div>
              <p>學號</p>
              <strong>{{ currentStudent.id }}</strong>
            </div>
            <div>
              <p>姓名</p>
              <strong>{{ currentStudent.name }}</strong>
            </div>
            <div>
              <p>性別</p>
              <strong>{{ currentStudent.gender || "未填寫" }}</strong>
            </div>
            <div>
              <p>系所</p>
              <strong>{{ currentStudent.department || "未填寫" }}</strong>
            </div>
            <div>
              <p>床位</p>
              <strong>{{ currentStudent.bed || "未分配" }}</strong>
            </div>
            <div>
              <p>住宿狀態</p>
              <span :class="['student-status', currentStudent.status || '未分配']">
                {{ currentStudent.status || "未分配" }}
              </span>
            </div>
          </div>

          <p v-else class="error-notice">找不到目前登入學生資料</p>
        </template>

        <template v-if="currentPage === 'students' && isAdmin">
          <div class="page-header">
            <h1>學生資料管理</h1>
          </div>

          <div class="card student-form">
            <input v-model="newStudent.id" placeholder="學號" />
            <input v-model="newStudent.name" placeholder="姓名" />
            <select v-model="newStudent.gender">
              <option value="">性別</option>
              <option value="男">男</option>
              <option value="女">女</option>
              <option value="其他">其他</option>
            </select>
            <input v-model="newStudent.department" placeholder="系所" />
            <input v-model="newStudent.phone" placeholder="電話" />
            <input v-model="newStudent.email" placeholder="Email" />
            <button @click="addStudent">新增學生</button>
          </div>

          <p v-if="isLoadingStudents" class="notice">學生資料載入中...</p>
          <p v-if="studentError" class="error-notice">{{ studentError }}</p>

          <div class="card">
            <table>
              <thead>
                <tr>
                  <th>學號</th>
                  <th>姓名</th>
                  <th>性別</th>
                  <th>系所</th>
                  <th>電話</th>
                  <th>Email</th>
                  <th>床位</th>
                  <th>狀態</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="student in filteredStudents" :key="student.id">
                  <td>{{ student.id }}</td>
                  <td>
                    <input
                      v-if="editingStudentId === student.id"
                      v-model="editingStudentForm.name"
                      class="table-input"
                    />
                    <span v-else>{{ student.name }}</span>
                  </td>
                  <td>
                    <select
                      v-if="editingStudentId === student.id"
                      v-model="editingStudentForm.gender"
                      class="table-input"
                    >
                      <option value="">未填寫</option>
                      <option value="男">男</option>
                      <option value="女">女</option>
                      <option value="其他">其他</option>
                    </select>
                    <span v-else>{{ student.gender || "未填寫" }}</span>
                  </td>
                  <td>
                    <input
                      v-if="editingStudentId === student.id"
                      v-model="editingStudentForm.department"
                      class="table-input"
                    />
                    <span v-else>{{ student.department }}</span>
                  </td>
                  <td>
                    <input
                      v-if="editingStudentId === student.id"
                      v-model="editingStudentForm.phone"
                      class="table-input"
                    />
                    <span v-else>{{ student.phone }}</span>
                  </td>
                  <td>
                    <input
                      v-if="editingStudentId === student.id"
                      v-model="editingStudentForm.email"
                      class="table-input"
                    />
                    <span v-else>{{ student.email }}</span>
                  </td>
                  <td>{{ student.bed || "未分配" }}</td>
                  <td>
                    <span :class="['student-status', student.status || '未分配']">
                      {{ student.status || "未分配" }}
                    </span>
                  </td>
                  <td v-if="editingStudentId === student.id">
                    <button class="edit-btn" @click="saveStudentEdit(student)">儲存</button>
                    <button class="delete-btn" @click="cancelStudentEdit">取消</button>
                  </td>
                  <td v-else>
                    <button class="checkout-btn" @click="checkoutStudent(student.id)">退宿</button>
                    <button class="edit-btn" @click="editStudent(student.id)">編輯</button>
                    <button class="delete-btn" @click="deleteStudent(student.id)">刪除</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>

        <template v-if="currentPage === 'rooms' && isAdmin">
          <div v-if="!currentDorm">
            <h1>宿舍管理</h1>

            <div class="dorm-grid">
              <button
                v-for="dorm in dormCards"
                :key="dorm.id"
                class="dorm-card"
                @click="selectDorm(dorm.id)"
              >
                <span>{{ dorm.name }}</span>
                <strong>{{ dorm.building }}</strong>
                <div class="dorm-card-stats">
                  <p>房間 {{ dorm.stats.roomCount }}</p>
                  <p>空床 {{ dorm.stats.emptyBeds }}</p>
                  <p>入住率 {{ dorm.stats.occupancyRate }}%</p>
                </div>
              </button>
            </div>
          </div>

          <div v-else>
            <div class="page-header">
              <div>
                <h1>{{ currentDorm.building }}</h1>
                <p class="muted-text">{{ currentDorm.name }}</p>
              </div>
              <button @click="backToDormList">返回宿舍列表</button>
            </div>

            <div class="dashboard-grid">
              <div class="dashboard-card">
                <p>房間總數</p>
                <h2>{{ currentDormStats.roomCount }}</h2>
              </div>
              <div class="dashboard-card">
                <p>總床位數</p>
                <h2>{{ currentDormStats.totalBeds }}</h2>
              </div>
              <div class="dashboard-card">
                <p>空床數</p>
                <h2>{{ currentDormStats.emptyBeds }}</h2>
              </div>
              <div class="dashboard-card">
                <p>入住率</p>
                <h2>{{ currentDormStats.occupancyRate }}%</h2>
              </div>
            </div>

            <div class="room-grid">
              <button
                v-for="room in filteredRooms"
                :key="room.room"
                :class="['room-card', selectedRoomId === room.room ? 'selected' : '']"
                @click="selectRoom(room.room)"
              >
                <div>
                  <span>房號</span>
                  <strong>{{ room.room }}</strong>
                </div>
                <div class="room-card-meta">
                  <p>樓層 {{ room.floor }}</p>
                  <p>已入住 {{ getRoomOccupiedCount(room.room) }}</p>
                  <p>空床 {{ getRoomEmptyBedCount(room.room) }}</p>
                </div>
              </button>
            </div>

            <p v-if="filteredRooms.length === 0" class="empty-text">找不到符合條件的房間</p>

            <div v-if="selectedRoom" class="card dorm-beds-card">
              <div class="page-header compact-header">
                <div>
                  <h2>{{ selectedRoom.room }} 房間詳情</h2>
                  <p class="muted-text">
                    已入住 {{ selectedRoomStudents.length }} 人，剩餘 {{ selectedRoomEmptyBeds.length }} 個床位
                  </p>
                </div>
                <button @click="backToRoomList">關閉</button>
              </div>

              <div class="room-detail-section">
                <h3>入住學生</h3>

                <table>
                  <thead>
                    <tr>
                      <th>姓名</th>
                      <th>學號</th>
                      <th>住宿狀態</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="student in selectedRoomStudents" :key="student.id">
                      <td>{{ student.name }}</td>
                      <td>{{ student.id }}</td>
                      <td>
                        <span :class="['student-status', student.status || '未分配']">
                          {{ student.status || "未分配" }}
                        </span>
                      </td>
                    </tr>
                    <tr v-if="selectedRoomStudents.length === 0">
                      <td colspan="3" class="empty-text">目前沒有入住學生</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div class="room-detail-section">
                <h3>空餘床位</h3>

              <div class="card-list bed-list">
                <div class="small-card" v-for="bed in selectedRoomEmptyBeds" :key="bed.bed">
                  <h3>{{ bed.bed }}</h3>
                  <p>{{ bed.room }}</p>
                </div>
              </div>

              <p v-if="selectedRoomEmptyBeds.length === 0" class="empty-text">這間房目前沒有符合條件的空床</p>
              </div>
            </div>
          </div>
        </template>

        <template v-if="currentPage === 'checkin' && isAdmin">
          <h1>入住辦理</h1>
          <div class="card">
            <div class="form-group">
              <label>學生</label>
              <input
                v-model.trim="checkinForm.studentId"
                list="checkin-students"
                placeholder="手動輸入學號，例如 11204501"
              />
              <datalist id="checkin-students">
                <option v-for="student in students" :key="student.id" :value="student.id">
                  {{ student.name }}
                </option>
              </datalist>

              <div v-if="isNewCheckinStudent" class="checkin-student-panel">
                <p class="notice">此學號尚未建立，請先填寫學生資料，建立入住時會同步新增到學生資料管理。</p>

                <input v-model="checkinStudentForm.name" placeholder="姓名" />
                <select v-model="checkinStudentForm.gender">
                  <option value="">性別</option>
                  <option value="男">男</option>
                  <option value="女">女</option>
                  <option value="其他">其他</option>
                </select>
                <input v-model="checkinStudentForm.department" placeholder="系所" />
                <input v-model="checkinStudentForm.phone" placeholder="電話" />
                <input v-model="checkinStudentForm.email" placeholder="Email" />
              </div>

              <label>宿舍</label>
              <input
                :value="checkinDorm ? checkinDorm.building : (checkinForm.studentId ? '請先設定學生性別' : '請先輸入學號')"
                disabled
              />

              <label>房間</label>
              <select v-model="checkinForm.roomId" :disabled="!checkinForm.studentId">
                <option value="">請選擇房間</option>
                <option v-for="room in checkinRooms" :key="room.room" :value="room.room">
                  {{ room.room }}
                </option>
              </select>

              <label>床位</label>
              <select v-model="checkinForm.bedId" :disabled="!checkinForm.roomId">
                <option value="">請選擇床位</option>
                <option v-for="bed in checkinRoomBeds" :key="bed.bed" :value="bed.bed">
                  {{ bed.bed }}
                </option>
              </select>

              <label>入住日期</label>
              <input type="date" v-model="checkinForm.date" />
              <button class="submit-btn" @click="createCheckin">建立入住</button>
            </div>
          </div>
        </template>

        <template v-if="currentPage === 'history'">
          <h1>{{ isAdmin ? "歷史住宿查詢" : "我的歷史住宿" }}</h1>

          <p v-if="isLoadingHistory" class="notice">歷史住宿資料載入中...</p>
          <p v-if="historyError" class="error-notice">{{ historyError }}</p>

          <div class="card">
            <table>
              <thead>
                <tr>
                  <th v-if="isAdmin">學號</th>
                  <th v-if="isAdmin">姓名</th>
                  <th>宿舍</th>
                  <th>房號</th>
                  <th>床位</th>
                  <th>入住日期</th>
                  <th>退宿日期</th>
                  <th>狀態</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="record in filteredCheckinHistory" :key="record.id">
                  <td v-if="isAdmin">{{ record.studentId }}</td>
                  <td v-if="isAdmin">{{ record.studentName }}</td>
                  <td>{{ record.dormitory }}</td>
                  <td>{{ record.room }}</td>
                  <td>{{ record.bed }}</td>
                  <td>{{ formatDateOnly(record.checkinDate) || "未記錄" }}</td>
                  <td>{{ formatDateOnly(record.checkoutDate) || "入住中" }}</td>
                  <td>
                    <span :class="['student-status', record.status || '未分配']">
                      {{ record.status || "未分配" }}
                    </span>
                  </td>
                </tr>
                <tr v-if="filteredCheckinHistory.length === 0">
                  <td :colspan="isAdmin ? 8 : 6" class="empty-text">目前沒有歷史住宿資料</td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>

        <template v-if="currentPage === 'repair'">
          <h1>維修管理</h1>
          <p v-if="!isAdmin && currentStudent" class="notice">
            申請人：{{ currentStudent.name }}，房號：{{ currentStudent.bed ? findRoomByBed(currentStudent.bed) : "未分配" }}
          </p>

          <p v-if="repairError" class="error-notice">{{ repairError }}</p>

          <div class="card">
            <div class="repair-form">
              <input v-if="isAdmin" v-model="repairForm.room" placeholder="房號，例如 A101" />
              <input v-else :value="currentStudent?.bed ? findRoomByBed(currentStudent.bed) : ''" placeholder="房號" disabled />
              <input v-model="repairForm.item" placeholder="設備，例如 冷氣" />
              <input v-model="repairForm.description" placeholder="報修原因，例如 冷氣漏水" />
              <input type="file" accept="image/*" @change="handleRepairPhotoChange" />
              <select v-if="isAdmin" v-model="repairForm.status">
                <option>待處理</option>
                <option>處理中</option>
                <option>已完成</option>
              </select>
              <button :disabled="isReadingRepairPhoto" @click="addRepair">
                {{ isReadingRepairPhoto ? "照片讀取中" : "送出報修" }}
              </button>
            </div>

            <p v-if="isReadingRepairPhoto" class="notice">照片讀取中，請稍候...</p>

            <img
              v-if="repairForm.photoData"
              class="repair-photo-preview"
              :src="repairForm.photoData"
              alt="現場照片預覽"
            />
          </div>

          <div class="card repair-list-card">
            <h2>{{ isAdmin ? "報修案件狀態" : "我的報修狀態" }}</h2>
            <table>
              <thead>
                <tr>
                  <th>房間</th>
                  <th>設備</th>
                  <th>報修原因</th>
                  <th>現場照片</th>
                  <th v-if="isAdmin">學生</th>
                  <th>狀態</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="repair in filteredRepairs" :key="repair.id">
                  <td>{{ repair.room }}</td>
                  <td>{{ repair.item }}</td>
                  <td>{{ repair.description || "未填寫" }}</td>
                  <td>
                    <img
                      v-if="repair.photoData"
                      class="repair-photo-thumb"
                      :src="repair.photoData"
                      alt="現場照片"
                    />
                    <span v-else class="muted-text">無</span>
                  </td>
                  <td v-if="isAdmin">{{ repair.studentId || "管理員建立" }}</td>
                  <td>
                    <select
                      v-if="isAdmin && editingRepairId === repair.id"
                      v-model="editingRepairStatus"
                      class="status-select"
                    >
                      <option>待處理</option>
                      <option>處理中</option>
                      <option>已完成</option>
                    </select>
                    <span v-else :class="['status-badge', repair.status]">{{ repair.status }}</span>
                  </td>
                  <td v-if="isAdmin && editingRepairId === repair.id">
                    <button class="edit-btn" @click="updateRepairStatus(repair, editingRepairStatus)">儲存</button>
                    <button class="delete-repair-btn" @click="cancelRepairStatusEdit">取消</button>
                  </td>
                  <td v-else>
                    <button v-if="isAdmin" class="edit-btn" @click="editRepairStatus(repair)">編輯</button>
                    <button
                      v-if="canCancelRepair(repair)"
                      class="delete-repair-btn"
                      @click="deleteRepair(repair)"
                    >
                      {{ isAdmin ? "刪除" : "取消報修" }}
                    </button>
                    <span v-else class="muted-text">不可取消</span>
                  </td>
                </tr>
                <tr v-if="filteredRepairs.length === 0">
                  <td :colspan="isAdmin ? 7 : 6" class="empty-text">目前沒有報修資料</td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>
      </div>
    </main>
  </div>
</template>
