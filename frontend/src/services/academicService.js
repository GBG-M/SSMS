import { getToken, clearAuthSession } from './authService'

const API_BASE_URL = '/api/academics'

async function authFetch(url, options = {}) {
  const token = options.token || getToken()
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

  if (response.status === 204) {
    return null
  }

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    const errorMsg =
      data.detail ||
      data.error ||
      data.message ||
      (typeof data === 'object' ? Object.entries(data).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join(' | ') : '') ||
      `Request failed with status ${response.status}`
    throw new Error(errorMsg)
  }

  return data
}

function toQueryString(params = {}) {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '') {
      query.append(key, val)
    }
  })
  const qs = query.toString()
  return qs ? `?${qs}` : ''
}

function unwrapList(data) {
  if (Array.isArray(data)) return data
  if (data && Array.isArray(data.results)) return data.results
  return []
}

// ================= ACADEMIC YEARS =================
export async function getAcademicYears(params = {}) {
  const data = await authFetch(`${API_BASE_URL}/academic-years/${toQueryString(params)}`)
  return unwrapList(data)
}
export async function createAcademicYear(tokenOrData, maybeData) {
  const data = maybeData !== undefined ? maybeData : tokenOrData
  return await authFetch(`${API_BASE_URL}/academic-years/`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}
export async function updateAcademicYear(id, data) {
  return await authFetch(`${API_BASE_URL}/academic-years/${id}/`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}
export async function deleteAcademicYear(id) {
  return await authFetch(`${API_BASE_URL}/academic-years/${id}/`, {
    method: 'DELETE',
  })
}

// ================= SUBJECTS =================
export async function getSubjects(params = {}) {
  const data = await authFetch(`${API_BASE_URL}/subjects/${toQueryString(params)}`)
  return unwrapList(data)
}
export async function createSubject(tokenOrData, maybeData) {
  const data = maybeData !== undefined ? maybeData : tokenOrData
  return await authFetch(`${API_BASE_URL}/subjects/`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}
export async function updateSubject(id, data) {
  return await authFetch(`${API_BASE_URL}/subjects/${id}/`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}
export async function deleteSubject(id) {
  return await authFetch(`${API_BASE_URL}/subjects/${id}/`, {
    method: 'DELETE',
  })
}

// ================= COURSES =================
export async function getCourses(params = {}) {
  const data = await authFetch(`${API_BASE_URL}/courses/${toQueryString(params)}`)
  return unwrapList(data)
}
export async function getCourseDetail(courseId) {
  return await authFetch(`${API_BASE_URL}/courses/${courseId}/`)
}
export async function createCourse(tokenOrData, maybeData) {
  const data = maybeData !== undefined ? maybeData : tokenOrData
  return await authFetch(`${API_BASE_URL}/courses/`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}
export async function updateCourse(id, data) {
  return await authFetch(`${API_BASE_URL}/courses/${id}/`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}
export async function deleteCourse(id) {
  return await authFetch(`${API_BASE_URL}/courses/${id}/`, {
    method: 'DELETE',
  })
}

// ================= CLASS SECTIONS =================
export async function getClassSections(params = {}) {
  const data = await authFetch(`${API_BASE_URL}/class-sections/${toQueryString(params)}`)
  return unwrapList(data)
}
export async function getClassSectionDetail(sectionId) {
  return await authFetch(`${API_BASE_URL}/class-sections/${sectionId}/`)
}
export async function getClassSectionRoster(sectionId) {
  const data = await authFetch(`${API_BASE_URL}/class-sections/${sectionId}/students/`)
  return unwrapList(data)
}
export async function createClassSection(tokenOrData, maybeData) {
  const data = maybeData !== undefined ? maybeData : tokenOrData
  return await authFetch(`${API_BASE_URL}/class-sections/`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}
export async function updateClassSection(id, data) {
  return await authFetch(`${API_BASE_URL}/class-sections/${id}/`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}
export async function deleteClassSection(id) {
  return await authFetch(`${API_BASE_URL}/class-sections/${id}/`, {
    method: 'DELETE',
  })
}

// ================= ENROLLMENTS =================
export async function getEnrollments(params = {}) {
  const data = await authFetch(`${API_BASE_URL}/enrollments/${toQueryString(params)}`)
  return unwrapList(data)
}
export async function createEnrollment(tokenOrData, maybeData) {
  const data = maybeData !== undefined ? maybeData : tokenOrData
  return await authFetch(`${API_BASE_URL}/enrollments/`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}
export async function updateEnrollment(id, data) {
  return await authFetch(`${API_BASE_URL}/enrollments/${id}/`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}
export async function deleteEnrollment(id) {
  return await authFetch(`${API_BASE_URL}/enrollments/${id}/`, {
    method: 'DELETE',
  })
}

// ================= ASSESSMENTS =================
export async function getAssessments(params = {}) {
  const data = await authFetch(`${API_BASE_URL}/assessments/${toQueryString(params)}`)
  return unwrapList(data)
}
export async function createAssessment(tokenOrData, maybeData) {
  const data = maybeData !== undefined ? maybeData : tokenOrData
  return await authFetch(`${API_BASE_URL}/assessments/`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}
export async function updateAssessment(id, data) {
  return await authFetch(`${API_BASE_URL}/assessments/${id}/`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}
export async function deleteAssessment(id) {
  return await authFetch(`${API_BASE_URL}/assessments/${id}/`, {
    method: 'DELETE',
  })
}

// ================= GRADE RECORDS =================
export async function getGradeRecords(params = {}) {
  const data = await authFetch(`${API_BASE_URL}/grade-records/${toQueryString(params)}`)
  return unwrapList(data)
}
export async function createGradeRecord(tokenOrData, maybeData) {
  const data = maybeData !== undefined ? maybeData : tokenOrData
  return await authFetch(`${API_BASE_URL}/grade-records/`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}
export async function updateGradeRecord(id, data) {
  return await authFetch(`${API_BASE_URL}/grade-records/${id}/`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}
export async function deleteGradeRecord(id) {
  return await authFetch(`${API_BASE_URL}/grade-records/${id}/`, {
    method: 'DELETE',
  })
}

// ================= ACADEMIC SUMMARIES =================
export async function getAcademicSummaries(params = {}) {
  const data = await authFetch(`${API_BASE_URL}/academic-summaries/${toQueryString(params)}`)
  return unwrapList(data)
}
export async function createAcademicSummary(data) {
  return await authFetch(`${API_BASE_URL}/academic-summaries/`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}
export async function updateAcademicSummary(id, data) {
  return await authFetch(`${API_BASE_URL}/academic-summaries/${id}/`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

// ================= LOOKUP HELPERS =================
export async function getStudentsLookup() {
  const data = await authFetch('/api/students/students/')
  return unwrapList(data)
}

export async function getUsersLookup(role = null) {
  const params = role ? `?role=${role}` : ''
  const data = await authFetch(`/api/accounts/users/${params}`)
  return unwrapList(data)
}

// ================= BACKWARD COMPATIBILITY ALIASES =================
export const fetchAcademicYears = async () => getAcademicYears()
export const fetchSubjects = async () => getSubjects()
export const fetchCourses = async (t, filters) => getCourses(filters || {})
export const fetchCourseDetail = async (t, id) => getCourseDetail(id)
export const fetchClassSections = async (t, filters) => getClassSections(filters || {})
export const fetchClassSectionDetail = async (t, id) => getClassSectionDetail(id)
export const fetchEnrollments = async (t, filters) => getEnrollments(filters || {})
export const fetchAssessments = async (t, filters) => getAssessments(filters || {})
export const fetchGradeRecords = async (t, filters) => getGradeRecords(filters || {})
export const fetchAcademicSummaries = async (t, filters) => getAcademicSummaries(filters || {})

