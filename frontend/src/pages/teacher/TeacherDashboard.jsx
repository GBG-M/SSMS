import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { logout } from '../../services/authService'

export default function TeacherDashboard() {
  const navigate = useNavigate()

  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('overview') // 'overview' | 'classes' | 'attendance' | 'grades' | 'timetable'

  // Data states
  const [myClasses, setMyClasses] = useState([])
  const [schedules, setSchedules] = useState([])
  const [assessments, setAssessments] = useState([])
  const [selectedSection, setSelectedSection] = useState(null)
  const [roster, setRoster] = useState([])
  const [loadingRoster, setLoadingRoster] = useState(false)
  const [showRosterModal, setShowRosterModal] = useState(false)

  // Attendance marking state
  const [attendanceSectionId, setAttendanceSectionId] = useState('')
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0])
  const [attendanceRoster, setAttendanceRoster] = useState([])
  const [attendanceRecords, setAttendanceRecords] = useState({}) // { studentId: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED' }
  const [savingAttendance, setSavingAttendance] = useState(false)
  const [attendanceSuccess, setAttendanceSuccess] = useState('')

  // Assessment & Grading state
  const [showAssessmentModal, setShowAssessmentModal] = useState(false)
  const [assessmentForm, setAssessmentForm] = useState({
    class_section: '',
    name: '',
    assessment_type: 'QUIZ',
    due_date: new Date().toISOString().split('T')[0],
    max_marks: 100,
    weight: 10,
    description: '',
  })
  const [creatingAssessment, setCreatingAssessment] = useState(false)

  // Grade entry state
  const [selectedAssessmentForGrades, setSelectedAssessmentForGrades] = useState(null)
  const [gradeEntries, setGradeEntries] = useState({}) // { enrollmentId: { score: 0, feedback: '' } }
  const [showGradeModal, setShowGradeModal] = useState(false)
  const [savingGrades, setSavingGrades] = useState(false)
  const [gradeSuccess, setGradeSuccess] = useState('')

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  useEffect(() => {
    loadTeacherData()
  }, [])

  async function loadTeacherData() {
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

      // 1. Load user profile
      const profRes = await fetch('/api/accounts/profile/', { headers })
      if (!profRes.ok) {
        if (profRes.status === 401) {
          navigate('/login')
          return
        }
        throw new Error('Failed to load faculty profile.')
      }
      const profData = await profRes.json()
      setProfile(profData)

      // 2. Load assigned classes
      const classesRes = await fetch(`/api/academics/class-sections/?teacher=${profData.id}`, { headers })
      let classData = []
      if (classesRes.ok) {
        const json = await classesRes.json()
        classData = Array.isArray(json) ? json : json.results || []
        setMyClasses(classData)
        if (classData.length > 0) {
          setAttendanceSectionId(String(classData[0].id))
          setAssessmentForm((prev) => ({ ...prev, class_section: String(classData[0].id) }))
        }
      }

      // 3. Load teaching schedules
      const schedRes = await fetch('/api/scheduling/class-schedules/', { headers })
      if (schedRes.ok) {
        const json = await schedRes.json()
        const allSched = Array.isArray(json) ? json : json.results || []
        setSchedules(allSched)
      }

      // 4. Load assessments
      const assessRes = await fetch('/api/academics/assessments/', { headers })
      if (assessRes.ok) {
        const json = await assessRes.json()
        const allAssess = Array.isArray(json) ? json : json.results || []
        setAssessments(allAssess)
      }

    } catch (err) {
      console.error('Teacher dashboard load error:', err)
      setError(err.message || 'Error loading faculty dashboard.')
    } finally {
      setLoading(false)
    }
  }

  // Load roster when attendance section changes
  useEffect(() => {
    if (!attendanceSectionId) return
    async function loadAttendanceRoster() {
      const token = localStorage.getItem('authToken')
      try {
        const res = await fetch(`/api/academics/class-sections/${attendanceSectionId}/students/`, {
          headers: { Authorization: `Token ${token}` },
        })
        if (res.ok) {
          const students = await res.json()
          setAttendanceRoster(students)
          // Default all to PRESENT
          const initial = {}
          students.forEach((s) => {
            initial[s.student_id] = 'PRESENT'
          })
          setAttendanceRecords(initial)
        }
      } catch (err) {
        console.error('Failed to load section students:', err)
      }
    }
    loadAttendanceRoster()
  }, [attendanceSectionId])

  // Open roster modal for a section
  const openRoster = async (section) => {
    setSelectedSection(section)
    setShowRosterModal(true)
    setLoadingRoster(true)
    const token = localStorage.getItem('authToken')
    try {
      const res = await fetch(`/api/academics/class-sections/${section.id}/students/`, {
        headers: { Authorization: `Token ${token}` },
      })
      if (res.ok) {
        const students = await res.json()
        setRoster(students)
      } else {
        setRoster([])
      }
    } catch {
      setRoster([])
    } finally {
      setLoadingRoster(false)
    }
  }

  // Save Attendance
  const handleSaveAttendance = async () => {
    const token = localStorage.getItem('authToken')
    setSavingAttendance(true)
    setAttendanceSuccess('')
    try {
      const promises = Object.entries(attendanceRecords).map(([studentId, status]) =>
        fetch('/api/students/attendance/', {
          method: 'POST',
          headers: {
            Authorization: `Token ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            student: studentId,
            date: attendanceDate,
            status: status,
          }),
        })
      )
      await Promise.all(promises)
      setAttendanceSuccess('✓ Attendance marked successfully for this session!')
      setTimeout(() => setAttendanceSuccess(''), 4000)
    } catch (err) {
      console.error('Attendance save error:', err)
      setError('Failed to record attendance entries.')
    } finally {
      setSavingAttendance(false)
    }
  }

  // Create new assessment
  const handleCreateAssessment = async (e) => {
    e.preventDefault()
    const token = localStorage.getItem('authToken')
    setCreatingAssessment(true)
    try {
      const res = await fetch('/api/academics/assessments/', {
        method: 'POST',
        headers: {
          Authorization: `Token ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(assessmentForm),
      })
      if (res.ok) {
        setShowAssessmentModal(false)
        setAssessmentForm({
          class_section: myClasses.length > 0 ? String(myClasses[0].id) : '',
          name: '',
          assessment_type: 'QUIZ',
          due_date: new Date().toISOString().split('T')[0],
          max_marks: 100,
          weight: 10,
          description: '',
        })
        loadTeacherData()
      } else {
        const data = await res.json()
        alert(data.detail || data.error || 'Failed to create assessment.')
      }
    } catch (err) {
      console.error('Assessment create error:', err)
    } finally {
      setCreatingAssessment(false)
    }
  }

  // Open grade entry modal
  const openGradeModal = async (assessment) => {
    setSelectedAssessmentForGrades(assessment)
    setShowGradeModal(true)
    setGradeSuccess('')
    const token = localStorage.getItem('authToken')
    try {
      const res = await fetch(`/api/academics/class-sections/${assessment.class_section}/students/`, {
        headers: { Authorization: `Token ${token}` },
      })
      if (res.ok) {
        const students = await res.json()
        const initial = {}
        students.forEach((s) => {
          initial[s.enrollment_id] = { score: '', feedback: '', student_name: s.full_name, student_id_number: s.student_id_number }
        })
        setGradeEntries(initial)
      }
    } catch (err) {
      console.error('Failed to load students for grading:', err)
    }
  }

  // Save student grades
  const handleSaveGrades = async () => {
    const token = localStorage.getItem('authToken')
    setSavingGrades(true)
    setGradeSuccess('')
    try {
      const promises = Object.entries(gradeEntries)
        .filter(([, data]) => data.score !== '' && data.score !== null)
        .map(([enrollmentId, data]) =>
          fetch('/api/academics/grade-records/', {
            method: 'POST',
            headers: {
              Authorization: `Token ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              enrollment: enrollmentId,
              assessment: selectedAssessmentForGrades.id,
              score: parseFloat(data.score),
              feedback: data.feedback || '',
            }),
          })
        )
      await Promise.all(promises)
      setGradeSuccess('✓ Scores and letter grades recorded successfully!')
      setTimeout(() => {
        setShowGradeModal(false)
        setGradeSuccess('')
      }, 2000)
    } catch (err) {
      console.error('Failed to save grades:', err)
      alert('Error recording grade records.')
    } finally {
      setSavingGrades(false)
    }
  }

  // Calculations
  const totalStudentsTaught = myClasses.reduce(
    (sum, c) => sum + (c.enrolled_students_count || 0),
    0
  )

  const daysOfWeek = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY']
  const todayDayName = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'][
    new Date().getDay()
  ]
  const todaySchedules = schedules.filter((s) => (s.day_of_week || '').toUpperCase() === todayDayName)

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Institutional Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 font-bold text-white shadow-md">
              SS
            </div>
            <div>
              <span className="text-base font-bold text-slate-900 tracking-tight">SSMS Faculty</span>
              <span className="ml-2 rounded-md bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
                Teacher Portal
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-slate-800">
                {profile?.full_name || profile?.first_name || 'Faculty Member'}
              </p>
              <p className="text-xs text-slate-500">{profile?.email}</p>
            </div>

            <div className="flex items-center gap-2">
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
        {/* Welcome Banner */}
        <div className="mb-8 rounded-2xl bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 p-6 text-white shadow-lg sm:p-8">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/30 px-3 py-1 text-xs font-medium text-blue-100 backdrop-blur">
                <span>📚</span> Academic Faculty Dashboard
              </span>
              <h1 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">
                Welcome back, {profile?.first_name ? `Professor ${profile.first_name}` : 'Teacher'}!
              </h1>
              <p className="mt-1 text-sm text-blue-100">
                Manage your classes, record attendance, enter assessment grades, and track student success.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveTab('attendance')}
                className="rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-blue-700 shadow transition hover:bg-blue-50"
              >
                ✓ Mark Attendance
              </button>
              <button
                onClick={() => setShowAssessmentModal(true)}
                className="rounded-xl bg-blue-500/40 border border-white/20 px-4 py-2.5 text-xs font-bold text-white shadow transition hover:bg-blue-500/60"
              >
                ＋ New Assessment
              </button>
            </div>
          </div>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Live KPI Metric Cards */}
        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Assigned Classes</span>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 text-base">
                📚
              </span>
            </div>
            <p className="mt-3 text-2xl font-black text-slate-900">{myClasses.length}</p>
            <p className="mt-1 text-xs text-slate-500">Active teaching sections</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Enrolled Students</span>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 text-base">
                👥
              </span>
            </div>
            <p className="mt-3 text-2xl font-black text-slate-900">{totalStudentsTaught}</p>
            <p className="mt-1 text-xs text-slate-500">Under your supervision</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Today's Periods</span>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 text-base">
                ⏰
              </span>
            </div>
            <p className="mt-3 text-2xl font-black text-slate-900">{todaySchedules.length}</p>
            <p className="mt-1 text-xs text-slate-500">
              {todayDayName.charAt(0) + todayDayName.slice(1).toLowerCase()} timetable
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Assessments</span>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600 text-base">
                📝
              </span>
            </div>
            <p className="mt-3 text-2xl font-black text-slate-900">{assessments.length}</p>
            <p className="mt-1 text-xs text-slate-500">Quizzes, exams & tasks</p>
          </div>
        </div>

        {/* Tab Navigation Navigation */}
        <div className="mb-6 flex overflow-x-auto border-b border-slate-200">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition whitespace-nowrap ${
              activeTab === 'overview'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>📊</span> Overview & Schedule
          </button>
          <button
            onClick={() => setActiveTab('classes')}
            className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition whitespace-nowrap ${
              activeTab === 'classes'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>🏫</span> My Classes ({myClasses.length})
          </button>
          <button
            onClick={() => setActiveTab('attendance')}
            className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition whitespace-nowrap ${
              activeTab === 'attendance'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>✓</span> Attendance Marker
          </button>
          <button
            onClick={() => setActiveTab('grades')}
            className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition whitespace-nowrap ${
              activeTab === 'grades'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>📝</span> Assessments & Grades
          </button>
          <button
            onClick={() => setActiveTab('timetable')}
            className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition whitespace-nowrap ${
              activeTab === 'timetable'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>📅</span> Weekly Timetable
          </button>
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Left 2 Cols: Today's Teaching Timeline */}
            <div className="lg:col-span-2 space-y-6">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <span>⏰</span> Today's Class Schedule
                  </h2>
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                    {todayDayName}
                  </span>
                </div>

                {todaySchedules.length === 0 ? (
                  <div className="py-8 text-center text-sm text-slate-400">
                    No classes scheduled for today ({todayDayName}). Take time to prepare upcoming course materials!
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {todaySchedules.map((item) => (
                      <div key={item.id} className="py-4 flex items-center justify-between">
                        <div className="flex items-start gap-4">
                          <div className="flex flex-col items-center justify-center rounded-xl bg-blue-50 px-3 py-2 text-blue-700 font-bold text-xs min-w-[70px]">
                            <span>{item.start_time?.slice(0, 5)}</span>
                            <span className="text-[10px] font-normal text-slate-400">to</span>
                            <span>{item.end_time?.slice(0, 5)}</span>
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-900 text-sm">{item.class_section_name || 'Class Section'}</h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                              Room: {item.room_name || 'Assigned Hall'} • {item.term || 'Term 1'}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            if (item.class_section) setAttendanceSectionId(String(item.class_section))
                            setActiveTab('attendance')
                          }}
                          className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-blue-600 hover:text-white transition"
                        >
                          Mark Roster
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick Actions Panel */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <span>⚡</span> Quick Faculty Actions
                </h2>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <button
                    onClick={() => setActiveTab('attendance')}
                    className="flex flex-col items-center justify-center rounded-xl border border-slate-200 p-4 text-center hover:border-blue-400 hover:bg-blue-50/50 transition group"
                  >
                    <span className="text-2xl mb-1">📋</span>
                    <span className="text-xs font-bold text-slate-800 group-hover:text-blue-700">Take Attendance</span>
                    <span className="text-[11px] text-slate-400 mt-0.5">Log daily class rosters</span>
                  </button>
                  <button
                    onClick={() => setShowAssessmentModal(true)}
                    className="flex flex-col items-center justify-center rounded-xl border border-slate-200 p-4 text-center hover:border-blue-400 hover:bg-blue-50/50 transition group"
                  >
                    <span className="text-2xl mb-1">📝</span>
                    <span className="text-xs font-bold text-slate-800 group-hover:text-blue-700">Post Assessment</span>
                    <span className="text-[11px] text-slate-400 mt-0.5">Create quiz or exam</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('grades')}
                    className="flex flex-col items-center justify-center rounded-xl border border-slate-200 p-4 text-center hover:border-blue-400 hover:bg-blue-50/50 transition group"
                  >
                    <span className="text-2xl mb-1">📊</span>
                    <span className="text-xs font-bold text-slate-800 group-hover:text-blue-700">Gradebook Entries</span>
                    <span className="text-[11px] text-slate-400 mt-0.5">Score completed tests</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Right Col: Classes Quick Summary */}
            <div className="space-y-6">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <span>🏫</span> My Class Sections
                  </h2>
                  <span className="text-xs font-semibold text-blue-600">{myClasses.length} Active</span>
                </div>

                <div className="space-y-3">
                  {myClasses.slice(0, 4).map((c) => (
                    <div
                      key={c.id}
                      onClick={() => openRoster(c)}
                      className="cursor-pointer rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 hover:border-blue-300 hover:bg-blue-50/40 transition"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-slate-900">{c.name}</span>
                        <span className="text-xs font-semibold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                          {c.section_code}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                        <span>{c.subject_name || 'Subject'}</span>
                        <span className="font-semibold text-blue-600">
                          {c.enrolled_students_count || 0} / {c.capacity || 30} Enrolled
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => setActiveTab('classes')}
                  className="mt-4 w-full rounded-xl bg-slate-100 py-2.5 text-center text-xs font-bold text-slate-700 hover:bg-slate-200 transition"
                >
                  View All Classes & Rosters →
                </button>
              </div>

              {/* Department Notice Card */}
              <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-blue-50 p-6 shadow-sm">
                <div className="flex items-center gap-2 text-indigo-900 font-bold text-sm">
                  <span>📢</span> Institutional Faculty Policy
                </div>
                <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                  Attendance records and mid-term assessments must be finalized within 48 hours of session completion
                  for student progress reporting and guardian visibility.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MY CLASSES & ROSTERS */}
        {activeTab === 'classes' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Your Assigned Class Sections</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Click any class section to view its complete active student roster.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {myClasses.map((section) => (
                <div
                  key={section.id}
                  className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
                        {section.section_code}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">
                        Room {section.room_number || 'TBA'}
                      </span>
                    </div>
                    <h3 className="mt-3 text-lg font-bold text-slate-900">{section.name}</h3>
                    <p className="text-xs font-medium text-slate-500 mt-1">
                      {section.subject_name} • Academic Year {section.academic_year_name || '2025/2026'}
                    </p>

                    <div className="mt-4">
                      <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                        <span>Class Capacity</span>
                        <span>{section.enrolled_students_count || 0} / {section.capacity || 30}</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full bg-blue-600 rounded-full"
                          style={{
                            width: `${Math.min(
                              100,
                              Math.round(((section.enrolled_students_count || 0) / (section.capacity || 30)) * 100)
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => openRoster(section)}
                      className="flex-1 rounded-xl bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100 transition text-center"
                    >
                      👥 View Roster
                    </button>
                    <button
                      onClick={() => {
                        setAttendanceSectionId(String(section.id))
                        setActiveTab('attendance')
                      }}
                      className="flex-1 rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 transition text-center"
                    >
                      ✓ Attendance
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: ATTENDANCE MARKER */}
        {activeTab === 'attendance' && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Class Attendance Marker</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Select a section and date, then mark present, absent, late, or excused for each student.
                </p>
              </div>

              {attendanceSuccess && (
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2 text-xs font-bold text-emerald-800 animate-fade-in">
                  {attendanceSuccess}
                </div>
              )}
            </div>

            {/* Selectors */}
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Class Section</label>
                <select
                  value={attendanceSectionId}
                  onChange={(e) => setAttendanceSectionId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-500"
                >
                  {myClasses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.section_code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Session Date</label>
                <input
                  type="date"
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const allPresent = {}
                    attendanceRoster.forEach((s) => {
                      allPresent[s.student_id] = 'PRESENT'
                    })
                    setAttendanceRecords(allPresent)
                  }}
                  className="rounded-lg bg-emerald-100 text-emerald-800 px-3 py-2 text-xs font-bold hover:bg-emerald-200 transition"
                >
                  ✓ All Present
                </button>
                <button
                  type="button"
                  onClick={handleSaveAttendance}
                  disabled={savingAttendance || attendanceRoster.length === 0}
                  className="flex-1 rounded-lg bg-blue-600 text-white px-4 py-2 text-xs font-bold hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {savingAttendance ? 'Saving...' : '💾 Save Attendance'}
                </button>
              </div>
            </div>

            {/* Attendance Roster Table */}
            {attendanceRoster.length === 0 ? (
              <div className="py-12 text-center text-sm text-slate-400">
                No active students enrolled in this section.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Student ID</th>
                      <th className="px-4 py-3">Full Name</th>
                      <th className="px-4 py-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {attendanceRoster.map((student) => {
                      const currentStatus = attendanceRecords[student.student_id] || 'PRESENT'
                      return (
                        <tr key={student.student_id} className="hover:bg-slate-50/50">
                          <td className="px-4 py-3 font-semibold text-slate-700">
                            {student.student_id_number || student.student_id}
                          </td>
                          <td className="px-4 py-3 font-bold text-slate-900">{student.full_name}</td>
                          <td className="px-4 py-3">
                            <div className="flex justify-center gap-1.5">
                              {['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'].map((st) => (
                                <button
                                  key={st}
                                  type="button"
                                  onClick={() =>
                                    setAttendanceRecords((prev) => ({
                                      ...prev,
                                      [student.student_id]: st,
                                    }))
                                  }
                                  className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                                    currentStatus === st
                                      ? st === 'PRESENT'
                                        ? 'bg-emerald-600 text-white'
                                        : st === 'ABSENT'
                                        ? 'bg-red-600 text-white'
                                        : st === 'LATE'
                                        ? 'bg-amber-500 text-white'
                                        : 'bg-blue-600 text-white'
                                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                  }`}
                                >
                                  {st}
                                </button>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: ASSESSMENTS & GRADES */}
        {activeTab === 'grades' && (
          <div className="space-y-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Assessments & Student Gradebook</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Create quizzes, assignments, and exams, then input student marks for letter grade calculation.
                </p>
              </div>

              <button
                onClick={() => setShowAssessmentModal(true)}
                className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-blue-700 transition"
              >
                ＋ New Assessment
              </button>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase border-b border-slate-200">
                    <tr>
                      <th className="px-5 py-3.5">Assessment Name</th>
                      <th className="px-5 py-3.5">Type</th>
                      <th className="px-5 py-3.5">Due Date</th>
                      <th className="px-5 py-3.5">Max Marks</th>
                      <th className="px-5 py-3.5">Weight</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {assessments.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-sm text-slate-400">
                          No assessments created yet. Click "＋ New Assessment" to add your first quiz or exam.
                        </td>
                      </tr>
                    ) : (
                      assessments.map((a) => (
                        <tr key={a.id} className="hover:bg-slate-50/50">
                          <td className="px-5 py-4 font-bold text-slate-900">{a.name}</td>
                          <td className="px-5 py-4">
                            <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                              {a.assessment_type}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-slate-600 text-xs">{a.due_date || 'N/A'}</td>
                          <td className="px-5 py-4 text-slate-700 font-semibold">{a.max_marks} pts</td>
                          <td className="px-5 py-4 text-slate-600 text-xs">{a.weight}%</td>
                          <td className="px-5 py-4 text-right">
                            <button
                              onClick={() => openGradeModal(a)}
                              className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition"
                            >
                              📊 Record Scores
                            </button>
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

        {/* TAB 5: WEEKLY TIMETABLE */}
        {activeTab === 'timetable' && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-900">Weekly Faculty Schedule</h2>
              <p className="text-xs text-slate-500 mt-1">
                Your assigned lecture timetable across all campus lecture rooms.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
              {daysOfWeek.map((day) => {
                const dayScheds = schedules.filter((s) => (s.day_of_week || '').toUpperCase() === day)
                return (
                  <div key={day} className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                    <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 pb-2 border-b border-slate-200">
                      {day}
                    </h3>
                    <div className="mt-3 space-y-2">
                      {dayScheds.length === 0 ? (
                        <p className="text-[11px] text-slate-400 italic">No classes</p>
                      ) : (
                        dayScheds.map((item) => (
                          <div
                            key={item.id}
                            className="rounded-lg bg-white border border-slate-200 p-2.5 shadow-xs"
                          >
                            <p className="text-xs font-bold text-blue-700">
                              {item.start_time?.slice(0, 5)} - {item.end_time?.slice(0, 5)}
                            </p>
                            <p className="text-xs font-bold text-slate-900 mt-1">
                              {item.class_section_name || 'Class Section'}
                            </p>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              Room: {item.room_name || 'TBA'}
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
      </main>

      {/* ROSTER MODAL */}
      {showRosterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{selectedSection?.name} Roster</h3>
                <p className="text-xs text-slate-500">
                  {selectedSection?.section_code} • {roster.length} active students enrolled
                </p>
              </div>
              <button
                onClick={() => setShowRosterModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 max-h-[400px] overflow-y-auto">
              {loadingRoster ? (
                <div className="py-8 text-center text-sm text-slate-500">Loading student roster...</div>
              ) : roster.length === 0 ? (
                <div className="py-8 text-center text-sm text-slate-400">No students currently enrolled.</div>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase">
                    <tr>
                      <th className="px-4 py-2">Student ID</th>
                      <th className="px-4 py-2">Student Name</th>
                      <th className="px-4 py-2">Enrolled Date</th>
                      <th className="px-4 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {roster.map((r) => (
                      <tr key={r.enrollment_id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-2.5 font-semibold text-slate-700">{r.student_id_number}</td>
                        <td className="px-4 py-2.5 font-bold text-slate-900">{r.full_name}</td>
                        <td className="px-4 py-2.5 text-xs text-slate-500">{r.enrolled_on || 'Active'}</td>
                        <td className="px-4 py-2.5">
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
                            {r.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowRosterModal(false)}
                className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200"
              >
                Close Roster
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE ASSESSMENT MODAL */}
      {showAssessmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Create New Assessment</h3>
            <p className="text-xs text-slate-500 mb-4">Post an assignment, quiz, or examination for your class.</p>

            <form onSubmit={handleCreateAssessment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Target Class Section</label>
                <select
                  value={assessmentForm.class_section}
                  onChange={(e) => setAssessmentForm({ ...assessmentForm, class_section: e.target.value })}
                  required
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                >
                  {myClasses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.section_code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Assessment Title</label>
                <input
                  type="text"
                  placeholder="e.g. Midterm Examination Chapter 1-4"
                  value={assessmentForm.name}
                  onChange={(e) => setAssessmentForm({ ...assessmentForm, name: e.target.value })}
                  required
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Type</label>
                  <select
                    value={assessmentForm.assessment_type}
                    onChange={(e) => setAssessmentForm({ ...assessmentForm, assessment_type: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                  >
                    <option value="QUIZ">Quiz</option>
                    <option value="ASSIGNMENT">Assignment</option>
                    <option value="MIDTERM">Midterm</option>
                    <option value="FINAL">Final Exam</option>
                    <option value="PRACTICAL">Practical Lab</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={assessmentForm.due_date}
                    onChange={(e) => setAssessmentForm({ ...assessmentForm, due_date: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Max Marks</label>
                  <input
                    type="number"
                    value={assessmentForm.max_marks}
                    onChange={(e) => setAssessmentForm({ ...assessmentForm, max_marks: parseInt(e.target.value) || 100 })}
                    min={1}
                    max={1000}
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Weight (%)</label>
                  <input
                    type="number"
                    value={assessmentForm.weight}
                    onChange={(e) => setAssessmentForm({ ...assessmentForm, weight: parseInt(e.target.value) || 10 })}
                    min={1}
                    max={100}
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Instructions / Description</label>
                <textarea
                  rows={2}
                  placeholder="Optional guidelines for students..."
                  value={assessmentForm.description}
                  onChange={(e) => setAssessmentForm({ ...assessmentForm, description: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAssessmentModal(false)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingAssessment}
                  className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white shadow hover:bg-blue-700 disabled:opacity-50"
                >
                  {creatingAssessment ? 'Publishing...' : 'Publish Assessment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECORD GRADES MODAL */}
      {showGradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Record Student Scores: {selectedAssessmentForGrades?.name}
                </h3>
                <p className="text-xs text-slate-500">
                  Max Marks: {selectedAssessmentForGrades?.max_marks} pts • Weight: {selectedAssessmentForGrades?.weight}%
                </p>
              </div>
              <button
                onClick={() => setShowGradeModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {gradeSuccess && (
              <div className="my-3 rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs font-bold text-emerald-800">
                {gradeSuccess}
              </div>
            )}

            <div className="mt-4 max-h-[360px] overflow-y-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase">
                  <tr>
                    <th className="px-4 py-2">Student</th>
                    <th className="px-4 py-2 w-32">Score / {selectedAssessmentForGrades?.max_marks}</th>
                    <th className="px-4 py-2">Remarks / Feedback</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {Object.entries(gradeEntries).map(([enrollmentId, item]) => (
                    <tr key={enrollmentId}>
                      <td className="px-4 py-2.5">
                        <p className="font-bold text-slate-900">{item.student_name}</p>
                        <p className="text-xs text-slate-400">{item.student_id_number}</p>
                      </td>
                      <td className="px-4 py-2.5">
                        <input
                          type="number"
                          placeholder="Score"
                          min={0}
                          max={selectedAssessmentForGrades?.max_marks}
                          step="0.5"
                          value={item.score}
                          onChange={(e) =>
                            setGradeEntries((prev) => ({
                              ...prev,
                              [enrollmentId]: { ...prev[enrollmentId], score: e.target.value },
                            }))
                          }
                          className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold outline-none focus:border-blue-500"
                        />
                      </td>
                      <td className="px-4 py-2.5">
                        <input
                          type="text"
                          placeholder="Feedback"
                          value={item.feedback}
                          onChange={(e) =>
                            setGradeEntries((prev) => ({
                              ...prev,
                              [enrollmentId]: { ...prev[enrollmentId], feedback: e.target.value },
                            }))
                          }
                          className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs outline-none focus:border-blue-500"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowGradeModal(false)}
                className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveGrades}
                disabled={savingGrades}
                className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white shadow hover:bg-blue-700 disabled:opacity-50"
              >
                {savingGrades ? 'Submitting Scores...' : '💾 Save Grades'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
