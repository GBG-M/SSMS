const API_BASE_URL = '/api/accounts'

export function clearAuthSession() {
  localStorage.removeItem('authToken')
  localStorage.removeItem('userEmail')
  localStorage.removeItem('userProfile')
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

  const data = await response.json()

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
  const roles = user.role_names || (user.roles ? user.roles.map(r => r.name || r) : [])
  return roles.includes('admin') || roles.includes('academic_coordinator')
}