import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// In production, route all relative /api calls directly to the live Render backend
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || (import.meta.env.PROD ? 'https://ssms-v1sa.onrender.com' : '')

if (BACKEND_URL) {
  const originalFetch = window.fetch
  window.fetch = function (resource, init) {
    if (typeof resource === 'string' && resource.startsWith('/api/')) {
      resource = `${BACKEND_URL}${resource}`
    } else if (resource instanceof Request && resource.url.startsWith('/api/')) {
      resource = new Request(`${BACKEND_URL}${resource.url}`, resource)
    }
    return originalFetch(resource, init)
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)