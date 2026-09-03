import { Link, useLocation } from 'react-router-dom'

export default function SchedulingLayout({ children, title, subtitle, actions }) {
  const location = useLocation()

  const tabs = [
    { name: 'Overview', path: '/scheduling', icon: '📊' },
    { name: 'Class Timetable', path: '/scheduling/classes', icon: '🗓️' },
    { name: 'Exam Schedules', path: '/scheduling/exams', icon: '📝' },
    { name: 'Campus Rooms', path: '/scheduling/rooms', icon: '🏢' },
  ]

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      {/* Top Header & Breadcrumb */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                to="/dashboard"
                className="flex items-center gap-2 rounded-lg p-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                title="Back to Dashboard"
              >
                <span>←</span>
                <span className="hidden sm:inline">Dashboard</span>
              </Link>

              <div className="h-5 w-px bg-slate-200" />

              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white font-bold shadow-md shadow-blue-500/20">
                  📅
                </div>
                <div>
                  <h1 className="text-base font-bold text-slate-900 leading-none">
                    Scheduling Hub
                  </h1>
                  <span className="text-xs text-slate-500">SSMS Academic Scheduling</span>
                </div>
              </div>
            </div>

            {/* Header Right Actions */}
            <div className="flex items-center gap-3">
              {actions}
            </div>
          </div>

          {/* Sub Navigation Tabs */}
          <nav className="flex space-x-1 overflow-x-auto border-t border-slate-100 py-2">
            {tabs.map((tab) => {
              const isActive = location.pathname === tab.path
              return (
                <Link
                  key={tab.path}
                  to={tab.path}
                  className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-3.5 py-2 text-xs sm:text-sm font-medium transition ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.name}</span>
                </Link>
              )
            })}
          </nav>
        </div>
      </header>

      {/* Page Title & Body */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {(title || subtitle) && (
          <div className="mb-6 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h2>
              {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
            </div>
          </div>
        )}
        {children}
      </main>
    </div>
  )
}
