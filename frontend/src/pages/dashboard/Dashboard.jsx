import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { logout } from '../../services/authService'

const API_BASE_URL = '/api/accounts'

export default function Dashboard() {
  const navigate = useNavigate()

  const [profile, setProfile] = useState(null)
  const [loadingProfile, setLoadingProfile] = useState(true)

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  useEffect(() => {
    fetchProfile()
  }, [])

  async function fetchProfile() {
    const token = localStorage.getItem('authToken')

    if (!token) {
      navigate('/login')
      return
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/profile/`,
        {
          method: 'GET',
          headers: {
            Authorization: `Token ${token}`,
            'Content-Type': 'application/json',
          },
        }
      )

      const data = await response.json()

      if (response.status === 401) {
        localStorage.removeItem('authToken')
        localStorage.removeItem('userEmail')
        navigate('/login')
        return
      }

      if (!response.ok) {
        console.error(
          'Failed to load profile:',
          data
        )
        return
      }

      setProfile(data)
    } catch (error) {
      console.error(
        'Profile request failed:',
        error
      )
    } finally {
      setLoadingProfile(false)
    }
  }

  const displayName =
    profile?.full_name ||
    `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() ||
    profile?.username ||
    'User'

  const displayEmail =
    profile?.email ||
    localStorage.getItem('userEmail') ||
    ''

  const avatarLetter =
    displayName.charAt(0).toUpperCase() || 'U'

  return (
    <div className="min-h-screen bg-slate-100">

      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 bg-slate-900 text-white lg:block">

        <div className="flex h-20 items-center border-b border-slate-800 px-6">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600">
              <span className="font-bold">
                S
              </span>
            </div>

            <div>
              <h1 className="font-bold">
                SSMS
              </h1>

              <p className="text-xs text-slate-400">
                School Management
              </p>
            </div>

          </div>

        </div>

        {/* Navigation */}
        <nav className="space-y-1 px-4 py-6">

          <Link
            to="/dashboard"
            className="flex items-center rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white"
          >
            <span className="mr-3">
              🏠
            </span>

            Dashboard
          </Link>

          <Link
            to="/student/dashboard"
            className="flex items-center rounded-lg px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white"
          >
            <span className="mr-3">
              👨‍🎓
            </span>

            Students
          </Link>

          <Link
            to="/academics"
            className="flex items-center rounded-lg px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white"
          >
            <span className="mr-3">
              📚
            </span>

            Academics
          </Link>

          <Link
            to="/finance/dashboard"
            className="flex items-center rounded-lg px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white"
          >
            <span className="mr-3">
              💰
            </span>

            Finance
          </Link>

          <Link
            to="/scheduling"
            className="flex items-center rounded-lg px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white"
          >
            <span className="mr-3">
              📅
            </span>

            Scheduling
          </Link>

          <Link
            to="/notifications"
            className="flex items-center rounded-lg px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white"
          >
            <span className="mr-3">
              🔔
            </span>

            Notifications
          </Link>

          <Link
            to="/users"
            className="flex items-center rounded-lg px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white"
          >
            <span className="mr-3">
              ⚙️
            </span>

            Administration
          </Link>

        </nav>

      </aside>

      {/* Main area */}
      <div className="lg:ml-64">

        {/* Top Header */}
        <header className="sticky top-0 z-10 flex h-20 items-center justify-between border-b border-slate-200 bg-white px-6 shadow-sm">

          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Dashboard
            </h2>

            <p className="text-sm text-slate-500">
              Welcome back to SSMS
            </p>
          </div>

          <div className="flex items-center gap-4">

            {/* User */}
            <div className="hidden text-right sm:block">

              <p className="text-sm font-semibold text-slate-800">
                {loadingProfile
                  ? 'Loading...'
                  : displayName}
              </p>

          

            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">
              {loadingProfile
                ? '...'
                : avatarLetter}
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Logout
            </button>

          </div>

        </header>

        {/* Dashboard Content */}
        <main className="p-6">

          {/* Welcome */}
          <div className="mb-8 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 p-8 text-white shadow-lg">

            <p className="mb-2 text-sm font-medium text-blue-100">
              School Management System
            </p>

            <h1 className="text-3xl font-bold">
              {loadingProfile
                ? 'Welcome back! 👋'
                : `Welcome back, ${displayName}! 👋`}
            </h1>

            <p className="mt-2 max-w-2xl text-blue-100">
              Manage students, academics, finance,
              scheduling, and other school activities
              from one place.
            </p>

          </div>

          {/* Statistics */}
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">

            <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">

              <div className="flex items-center justify-between">

                <div>
                  <p className="text-sm text-slate-500">
                    Students
                  </p>

                  <p className="mt-2 text-3xl font-bold text-slate-900">
                    --
                  </p>
                </div>

                <div className="rounded-xl bg-blue-100 p-3 text-2xl">
                  👨‍🎓
                </div>

              </div>

              <p className="mt-4 text-xs text-slate-400">
                Data will connect later
              </p>

            </div>

            <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">

              <div className="flex items-center justify-between">

                <div>
                  <p className="text-sm text-slate-500">
                    Teachers
                  </p>

                  <p className="mt-2 text-3xl font-bold text-slate-900">
                    --
                  </p>
                </div>

                <div className="rounded-xl bg-green-100 p-3 text-2xl">
                  👨‍🏫
                </div>

              </div>

              <p className="mt-4 text-xs text-slate-400">
                Data will connect later
              </p>

            </div>

            <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">

              <div className="flex items-center justify-between">

                <div>
                  <p className="text-sm text-slate-500">
                    Classes
                  </p>

                  <p className="mt-2 text-3xl font-bold text-slate-900">
                    --
                  </p>
                </div>

                <div className="rounded-xl bg-purple-100 p-3 text-2xl">
                  📚
                </div>

              </div>

              <p className="mt-4 text-xs text-slate-400">
                Data will connect later
              </p>

            </div>

            <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">

              <div className="flex items-center justify-between">

                <div>
                  <p className="text-sm text-slate-500">
                    Attendance
                  </p>

                  <p className="mt-2 text-3xl font-bold text-slate-900">
                    --
                  </p>
                </div>

                <div className="rounded-xl bg-orange-100 p-3 text-2xl">
                  📊
                </div>

              </div>

              <p className="mt-4 text-xs text-slate-400">
                Data will connect later
              </p>

            </div>

          </div>

          {/* Modules */}
          <div className="mt-8">

            <h2 className="mb-4 text-xl font-bold text-slate-900">
              System Modules
            </h2>

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">

              {/* 1. Student Management */}
              <Link
                to="/student/dashboard"
                className="group rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-1 hover:shadow-md hover:ring-blue-500"
              >
                <div className="mb-4 text-3xl">
                  👨‍🎓
                </div>
                <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition">
                  Student Management →
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Manage student profiles, admissions, attendance, and academic records.
                </p>
              </Link>

              {/* 2. Academic Management */}
              <Link
                to="/academics"
                className="group rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-1 hover:shadow-md hover:ring-blue-500"
              >
                <div className="mb-4 text-3xl">
                  📚
                </div>
                <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition">
                  Academic Management →
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Manage curriculum, subjects, class sections, and the official gradebook.
                </p>
              </Link>

              {/* 3. Finance */}
              <Link
                to="/finance/dashboard"
                className="group rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-1 hover:shadow-md hover:ring-blue-500"
              >
                <div className="mb-4 text-3xl">
                  💰
                </div>
                <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition">
                  Finance & Billing →
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Manage school fee structures, student invoices, and ledger balances.
                </p>
              </Link>

              {/* 4. Notifications */}
              <Link
                to="/notifications"
                className="group rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-1 hover:shadow-md hover:ring-blue-500"
              >
                <div className="mb-4 text-3xl">
                  🔔
                </div>
                <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition">
                  Notifications →
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  View and manage school-wide announcements and alert dispatches.
                </p>
              </Link>

              {/* 5. Scheduling */}
              <Link
                to="/scheduling"
                className="group rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-1 hover:shadow-md hover:ring-blue-500"
              >
                <div className="mb-4 text-3xl">
                  📅
                </div>
                <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition">
                  Scheduling & Timetables →
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Manage weekly class timetables, examination sessions, and room bookings.
                </p>
              </Link>

              {/* 6. Administration */}
              <Link
                to="/users"
                className="group rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-1 hover:shadow-md hover:ring-blue-500"
              >
                <div className="mb-4 text-3xl">
                  ⚙️
                </div>
                <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition">
                  Administration & Users →
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Manage user accounts, system roles, staff permissions, and security.
                </p>
              </Link>

            </div>

          </div>

        </main>

      </div>

    </div>
  )
}