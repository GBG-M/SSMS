import { useState } from "react"
import { Link } from "react-router-dom"
import LogoutButton from "../../components/LogoutButton"

function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-100">

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed left-0 top-0 z-40 h-screen w-64
          bg-slate-900 text-white
          transform transition-transform duration-300
          lg:translate-x-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >

        {/* Logo */}
        <div className="flex h-20 items-center border-b border-slate-700 px-6">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 font-bold">
              S
            </div>

            <div>
              <h1 className="text-lg font-bold">
                SSMS
              </h1>

              <p className="text-xs text-slate-400">
                School Management
              </p>
            </div>

          </div>

        </div>

        {/* Navigation */}
        <nav className="mt-6 px-4">

          <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Main Menu
          </p>

          <div className="space-y-2">

            <Link
              to="/dashboard"
              className="flex items-center gap-3 rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium"
            >
              <span>🏠</span>
              Dashboard
            </Link>

            <Link
              to="#"
              className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm text-slate-300 hover:bg-slate-800"
            >
              <span>👨‍🎓</span>
              Students
            </Link>

            <Link
              to="#"
              className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm text-slate-300 hover:bg-slate-800"
            >
              <span>📚</span>
              Academics
            </Link>

            <Link
              to="#"
              className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm text-slate-300 hover:bg-slate-800"
            >
              <span>💰</span>
              Finance
            </Link>

            <Link
              to="#"
              className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm text-slate-300 hover:bg-slate-800"
            >
              <span>📅</span>
              Scheduling
            </Link>

            <Link
              to="#"
              className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm text-slate-300 hover:bg-slate-800"
            >
              <span>🔔</span>
              Notifications
            </Link>

          </div>

          <p className="mb-3 mt-8 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
            System
          </p>

          <div className="space-y-2">

            <Link
              to="#"
              className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm text-slate-300 hover:bg-slate-800"
            >
              <span>⚙️</span>
              Settings
            </Link>

          </div>

        </nav>

        {/* Logout */}
        <div className="absolute bottom-6 left-4 right-4">

          <LogoutButton />

        </div>

      </aside>

      {/* Main content */}
      <div className="lg:ml-64">

        {/* Header */}
        <header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-gray-200 bg-white px-4 shadow-sm sm:px-6">

          <div className="flex items-center gap-4">

            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 lg:hidden"
            >
              ☰
            </button>

            <div>
              <h2 className="text-xl font-bold text-gray-800">
                Dashboard
              </h2>

              <p className="hidden text-sm text-gray-500 sm:block">
                Overview of your school
              </p>
            </div>

          </div>

          {/* User */}
          <div className="flex items-center gap-3">

            <button className="relative rounded-full p-2 text-gray-500 hover:bg-gray-100">
              🔔

              <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />
            </button>

            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-gray-800">
                Admin User
              </p>

              <p className="text-xs text-gray-500">
                Administrator
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-600">
              A
            </div>

          </div>

        </header>

        {/* Dashboard content */}
        <main className="p-4 sm:p-6">

          {/* Welcome section */}
          <section className="mb-6 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 p-6 text-white shadow-lg">

            <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">

              <div>

                <p className="mb-1 text-blue-100">
                  Welcome back 👋
                </p>

                <h1 className="text-2xl font-bold sm:text-3xl">
                  Good morning, Admin!
                </h1>

                <p className="mt-2 max-w-xl text-sm text-blue-100">
                  Here's what's happening in your school today.
                </p>

              </div>

              <div className="rounded-xl bg-white/10 px-5 py-4 backdrop-blur-sm">

                <p className="text-sm text-blue-100">
                  Academic Year
                </p>

                <p className="text-lg font-bold">
                  2025 / 2026
                </p>

              </div>

            </div>

          </section>

          {/* Statistics */}
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

            {/* Students */}
            <div className="rounded-2xl bg-white p-5 shadow-sm">

              <div className="flex items-center justify-between">

                <div>
                  <p className="text-sm text-gray-500">
                    Total Students
                  </p>

                  <h3 className="mt-2 text-2xl font-bold text-gray-800">
                    1,245
                  </h3>

                  <p className="mt-2 text-xs text-green-600">
                    ↑ 8.2% from last month
                  </p>
                </div>

                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-2xl">
                  👨‍🎓
                </div>

              </div>

            </div>

            {/* Teachers */}
            <div className="rounded-2xl bg-white p-5 shadow-sm">

              <div className="flex items-center justify-between">

                <div>
                  <p className="text-sm text-gray-500">
                    Teachers
                  </p>

                  <h3 className="mt-2 text-2xl font-bold text-gray-800">
                    68
                  </h3>

                  <p className="mt-2 text-xs text-green-600">
                    ↑ 3 new this month
                  </p>
                </div>

                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-2xl">
                  👨‍🏫
                </div>

              </div>

            </div>

            {/* Attendance */}
            <div className="rounded-2xl bg-white p-5 shadow-sm">

              <div className="flex items-center justify-between">

                <div>
                  <p className="text-sm text-gray-500">
                    Attendance
                  </p>

                  <h3 className="mt-2 text-2xl font-bold text-gray-800">
                    94.5%
                  </h3>

                  <p className="mt-2 text-xs text-green-600">
                    ↑ 2.4% this week
                  </p>
                </div>

                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-2xl">
                  📊
                </div>

              </div>

            </div>

            {/* Classes */}
            <div className="rounded-2xl bg-white p-5 shadow-sm">

              <div className="flex items-center justify-between">

                <div>
                  <p className="text-sm text-gray-500">
                    Active Classes
                  </p>

                  <h3 className="mt-2 text-2xl font-bold text-gray-800">
                    42
                  </h3>

                  <p className="mt-2 text-xs text-gray-500">
                    Across grades 1–12
                  </p>
                </div>

                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 text-2xl">
                  🏫
                </div>

              </div>

            </div>

          </section>

          {/* Lower section */}
          <section className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">

            {/* Recent Activity */}
            <div className="rounded-2xl bg-white p-6 shadow-sm xl:col-span-2">

              <div className="mb-5 flex items-center justify-between">

                <div>
                  <h2 className="font-bold text-gray-800">
                    Recent Activity
                  </h2>

                  <p className="text-sm text-gray-500">
                    Latest school activities
                  </p>
                </div>

                <button className="text-sm font-medium text-blue-600 hover:underline">
                  View all
                </button>

              </div>

              <div className="space-y-4">

                <div className="flex items-start gap-4 rounded-xl bg-gray-50 p-4">

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100">
                    👨‍🎓
                  </div>

                  <div className="flex-1">

                    <p className="text-sm font-medium text-gray-800">
                      New student registered
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      Student registration was completed successfully.
                    </p>

                    <p className="mt-2 text-xs text-gray-400">
                      10 minutes ago
                    </p>

                  </div>

                </div>

                <div className="flex items-start gap-4 rounded-xl bg-gray-50 p-4">

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100">
                    📚
                  </div>

                  <div className="flex-1">

                    <p className="text-sm font-medium text-gray-800">
                      Grades updated
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      Mathematics grades for Grade 10 were updated.
                    </p>

                    <p className="mt-2 text-xs text-gray-400">
                      35 minutes ago
                    </p>

                  </div>

                </div>

                <div className="flex items-start gap-4 rounded-xl bg-gray-50 p-4">

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-100">
                    🔔
                  </div>

                  <div className="flex-1">

                    <p className="text-sm font-medium text-gray-800">
                      Announcement published
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      A new announcement was sent to parents.
                    </p>

                    <p className="mt-2 text-xs text-gray-400">
                      1 hour ago
                    </p>

                  </div>

                </div>

              </div>

            </div>

            {/* Performance */}
            <div className="rounded-2xl bg-white p-6 shadow-sm">

              <div className="mb-6">

                <h2 className="font-bold text-gray-800">
                  Academic Performance
                </h2>

                <p className="text-sm text-gray-500">
                  Overall school performance
                </p>

              </div>

              <div className="flex flex-col items-center">

                <div className="flex h-40 w-40 items-center justify-center rounded-full border-[16px] border-blue-500">

                  <div className="text-center">

                    <p className="text-3xl font-bold text-gray-800">
                      87%
                    </p>

                    <p className="text-xs text-gray-500">
                      Average
                    </p>

                  </div>

                </div>

                <div className="mt-6 w-full space-y-4">

                  <div>

                    <div className="mb-1 flex justify-between text-sm">

                      <span className="text-gray-600">
                        Mathematics
                      </span>

                      <span className="font-semibold">
                        89%
                      </span>

                    </div>

                    <div className="h-2 rounded-full bg-gray-200">

                      <div className="h-2 w-[89%] rounded-full bg-blue-500" />

                    </div>

                  </div>

                  <div>

                    <div className="mb-1 flex justify-between text-sm">

                      <span className="text-gray-600">
                        English
                      </span>

                      <span className="font-semibold">
                        85%
                      </span>

                    </div>

                    <div className="h-2 rounded-full bg-gray-200">

                      <div className="h-2 w-[85%] rounded-full bg-green-500" />

                    </div>

                  </div>

                  <div>

                    <div className="mb-1 flex justify-between text-sm">

                      <span className="text-gray-600">
                        Science
                      </span>

                      <span className="font-semibold">
                        88%
                      </span>

                    </div>

                    <div className="h-2 rounded-full bg-gray-200">

                      <div className="h-2 w-[88%] rounded-full bg-purple-500" />

                    </div>

                  </div>

                </div>

              </div>

            </div>

          </section>

        </main>

      </div>

    </div>
  )
}

export default Dashboard
