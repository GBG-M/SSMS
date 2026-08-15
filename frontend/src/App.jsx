import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import Login from "./pages/auth/Login"
import Register from "./pages/auth/Register"

function Dashboard() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <h1 className="text-3xl font-bold text-blue-600">
        SSMS Dashboard
      </h1>
    </div>
  )
}

function ForgotPassword() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <h1 className="text-2xl font-bold">
        Forgot Password
      </h1>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/" element={<Navigate to="/login" replace />} />

        <Route path="/login" element={<Login />} />

        <Route path="/register" element={<Register />} />

        <Route
          path="/forgot-password"
          element={<ForgotPassword />}
        />

        <Route
          path="/dashboard"
          element={<Dashboard />}
        />

      </Routes>
    </BrowserRouter>
  )
}

export default App