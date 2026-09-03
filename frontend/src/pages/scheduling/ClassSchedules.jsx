import { useState, useEffect } from 'react'
import SchedulingLayout from '../../components/scheduling/SchedulingLayout'
import TimetableGrid from '../../components/scheduling/TimetableGrid'
import ClassScheduleModal from '../../components/scheduling/ClassScheduleModal'
import {
  fetchClassSchedules,
  fetchRooms,
  fetchClassSectionsLookup,
  fetchAcademicYearsLookup,
  fetchTeachersLookup,
  deleteClassSchedule,
} from '../../services/scheduleService'
import { getCurrentUserProfile, hasSchedulingPermission } from '../../services/authService'

export default function ClassSchedules() {
  const [currentUser, setCurrentUser] = useState(null)
  const [schedules, setSchedules] = useState([])
  const [rooms, setRooms] = useState([])
  const [classSections, setClassSections] = useState([])
  const [academicYears, setAcademicYears] = useState([])
  const [teachers, setTeachers] = useState([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Filter States
  const [search, setSearch] = useState('')
  const [selectedRoom, setSelectedRoom] = useState('')
  const [selectedTerm, setSelectedTerm] = useState('')

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState(null)

  const canManage = hasSchedulingPermission(currentUser)

  useEffect(() => {
    loadUser()
    loadSchedules()
  }, [])

  async function loadUser() {
    const profile = await getCurrentUserProfile()
    setCurrentUser(profile)
    if (hasSchedulingPermission(profile)) {
      loadLookups()
    }
  }

  async function loadSchedules() {
    setLoading(true)
    setError('')
    try {
      const data = await fetchClassSchedules({}, true)
      setSchedules(data)
    } catch (err) {
      setError(err.message || 'Failed to load class schedules.')
    } finally {
      setLoading(false)
    }
  }

  async function loadLookups() {
    try {
      const [roomsRes, sectionsRes, yearsRes, teachersRes] = await Promise.all([
        fetchRooms({}, true),
        fetchClassSectionsLookup(),
        fetchAcademicYearsLookup(),
        fetchTeachersLookup(),
      ])
      setRooms(roomsRes.results || roomsRes || [])
      setClassSections(sectionsRes)
      setAcademicYears(yearsRes)
      setTeachers(teachersRes)
    } catch (e) {
      console.warn('Could not load all lookups:', e)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this schedule?')) return
    try {
      await deleteClassSchedule(id)
      setSchedules((prev) => prev.filter((s) => s.id !== id))
    } catch (err) {
      alert(err.message || 'Failed to delete schedule.')
    }
  }

  // Filter schedules locally for instant responsiveness
  const filteredSchedules = schedules.filter((s) => {
    const matchesSearch =
      !search ||
      (s.class_section_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.teacher_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.room_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.subject_code || '').toLowerCase().includes(search.toLowerCase())

    const matchesRoom = !selectedRoom || s.room === selectedRoom || s.room_name === selectedRoom
    const matchesTerm = !selectedTerm || s.term === selectedTerm

    return matchesSearch && matchesRoom && matchesTerm
  })

  // Extract unique terms
  const terms = Array.from(new Set(schedules.map((s) => s.term).filter(Boolean)))

  return (
    <SchedulingLayout
      title="Class Timetables"
      subtitle="Interactive weekly timetable grid for classes, subjects, and rooms."
      actions={
        canManage ? (
          <button
            onClick={() => {
              setEditingSchedule(null)
              setIsModalOpen(true)
            }}
            className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-sm shadow-blue-500/30 transition hover:bg-blue-700"
          >
            <span>＋</span>
            <span>Add Schedule</span>
          </button>
        ) : null
      }
    >
      {error && (
        <div className="mb-4 rounded-xl bg-red-50 p-3.5 text-xs text-red-700 border border-red-200">
          {error}
        </div>
      )}

      {/* Filter Bar */}
      <div className="mb-6 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px]">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by class, subject, teacher, room..."
              className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 outline-none focus:border-blue-600"
            />
            <span className="absolute left-3 top-2.5 text-slate-400">🔍</span>
          </div>

          {/* Room Filter */}
          <select
            value={selectedRoom}
            onChange={(e) => setSelectedRoom(e.target.value)}
            className="rounded-xl border border-slate-200 p-2 outline-none focus:border-blue-600 bg-white"
          >
            <option value="">All Rooms</option>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} ({r.room_number})
              </option>
            ))}
          </select>

          {/* Term Filter */}
          {terms.length > 0 && (
            <select
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
              className="rounded-xl border border-slate-200 p-2 outline-none focus:border-blue-600 bg-white"
            >
              <option value="">All Terms</option>
              {terms.map((term) => (
                <option key={term} value={term}>
                  {term}
                </option>
              ))}
            </select>
          )}

          {(search || selectedRoom || selectedTerm) && (
            <button
              onClick={() => {
                setSearch('')
                setSelectedRoom('')
                setSelectedTerm('')
              }}
              className="rounded-lg bg-slate-100 px-3 py-1.5 font-semibold text-slate-600 hover:bg-slate-200"
            >
              Reset Filters
            </button>
          )}
        </div>

        <div className="text-slate-500 font-medium">
          Showing <span className="font-bold text-slate-900">{filteredSchedules.length}</span> of {schedules.length} classes
        </div>
      </div>

      {/* Main Timetable View */}
      <TimetableGrid
        schedules={filteredSchedules}
        loading={loading}
        onEdit={
          canManage
            ? (item) => {
                setEditingSchedule(item)
                setIsModalOpen(true)
              }
            : null
        }
        onDelete={canManage ? handleDelete : null}
      />

      {/* Class Schedule Form Modal */}
      {canManage && (
        <ClassScheduleModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSaved={loadSchedules}
          initialData={editingSchedule}
          classSections={classSections}
          rooms={rooms}
          academicYears={academicYears}
          teachers={teachers}
        />
      )}
    </SchedulingLayout>
  )
}
