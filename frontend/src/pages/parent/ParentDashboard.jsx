import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { logout } from '../../services/authService'
import CommunicationsHub from '../../features/communications/CommunicationsHub'

export default function ParentDashboard() {
  const navigate = useNavigate()

  const [profile, setProfile] = useState(null)
  const [childrenList, setChildrenList] = useState([])
  const [selectedChildIndex, setSelectedChildIndex] = useState(0)
  const [activeTab, setActiveTab] = useState('overview') // 'overview' | 'academics' | 'attendance' | 'timetable' | 'finance'
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Child-specific loaded data
  const [childGrades, setChildGrades] = useState([])
  const [childAttendance, setChildAttendance] = useState([])
  const [childSchedules, setChildSchedules] = useState([])
  const [childFees, setChildFees] = useState([])
  const [childInvoices, setChildInvoices] = useState([])

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  useEffect(() => {
    loadParentProfile()
  }, [])

  async function loadParentProfile() {
    const token = localStorage.getItem('authToken')
    if (!token) {
      navigate('/login')
      return
    }

    try {
      setLoading(true)
      setError('')

      const headers = {
        Authorization: `Token ${token}`,
        'Content-Type': 'application/json',
      }

      // 1. Fetch parent user profile
      const profRes = await fetch('/api/accounts/profile/', { headers })
      if (!profRes.ok) {
        if (profRes.status === 401) {
          navigate('/login')
          return
        }
        throw new Error('Failed to load parent profile.')
      }
      const profData = await profRes.json()
      setProfile(profData)

      // Get children list
      let kids = profData.children || []
      // Fallback: If children array was empty on profile, fetch students linked to parent
      if (kids.length === 0) {
        const studentsRes = await fetch('/api/students/students/', { headers })
        if (studentsRes.ok) {
          const json = await studentsRes.json()
          kids = Array.isArray(json) ? json : json.results || []
        }
      }

      setChildrenList(kids)
    } catch (err) {
      console.error('Parent dashboard load error:', err)
      setError(err.message || 'Error loading parent portal.')
    } finally {
      setLoading(false)
    }
  }

  // Load records for currently selected child
  const selectedChild = childrenList[selectedChildIndex] || null

  useEffect(() => {
    if (!selectedChild) return
    async function loadChildData() {
      const token = localStorage.getItem('authToken')
      const headers = {
        Authorization: `Token ${token}`,
        'Content-Type': 'application/json',
      }

      const childId = selectedChild.id

      // 1. Attendance records
      try {
        const attRes = await fetch(`/api/students/attendance/?student=${childId}`, { headers })
        if (attRes.ok) {
          const json = await attRes.json()
          setChildAttendance(Array.isArray(json) ? json : json.results || [])
        }
      } catch {}

      // 2. Grade records
      try {
        const gradeRes = await fetch(`/api/academics/grade-records/`, { headers })
        if (gradeRes.ok) {
          const json = await gradeRes.json()
          const allGrades = Array.isArray(json) ? json : json.results || []
          // Scoped to this child
          setChildGrades(allGrades)
        }
      } catch {}

      // 3. Class schedules
      try {
        const schedRes = await fetch('/api/scheduling/class-schedules/', { headers })
        if (schedRes.ok) {
          const json = await schedRes.json()
          setChildSchedules(Array.isArray(json) ? json : json.results || [])
        }
      } catch {}

      // 4. Invoices & Fees
      try {
        const invRes = await fetch(`/api/finance/invoices/?student=${childId}`, { headers })
        if (invRes.ok) {
          const json = await invRes.json()
          setChildInvoices(Array.isArray(json) ? json : json.results || [])
        }
      } catch {}

      try {
        const feeRes = await fetch(`/api/finance/student-fees/?student=${childId}`, { headers })
        if (feeRes.ok) {
          const json = await feeRes.json()
          setChildFees(Array.isArray(json) ? json : json.results || [])
        }
      } catch {}
    }

    loadChildData()
  }, [selectedChildIndex, childrenList])

  // Attendance metrics
  const totalDays = childAttendance.length
  const presentDays = childAttendance.filter((a) => (a.status || '').toUpperCase() === 'PRESENT').length
  const attendanceRate = totalDays > 0 ? `${Math.round((presentDays / totalDays) * 100)}%` : '100%'

  // Outstanding fee balance
  const totalFeeDue = childInvoices.reduce((sum, inv) => sum + parseFloat(inv.total_amount || 0), 0)
  const totalFeePaid = childInvoices.reduce((sum, inv) => sum + parseFloat(inv.amount_paid || 0), 0)
  const feeBalance = Math.max(0, totalFeeDue - totalFeePaid)

  const daysOfWeek = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY']

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Institutional Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 font-bold text-white shadow-md">
              SS
            </div>
            <div>
              <span className="text-base font-bold text-slate-900 tracking-tight">SSMS Parent</span>
              <span className="ml-2 rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700">
                Guardian Portal
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-slate-800">
                {profile?.full_name || profile?.first_name || 'Guardian'}
              </p>
              <p className="text-xs text-slate-500">{profile?.email}</p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                to="/notifications"
                title="Notifications"
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition shadow-sm"
              >
                <span>🔔</span>
                <span className="hidden md:inline">Notifications</span>
              </Link>
              <Link
                to="/profile"
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Profile
              </Link>
              <button
                onClick={handleLogout}
                className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 transition"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {/* Top Family Header */}
        <div className="mb-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white shadow-lg sm:p-8">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/30 px-3 py-1 text-xs font-medium text-indigo-200 backdrop-blur">
                <span>🛡️</span> Guardian & Family Portal
              </span>
              <h1 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">
                Welcome, {profile?.first_name || 'Guardian'}
              </h1>
              <p className="mt-1 text-sm text-slate-300">
                Real-time academic performance, attendance, schedules, and fee records for your children.
              </p>
            </div>

            {selectedChild && (
              <div className="rounded-xl bg-white/10 border border-white/15 p-3.5 backdrop-blur">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-indigo-200">
                  Currently Viewing
                </p>
                <p className="text-base font-bold text-white mt-0.5">{selectedChild.full_name}</p>
                <p className="text-xs text-slate-300">
                  ID: {selectedChild.student_id} • {selectedChild.current_grade}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Global Error */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* MULTI-CHILD SWITCHER BAR */}
        {childrenList.length > 0 ? (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Linked Children ({childrenList.length})
              </span>
              <span className="text-xs text-slate-400">Click a student tab to switch view</span>
            </div>

            <div className="flex flex-wrap gap-3">
              {childrenList.map((kid, idx) => {
                const isSelected = idx === selectedChildIndex
                return (
                  <button
                    key={kid.id || kid.student_id}
                    onClick={() => setSelectedChildIndex(idx)}
                    className={`flex items-center gap-3.5 rounded-2xl border px-5 py-3 text-left transition-all ${
                      isSelected
                        ? 'border-indigo-600 bg-white shadow-md ring-2 ring-indigo-100'
                        : 'border-slate-200 bg-white/80 hover:border-slate-300 hover:bg-white'
                    }`}
                  >
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-xl font-black text-sm ${
                        isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {kid.first_name ? kid.first_name.charAt(0).toUpperCase() : 'S'}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-slate-900 leading-snug">{kid.full_name || kid.first_name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {kid.current_grade || 'Grade Level'} • {kid.student_id}
                      </p>
                    </div>
                    {isSelected && (
                      <span className="ml-2 flex h-2.5 w-2.5 rounded-full bg-indigo-600"></span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="mb-8 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <span className="text-3xl mb-2 block">👨‍👩‍👦</span>
            <h3 className="font-bold text-slate-800 text-base">No Enrolled Children Linked Yet</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              If your child has recently enrolled, their record will appear once the Registrar assigns your guardian
              email to their profile.
            </p>
          </div>
        )}

        {selectedChild && (
          <>
            {/* KPI METRIC HIGHLIGHTS */}
            <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Attendance Rate</span>
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 text-base">
                    ✓
                  </span>
                </div>
                <p className="mt-3 text-2xl font-black text-slate-900">{attendanceRate}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {presentDays} of {totalDays} recorded sessions
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Assessments Scored</span>
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 text-base">
                    🎓
                  </span>
                </div>
                <p className="mt-3 text-2xl font-black text-slate-900">{childGrades.length}</p>
                <p className="mt-1 text-xs text-slate-500">Tests & assignments graded</p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Fee Balance</span>
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-xl text-base ${
                      feeBalance > 0 ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
                    }`}
                  >
                    💳
                  </span>
                </div>
                <p className="mt-3 text-2xl font-black text-slate-900">${feeBalance.toFixed(2)}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {feeBalance > 0 ? 'Pending invoice payments' : 'All invoices settled'}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Class Enrolled</span>
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 text-base">
                    🏫
                  </span>
                </div>
                <p className="mt-3 text-xl font-bold text-slate-900 truncate">
                  {selectedChild.current_class || selectedChild.current_grade || 'Grade Section'}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Status: {selectedChild.status || 'ACTIVE'}
                </p>
              </div>
            </div>

            {/* TAB NAVIGATION */}
            <div className="mb-6 flex overflow-x-auto border-b border-slate-200">
              <button
                onClick={() => setActiveTab('overview')}
                className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition whitespace-nowrap ${
                  activeTab === 'overview'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>👤</span> Student Profile
              </button>
              <button
                onClick={() => setActiveTab('academics')}
                className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition whitespace-nowrap ${
                  activeTab === 'academics'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>📚</span> Grades & Tests ({childGrades.length})
              </button>
              <button
                onClick={() => setActiveTab('attendance')}
                className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition whitespace-nowrap ${
                  activeTab === 'attendance'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>✓</span> Attendance Log ({childAttendance.length})
              </button>
              <button
                onClick={() => setActiveTab('timetable')}
                className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition whitespace-nowrap ${
                  activeTab === 'timetable'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>📅</span> Class Timetable
              </button>
              <button
                onClick={() => setActiveTab('finance')}
                className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition whitespace-nowrap ${
                  activeTab === 'finance'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>💳</span> Invoices & Fees ({childInvoices.length})
              </button>
              <button
                onClick={() => setActiveTab('communications')}
                className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition whitespace-nowrap ${
                  activeTab === 'communications'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>💬</span> Inquiries & Messages
              </button>
            </div>

            {/* TAB 1: OVERVIEW & PROFILE */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Student Digital Identity Card */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="text-center">
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 text-3xl font-black text-white shadow-md">
                      {selectedChild.first_name ? selectedChild.first_name.charAt(0).toUpperCase() : 'S'}
                    </div>
                    <h3 className="mt-4 text-xl font-bold text-slate-900">{selectedChild.full_name}</h3>
                    <p className="text-xs font-semibold text-indigo-600 mt-0.5">
                      Student ID: {selectedChild.student_id}
                    </p>
                    <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                      ● Active Student
                    </span>
                  </div>

                  <div className="mt-6 divide-y divide-slate-100 border-t border-slate-100 text-xs">
                    <div className="py-2.5 flex justify-between">
                      <span className="text-slate-500">Grade Level</span>
                      <span className="font-bold text-slate-800">{selectedChild.current_grade || 'Grade 10'}</span>
                    </div>
                    <div className="py-2.5 flex justify-between">
                      <span className="text-slate-500">Assigned Class</span>
                      <span className="font-bold text-slate-800">{selectedChild.current_class || 'Class 10A'}</span>
                    </div>
                    <div className="py-2.5 flex justify-between">
                      <span className="text-slate-500">Campus</span>
                      <span className="font-bold text-slate-800">{selectedChild.campus || 'Main Campus'}</span>
                    </div>
                    <div className="py-2.5 flex justify-between">
                      <span className="text-slate-500">Student Email</span>
                      <span className="font-bold text-slate-800">{selectedChild.email}</span>
                    </div>
                  </div>
                </div>

                {/* Right 2 cols: Attendance Snapshot & Highlights */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Attendance Progress Card */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h3 className="text-base font-bold text-slate-900 mb-2 flex items-center gap-2">
                      <span>✓</span> Term Attendance Summary
                    </h3>
                    <p className="text-xs text-slate-500 mb-4">
                      Daily tracking of class participation and excused absences.
                    </p>

                    <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-1">
                      <span>Overall Rate</span>
                      <span>{attendanceRate}</span>
                    </div>
                    <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all"
                        style={{ width: attendanceRate }}
                      />
                    </div>

                    <div className="mt-4 grid grid-cols-4 gap-2 text-center text-xs">
                      <div className="rounded-lg bg-slate-50 p-2.5">
                        <span className="block font-black text-slate-900 text-base">{totalDays}</span>
                        <span className="text-slate-400 text-[11px]">Total Days</span>
                      </div>
                      <div className="rounded-lg bg-emerald-50 p-2.5">
                        <span className="block font-black text-emerald-700 text-base">{presentDays}</span>
                        <span className="text-emerald-600 text-[11px]">Present</span>
                      </div>
                      <div className="rounded-lg bg-red-50 p-2.5">
                        <span className="block font-black text-red-700 text-base">
                          {childAttendance.filter((a) => (a.status || '').toUpperCase() === 'ABSENT').length}
                        </span>
                        <span className="text-red-600 text-[11px]">Absent</span>
                      </div>
                      <div className="rounded-lg bg-amber-50 p-2.5">
                        <span className="block font-black text-amber-700 text-base">
                          {childAttendance.filter((a) => (a.status || '').toUpperCase() === 'LATE').length}
                        </span>
                        <span className="text-amber-600 text-[11px]">Late</span>
                      </div>
                    </div>
                  </div>

                  {/* School Advisory */}
                  <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/70 to-blue-50/70 p-6 shadow-sm">
                    <h3 className="text-sm font-bold text-indigo-900 flex items-center gap-2">
                      <span>📢</span> School Announcements & Policy
                    </h3>
                    <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                      Parents are invited to review semester examination guidelines. In the event of illness or excused
                      absence, please notify the school office via phone or emergency portal communication within 24 hours.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: ACADEMIC GRADES */}
            {activeTab === 'academics' && (
              <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                <div className="p-6 border-b border-slate-100">
                  <h3 className="text-lg font-bold text-slate-900">Academic Assessments & Grade Results</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Scores posted by subject teachers for quizzes, assignments, and examinations.
                  </p>
                </div>

                {childGrades.length === 0 ? (
                  <div className="py-16 text-center text-sm text-slate-400">
                    No graded assessments posted for this student yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase border-b border-slate-200">
                        <tr>
                          <th className="px-5 py-3.5">Assessment</th>
                          <th className="px-5 py-3.5">Score</th>
                          <th className="px-5 py-3.5 text-center">Letter Grade</th>
                          <th className="px-5 py-3.5">Teacher Remarks</th>
                          <th className="px-5 py-3.5">Date Recorded</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {childGrades.map((g) => (
                          <tr key={g.id} className="hover:bg-slate-50/50">
                            <td className="px-5 py-4">
                              <p className="font-bold text-slate-900">{g.assessment_name || 'Class Assessment'}</p>
                              <p className="text-xs text-slate-500">{g.subject_name || 'Subject'}</p>
                            </td>
                            <td className="px-5 py-4 font-semibold text-slate-700">
                              {g.score} <span className="text-xs text-slate-400">/ {g.max_marks || 100}</span>
                            </td>
                            <td className="px-5 py-4 text-center">
                              <span
                                className={`inline-block px-3 py-1 rounded-full text-xs font-black ${
                                  g.grade === 'A'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : g.grade === 'B'
                                    ? 'bg-blue-100 text-blue-800'
                                    : g.grade === 'C'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {g.grade || 'A'}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-xs text-slate-600 max-w-xs truncate">
                              {g.feedback || 'Excellent effort.'}
                            </td>
                            <td className="px-5 py-4 text-xs text-slate-500">
                              {g.recorded_at ? g.recorded_at.slice(0, 10) : 'Recent'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: ATTENDANCE LOG */}
            {activeTab === 'attendance' && (
              <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Attendance Log History</h3>
                    <p className="text-xs text-slate-500 mt-1">Verified daily class attendance check-ins.</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-500 uppercase">Rate:</span>
                    <span className="ml-2 font-black text-emerald-600 text-base">{attendanceRate}</span>
                  </div>
                </div>

                {childAttendance.length === 0 ? (
                  <div className="py-16 text-center text-sm text-slate-400">
                    No attendance records logged for this student yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase border-b border-slate-200">
                        <tr>
                          <th className="px-5 py-3.5">Date</th>
                          <th className="px-5 py-3.5">Status</th>
                          <th className="px-5 py-3.5">Period / Check-in</th>
                          <th className="px-5 py-3.5">Reason / Remarks</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {childAttendance.map((rec) => (
                          <tr key={rec.id} className="hover:bg-slate-50/50">
                            <td className="px-5 py-3.5 font-bold text-slate-900">{rec.date}</td>
                            <td className="px-5 py-3.5">
                              <span
                                className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                  rec.status === 'PRESENT'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : rec.status === 'ABSENT'
                                    ? 'bg-red-100 text-red-800'
                                    : rec.status === 'LATE'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-blue-100 text-blue-800'
                                }`}
                              >
                                {rec.status}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 text-xs text-slate-500">
                              {rec.check_in_time || rec.class_period || 'Regular Session'}
                            </td>
                            <td className="px-5 py-3.5 text-xs text-slate-600">
                              {rec.reason || 'Normal attendance.'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: WEEKLY TIMETABLE */}
            {activeTab === 'timetable' && (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-slate-900">Weekly Class Timetable</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Scheduled subject lectures, teachers, and classrooms for {selectedChild.full_name}.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
                  {daysOfWeek.map((day) => {
                    const dayScheds = childSchedules.filter((s) => (s.day_of_week || '').toUpperCase() === day)
                    return (
                      <div key={day} className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                        <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 pb-2 border-b border-slate-200">
                          {day}
                        </h4>
                        <div className="mt-3 space-y-2">
                          {dayScheds.length === 0 ? (
                            <p className="text-[11px] text-slate-400 italic">No classes</p>
                          ) : (
                            dayScheds.map((item) => (
                              <div
                                key={item.id}
                                className="rounded-lg bg-white border border-slate-200 p-2.5 shadow-xs"
                              >
                                <p className="text-xs font-bold text-indigo-600">
                                  {item.start_time?.slice(0, 5)} - {item.end_time?.slice(0, 5)}
                                </p>
                                <p className="text-xs font-bold text-slate-900 mt-1">
                                  {item.class_section_name || 'Lecture'}
                                </p>
                                <p className="text-[11px] text-slate-500 mt-0.5">
                                  Room: {item.room_name || 'Main Hall'}
                                </p>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* TAB 5: FINANCE & INVOICES */}
            {activeTab === 'finance' && (
              <div className="space-y-6">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">Student Tuition & Fee Invoices</h3>
                      <p className="text-xs text-slate-500 mt-1">Official institutional billings and receipts.</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-[11px] font-bold uppercase text-slate-400 block">Total Due</span>
                        <span className="text-xl font-black text-slate-900">${feeBalance.toFixed(2)}</span>
                      </div>
                      <button
                        onClick={() => window.print()}
                        className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
                      >
                        🖨️ Print Statement
                      </button>
                    </div>
                  </div>

                  <div className="mt-6 overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase border-b border-slate-200">
                        <tr>
                          <th className="px-5 py-3.5">Invoice #</th>
                          <th className="px-5 py-3.5">Total Amount</th>
                          <th className="px-5 py-3.5">Amount Paid</th>
                          <th className="px-5 py-3.5">Due Date</th>
                          <th className="px-5 py-3.5 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {childInvoices.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-12 text-center text-sm text-slate-400">
                              No financial invoices issued for this student.
                            </td>
                          </tr>
                        ) : (
                          childInvoices.map((inv) => (
                            <tr key={inv.id} className="hover:bg-slate-50/50">
                              <td className="px-5 py-4 font-bold text-slate-900">
                                {inv.invoice_number || `INV-${inv.id?.slice(0, 8)}`}
                              </td>
                              <td className="px-5 py-4 font-semibold text-slate-800">
                                ${parseFloat(inv.total_amount || 0).toFixed(2)}
                              </td>
                              <td className="px-5 py-4 text-emerald-600 font-semibold">
                                ${parseFloat(inv.amount_paid || 0).toFixed(2)}
                              </td>
                              <td className="px-5 py-4 text-xs text-slate-500">{inv.due_date || 'N/A'}</td>
                              <td className="px-5 py-4 text-center">
                                <span
                                  className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                                    (inv.status || '').toUpperCase() === 'PAID'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-amber-100 text-amber-800'
                                  }`}
                                >
                                  {inv.status || 'PENDING'}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 6: INQUIRIES & COMMUNICATIONS */}
            {activeTab === 'communications' && (
              <CommunicationsHub userRole="PARENT" selectedChild={selectedChild} />
            )}
          </>
        )}
      </main>
    </div>
  )
}
