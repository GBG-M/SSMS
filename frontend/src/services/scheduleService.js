/**
 * Centralized Service for Scheduling API operations:
 * - Uses central getToken() from authService
 * - Auto-pagination for complete timetables
 * - Strict teacher role filtering (no || true bug)
 * - Friendly error formatting (handles DRF non_field_errors and conflicts)
 * - Timezone-safe date utilities
 */

import { getToken } from './authService'

const API_BASE_URL = '/api/scheduling'

function getAuthHeaders() {
  const token = getToken()
  return {
    'Authorization': token ? `Token ${token}` : '',
    'Content-Type': 'application/json',
  }
}

export function parseApiError(error) {
  if (!error) return 'An unexpected error occurred.'
  if (typeof error === 'string') return error

  if (error.status === 401) {
    return 'Your session has expired. Please log in again.'
  }
  if (error.status === 403) {
    return 'You do not have permission to perform this scheduling action.'
  }

  if (error.data) {
    const data = error.data
    if (typeof data === 'string') return data
    if (data.detail) return data.detail
    if (data.error) return data.error
    if (data.message) return data.message

    // DRF non_field_errors (e.g. Schedule conflicts)
    if (Array.isArray(data.non_field_errors) && data.non_field_errors.length > 0) {
      return data.non_field_errors.join(' ')
    }

    // Specific field validation errors
    const fieldErrors = Object.entries(data)
      .filter(([key]) => key !== 'status' && key !== 'code')
      .map(([field, msgs]) => {
        const fieldName = field.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())
        const msgText = Array.isArray(msgs) ? msgs.join(', ') : msgs
        return `${fieldName}: ${msgText}`
      })

    if (fieldErrors.length > 0) {
      return fieldErrors.join(' | ')
    }
  }

  return error.message || 'Failed to complete request.'
}

async function handleResponse(response) {
  const data = await response.json().catch(() => null)
  if (!response.ok) {
    const err = new Error(parseApiError({ status: response.status, data }))
    err.status = response.status
    err.data = data
    throw err
  }
  return data
}

/**
 * Returns a YYYY-MM-DD string according to local system time
 * avoiding UTC midnight shift bugs.
 */
export function getLocalDateString(d = new Date()) {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// ==========================================
// Class Schedules API (Auto-Paginated)
// ==========================================

export async function fetchClassSchedules(params = {}, fetchAllPages = true) {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '') {
      query.append(key, val)
    }
  })

  let nextUrl = `${API_BASE_URL}/class-schedules/${query.toString() ? `?${query.toString()}` : ''}`
  let allResults = []

  while (nextUrl) {
    const response = await fetch(nextUrl, {
      method: 'GET',
      headers: getAuthHeaders(),
    })
    const data = await handleResponse(response)

    if (Array.isArray(data)) {
      return data
    }

    if (data.results) {
      allResults = allResults.concat(data.results)
      nextUrl = fetchAllPages && data.next ? data.next : null
    } else {
      break
    }
  }

  return allResults
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
// Exam Schedules API (Auto-Paginated)
// ==========================================

export async function fetchExamSchedules(params = {}, fetchAllPages = true) {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '') {
      query.append(key, val)
    }
  })

  let nextUrl = `${API_BASE_URL}/exam-schedules/${query.toString() ? `?${query.toString()}` : ''}`
  let allResults = []

  while (nextUrl) {
    const response = await fetch(nextUrl, {
      method: 'GET',
      headers: getAuthHeaders(),
    })
    const data = await handleResponse(response)

    if (Array.isArray(data)) {
      return data
    }

    if (data.results) {
      allResults = allResults.concat(data.results)
      nextUrl = fetchAllPages && data.next ? data.next : null
    } else {
      break
    }
  }

  return allResults
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
// Rooms API (Auto-Paginated)
// ==========================================

export async function fetchRooms(params = {}, fetchAllPages = true) {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '') {
      query.append(key, val)
    }
  })

  let nextUrl = `${API_BASE_URL}/rooms/${query.toString() ? `?${query.toString()}` : ''}`
  let allResults = []

  while (nextUrl) {
    const response = await fetch(nextUrl, {
      method: 'GET',
      headers: getAuthHeaders(),
    })
    const data = await handleResponse(response)

    if (Array.isArray(data)) {
      return data
    }

    if (data.results) {
      allResults = allResults.concat(data.results)
      nextUrl = fetchAllPages && data.next ? data.next : null
    } else {
      break
    }
  }

  return allResults
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
// Dropdown Lookups
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

/**
 * Returns strictly users with teacher or coordinator roles.
 * Resolves review comment #1 by removing the '|| true' bug.
 */
export async function fetchTeachersLookup() {
  const response = await fetch('/api/accounts/users/', {
    method: 'GET',
    headers: getAuthHeaders(),
  })
  const res = await handleResponse(response)
  const users = res.results || res.users || res || []

  return users.filter((u) => {
    const roles = u.role_names || (u.roles ? u.roles.map((r) => r.name || r) : [])
    return roles.includes('teacher') || roles.includes('academic_coordinator')
  })
}
