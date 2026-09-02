import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import Home from './pages/Home/Home'
import Login from './pages/auth/login'
import ForcePasswordReset from './pages/auth/ForcePasswordReset'
import Dashboard from './pages/dashboard/Dashboard'
import ProtectedRoute from './routes/ProtectedRoute'
import Profile from './pages/profile/Profile'
import ChangePassword from './pages/auth/ChangePassword'
import Users from './pages/admin/Users'
import UserDetails from './pages/admin/UserDetails'
import EditUser from './pages/admin/EditUser'
import AcademicsOverview from './pages/academics/AcademicsOverview'
import AcademicYears from './pages/academics/AcademicYears'
import Subjects from './pages/academics/Subjects'
import Courses from './pages/academics/Courses'
import ClassSections from './pages/academics/ClassSections'
import Enrollments from './pages/academics/Enrollments'
import GradeBook from './pages/academics/GradeBook'
import Assessments from './pages/academics/Assessments'
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
<Route
  path="/admin/users/:id"
  element={
    <ProtectedRoute>
      <UserDetails />
    </ProtectedRoute>
  }
/>
<Route
  path="/admin/users/:id/edit"
  element={
    <ProtectedRoute>
      <EditUser />
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

        {/* Academics Routes */}
        <Route
          path="/academics"
          element={
            <ProtectedRoute>
              <AcademicsOverview />
            </ProtectedRoute>
          }
        />
        <Route
          path="/academics/years"
          element={
            <ProtectedRoute>
              <AcademicYears />
            </ProtectedRoute>
          }
        />
        <Route
          path="/academics/subjects"
          element={
            <ProtectedRoute>
              <Subjects />
            </ProtectedRoute>
          }
        />
        <Route
          path="/academics/courses"
          element={
            <ProtectedRoute>
              <Courses />
            </ProtectedRoute>
          }
        />
        <Route
          path="/academics/sections"
          element={
            <ProtectedRoute>
              <ClassSections />
            </ProtectedRoute>
          }
        />
        <Route
          path="/academics/enrollments"
          element={
            <ProtectedRoute>
              <Enrollments />
            </ProtectedRoute>
          }
        />
        <Route
          path="/academics/grades"
          element={
            <ProtectedRoute>
              <GradeBook />
            </ProtectedRoute>
          }
        />
        <Route
          path="/academics/assessments"
          element={
            <ProtectedRoute>
              <Assessments />
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