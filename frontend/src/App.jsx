import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Home from "./pages/Home/Home";
import Login from "./pages/auth/login";
import ForcePasswordReset from "./pages/auth/ForcePasswordReset";
import Dashboard from "./pages/dashboard/Dashboard";
import ProtectedRoute from "./routes/ProtectedRoute";
import StudentRoute from "./routes/StudentRoute";
import Profile from "./pages/profile/Profile";
import ChangePassword from "./pages/auth/ChangePassword";

import Users from "./pages/admin/Users";
import UserDetails from "./pages/admin/UserDetails";
import EditUser from "./pages/admin/EditUser";

import AcademicsOverview from "./pages/academics/AcademicsOverview";
import AcademicYears from "./pages/academics/AcademicYears";
import Subjects from "./pages/academics/Subjects";
import Courses from "./pages/academics/Courses";
import ClassSections from "./pages/academics/ClassSections";
import Enrollments from "./pages/academics/Enrollments";
import GradeBook from "./pages/academics/GradeBook";
import Assessments from "./pages/academics/Assessments";

import StudentDashboard from "./pages/student/StudentDashboard";
import StudentProfile from "./pages/student/StudentProfile";
import AcademicRecords from "./pages/student/AcademicRecords";
import Attendance from "./pages/student/Attendance";
import Documents from "./pages/student/Documents";

import SchedulingOverview from "./pages/scheduling/SchedulingOverview";
import ClassSchedules from "./pages/scheduling/ClassSchedules";
import ExamSchedules from "./pages/scheduling/ExamSchedules";
import Rooms from "./pages/scheduling/Rooms";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ================= PUBLIC ================= */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/force-password-reset" element={<ForcePasswordReset />} />

        {/* ================= GENERAL PROTECTED ================= */}
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

        {/* ================= ADMIN ================= */}
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

        {/* ================= ACADEMICS ================= */}
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

        {/* ================= STUDENT ================= */}
        <Route
          path="/student/dashboard"
          element={
            <StudentRoute>
              <StudentDashboard />
            </StudentRoute>
          }
        />
        <Route
          path="/student/profile"
          element={
            <StudentRoute>
              <StudentProfile />
            </StudentRoute>
          }
        />
        <Route
          path="/student/academics"
          element={
            <StudentRoute>
              <AcademicRecords />
            </StudentRoute>
          }
        />
        <Route
          path="/student/attendance"
          element={
            <StudentRoute>
              <Attendance />
            </StudentRoute>
          }
        />
        <Route
          path="/student/documents"
          element={
            <StudentRoute>
              <Documents />
            </StudentRoute>
          }
        />

        {/* ================= SCHEDULING ================= */}
        <Route
          path="/scheduling"
          element={
            <ProtectedRoute>
              <SchedulingOverview />
            </ProtectedRoute>
          }
        />
        <Route
          path="/scheduling/classes"
          element={
            <ProtectedRoute>
              <ClassSchedules />
            </ProtectedRoute>
          }
        />
        <Route
          path="/scheduling/exams"
          element={
            <ProtectedRoute>
              <ExamSchedules />
            </ProtectedRoute>
          }
        />
        <Route
          path="/scheduling/rooms"
          element={
            <ProtectedRoute>
              <Rooms />
            </ProtectedRoute>
          }
        />

        {/* ================= UNKNOWN URL ================= */}
        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;