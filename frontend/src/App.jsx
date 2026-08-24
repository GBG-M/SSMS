import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import Login from './pages/auth/login'
import ForcePasswordReset from './pages/auth/ForcePasswordReset'
import Dashboard from './pages/dashboard/Dashboard'
import ProtectedRoute from './routes/ProtectedRoute'

function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route
          path="/"
          element={<Navigate to="/login" replace />}
        />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/force-password-reset"
          element={<ForcePasswordReset />}
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="*"
          element={<Navigate to="/login" replace />}
        />

      </Routes>
    </BrowserRouter>
  )
}

export default App