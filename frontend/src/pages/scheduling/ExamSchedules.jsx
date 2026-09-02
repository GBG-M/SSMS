import { useState, useEffect } from 'react'
import SchedulingLayout from '../../components/scheduling/SchedulingLayout'
import ExamCard from '../../components/scheduling/ExamCard'
import ExamScheduleModal from '../../components/scheduling/ExamScheduleModal'
import {
  fetchExamSchedules,
  fetchRooms,
  fetchClassSectionsLookup,
  fetchAcademicYearsLookup,
  deleteExamSchedule,
} from '../../services/scheduleService'

const EXAM_TYPES = [
  { value: 'ALL', label: 'All Exam Types' },
  { value: 'MIDTERM', label: 'Midterm Exams' },
  { value: 'FINAL', label: 'Final Exams' },
  { value: 'QUIZ', label: 'Quizzes' },
  { value: 'PRACTICAL', label: 'Practical Exams' },
]

export default function ExamSchedules() {
  const [exams, setExams] = useState([])
  const [rooms, setRooms] = useState([])
  const [classSections, setClassSections] = useState([])
  const [academicYears, setAcademicYears] = useState([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Filters
  const [search, setSearch] = useState('')
  const [selectedType, setSelectedType] = useState('ALL')
  const [selectedRoom, setSelectedRoom] = useState('')

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingExam, setEditingExam] = useState(null)

  useEffect(() => {
    loadExams()
    loadLookups()
  }, [])

  async function loadExams() {
    setLoading(true)
    setError('')
    try {
      const res = await fetchExamSchedules()
      const data = res.results || res || []
      setExams(data)
    } catch (err) {
      setError(err.message || 'Failed to load exam schedules.')
    } finally {
      setLoading(false)
    }
  }

  async function loadLookups() {
    try {
      const [roomsRes, sectionsRes, yearsRes] = await Promise.all([
        fetchRooms(),
        fetchClassSectionsLookup(),
        fetchAcademicYearsLookup(),
      ])
      setRooms(roomsRes.results || roomsRes || [])
      setClassSections(sectionsRes)
      setAcademicYears(yearsRes)
    } catch (e) {
      console.warn('Could not load exam lookups:', e)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this exam schedule?')) return
    try {
      await deleteExamSchedule(id)
      loadExams()
    } catch (err) {
      alert(err.message || 'Failed to delete exam.')
    }
  }

  // Filter exams locally
  const filteredExams = exams.filter((e) => {
    const matchesSearch =
      !search ||
      (e.class_section_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (e.subject_code || '').toLowerCase().includes(search.toLowerCase()) ||
      (e.room_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (e.teacher_name || '').toLowerCase().includes(search.toLowerCase())

    const matchesType = selectedType === 'ALL' || e.exam_type === selectedType
    const matchesRoom = !selectedRoom || e.room === selectedRoom || e.room_name === selectedRoom

    return matchesSearch && matchesType && matchesRoom
  })

  return (
    <SchedulingLayout
      title="Exam Schedules"
      subtitle="Track upcoming midterm, final, and practical examination bookings."
      actions={
        <button
          onClick={() => {
            setEditingExam(null)
            setIsModalOpen(true)
          }}
          className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-sm shadow-blue-500/30 transition hover:bg-blue-700"
        >
          <span>＋</span>
          <span>Schedule Exam</span>
        </button>
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
              placeholder="Search by class, room, invigilator..."
              className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 outline-none focus:border-blue-600"
            />
            <span className="absolute left-3 top-2.5 text-slate-400">🔍</span>
          </div>

          {/* Exam Type Select */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="rounded-xl border border-slate-200 p-2 outline-none focus:border-blue-600 bg-white"
          >
            {EXAM_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>

          {/* Room Filter */}
          <select
            value={selectedRoom}
            onChange={(e) => setSelectedRoom(e.target.value)}
            className="rounded-xl border border-slate-200 p-2 outline-none focus:border-blue-600 bg-white"
          >
            <option value="">All Rooms</option>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>

          {(search || selectedType !== 'ALL' || selectedRoom) && (
            <button
              onClick={() => {
                setSearch('')
                setSelectedType('ALL')
                setSelectedRoom('')
              }}
              className="rounded-lg bg-slate-100 px-3 py-1.5 font-semibold text-slate-600 hover:bg-slate-200"
            >
              Reset
            </button>
          )}
        </div>

        <div className="text-slate-500 font-medium">
          Showing <span className="font-bold text-slate-900">{filteredExams.length}</span> of {exams.length} exams
        </div>
      </div>

      {/* Exam Cards Grid */}
      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-col items-center gap-3 text-slate-500">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            <p className="text-sm font-medium">Loading exam schedules...</p>
          </div>
        </div>
      ) : filteredExams.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredExams.map((exam) => (
            <ExamCard
              key={exam.id}
              exam={exam}
              onEdit={(item) => {
                setEditingExam(item)
                setIsModalOpen(true)
              }}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl bg-white p-12 text-center shadow-sm ring-1 ring-slate-200">
          <span className="text-4xl mb-3">📝</span>
          <h3 className="text-lg font-bold text-slate-900">No exam schedules found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm">
            {search || selectedType !== 'ALL' || selectedRoom
              ? 'No exams match your filter criteria. Try resetting filters.'
              : 'There are currently no exams scheduled. Click the button below to schedule one.'}
          </p>
          <button
            onClick={() => {
              setEditingExam(null)
              setIsModalOpen(true)
            }}
            className="mt-4 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            ＋ Schedule First Exam
          </button>
        </div>
      )}

      {/* Exam Modal */}
      <ExamScheduleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSaved={loadExams}
        initialData={editingExam}
        classSections={classSections}
        rooms={rooms}
        academicYears={academicYears}
      />
    </SchedulingLayout>
  )
}
