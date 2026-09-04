import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Home & Auth
import Home from "./pages/home/Home";
import Login from "./pages/auth/login";
import Register from "./pages/auth/register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ForcePasswordReset from "./pages/auth/ForcePasswordReset";
import ChangePassword from "./pages/auth/ChangePassword";

// Accounts & Admin
import Profile from "./pages/Profile/Profile";
import Users from "./pages/admin/Users";
import UserDetails from "./pages/admin/UserDetails";
import EditUser from "./pages/admin/EditUser";

// Dashboard
import Dashboard from "./pages/dashboard/Dashboard";

// Protected Route wrappers
import ProtectedRoute from "./routes/ProtectedRoute";
import StudentRoute from "./routes/StudentRoute";

// Student Portal
import StudentDashboard from "./pages/student/StudentDashboard";
import StudentProfile from "./pages/student/StudentProfile";
import AcademicRecords from "./pages/student/AcademicRecords";
import Attendance from "./pages/student/Attendance";
import Documents from "./pages/student/Documents";

// Academics Portal
import AcademicsOverview from "./pages/academics/AcademicsOverview";
import AcademicYears from "./pages/academics/AcademicYears";
import Assessments from "./pages/academics/Assessments";
import ClassSections from "./pages/academics/ClassSections";
import Courses from "./pages/academics/Courses";
import Enrollments from "./pages/academics/Enrollments";
import GradeBook from "./pages/academics/GradeBook";
import Subjects from "./pages/academics/Subjects";

// Scheduling Portal
import SchedulingOverview from "./pages/scheduling/SchedulingOverview";
import ClassSchedules from "./pages/scheduling/ClassSchedules";
import ExamSchedules from "./pages/scheduling/ExamSchedules";
import Rooms from "./pages/scheduling/Rooms";

// Notifications
import Notifications from "./features/notifications/Notifications";

// Finance Portal
import FinanceDashboard from "./pages/finance/FinanceDashboard";
import StudentFees from "./pages/finance/StudentFees";
import Invoices from "./pages/finance/Invoices";
import FeeTypes from "./pages/finance/FeeTypes";
import Payments from "./pages/finance/Payments";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ================= PUBLIC ROUTES ================= */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
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

        {/* ================= ADMIN / USER MANAGEMENT ================= */}
        <Route
          path="/users"
          element={
            <ProtectedRoute>
              <Users />
            </ProtectedRoute>
          }
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
          path="/users/:id"
          element={
            <ProtectedRoute>
              <UserDetails />
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
          path="/users/:id/edit"
          element={
            <ProtectedRoute>
              <EditUser />
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

        {/* ================= NOTIFICATIONS ================= */}
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <Notifications />
            </ProtectedRoute>
          }
        />

        {/* ================= STUDENT PORTAL ================= */}
        <Route
          path="/student"
          element={
            <StudentRoute>
              <StudentDashboard />
            </StudentRoute>
          }
        />
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
          path="/student/academic-records"
          element={
            <StudentRoute>
              <AcademicRecords />
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
          path="/academics/class-sections"
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
          path="/academics/grade-book"
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
          path="/scheduling/class-schedules"
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
          path="/scheduling/exam-schedules"
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

        {/* ================= FINANCE ================= */}
        <Route
          path="/finance"
          element={
            <ProtectedRoute>
              <FinanceDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/finance/dashboard"
          element={
            <ProtectedRoute>
              <FinanceDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/finance/student-fees"
          element={
            <ProtectedRoute>
              <StudentFees />
            </ProtectedRoute>
          }
        />
        <Route
          path="/finance/invoices"
          element={
            <ProtectedRoute>
              <Invoices />
            </ProtectedRoute>
          }
        />
        <Route
          path="/finance/fee-types"
          element={
            <ProtectedRoute>
              <FeeTypes />
            </ProtectedRoute>
          }
        />
        <Route
          path="/finance/payments"
          element={
            <ProtectedRoute>
              <Payments />
            </ProtectedRoute>
          }
        />

        {/* Catch-all fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;