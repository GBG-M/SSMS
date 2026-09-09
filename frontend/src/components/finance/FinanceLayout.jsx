import { Link, useLocation } from 'react-router-dom'

export default function FinanceLayout({ children, title, subtitle, actions }) {
  const location = useLocation()

  const tabs = [
    { name: 'Overview', path: '/finance/dashboard', altPath: '/finance', icon: '📊' },
    { name: 'Fee Types', path: '/finance/fee-types', icon: '🏷️' },
    { name: 'Student Fees', path: '/finance/student-fees', altPath: '/finance/fees', icon: '🎓' },
    { name: 'Invoices', path: '/finance/invoices', icon: '📄' },
    { name: 'Payments', path: '/finance/payments', icon: '💳' },
  ]

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Top Header & Navigation */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                to="/dashboard"
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                title="Return to Main Dashboard"
              >
                <span>←</span>
                <span className="hidden sm:inline">Dashboard</span>
              </Link>

              <div className="h-5 w-px bg-slate-200" />

              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white font-bold shadow-md shadow-emerald-500/20">
                  💰
                </div>
                <div>
                  <h1 className="text-base font-bold text-slate-900 leading-none">
                    Finance Hub
                  </h1>
                  <span className="text-xs text-slate-500">SSMS Financial & Billing Management</span>
                </div>
              </div>
            </div>

            {/* Header Right Actions Slot */}
            <div className="flex items-center gap-2 sm:gap-3">
              {actions}
            </div>
          </div>

          {/* Sub Navigation Tabs */}
          <nav className="flex space-x-1 overflow-x-auto border-t border-slate-100 py-2 no-scrollbar">
            {tabs.map((tab) => {
              const isActive =
                location.pathname === tab.path ||
                (tab.altPath && location.pathname === tab.altPath)

              return (
                <Link
                  key={tab.path}
                  to={tab.path}
                  className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-3.5 py-2 text-xs sm:text-sm font-medium transition ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
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

      {/* Main Page Content */}
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
