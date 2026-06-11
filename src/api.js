const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

async function request(path, options = {}) {
  let response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers
      },
      ...options
    });
  } catch {
    throw new Error("無法連線到後端，請先啟動或重啟 npm run server");
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = data?.message || `伺服器連線失敗，請確認後端已重啟 (${response.status})`;
    throw new Error(message);
  }

  return data;
}

export function fetchStudents() {
  return request("/students");
}

export function createStudent(student) {
  return request("/students", {
    method: "POST",
    body: JSON.stringify(student)
  });
}

export function updateStudent(id, student) {
  return request(`/students/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(student)
  });
}

export function removeStudent(id) {
  return request(`/students/${encodeURIComponent(id)}`, {
    method: "DELETE"
  });
}

export function fetchCheckinHistory(studentId = "") {
  const query = studentId ? `?studentId=${encodeURIComponent(studentId)}` : "";
  return request(`/checkin-history${query}`);
}

export function fetchRepairs() {
  return request("/repairs");
}

export function createRepair(repair) {
  return request("/repairs", {
    method: "POST",
    body: JSON.stringify(repair)
  });
}

export function updateRepairStatus(id, status) {
  return request(`/repairs/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify({ status })
  });
}

export function removeRepair(id) {
  return request(`/repairs/${encodeURIComponent(id)}`, {
    method: "DELETE"
  });
}
