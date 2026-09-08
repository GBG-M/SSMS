import { getToken } from './authService'

const API_BASE_URL = '/api/communications'

async function request(url, options = {}) {
  const token = getToken()
  const headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Token ${token}` } : {}),
    ...options.headers,
  }

  const response = await fetch(url, {
    ...options,
    headers,
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    const errorMsg =
      data?.detail ||
      data?.error ||
      (typeof data === 'object' ? Object.values(data).flat().join(' ') : 'Communication request failed.')
    const error = new Error(errorMsg)
    error.status = response.status
    error.data = data
    throw error
  }

  return data
}

export async function fetchThreads(params = {}) {
  const query = new URLSearchParams()
  if (params.status) query.append('status', params.status)
  if (params.category) query.append('category', params.category)
  if (params.student) query.append('student', params.student)
  if (params.search) query.append('search', params.search)

  const qs = query.toString() ? `?${query.toString()}` : ''
  const data = await request(`${API_BASE_URL}/threads/${qs}`)
  return Array.isArray(data) ? data : data.results || []
}

export async function fetchThread(id) {
  return request(`${API_BASE_URL}/threads/${id}/`)
}

export async function createThread({ student_id, recipient_id, subject, category, initial_message }) {
  return request(`${API_BASE_URL}/threads/`, {
    method: 'POST',
    body: JSON.stringify({
      student_id,
      recipient_id,
      subject,
      category,
      initial_message,
    }),
  })
}

export async function sendThreadMessage(threadId, content) {
  return request(`${API_BASE_URL}/threads/${threadId}/messages/`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  })
}

export async function resolveThread(threadId) {
  return request(`${API_BASE_URL}/threads/${threadId}/resolve/`, {
    method: 'POST',
  })
}

export async function markThreadRead(threadId) {
  return request(`${API_BASE_URL}/threads/${threadId}/mark-read/`, {
    method: 'POST',
  })
}

export async function fetchContacts() {
  return request(`${API_BASE_URL}/contacts/`)
}

export async function fetchAnnouncements(params = {}) {
  const query = new URLSearchParams()
  if (params.priority) query.append('priority', params.priority)
  if (params.target_audience) query.append('target_audience', params.target_audience)

  const qs = query.toString() ? `?${query.toString()}` : ''
  const data = await request(`${API_BASE_URL}/announcements/${qs}`)
  return Array.isArray(data) ? data : data.results || []
}

export async function createAnnouncement({ title, content, target_audience = 'ALL', priority = 'NORMAL' }) {
  return request(`${API_BASE_URL}/announcements/`, {
    method: 'POST',
    body: JSON.stringify({
      title,
      content,
      target_audience,
      priority,
    }),
  })
}
