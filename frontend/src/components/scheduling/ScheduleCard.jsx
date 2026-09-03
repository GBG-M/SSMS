export default function ScheduleCard({ schedule, onEdit, onDelete }) {
  const formatTime = (timeStr) => {
    if (!timeStr) return ''
    try {
      const [hours, minutes] = timeStr.split(':')
      const hour = parseInt(hours, 10)
      const ampm = hour >= 12 ? 'PM' : 'AM'
      const formattedHour = hour % 12 || 12
      return `${formattedHour}:${minutes} ${ampm}`
    } catch {
      return timeStr
    }
  }

  // Generate consistent color badge based on subject code
  const getBadgeColor = (str = '') => {
    const colors = [
      'bg-blue-100 text-blue-700 border-blue-200',
      'bg-indigo-100 text-indigo-700 border-indigo-200',
      'bg-purple-100 text-purple-700 border-purple-200',
      'bg-emerald-100 text-emerald-700 border-emerald-200',
      'bg-amber-100 text-amber-700 border-amber-200',
      'bg-rose-100 text-rose-700 border-rose-200',
    ]
    let hash = 0
    for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash)
    return colors[Math.abs(hash) % colors.length]
  }

  const badgeColor = getBadgeColor(schedule.subject_code || schedule.class_section_name)

  return (
    <div className="group relative flex flex-col justify-between rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200/80 transition hover:-translate-y-0.5 hover:shadow-md hover:ring-blue-300">
      <div>
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-bold ${badgeColor}`}>
            {schedule.subject_code || 'CLASS'}
          </span>
          <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
            {schedule.term || 'Term 1'}
          </span>
        </div>

        {/* Title */}
        <h4 className="text-base font-bold text-slate-900 leading-snug">
          {schedule.class_section_name || 'Class Section'}
        </h4>

        {/* Time Badge */}
        <div className="mt-2.5 flex items-center gap-1.5 text-xs font-semibold text-blue-600 bg-blue-50/80 rounded-lg px-2.5 py-1.5 w-fit">
          <span>⏰</span>
          <span>{formatTime(schedule.start_time)} – {formatTime(schedule.end_time)}</span>
        </div>

        {/* Details Grid */}
        <div className="mt-3 space-y-1.5 text-xs text-slate-600">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">📍</span>
            <span className="font-medium text-slate-700">{schedule.room_name || 'Room Unassigned'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">👤</span>
            <span className="text-slate-600">{schedule.teacher_name || 'Teacher Unassigned'}</span>
          </div>
        </div>

        {schedule.notes && (
          <p className="mt-2 text-xs italic text-slate-400 line-clamp-1 border-t border-slate-100 pt-2">
            "{schedule.notes}"
          </p>
        )}
      </div>

      {/* Action Buttons (Optional) */}
      {(onEdit || onDelete) && (
        <div className="mt-3 flex items-center justify-end gap-1.5 border-t border-slate-100 pt-2">
          {onEdit && (
            <button
              onClick={() => onEdit(schedule)}
              className="rounded p-1 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-blue-600"
              title="Edit Schedule"
            >
              ✏️ Edit
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(schedule.id)}
              className="rounded p-1 text-xs font-medium text-slate-600 hover:bg-red-50 hover:text-red-600"
              title="Delete Schedule"
            >
              🗑️ Delete
            </button>
          )}
        </div>
      )}
    </div>
  )
}
