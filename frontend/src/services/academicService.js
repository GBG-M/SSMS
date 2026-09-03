const API_BASE_URL = '/api/academics'

export async function fetchAcademicYears(token) {
  const response = await fetch(`${API_BASE_URL}/academic-years/`, {
    headers: {
      'Authorization': `Token ${token}`,
      'Content-Type': 'application/json',
    },
  })
  return response.json()
}

export async function createAcademicYear(token, data) {
  const response = await fetch(`${API_BASE_URL}/academic-years/`, {
    method: 'POST',
    headers: {
      'Authorization': `Token ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  return response.json()
}

export async function fetchSubjects(token) {
  const response = await fetch(`${API_BASE_URL}/subjects/`, {
    headers: {
      'Authorization': `Token ${token}`,
      'Content-Type': 'application/json',
    },
  })
  return response.json()
}

export async function createSubject(token, data) {
  const response = await fetch(`${API_BASE_URL}/subjects/`, {
    method: 'POST',
    headers: {
      'Authorization': `Token ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  return response.json()
}

export async function fetchCourses(token, filters = {}) {
  const params = new URLSearchParams(filters)
  const response = await fetch(`${API_BASE_URL}/courses/?${params}`, {
    headers: {
      'Authorization': `Token ${token}`,
      'Content-Type': 'application/json',
    },
  })
  return response.json()
}

export async function fetchCourseDetail(token, courseId) {
  const response = await fetch(`${API_BASE_URL}/courses/${courseId}/`, {
    headers: {
      'Authorization': `Token ${token}`,
      'Content-Type': 'application/json',
    },
  })
  return response.json()
}

export async function createCourse(token, data) {
  const response = await fetch(`${API_BASE_URL}/courses/`, {
    method: 'POST',
    headers: {
      'Authorization': `Token ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  return response.json()
}

export async function updateCourse(token, courseId, data) {
  const response = await fetch(`${API_BASE_URL}/courses/${courseId}/`, {
    method: 'PUT',
    headers: {
      'Authorization': `Token ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  return response.json()
}

export async function fetchClassSections(token, filters = {}) {
  const params = new URLSearchParams(filters)
  const response = await fetch(`${API_BASE_URL}/class-sections/?${params}`, {
    headers: {
      'Authorization': `Token ${token}`,
      'Content-Type': 'application/json',
    },
  })
  return response.json()
}

export async function fetchClassSectionDetail(token, sectionId) {
  const response = await fetch(`${API_BASE_URL}/class-sections/${sectionId}/`, {
    headers: {
      'Authorization': `Token ${token}`,
      'Content-Type': 'application/json',
    },
  })
  return response.json()
}

export async function createClassSection(token, data) {
  const response = await fetch(`${API_BASE_URL}/class-sections/`, {
    method: 'POST',
    headers: {
      'Authorization': `Token ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  return response.json()
}

export async function fetchEnrollments(token, filters = {}) {
  const params = new URLSearchParams(filters)
  const response = await fetch(`${API_BASE_URL}/enrollments/?${params}`, {
    headers: {
      'Authorization': `Token ${token}`,
      'Content-Type': 'application/json',
    },
  })
  return response.json()
}

export async function createEnrollment(token, data) {
  const response = await fetch(`${API_BASE_URL}/enrollments/`, {
    method: 'POST',
    headers: {
      'Authorization': `Token ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  return response.json()
}

export async function fetchAssessments(token, filters = {}) {
  const params = new URLSearchParams(filters)
  const response = await fetch(`${API_BASE_URL}/assessments/?${params}`, {
    headers: {
      'Authorization': `Token ${token}`,
      'Content-Type': 'application/json',
    },
  })
  return response.json()
}

export async function createAssessment(token, data) {
  const response = await fetch(`${API_BASE_URL}/assessments/`, {
    method: 'POST',
    headers: {
      'Authorization': `Token ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  return response.json()
}

export async function fetchGradeRecords(token, filters = {}) {
  const params = new URLSearchParams(filters)
  const response = await fetch(`${API_BASE_URL}/grade-records/?${params}`, {
    headers: {
      'Authorization': `Token ${token}`,
      'Content-Type': 'application/json',
    },
  })
  return response.json()
}

export async function createGradeRecord(token, data) {
  const response = await fetch(`${API_BASE_URL}/grade-records/`, {
    method: 'POST',
    headers: {
      'Authorization': `Token ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  return response.json()
}

export async function updateGradeRecord(token, gradeId, data) {
  const response = await fetch(`${API_BASE_URL}/grade-records/${gradeId}/`, {
    method: 'PUT',
    headers: {
      'Authorization': `Token ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  return response.json()
}

export async function fetchAcademicSummaries(token, filters = {}) {
  const params = new URLSearchParams(filters)
  const response = await fetch(`${API_BASE_URL}/academic-summaries/?${params}`, {
    headers: {
      'Authorization': `Token ${token}`,
      'Content-Type': 'application/json',
    },
  })
  return response.json()
}
