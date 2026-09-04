const API_BASE_URL = '/api/accounts'

export function clearAuthSession() {
  localStorage.removeItem('authToken')
  localStorage.removeItem('authType')
  localStorage.removeItem('userEmail')
  localStorage.removeItem('userProfile')
  localStorage.removeItem('preAuthUserId')
}

export async function login(email, password) {
  const response = await fetch(`${API_BASE_URL}/login/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      password,
    }),
  })

  const data = await response.json().catch(() => ({}))

  return {
    ok: response.ok,
    status: response.status,
    data,
  }
}

export async function logout() {
  const token = localStorage.getItem('authToken')

  if (!token) {
    clearAuthSession()
    return
  }

  try {
    await fetch(`${API_BASE_URL}/logout/`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/json',
      },
    })
  } finally {
    clearAuthSession()
  }
}

export function getToken() {
  return localStorage.getItem('authToken')
}

export function isAuthenticated() {
  return Boolean(localStorage.getItem('authToken'))
}

export async function getCurrentUserProfile(forceRefresh = false) {
  const token = getToken()
  if (!token) return null

  if (!forceRefresh) {
    try {
      const cached = localStorage.getItem('userProfile')
      if (cached) return JSON.parse(cached)
    } catch {}
  }

  try {
    const response = await fetch(`${API_BASE_URL}/profile/`, {
      method: 'GET',
      headers: {
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) return null
    const user = await response.json()
    localStorage.setItem('userProfile', JSON.stringify(user))
    return user
  } catch {
    return null
  }
}

export function hasSchedulingPermission(user) {
  if (!user) return false
  if (user.is_staff || user.is_superuser) return true
  const roles = (user.role_names || (user.roles ? user.roles.map(r => r.name || r) : [])).map(r => String(r).toLowerCase())
  return roles.includes('admin') || roles.includes('academic_coordinator')
}

export async function getSystemRoles() {
  const token = getToken()
  if (!token) return []
  try {
    const res = await fetch(`${API_BASE_URL}/roles/`, {
      headers: {
        Authorization: `Token ${token}`,
        'Content-Type': 'application/json',
      },
    })
    if (!res.ok) return []
    const data = await res.json()
    return Array.isArray(data) ? data : data.results || []
  } catch {
    return []
  }
}

export async function updateUserRoles(userId, roleNames) {
  const token = getToken()
  const res = await fetch(`${API_BASE_URL}/users/${userId}/roles/`, {
    method: 'POST',
    headers: {
      Authorization: `Token ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ role_names: roleNames }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.error || data.detail || 'Failed to update roles.')
  }
  return data
}

export async function adminForceUserPasswordReset(userId) {
  const token = getToken()
  const res = await fetch(`${API_BASE_URL}/users/${userId}/force-reset/`, {
    method: 'POST',
    headers: {
      Authorization: `Token ${token}`,
      'Content-Type': 'application/json',
    },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.error || data.detail || 'Failed to trigger password reset.')
  }
  return data
}

export async function getUserLoginHistory(userId = null) {
  const token = getToken()
  const url = userId
    ? `${API_BASE_URL}/users/${userId}/login-history/`
    : `${API_BASE_URL}/login-history/`
  const res = await fetch(url, {
    headers: {
      Authorization: `Token ${token}`,
      'Content-Type': 'application/json',
    },
  })
  if (!res.ok) return []
  const data = await res.json().catch(() => [])
  return Array.isArray(data) ? data : []
}