import { getToken, clearAuthSession } from './authService'

const API_BASE = '/api/students'

async function authFetch(url, options = {}) {
  const token = getToken()
  const headers = {
    ...(options.headers || {}),
  }

  if (token) {
    headers['Authorization'] = `Token ${token}`
  }

  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json'
  }

  const response = await fetch(url, {
    ...options,
    headers,
  })

  if (response.status === 401) {
    clearAuthSession()
    window.location.href = '/login'
    throw new Error('Authentication expired. Please log in again.')
  }

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.detail || data.error || data.message || `Request failed with status ${response.status}`)
  }

  return data
}

export async function getMyStudentProfile() {
  // First fetch the list of students accessible to the logged-in user
  const listData = await authFetch(`${API_BASE}/students/`)
  const students = Array.isArray(listData) ? listData : listData.results || []

  if (students.length > 0) {
    const studentSummary = students[0]
    try {
      // Fetch the full detailed profile
      const detailData = await authFetch(`${API_BASE}/students/${studentSummary.id}/`)
      return detailData
    } catch {
      return studentSummary
    }
  }

  return null
}

export async function getAcademicRecords(studentId = null) {
  const url = studentId
    ? `${API_BASE}/academic-records/?student_id=${studentId}`
    : `${API_BASE}/academic-records/`
  const data = await authFetch(url)
  return Array.isArray(data) ? data : data.results || []
}

export async function getAttendanceRecords(startDate = null, endDate = null) {
  const params = new URLSearchParams()
  if (startDate) params.append('start_date', startDate)
  if (endDate) params.append('end_date', endDate)

  const queryString = params.toString() ? `?${params.toString()}` : ''
  const data = await authFetch(`${API_BASE}/attendance/${queryString}`)
  return Array.isArray(data) ? data : data.results || []
}

export async function getDocuments(studentId = null) {
  const url = studentId
    ? `${API_BASE}/documents/?student=${studentId}`
    : `${API_BASE}/documents/`
  const data = await authFetch(url)
  return Array.isArray(data) ? data : data.results || []
}

export async function uploadStudentDocument(formData) {
  return await authFetch(`${API_BASE}/documents/`, {
    method: 'POST',
    body: formData,
  })
}
