import { getToken } from './authService'

const API_BASE_URL = '/api/finance'

function collectionData(data) {
  return Array.isArray(data) ? data : (Array.isArray(data?.results) ? data.results : [])
}

function getHeaders() {
  const token = getToken()
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Token ${token}` }),
  }
}

// ============ Fee Types ============

export async function getFeeTypes() {
  try {
    const response = await fetch(`${API_BASE_URL}/fee-types/`, {
      method: 'GET',
      headers: getHeaders(),
    })
    const data = await response.json()
    return {
      ok: response.ok,
      status: response.status,
      data: collectionData(data),
    }
  } catch (error) {
    return {
      ok: false,
      status: 0,
      error: error.message,
    }
  }
}

export async function createFeeType(payload) {
  try {
    const response = await fetch(`${API_BASE_URL}/fee-types/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    })
    const data = await response.json()
    return {
      ok: response.ok,
      status: response.status,
      data,
    }
  } catch (error) {
    return {
      ok: false,
      status: 0,
      error: error.message,
    }
  }
}

// ============ Fee Structures ============

export async function getFeeStructures(params = {}) {
  try {
    const query = new URLSearchParams(params).toString()
    const url = query ? `${API_BASE_URL}/fee-structures/?${query}` : `${API_BASE_URL}/fee-structures/`
    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders(),
    })
    const data = await response.json()
    return {
      ok: response.ok,
      status: response.status,
      data: collectionData(data),
    }
  } catch (error) {
    return {
      ok: false,
      status: 0,
      error: error.message,
    }
  }
}

// ============ Student Fees ============

export async function getStudentFees(params = {}) {
  try {
    const query = new URLSearchParams(params).toString()
    const url = query ? `${API_BASE_URL}/student-fees/?${query}` : `${API_BASE_URL}/student-fees/`
    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders(),
    })
    const data = await response.json()
    return {
      ok: response.ok,
      status: response.status,
      data: collectionData(data),
    }
  } catch (error) {
    return {
      ok: false,
      status: 0,
      error: error.message,
    }
  }
}

export async function createStudentFee(payload) {
  try {
    const response = await fetch(`${API_BASE_URL}/student-fees/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    })
    const data = await response.json()
    return {
      ok: response.ok,
      status: response.status,
      data,
    }
  } catch (error) {
    return {
      ok: false,
      status: 0,
      error: error.message,
    }
  }
}

export async function updateStudentFee(feeId, payload) {
  try {
    const response = await fetch(`${API_BASE_URL}/student-fees/${feeId}/`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    })
    const data = await response.json()
    return {
      ok: response.ok,
      status: response.status,
      data,
    }
  } catch (error) {
    return {
      ok: false,
      status: 0,
      error: error.message,
    }
  }
}

// ============ Invoices ============

export async function getInvoices(params = {}) {
  try {
    const query = new URLSearchParams(params).toString()
    const url = query ? `${API_BASE_URL}/invoices/?${query}` : `${API_BASE_URL}/invoices/`
    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders(),
    })
    const data = await response.json()
    return {
      ok: response.ok,
      status: response.status,
      data: collectionData(data),
    }
  } catch (error) {
    return {
      ok: false,
      status: 0,
      error: error.message,
    }
  }
}

export async function getInvoiceDetail(invoiceId) {
  try {
    const response = await fetch(`${API_BASE_URL}/invoices/${invoiceId}/`, {
      method: 'GET',
      headers: getHeaders(),
    })
    const data = await response.json()
    return {
      ok: response.ok,
      status: response.status,
      data,
    }
  } catch (error) {
    return {
      ok: false,
      status: 0,
      error: error.message,
    }
  }
}

export async function createInvoice(payload) {
  try {
    const response = await fetch(`${API_BASE_URL}/invoices/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    })
    const data = await response.json()
    return {
      ok: response.ok,
      status: response.status,
      data,
    }
  } catch (error) {
    return {
      ok: false,
      status: 0,
      error: error.message,
    }
  }
}

// ============ Payments ============

export async function getPayments(params = {}) {
  try {
    const query = new URLSearchParams(params).toString()
    const url = query ? `${API_BASE_URL}/payments/?${query}` : `${API_BASE_URL}/payments/`
    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders(),
    })
    const data = await response.json()
    return {
      ok: response.ok,
      status: response.status,
      data: collectionData(data),
    }
  } catch (error) {
    return {
      ok: false,
      status: 0,
      error: error.message,
    }
  }
}

export async function recordPayment(payload) {
  try {
    const response = await fetch(`${API_BASE_URL}/payments/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    })
    const data = await response.json()
    return {
      ok: response.ok,
      status: response.status,
      data,
    }
  } catch (error) {
    return {
      ok: false,
      status: 0,
      error: error.message,
    }
  }
}
