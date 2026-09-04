import { useState } from 'react'
import { Link } from 'react-router-dom'

const MODULES = [
  {
    id: 'student',
    title: 'Student Portal',
    icon: '👨‍🎓',
    tag: 'Module 5.1 & 5.2',
    color: 'from-blue-600 to-cyan-600',
    description: 'Personal profile, academic term grade reports, daily attendance tracking, and document verification.',
    features: ['Live Term GPA & Score Breakdown', 'Attendance History with Date Filtering', 'Document Upload & Verification', 'Guardian & Emergency Contacts'],
    route: '/student/dashboard',
  },
  {
    id: 'academics',
    title: 'Academics & Gradebook',
    icon: '📚',
    tag: 'Core Academic Engine',
    color: 'from-indigo-600 to-purple-600',
    description: 'Complete curriculum management, course catalogs, section enrollments, and continuous assessment gradebook.',
    features: ['Academic Years & Semesters', 'Class Sections & Multi-Course Enrollments', 'Teacher Gradebook & Marking Scheme', 'Assessment Weightage Configuration'],
    route: '/academics',
  },
  {
    id: 'scheduling',
    title: 'Scheduling & Timetables',
    icon: '📅',
    tag: 'Timetable & Room Engine',
    color: 'from-violet-600 to-pink-600',
    description: 'Conflict-free weekly class timetables, examination session scheduling, and campus room allocation.',
    features: ['Weekly Timetable Grid', 'Exam Session Management', 'Room Capacity & Availability', 'Conflict Detection'],
    route: '/scheduling',
  },
  {
    id: 'finance',
    title: 'Finance & Billing',
    icon: '💰',
    tag: 'Accounting & Ledger',
    color: 'from-emerald-600 to-teal-600',
    description: 'Institutional fee structures, student tuition invoicing, multi-method payment collection, and ledger reconciliation.',
    features: ['Configurable Fee Types', 'Automated Student Invoicing', 'Payment Processing & Receipts', 'Revenue & Balance Ledgers'],
    route: '/finance/dashboard',
  },
  {
    id: 'accounts',
    title: 'User & Role Governance',
    icon: '🛡️',
    tag: 'Security & RBAC',
    color: 'from-amber-600 to-orange-600',
    description: 'Granular role-based access control, mandatory first-login password enforcement, and login audit trail tracking.',
    features: ['5 Predefined System Roles', 'Mandatory Forced Password Resets', 'Login History & Security Audit Logs', 'Student Auto-Provisioning Pipeline'],
    route: '/users',
  },
  {
    id: 'notifications',
    title: 'Notifications & Alerts',
    icon: '🔔',
    tag: 'Communications',
    color: 'from-rose-600 to-red-600',
    description: 'Centralized school-wide announcements, emergency alert broadcasts, and personalized user notifications.',
    features: ['Announcement Broadcasting', 'Role-Targeted Dispatches', 'Real-Time Alert Badges', 'Notification Preferences'],
    route: '/notifications',
  },
]

const DEMO_ACCOUNTS = [
  { role: 'Enrolled Student', email: 'student@ssms.edu', pass: 'StudentPass123!', badge: 'bg-blue-100 text-blue-800' },
  { role: 'Administrator / Staff', email: 'admin@example.com', pass: 'AdminPass123!', badge: 'bg-purple-100 text-purple-800' },
  { role: 'Parent Account', email: 'parent@ssms.edu', pass: 'ParentPass123!', badge: 'bg-emerald-100 text-emerald-800' },
]

