/**
 * Service for Scheduling API operations:
 * - Class Schedules CRUD
 * - Exam Schedules CRUD
 * - Rooms CRUD
 * - Dropdown Lookup Helpers
 */

const API_BASE_URL = '/api/scheduling'

function getAuthHeaders() {
  const token = localStorage.getItem('authToken')
  return {
    'Authorization': token ? `Token ${token}` : '',
    'Content-Type': 'application/json',
  }
}

async function handleResponse(response) {
  const data = await response.json().catch(() => null)
  if (!response.ok) {
    const errorMsg =
      (data && (data.detail || data.error || data.message)) ||
      (typeof data === 'object' ? JSON.stringify(data) : 'An error occurred.')
    const err = new Error(errorMsg)
    err.status = response.status
    err.data = data
    throw err
  }
  return data
}

// ==========================================
// Class Schedules API
// ==========================================

export async function fetchClassSchedules(params = {}) {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '') {
      query.append(key, val)
    }
  })
  const url = `${API_BASE_URL}/class-schedules/${query.toString() ? `?${query.toString()}` : ''}`
  const response = await fetch(url, {
    method: 'GET',
    headers: getAuthHeaders(),
  })
  return handleResponse(response)
}

export async function fetchClassScheduleById(id) {
  const response = await fetch(`${API_BASE_URL}/class-schedules/${id}/`, {
    method: 'GET',
    headers: getAuthHeaders(),
  })
  return handleResponse(response)
}

export async function createClassSchedule(payload) {
  const response = await fetch(`${API_BASE_URL}/class-schedules/`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  })
  return handleResponse(response)
}

export async function updateClassSchedule(id, payload) {
  const response = await fetch(`${API_BASE_URL}/class-schedules/${id}/`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  })
  return handleResponse(response)
}

export async function deleteClassSchedule(id) {
  const response = await fetch(`${API_BASE_URL}/class-schedules/${id}/`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  })
  if (response.status === 204) return true
  return handleResponse(response)
}

// ==========================================
// Exam Schedules API
// ==========================================

export async function fetchExamSchedules(params = {}) {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '') {
      query.append(key, val)
    }
  })
  const url = `${API_BASE_URL}/exam-schedules/${query.toString() ? `?${query.toString()}` : ''}`
  const response = await fetch(url, {
    method: 'GET',
    headers: getAuthHeaders(),
  })
  return handleResponse(response)
}

export async function createExamSchedule(payload) {
  const response = await fetch(`${API_BASE_URL}/exam-schedules/`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  })
  return handleResponse(response)
}

export async function updateExamSchedule(id, payload) {
  const response = await fetch(`${API_BASE_URL}/exam-schedules/${id}/`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  })
  return handleResponse(response)
}

export async function deleteExamSchedule(id) {
  const response = await fetch(`${API_BASE_URL}/exam-schedules/${id}/`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  })
  if (response.status === 204) return true
  return handleResponse(response)
}

// ==========================================
// Rooms API
// ==========================================

export async function fetchRooms(params = {}) {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '') {
      query.append(key, val)
    }
  })
  const url = `${API_BASE_URL}/rooms/${query.toString() ? `?${query.toString()}` : ''}`
  const response = await fetch(url, {
    method: 'GET',
    headers: getAuthHeaders(),
  })
  return handleResponse(response)
}

export async function createRoom(payload) {
  const response = await fetch(`${API_BASE_URL}/rooms/`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  })
  return handleResponse(response)
}

export async function updateRoom(id, payload) {
  const response = await fetch(`${API_BASE_URL}/rooms/${id}/`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  })
  return handleResponse(response)
}

export async function deleteRoom(id) {
  const response = await fetch(`${API_BASE_URL}/rooms/${id}/`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  })
  if (response.status === 204) return true
  return handleResponse(response)
}

// ==========================================
// Helper Dropdown Lookups
// ==========================================

export async function fetchClassSectionsLookup() {
  const response = await fetch('/api/academics/class-sections/', {
    method: 'GET',
    headers: getAuthHeaders(),
  })
  const res = await handleResponse(response)
  return res.results || res || []
}

export async function fetchAcademicYearsLookup() {
  const response = await fetch('/api/academics/academic-years/', {
    method: 'GET',
    headers: getAuthHeaders(),
  })
  const res = await handleResponse(response)
  return res.results || res || []
}

export async function fetchTeachersLookup() {
  const response = await fetch('/api/accounts/users/', {
    method: 'GET',
    headers: getAuthHeaders(),
  })
  const res = await handleResponse(response)
  const users = res.results || res.users || res || []
  // Return teachers or all staff
  return users.filter(u => {
    const roles = u.role_names || (u.roles ? u.roles.map(r => r.name || r) : [])
    return roles.includes('teacher') || roles.includes('academic_coordinator') || roles.includes('admin') || true
  })
}
