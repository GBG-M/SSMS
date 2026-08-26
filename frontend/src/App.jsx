import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import Home from './pages/Home/Home'
import Login from './pages/auth/login'
import ForcePasswordReset from './pages/auth/ForcePasswordReset'
import Dashboard from './pages/dashboard/Dashboard'
import ProtectedRoute from './routes/ProtectedRoute'
import Profile from './pages/profile/Profile'
import ChangePassword from './pages/auth/ChangePassword'
import Users from './pages/admin/Users'

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Public Home Page */}
        <Route
          path="/"
          element={<Home />}
        />

        {/* Login */}
        <Route
          path="/login"
          element={<Login />}
        />

        {/* Mandatory Password Reset */}
        <Route
          path="/force-password-reset"
          element={<ForcePasswordReset />}
        />
        <Route
  path="/admin/users"
  element={
    <ProtectedRoute>
      <Users />
    </ProtectedRoute>
  }
/>

        {/* Protected Dashboard */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
  path="/profile"
  element={
    <ProtectedRoute>
      <Profile />
    </ProtectedRoute>
  }
/>
<Route
  path="/change-password"
  element={
    <ProtectedRoute>
      <ChangePassword />
    </ProtectedRoute>
  }
/>

        {/* Unknown URL */}
        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />

      </Routes>
    </BrowserRouter>
  )
}

export default App