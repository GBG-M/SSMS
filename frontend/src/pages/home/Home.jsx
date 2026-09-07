import { useState } from 'react'
import { Link } from 'react-router-dom'

const FEATURES = [
  {
    title: 'Role-Based Access Control (RBAC)',
    description: 'Strict authorization boundaries ensure administrators, teachers, students, and parents only view data authorized for their role.',
    icon: (
      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  {
    title: 'Continuous Gradebook & GPA',
    description: 'Configurable weighted continuous assessments with automated term score aggregation, letter grade calculation, and transcripts.',
    icon: (
      <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    title: 'Classroom & Exam Scheduling',
    description: 'Timetable coordination ensuring conflict-free teacher assignments, classroom utilization, and examination periods.',
    icon: (
      <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    title: 'Automated Tuition Billing',
    description: 'Structured fee plans, automated invoice generation per term, official payment receipts, and real-time outstanding balance tracking.',
    icon: (
      <svg className="w-5 h-5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
  },
  {
    title: 'Daily Attendance Auditing',
    description: 'Accurate daily and period-level attendance tracking with automated summaries accessible to school staff and parents.',
    icon: (
      <svg className="w-5 h-5 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
  {
    title: 'Instant School Communications',
    description: 'Targeted broadcast announcements, urgent notices, and real-time notification feeds connecting the entire school community.',
    icon: (
      <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
  },
]

const MODULES = [
  {
    id: 'academics',
    title: 'Academics & Curriculum',
    description: 'Manage academic terms, subjects, class sections, assignments, and continuous grade calculations.',
    tags: ['Curriculum Planning', 'Class Rosters', 'Weighted Grades'],
    color: 'text-indigo-600 bg-indigo-50 border-indigo-100',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    id: 'students',
    title: 'Student Information System',
    description: 'Centralized student directory, daily attendance tracking, enrollment lifecycle, and cumulative transcripts.',
    tags: ['Student Records', 'Daily Attendance', 'Official Transcripts'],
    color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {
    id: 'scheduling',
    title: 'Timetables & Scheduling',
    description: 'Conflict-free weekly class timetables, classroom allocation, teacher workload assignments, and examination periods.',
    tags: ['Class Timetables', 'Room Allocation', 'Exam Schedules'],
    color: 'text-blue-600 bg-blue-50 border-blue-100',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    id: 'finance',
    title: 'Tuition & Fee Management',
    description: 'Structured school fee plans, automated invoice generation, payment receipt issuance, and balance tracking.',
    tags: ['Fee Structures', 'Tuition Invoices', 'Payment Records'],
    color: 'text-violet-600 bg-violet-50 border-violet-100',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
  },
  {
    id: 'accounts',
    title: 'Access Control & Security',
    description: 'Granular role-based security protecting student records across administrators, teachers, students, and parents.',
    tags: ['RBAC Security', 'User Accounts', 'Audit Logs'],
    color: 'text-sky-600 bg-sky-50 border-sky-100',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  {
    id: 'notifications',
    title: 'School Communications',
    description: 'School-wide announcements, critical urgent alerts, teacher broadcasts, and real-time notification feeds.',
    tags: ['Announcements', 'Urgent Alerts', 'Notice Board'],
    color: 'text-amber-600 bg-amber-50 border-amber-100',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
  },
]

const ROLES = [
  {
    role: 'School Leadership',
    badge: 'Administration',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
    summary: 'Oversee school-wide operations, configure academic calendars, manage staff accounts, and enforce institutional compliance.',
    highlights: ['Institutional Governance', 'Staff Account Provisioning', 'Academic Calendar Setup'],
    icon: (
      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  {
    role: 'Teaching Faculty',
    badge: 'Academics',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
    summary: 'Access classroom rosters, maintain daily student attendance, evaluate continuous assignments, and record official term marks.',
    highlights: ['Continuous Grading', 'Daily Attendance Tracking', 'Classroom Rosters'],
    icon: (
      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    role: 'Enrolled Students',
    badge: 'Learners',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    summary: 'Review personalized course timetables, check continuous assessment scores, track cumulative GPA, and view attendance records.',
    highlights: ['Course Grade Reports', 'Class Timetables', 'Academic Transcripts'],
    icon: (
      <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    role: 'Parents & Guardians',
    badge: 'Families',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    summary: 'Transparent access to child academic progress, classroom attendance reports, official fee invoices, and payment receipts.',
    highlights: ['Academic Progress', 'Attendance Monitoring', 'Tuition Fee Invoices'],
    icon: (
      <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
  },
]

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased selection:bg-blue-600 selection:text-white">
      {/* ================= INSTITUTIONAL NAVBAR ================= */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
          {/* Institutional Brand */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white font-bold shadow-xs group-hover:bg-blue-700 transition">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight text-slate-900">SSMS</span>
                <span className="rounded-full bg-blue-50 border border-blue-200 px-2 py-0.5 text-[10px] font-bold text-blue-700 uppercase tracking-wider">
                  School Portal
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-500 leading-none">Smart School Management System</p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-7">
            <a href="#hero" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition">
              Home
            </a>
            <a href="#features" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition">
              Features
            </a>
            <a href="#modules" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition">
              Modules
            </a>
            <a href="#roles" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition">
              Roles
            </a>
            <a href="#about" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition">
              About
            </a>
          </div>

          {/* Single Direct Action: Sign In to Portal */}
          <div className="hidden sm:flex items-center">
            <Link
              to="/login"
              className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition flex items-center gap-2"
            >
              <span>Sign In to Portal</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              type="button"
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              aria-label="Toggle navigation menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </nav>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-5 space-y-2">
            <a
              href="#hero"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Home
            </a>
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Features
            </a>
            <a
              href="#modules"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Modules
            </a>
            <a
              href="#roles"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Roles
            </a>
            <a
              href="#about"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              About
            </a>
            <div className="pt-2 border-t border-slate-100">
              <Link
                to="/login"
                className="w-full text-center block px-4 py-2.5 rounded-lg text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700"
              >
                Sign In to Portal
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ================= 1. HERO SECTION (#hero) ================= */}
      <section id="hero" className="py-16 sm:py-24 bg-white border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            {/* Institutional Tag */}
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3.5 py-1 text-xs font-semibold text-blue-800 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
              Institutional School Management Platform
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
              Smart School Management <span className="text-blue-600">System</span>
            </h1>

            {/* Subtitle */}
            <p className="mt-5 text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
              A unified institutional digital platform connecting school administrators, educators, students, and
              parents to manage academics, timetables, grading, attendance, and administrative operations.
            </p>

            {/* CTAs: Portal Sign In and Explore Modules */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
              <Link
                to="/login"
                className="w-full sm:w-auto px-7 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-xs transition flex items-center justify-center gap-2"
              >
                <span>Sign In to Portal</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
              <a
                href="#modules"
                className="w-full sm:w-auto px-7 py-3 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-semibold shadow-xs transition flex items-center justify-center gap-2"
              >
                <span>Explore Modules</span>
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </a>
            </div>

            {/* Institutional Stat Highlights */}
            <div className="mt-12 pt-8 border-t border-slate-100 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-xs font-bold text-slate-900">Unified Architecture</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Centralized Operations</p>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-xs font-bold text-slate-900">Role-Based Access</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Strict Data Privacy</p>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-xs font-bold text-slate-900">Academic Sync</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Continuous Assessment</p>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-xs font-bold text-slate-900">Tuition Ledger</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Automated Invoicing</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= 2. FEATURES SECTION (#features) ================= */}
      <section id="features" className="py-16 sm:py-20 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Platform Capabilities</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 tracking-tight">
              Essential School Features
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              Engineered with modern institutional standards to guarantee security, accuracy, and operational continuity.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feat, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:border-slate-300 transition"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-4">
                  {feat.icon}
                </div>
                <h3 className="text-sm font-bold text-slate-900 mb-2">{feat.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{feat.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= 3. MODULES SECTION (#modules) ================= */}
      <section id="modules" className="py-16 sm:py-20 bg-white border-t border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">System Modules</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 tracking-tight">
              Integrated School Modules
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              Comprehensive modules engineered to manage the entire student, faculty, and academic lifecycle.
            </p>
          </div>

          {/* 6 Informational Module Cards (No direct links, access is via authenticated login) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {MODULES.map((item) => (
              <div
                key={item.id}
                className="bg-slate-50 rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-xl border ${item.color}`}>
                      {item.icon}
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-slate-900">{item.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed mt-2.5">{item.description}</p>
                </div>

                {/* Capability tags */}
                <div className="flex flex-wrap gap-1.5 pt-5 mt-4 border-t border-slate-200/80">
                  {item.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-0.5 bg-white text-slate-700 rounded-md text-[11px] font-medium border border-slate-200 shadow-2xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= 4. ROLES SECTION (#roles) ================= */}
      <section id="roles" className="py-16 sm:py-20 bg-slate-50 border-t border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Access Governance</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 tracking-tight">
              School Community Roles
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              Role-tailored dashboards providing each school stakeholder with clear workflows and secure access boundaries.
            </p>
          </div>

          {/* 4 Clean Stakeholder Showcase Cards (No links, access via authenticated login) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {ROLES.map((r, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between shadow-xs hover:border-slate-300 transition"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                      {r.icon}
                    </div>
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${r.badgeColor}`}>
                      {r.badge}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 mb-2">{r.role}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed mb-4">{r.summary}</p>
                </div>

                {/* Key Role Workflows */}
                <div className="pt-3.5 border-t border-slate-100 space-y-2">
                  {r.highlights.map((h, i) => (
                    <div key={i} className="flex items-center gap-2 text-[11px] text-slate-700 font-medium">
                      <svg className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{h}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= 5. ABOUT SECTION (#about) ================= */}
      <section id="about" className="py-16 sm:py-20 bg-white border-t border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Institutional Purpose</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 tracking-tight">
              About Smart School Management System
            </h2>
            <p className="text-sm text-slate-600 mt-3 leading-relaxed">
              SSMS was engineered to modernize school operations by replacing manual paperwork and disconnected spreadsheets
              with a unified, secure, and relational digital platform tailored for primary and secondary schools.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center">
              <div className="w-10 h-10 mx-auto rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold mb-3">
                01
              </div>
              <h3 className="text-sm font-bold text-slate-900">Unified Operations</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Connects academics, student profiles, timetables, and school fees into a single, cohesive database.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center">
              <div className="w-10 h-10 mx-auto rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold mb-3">
                02
              </div>
              <h3 className="text-sm font-bold text-slate-900">Data Integrity & Privacy</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Enforces strict role-based access control (RBAC), ensuring students and parents only access verified, authorized information.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center">
              <div className="w-10 h-10 mx-auto rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold mb-3">
                03
              </div>
              <h3 className="text-sm font-bold text-slate-900">Real-Time Connectivity</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Empowers teachers, students, and parents with instant grade tracking, attendance visibility, and school notices.
              </p>
            </div>
          </div>

          {/* Protected Access Action Banner */}
          <div className="mt-12 max-w-4xl mx-auto rounded-2xl bg-slate-900 text-white p-8 sm:p-10 text-center relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="text-xl sm:text-2xl font-bold">Access Protected School Portal</h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
                All school features and records require institutional authentication. Sign in with your assigned school credentials.
              </p>
              <div className="mt-6 flex justify-center">
                <Link
                  to="/login"
                  className="px-7 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold shadow-md transition flex items-center gap-2"
                >
                  <span>Sign In to School Portal</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= INSTITUTIONAL FOOTER ================= */}
      <footer className="border-t border-slate-200 bg-white text-slate-600 text-xs py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5 text-slate-900 font-bold text-sm">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                </svg>
              </div>
              <span>Smart School Management System (SSMS)</span>
            </div>

            <div className="flex items-center gap-6 text-xs text-slate-500 font-medium">
              <a href="#hero" className="hover:text-blue-600 transition">Home</a>
              <a href="#features" className="hover:text-blue-600 transition">Features</a>
              <a href="#modules" className="hover:text-blue-600 transition">Modules</a>
              <a href="#roles" className="hover:text-blue-600 transition">Roles</a>
              <a href="#about" className="hover:text-blue-600 transition">About</a>
              <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-800 transition">Portal Sign In</Link>
            </div>
          </div>

          <div className="border-t border-slate-100 mt-6 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-400">
            <p>© 2026 Smart School Management System (SSMS). All rights reserved.</p>
            <div className="flex items-center gap-2 text-[11px] text-emerald-600 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Institutional Core Operational</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}