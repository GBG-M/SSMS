import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  getAcademicYears,
  getCourses,
  getClassSections,
  getEnrollments,
  getAssessments,
  getGradeRecords,
} from '../../services/academicService'

export default function AcademicsOverview() {
  const [stats, setStats] = useState({
    totalAcademicYears: 0,
    activeAcademicYear: null,
    totalSubjects: 0,
    activeCourses: 0,
    totalClassSections: 0,
    totalEnrollments: 0,
    totalAssessments: 0,
    totalGrades: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [recentData, setRecentData] = useState({
    academicYears: [],
    courses: [],
    sections: [],
    assessments: [],
  })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    setError('')
    try {
      const [years, courses, sections, enrollments, assessments, grades] =
        await Promise.all([
          getAcademicYears().catch(() => []),
          getCourses().catch(() => []),
          getClassSections().catch(() => []),
          getEnrollments().catch(() => []),
          getAssessments().catch(() => []),
          getGradeRecords().catch(() => []),
        ])

      const activeYear = years.find((y) => y.is_active) || years[0] || null

      setStats({
        totalAcademicYears: years.length,
        activeAcademicYear: activeYear,
        activeCourses: courses.filter((c) => c.is_active).length,
        totalClassSections: sections.length,
        totalEnrollments: enrollments.length,
        totalAssessments: assessments.length,
        totalGrades: grades.length,
      })

      setRecentData({
        academicYears: years.slice(0, 4),
        courses: courses.slice(0, 4),
        sections: sections.slice(0, 4),
        assessments: assessments.slice(0, 4),
      })
    } catch (err) {
      setError(err.message || 'Failed to load academic overview data')
    } finally {
      setLoading(false)
    }
  }

  const modules = [
    {
      title: 'Academic Years',
      description: 'Manage institutional calendar, semester dates, and activate the current academic year.',
      link: '/academics/years',
      icon: '📅',
      badge: `${stats.totalAcademicYears} Years`,
      badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
    },
    {
      title: 'Subjects & Disciplines',
      description: 'Define core subject curricula, credit hour weightings, and departmental affiliations.',
      link: '/academics/subjects',
      icon: '📐',
      badge: 'Curriculum',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    },
    {
      title: 'Course Catalog',
      description: 'Configure course codes, educational levels, credit hours, and subject associations.',
      link: '/academics/courses',
      icon: '📚',
      badge: `${stats.activeCourses} Active`,
      badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    },
    {
      title: 'Class Sections',
      description: 'Assign teachers to classes, schedule rooms, and track classroom seat capacities.',
      link: '/academics/sections',
      icon: '🏫',
      badge: `${stats.totalClassSections} Sections`,
      badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
    },
    {
      title: 'Student Enrollments',
      description: 'Enroll students in class sections, monitor active status, and audit course rosters.',
      link: '/academics/enrollments',
      icon: '👥',
      badge: `${stats.totalEnrollments} Enrolled`,
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    },
    {
      title: 'Assessments & Exams',
      description: 'Create quizzes, midterms, final examinations, and weighted evaluation rules.',
      link: '/academics/assessments',
      icon: '📝',
      badge: `${stats.totalAssessments} Tests`,
      badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
    },
    {
      title: 'Grade Book & Results',
      description: 'Record student exam marks, calculate GPA & letter grades, and publish feedback.',
      link: '/academics/grades',
      icon: '📊',
      badge: `${stats.totalGrades} Recorded`,
      badgeColor: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-600 font-medium animate-pulse">Loading academic system metrics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Header & Breadcrumb */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <Link to="/dashboard" className="hover:text-indigo-600 transition">Dashboard</Link>
                <span>/</span>
                <span className="text-indigo-600">Academics</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1 flex items-center gap-2">
                🎓 Academic Management
              </h1>
            </div>

            {/* Quick Navigation Tabs */}
            <div className="flex items-center gap-2 flex-wrap text-sm">
              <Link
                to="/academics/years"
                className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 font-medium transition"
              >
                Years
              </Link>
              <Link
                to="/academics/subjects"
                className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 font-medium transition"
              >
                Subjects
              </Link>
              <Link
                to="/academics/courses"
                className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 font-medium transition"
              >
                Courses
              </Link>
              <Link
                to="/academics/sections"
                className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 font-medium transition"
              >
                Sections
              </Link>
              <Link
                to="/academics/enrollments"
                className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 font-medium transition"
              >
                Enrollments
              </Link>
              <Link
                to="/academics/assessments"
                className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 font-medium transition"
              >
                Assessments
              </Link>
              <Link
                to="/academics/grades"
                className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition shadow-sm"
              >
                Grade Book
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center justify-between shadow-sm">
            <div className="flex items-center space-x-3">
              <span className="text-xl">⚠️</span>
              <p className="font-medium text-sm">{error}</p>
            </div>
            <button
              onClick={loadData}
              className="text-xs bg-red-100 hover:bg-red-200 text-red-800 font-bold px-3 py-1 rounded-md transition"
            >
              Retry
            </button>
          </div>
        )}

        {/* Active Academic Year Banner */}
        {stats.activeAcademicYear && (
          <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-blue-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  Active Academic Calendar
                </div>
                <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
                  Academic Year: {stats.activeAcademicYear.name}
                </h2>
                <p className="text-indigo-200 text-sm max-w-xl">
                  Official operational term running from{' '}
                  <span className="text-white font-medium">{stats.activeAcademicYear.start_date}</span> to{' '}
                  <span className="text-white font-medium">{stats.activeAcademicYear.end_date}</span>. All current enrollments and schedules align to this period.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Link
                  to="/academics/years"
                  className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-4 py-2.5 rounded-xl text-sm font-semibold transition backdrop-blur-sm shadow-sm"
                >
                  Manage Term Dates
                </Link>
                <Link
                  to="/academics/sections"
                  className="bg-indigo-500 hover:bg-indigo-400 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition shadow-md"
                >
                  + Create Section
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* KPI Metrics Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between text-slate-500 text-sm font-medium">
              <span>Active Courses</span>
              <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl text-lg">📚</span>
            </div>
            <p className="text-3xl font-extrabold text-slate-900 mt-2">{stats.activeCourses}</p>
            <p className="text-xs text-slate-500 mt-1">Disciplines & courses open</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between text-slate-500 text-sm font-medium">
              <span>Class Sections</span>
              <span className="p-2 bg-purple-50 text-purple-600 rounded-xl text-lg">🏫</span>
            </div>
            <p className="text-3xl font-extrabold text-slate-900 mt-2">{stats.totalClassSections}</p>
            <p className="text-xs text-slate-500 mt-1">Assigned teacher classes</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between text-slate-500 text-sm font-medium">
              <span>Live Enrollments</span>
              <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl text-lg">👥</span>
            </div>
            <p className="text-3xl font-extrabold text-slate-900 mt-2">{stats.totalEnrollments}</p>
            <p className="text-xs text-slate-500 mt-1">Student course assignments</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between text-slate-500 text-sm font-medium">
              <span>Grades Recorded</span>
              <span className="p-2 bg-cyan-50 text-cyan-600 rounded-xl text-lg">📊</span>
            </div>
            <p className="text-3xl font-extrabold text-slate-900 mt-2">{stats.totalGrades}</p>
            <p className="text-xs text-slate-500 mt-1">Evaluated exam scores</p>
          </div>
        </div>

        {/* Academic Management Modules Grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Academic Core Modules</h3>
              <p className="text-xs text-slate-500">Access and administer all academic sub-modules</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules.map((mod, index) => (
              <Link
                key={index}
                to={mod.link}
                className="group bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-lg hover:border-indigo-300 transition duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <span className="text-3xl p-3 bg-slate-50 group-hover:bg-indigo-50 rounded-2xl transition">
                      {mod.icon}
                    </span>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${mod.badgeColor}`}>
                      {mod.badge}
                    </span>
                  </div>
                  <h4 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 mt-4 transition">
                    {mod.title}
                  </h4>
                  <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">
                    {mod.description}
                  </p>
                </div>
                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-indigo-600 group-hover:translate-x-1 transition duration-150">
                  <span>Enter Module</span>
                  <span>→</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Live Snapshot Tables / Recent Data */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Courses */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <span>📚</span> Active Courses
              </h4>
              <Link to="/academics/courses" className="text-xs font-semibold text-indigo-600 hover:underline">
                View all
              </Link>
            </div>
            {recentData.courses.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No courses configured yet</p>
            ) : (
              <div className="space-y-3">
                {recentData.courses.map((c) => (
                  <div key={c.id} className="p-3 bg-slate-50 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-indigo-700">{c.course_code}</p>
                      <p className="text-sm font-semibold text-slate-800">{c.title}</p>
                    </div>
                    <span className="text-xs bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded-md">
                      {c.credit_hours} Cr
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Class Sections */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <span>🏫</span> Active Sections
              </h4>
              <Link to="/academics/sections" className="text-xs font-semibold text-indigo-600 hover:underline">
                View all
              </Link>
            </div>
            {recentData.sections.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No class sections created</p>
            ) : (
              <div className="space-y-3">
                {recentData.sections.map((s) => (
                  <div key={s.id} className="p-3 bg-slate-50 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-purple-700">{s.section_code}</p>
                      <p className="text-sm font-semibold text-slate-800">{s.name}</p>
                      <p className="text-xs text-slate-500">Teacher: {s.teacher_name || 'Unassigned'}</p>
                    </div>
                    <span className="text-xs bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded-md">
                      {s.enrolled_students_count || 0} / {s.capacity}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Assessments */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <span>📝</span> Assessments
              </h4>
              <Link to="/academics/assessments" className="text-xs font-semibold text-indigo-600 hover:underline">
                View all
              </Link>
            </div>
            {recentData.assessments.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No assessments scheduled</p>
            ) : (
              <div className="space-y-3">
                {recentData.assessments.map((a) => (
                  <div key={a.id} className="p-3 bg-slate-50 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-rose-700">{a.assessment_type}</p>
                      <p className="text-sm font-semibold text-slate-800">{a.name}</p>
                      <p className="text-xs text-slate-500">Due: {a.due_date || 'No deadline'}</p>
                    </div>
                    <span className="text-xs bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded-md">
                      {a.max_marks} pts ({a.weight}%)
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