export default function Home() {
  const [activeModule, setActiveModule] = useState(MODULES[0])
  const [copiedText, setCopiedText] = useState('')

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text)
    setCopiedText(text)
    setTimeout(() => setCopiedText(''), 2000)
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 selection:bg-blue-500 selection:text-white">
      {/* ================= NAVBAR ================= */}
      <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-md">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 font-extrabold text-white shadow-lg shadow-blue-500/20">
              🎓
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-tight text-white">SSMS</span>
                <span className="rounded-full bg-blue-500/20 border border-blue-500/30 px-2 py-0.5 text-[10px] font-bold text-blue-300">
                  Enterprise
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-400">School Management System</p>
            </div>
          </Link>

          {/* Links */}
          <div className="hidden items-center gap-8 md:flex">
            <a href="#modules" className="text-sm font-semibold text-slate-300 transition hover:text-blue-400">
              System Modules
            </a>
            <a href="#demo-access" className="text-sm font-semibold text-slate-300 transition hover:text-blue-400">
              Demo Logins
            </a>
            <a href="#architecture" className="text-sm font-semibold text-slate-300 transition hover:text-blue-400">
              Architecture
            </a>
          </div>

          {/* Action */}
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-600/30 transition hover:from-blue-500 hover:to-indigo-500 hover:shadow-blue-500/40"
            >
              Sign In to Portal →
            </Link>
          </div>
        </nav>
      </header>

      {/* ================= HERO SECTION ================= */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-32">
        {/* Glow Spheres */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-blue-600/20 blur-[130px] pointer-events-none"></div>
        <div className="absolute top-1/3 right-10 h-[350px] w-[350px] rounded-full bg-indigo-600/15 blur-[100px] pointer-events-none"></div>

        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-xs font-bold text-blue-300 mb-6 backdrop-blur-md">
              <span className="h-2 w-2 rounded-full bg-blue-400 animate-ping"></span>
              Full-Stack Institutional Management Platform
            </div>

            <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl leading-tight">
              Unified School Operations &{' '}
              <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
                Academic Governance
              </span>
            </h1>

            <p className="mt-6 text-base sm:text-lg leading-relaxed text-slate-300 max-w-2xl mx-auto">
              A comprehensive system built with Django REST Framework and React 19. Manage student life cycles,
              curriculums, class timetables, fee billing, and RBAC governance in one secure workspace.
            </p>

            <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/login"
                className="w-full sm:w-auto rounded-2xl bg-blue-600 px-8 py-4 text-sm font-bold text-white shadow-xl shadow-blue-600/30 hover:bg-blue-500 transition duration-150 flex items-center justify-center gap-2"
              >
                <span>Launch Portal</span>
                <span>→</span>
              </Link>
              <a
                href="#demo-access"
                className="w-full sm:w-auto rounded-2xl bg-slate-800/80 border border-slate-700 px-8 py-4 text-sm font-bold text-slate-200 hover:bg-slate-800 hover:text-white transition duration-150 flex items-center justify-center gap-2"
              >
                <span>⚡ Interviewer Quick Demo</span>
              </a>
            </div>

            {/* Quick Metrics Bar */}
            <div className="mt-14 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto">
              <div className="rounded-2xl border border-slate-800 bg-slate-800/40 p-4 backdrop-blur-sm">
                <p className="text-2xl font-black text-white">100%</p>
                <p className="text-xs text-slate-400 mt-1">Backend Test Passing (40/40)</p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-800/40 p-4 backdrop-blur-sm">
                <p className="text-2xl font-black text-white">6 Modules</p>
                <p className="text-xs text-slate-400 mt-1">Integrated Subsystems</p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-800/40 p-4 backdrop-blur-sm">
                <p className="text-2xl font-black text-white">5 Roles</p>
                <p className="text-xs text-slate-400 mt-1">Granular RBAC Security</p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-800/40 p-4 backdrop-blur-sm">
                <p className="text-2xl font-black text-white">&lt; 1.2s</p>
                <p className="text-xs text-slate-400 mt-1">Production Build Time</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= INTERACTIVE MODULE SHOWCASE ================= */}
      <section id="modules" className="py-20 border-t border-slate-800/80 bg-slate-950/60">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-xs font-bold uppercase tracking-wider text-blue-400">Complete Functional Suite</p>
            <h2 className="mt-2 text-3xl font-extrabold text-white sm:text-4xl">
              Engineered for Every School Stakeholder
            </h2>
            <p className="mt-3 text-sm text-slate-400">
              Explore the dedicated modules built to handle all dimensions of institutional operations.
            </p>
          </div>

          {/* Module Selector Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
            {MODULES.map((mod) => (
              <button
                key={mod.id}
                onClick={() => setActiveModule(mod)}
                className={`flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-xs font-bold transition duration-150 ${
                  activeModule.id === mod.id
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25 ring-2 ring-blue-400'
                    : 'bg-slate-800/60 border border-slate-700/60 text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span>{mod.icon}</span>
                <span>{mod.title}</span>
              </button>
            ))}
          </div>

          {/* Active Module Feature Display */}
          <div className="rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-900 to-slate-900/90 p-8 lg:p-12 shadow-2xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
              <div>
                <div className="inline-flex items-center gap-2 rounded-lg bg-blue-500/10 border border-blue-500/20 px-3 py-1 text-xs font-bold text-blue-300 mb-4">
                  <span>{activeModule.tag}</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
                  <span>{activeModule.icon}</span>
                  <span>{activeModule.title}</span>
                </h3>
                <p className="mt-4 text-sm leading-relaxed text-slate-300">
                  {activeModule.description}
                </p>

                <div className="mt-6 space-y-3">
                  {activeModule.features.map((feat) => (
                    <div key={feat} className="flex items-center gap-3 text-xs font-semibold text-slate-200">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600/30 text-blue-400 text-[10px] font-bold">
                        ✓
                      </span>
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-8">
                  <Link
                    to={activeModule.route}
                    className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-xs font-bold text-slate-900 shadow hover:bg-slate-100 transition"
                  >
                    <span>Open {activeModule.title}</span>
                    <span>→</span>
                  </Link>
                </div>
              </div>

              {/* Module Visual Preview Box */}
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-inner space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-red-500/80"></span>
                    <span className="h-3 w-3 rounded-full bg-amber-500/80"></span>
                    <span className="h-3 w-3 rounded-full bg-emerald-500/80"></span>
                    <span className="ml-2 text-[11px] font-mono text-slate-500">{activeModule.route}</span>
                  </div>
                  <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-blue-400">
                    STATUS: 200 OK
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="rounded-xl bg-slate-900/90 border border-slate-800/80 p-4">
                    <p className="text-[11px] font-bold text-slate-400">Endpoint Coverage</p>
                    <p className="text-lg font-bold text-white mt-1">REST API</p>
                    <p className="text-[10px] text-slate-500 mt-1">Fully Scoped DRF ViewSets</p>
                  </div>
                  <div className="rounded-xl bg-slate-900/90 border border-slate-800/80 p-4">
                    <p className="text-[11px] font-bold text-slate-400">Client Integration</p>
                    <p className="text-lg font-bold text-white mt-1">React 19 + Vite</p>
                    <p className="text-[10px] text-slate-500 mt-1">Tailwind CSS Responsive</p>
                  </div>
                </div>

                <div className="rounded-xl bg-slate-900/60 border border-slate-800/60 p-4 text-xs font-mono text-slate-400 leading-relaxed">
                  <p className="text-blue-400 font-bold">// Verified Role Scoping:</p>
                  <p className="mt-1">Authenticated user permissions validated via StudentAccessPermission & Role checks.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= DEMO CREDENTIALS SECTION ================= */}
      <section id="demo-access" className="py-20 border-t border-slate-800/80 bg-slate-900">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-400">
              ⚡ Instant Evaluation & Testing
            </span>
            <h2 className="mt-3 text-3xl font-extrabold text-white">Pre-Seeded Demo Accounts</h2>
            <p className="mt-2 text-sm text-slate-400">
              Use these credentials to sign in and test individual role views immediately.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {DEMO_ACCOUNTS.map((acc) => (
              <div
                key={acc.email}
                className="rounded-2xl border border-slate-800 bg-slate-950/70 p-6 flex flex-col justify-between hover:border-slate-700 transition"
              >
                <div>
                  <span className="inline-block rounded-lg bg-slate-800 border border-slate-700 px-3 py-1 text-xs font-bold text-slate-200 mb-4">
                    {acc.role}
                  </span>

                  <div className="space-y-3 text-xs">
                    <div>
                      <p className="text-slate-400">Email Address</p>
                      <div className="flex items-center justify-between mt-1 rounded-lg bg-slate-900 px-3 py-2 border border-slate-800">
                        <span className="font-mono text-white select-all">{acc.email}</span>
                        <button
                          onClick={() => handleCopy(acc.email)}
                          className="text-[11px] font-bold text-blue-400 hover:text-blue-300"
                        >
                          {copiedText === acc.email ? '✓ Copied' : 'Copy'}
                        </button>
                      </div>
                    </div>

                    <div>
                      <p className="text-slate-400">Password</p>
                      <div className="flex items-center justify-between mt-1 rounded-lg bg-slate-900 px-3 py-2 border border-slate-800">
                        <span className="font-mono text-white select-all">{acc.pass}</span>
                        <button
                          onClick={() => handleCopy(acc.pass)}
                          className="text-[11px] font-bold text-blue-400 hover:text-blue-300"
                        >
                          {copiedText === acc.pass ? '✓ Copied' : 'Copy'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <Link
                  to="/login"
                  className="mt-6 flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-500 shadow transition"
                >
                  Sign In with this Account →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= ARCHITECTURE & COMPLIANCE ================= */}
      <section id="architecture" className="py-20 border-t border-slate-800/80 bg-slate-950">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl font-extrabold text-white">System Architecture & Design</h2>
            <p className="mt-2 text-sm text-slate-400">
              Built on production-grade design principles for reliability, security, and scalability.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
              <div className="text-2xl mb-3">🛡️</div>
              <h4 className="font-bold text-base text-white">Role-Based Security (RBAC)</h4>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Role-gated ViewSets, customized permissions (`StudentAccessPermission`), and automatic query filtering
                ensure data isolation between students, teachers, and admins.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
              <div className="text-2xl mb-3">⚡</div>
              <h4 className="font-bold text-base text-white">High-Performance Frontend</h4>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Vite-powered React SPA architecture with modular service layers, error boundaries, centralized auth token
                handling, and reactive Tailwind UI styling.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
              <div className="text-2xl mb-3">📊</div>
              <h4 className="font-bold text-base text-white">Audit & Compliance Logging</h4>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Authentication events are recorded with client IP, user-agent, timestamps, and success flags in the
                LoginHistory registry for full administrative transparency.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="border-t border-slate-800 bg-slate-950 px-6 py-12 text-slate-400 text-xs">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 font-bold text-white text-sm">
              🎓
            </div>
            <div>
              <p className="font-bold text-white text-sm">SSMS Enterprise</p>
              <p className="text-[11px] text-slate-500">School Management System</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <Link to="/login" className="hover:text-white transition">
              Sign In
            </Link>
            <Link to="/student/dashboard" className="hover:text-white transition">
              Student Portal
            </Link>
            <Link to="/academics" className="hover:text-white transition">
              Academics
            </Link>
            <Link to="/scheduling" className="hover:text-white transition">
              Scheduling
            </Link>
            <Link to="/finance/dashboard" className="hover:text-white transition">
              Finance
            </Link>
            <Link to="/users" className="hover:text-white transition">
              User Governance
            </Link>
          </div>

          <p className="text-[11px] text-slate-500">
            © {new Date().getFullYear()} SSMS. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}