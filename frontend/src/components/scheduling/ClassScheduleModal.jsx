import { useState, useEffect } from 'react'
import { createClassSchedule, updateClassSchedule, parseApiError } from '../../services/scheduleService'

const DAYS = [
  { value: 'MONDAY', label: 'Monday' },
  { value: 'TUESDAY', label: 'Tuesday' },
  { value: 'WEDNESDAY', label: 'Wednesday' },
  { value: 'THURSDAY', label: 'Thursday' },
  { value: 'FRIDAY', label: 'Friday' },
  { value: 'SATURDAY', label: 'Saturday' },
  { value: 'SUNDAY', label: 'Sunday' },
]

export default function ClassScheduleModal({
  isOpen,
  onClose,
  onSaved,
  initialData = null,
  classSections = [],
  rooms = [],
  academicYears = [],
  teachers = [],
}) {
  const [formData, setFormData] = useState({
    class_section: '',
    room: '',
    teacher: '',
    academic_year: '',
    day_of_week: 'MONDAY',
    start_time: '09:00',
    end_time: '10:00',
    term: 'Term 1',
    notes: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (initialData) {
      setFormData({
        class_section: initialData.class_section || '',
        room: initialData.room || '',
        teacher: initialData.teacher || '',
        academic_year: initialData.academic_year || '',
        day_of_week: initialData.day_of_week || 'MONDAY',
        start_time: initialData.start_time?.slice(0, 5) || '09:00',
        end_time: initialData.end_time?.slice(0, 5) || '10:00',
        term: initialData.term || 'Term 1',
        notes: initialData.notes || '',
      })
    } else {
      setFormData({
        class_section: classSections[0]?.id || '',
        room: rooms[0]?.id || '',
        teacher: teachers[0]?.id || '',
        academic_year: academicYears[0]?.id || '',
        day_of_week: 'MONDAY',
        start_time: '09:00',
        end_time: '10:00',
        term: 'Term 1',
        notes: '',
      })
    }
    setError('')
  }, [initialData, isOpen, classSections, rooms, academicYears, teachers])

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Client-side validation: end time must be after start time
    if (formData.start_time && formData.end_time && formData.start_time >= formData.end_time) {
      setError('End time must be after start time.')
      return
    }

    setSubmitting(true)

    try {
      if (initialData?.id) {
        await updateClassSchedule(initialData.id, formData)
      } else {
        await createClassSchedule(formData)
      }
      onSaved()
      onClose()
    } catch (err) {
      setError(parseApiError(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl ring-1 ring-slate-200">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-lg font-bold text-slate-900">
            {initialData ? 'Edit Class Schedule' : 'Create Class Schedule'}
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-xl bg-red-50 p-3.5 text-xs text-red-700 border border-red-200 flex items-start gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          {/* Class Section & Room */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Class Section *
              </label>
              <select
                required
                value={formData.class_section}
                onChange={(e) => setFormData({ ...formData, class_section: e.target.value })}
                className="w-full rounded-lg border border-slate-300 p-2.5 outline-none focus:border-blue-600 bg-white"
              >
                <option value="">Select Section</option>
                {classSections.map((sec) => (
                  <option key={sec.id} value={sec.id}>
                    {sec.name} ({sec.section_code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Room *
              </label>
              <select
                required
                value={formData.room}
                onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                className="w-full rounded-lg border border-slate-300 p-2.5 outline-none focus:border-blue-600 bg-white"
              >
                <option value="">Select Room</option>
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.room_number})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Teacher & Academic Year */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Teacher
              </label>
              <select
                value={formData.teacher}
                onChange={(e) => setFormData({ ...formData, teacher: e.target.value })}
                className="w-full rounded-lg border border-slate-300 p-2.5 outline-none focus:border-blue-600 bg-white"
              >
                <option value="">Unassigned</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.full_name || t.username}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Academic Year *
              </label>
              <select
                required
                value={formData.academic_year}
                onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}
                className="w-full rounded-lg border border-slate-300 p-2.5 outline-none focus:border-blue-600 bg-white"
              >
                <option value="">Select Year</option>
                {academicYears.map((ay) => (
                  <option key={ay.id} value={ay.id}>
                    {ay.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Day & Term */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Day of Week *
              </label>
              <select
                required
                value={formData.day_of_week}
                onChange={(e) => setFormData({ ...formData, day_of_week: e.target.value })}
                className="w-full rounded-lg border border-slate-300 p-2.5 outline-none focus:border-blue-600 bg-white"
              >
                {DAYS.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Term
              </label>
              <input
                type="text"
                value={formData.term}
                onChange={(e) => setFormData({ ...formData, term: e.target.value })}
                placeholder="e.g. Term 1"
                className="w-full rounded-lg border border-slate-300 p-2.5 outline-none focus:border-blue-600"
              />
            </div>
          </div>

          {/* Time Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Start Time *
              </label>
              <input
                type="time"
                required
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                className="w-full rounded-lg border border-slate-300 p-2.5 outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                End Time *
              </label>
              <input
                type="time"
                required
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                className="w-full rounded-lg border border-slate-300 p-2.5 outline-none focus:border-blue-600"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="e.g. Bring lab materials"
              className="w-full rounded-lg border border-slate-300 p-2.5 outline-none focus:border-blue-600"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-blue-600 px-5 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? 'Saving...' : initialData ? 'Update Schedule' : 'Create Schedule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
