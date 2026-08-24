const API_BASE_URL = '/api/accounts'

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
    localStorage.removeItem('authToken')
    localStorage.removeItem('userEmail')
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
    localStorage.removeItem('authToken')
    localStorage.removeItem('userEmail')
  }
}

export function getToken() {
  return localStorage.getItem('authToken')
}

export function isAuthenticated() {
  return Boolean(localStorage.getItem('authToken'))
}