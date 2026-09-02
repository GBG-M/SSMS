import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import SchedulingLayout from '../../components/scheduling/SchedulingLayout'
import ScheduleCard from '../../components/scheduling/ScheduleCard'
import ClassScheduleModal from '../../components/scheduling/ClassScheduleModal'
import {
  fetchClassSchedules,
  fetchExamSchedules,
  fetchRooms,
  fetchClassSectionsLookup,
  fetchAcademicYearsLookup,
  fetchTeachersLookup,
  deleteClassSchedule,
} from '../../services/scheduleService'

const DAY_MAP = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']

export default function SchedulingOverview() {
  const [classSchedules, setClassSchedules] = useState([])
  const [examSchedules, setExamSchedules] = useState([])
  const [rooms, setRooms] = useState([])
  const [classSections, setClassSections] = useState([])
  const [academicYears, setAcademicYears] = useState([])
  const [teachers, setTeachers] = useState([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState(null)

  const todayIndex = new Date().getDay()
  const todayDayKey = DAY_MAP[todayIndex]

  useEffect(() => {
    loadAllData()
  }, [])

  async function loadAllData() {
    setLoading(true)
    setError('')
    try {
      const [classesRes, examsRes, roomsRes] = await Promise.all([
        fetchClassSchedules(),
        fetchExamSchedules(),
        fetchRooms(),
      ])

      const classesData = classesRes.results || classesRes || []
      const examsData = examsRes.results || examsRes || []
      const roomsData = roomsRes.results || roomsRes || []

      setClassSchedules(classesData)
      setExamSchedules(examsData)
      setRooms(roomsData)

      // Background lookup load for modal
      Promise.all([
        fetchClassSectionsLookup(),
        fetchAcademicYearsLookup(),
        fetchTeachersLookup(),
      ]).then(([sections, years, teachs]) => {
        setClassSections(sections)
        setAcademicYears(years)
        setTeachers(teachs)
      }).catch(() => {})
    } catch (err) {
      setError('Failed to load scheduling data: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to remove this schedule entry?')) return
    try {
      await deleteClassSchedule(id)
      loadAllData()
    } catch (err) {
      alert(err.message || 'Failed to delete schedule.')
    }
  }

  const todayClasses = classSchedules
    .filter((s) => s.day_of_week === todayDayKey)
    .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''))

  const upcomingExams = [...examSchedules]
    .filter((e) => new Date(e.exam_date) >= new Date(new Date().setHours(0, 0, 0, 0)))
    .sort((a, b) => new Date(a.exam_date) - new Date(b.exam_date))
    .slice(0, 3)

  return (
    <SchedulingLayout
      title="Scheduling Overview"
      subtitle="Monitor live timetables, exam reservations, and room capacities."
      actions={
        <button
          onClick={() => {
            setEditingSchedule(null)
            setIsModalOpen(true)
          }}
          className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-sm shadow-blue-500/30 transition hover:bg-blue-700"
        >
          <span>＋</span>
          <span>Add Class Schedule</span>
        </button>
      }
    >
      {error && (
        <div className="mb-6 rounded-xl bg-red-50 p-4 text-xs font-semibold text-red-700 border border-red-200 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={loadAllData} className="underline hover:text-red-900">
            Retry
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Today's Classes */}
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Today ({todayDayKey})
            </p>
            <p className="mt-1 text-3xl font-extrabold text-slate-900">
              {loading ? '...' : todayClasses.length}
            </p>
            <span className="text-xs text-blue-600 font-medium">Classes Scheduled</span>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-2xl">
            ⏰
          </div>
        </div>

        {/* Card 2: Total Weekly Sessions */}
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Weekly Timetable
            </p>
            <p className="mt-1 text-3xl font-extrabold text-slate-900">
              {loading ? '...' : classSchedules.length}
            </p>
            <span className="text-xs text-indigo-600 font-medium">Active Sessions</span>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-2xl">
            🗓️
          </div>
        </div>

        {/* Card 3: Upcoming Exams */}
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Exams
            </p>
            <p className="mt-1 text-3xl font-extrabold text-slate-900">
              {loading ? '...' : examSchedules.length}
            </p>
            <span className="text-xs text-rose-600 font-medium">Scheduled Exams</span>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-2xl">
            📝
          </div>
        </div>

        {/* Card 4: Campus Rooms */}
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Campus Rooms
            </p>
            <p className="mt-1 text-3xl font-extrabold text-slate-900">
              {loading ? '...' : rooms.filter((r) => r.is_active).length}
            </p>
            <span className="text-xs text-emerald-600 font-medium">
              Of {rooms.length} Total Rooms
            </span>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-2xl">
            🏢
          </div>
        </div>
      </div>

      {/* Main Grid: Today's Schedule & Quick Actions */}
      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left 2 Cols: Today's Schedule */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span>📅</span> Today's Class Schedule ({todayDayKey})
            </h3>
            <Link
              to="/scheduling/classes"
              className="text-xs font-semibold text-blue-600 hover:text-blue-800"
            >
              View Full Week Timetable →
            </Link>
          </div>

          {loading ? (
            <div className="flex h-48 items-center justify-center rounded-2xl bg-white ring-1 ring-slate-200 text-slate-400 text-sm">
              Loading today's schedule...
            </div>
          ) : todayClasses.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {todayClasses.map((schedule) => (
                <ScheduleCard
                  key={schedule.id}
                  schedule={schedule}
                  onEdit={(item) => {
                    setEditingSchedule(item)
                    setIsModalOpen(true)
                  }}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-2xl bg-white p-8 text-center ring-1 ring-slate-200">
              <span className="text-3xl mb-2">🎉</span>
              <p className="text-sm font-bold text-slate-800">No classes scheduled for today</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                Enjoy your free time or check the full weekly timetable to prepare for upcoming sessions.
              </p>
              <Link
                to="/scheduling/classes"
                className="mt-4 rounded-lg bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200"
              >
                Browse Weekly Timetable
              </Link>
            </div>
          )}
        </div>

        {/* Right 1 Col: Upcoming Exams & Quick Links */}
        <div className="space-y-6">
          {/* Upcoming Exams Card */}
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>📝</span> Upcoming Exams
              </h4>
              <Link to="/scheduling/exams" className="text-xs font-semibold text-blue-600 hover:underline">
                View All
              </Link>
            </div>

            {loading ? (
              <p className="text-xs text-slate-400 py-4 text-center">Loading exams...</p>
            ) : upcomingExams.length > 0 ? (
              <div className="space-y-3">
                {upcomingExams.map((exam) => (
                  <div key={exam.id} className="rounded-xl bg-slate-50 p-3 text-xs border border-slate-100">
                    <div className="flex items-center justify-between font-bold text-slate-900">
                      <span>{exam.class_section_name}</span>
                      <span className="text-rose-600 text-[11px] font-semibold">{exam.exam_type}</span>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-slate-500">
                      <span>📅 {exam.exam_date}</span>
                      <span className="font-semibold text-blue-600">{exam.room_name}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-4 text-center">
                No upcoming exams scheduled.
              </p>
            )}
          </div>

          {/* Quick Navigation Cards */}
          <div className="space-y-3">
            <Link
              to="/scheduling/classes"
              className="flex items-center justify-between rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-white shadow-sm transition hover:opacity-95"
            >
              <div>
                <p className="text-sm font-bold">Class Timetables</p>
                <p className="text-xs text-blue-100">Interactive weekly schedule grid</p>
              </div>
              <span className="text-xl">🗓️</span>
            </Link>

            <Link
              to="/scheduling/rooms"
              className="flex items-center justify-between rounded-xl bg-white p-4 text-slate-800 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50"
            >
              <div>
                <p className="text-sm font-bold">Campus Room Directory</p>
                <p className="text-xs text-slate-500">Check room capacities & bookings</p>
              </div>
              <span className="text-xl">🏢</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Modal Form */}
      <ClassScheduleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSaved={loadAllData}
        initialData={editingSchedule}
        classSections={classSections}
        rooms={rooms}
        academicYears={academicYears}
        teachers={teachers}
      />
    </SchedulingLayout>
  )
}
