export default function ExamCard({ exam, onEdit, onDelete }) {
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

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    try {
      const d = new Date(dateStr)
      return d.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    } catch {
      return dateStr
    }
  }

  const getDaysRemaining = (dateStr) => {
    if (!dateStr) return null
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const target = new Date(dateStr)
    target.setHours(0, 0, 0, 0)
    const diff = Math.round((target - today) / (1000 * 60 * 60 * 24))
    if (diff < 0) return { label: 'Completed', color: 'bg-slate-100 text-slate-500' }
    if (diff === 0) return { label: 'Today! ⚠️', color: 'bg-red-100 text-red-700 font-bold animate-pulse' }
    if (diff === 1) return { label: 'Tomorrow', color: 'bg-amber-100 text-amber-700 font-semibold' }
    return { label: `In ${diff} days`, color: 'bg-blue-50 text-blue-700' }
  }

  const typeColors = {
    FINAL: 'bg-rose-600 text-white',
    MIDTERM: 'bg-purple-600 text-white',
    QUIZ: 'bg-amber-500 text-white',
    PRACTICAL: 'bg-emerald-600 text-white',
  }

  const remaining = getDaysRemaining(exam.exam_date)

  return (
    <div className="relative flex flex-col justify-between rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-1 hover:shadow-md">
      <div>
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className={`rounded-md px-2.5 py-1 text-xs font-bold uppercase tracking-wider ${typeColors[exam.exam_type] || 'bg-slate-800 text-white'}`}>
            {exam.exam_type}
          </span>
          {remaining && (
            <span className={`rounded-full px-2.5 py-0.5 text-xs ${remaining.color}`}>
              {remaining.label}
            </span>
          )}
        </div>

        {/* Section & Subject */}
        <h3 className="text-lg font-bold text-slate-900 leading-tight">
          {exam.class_section_name || 'Exam'}
        </h3>
        {exam.subject_code && (
          <p className="text-xs font-medium text-slate-500 mt-0.5">
            Subject: {exam.subject_code}
          </p>
        )}

        {/* Date & Time Highlights */}
        <div className="mt-4 rounded-xl bg-slate-50 p-3 space-y-2 text-xs border border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">📅</span>
            <span className="font-semibold text-slate-800">{formatDate(exam.exam_date)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">⏰</span>
            <span className="font-medium text-slate-700">
              {formatTime(exam.start_time)} – {formatTime(exam.end_time)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">📍</span>
            <span className="font-semibold text-blue-700">{exam.room_name || 'Room Unassigned'}</span>
          </div>
        </div>

        {exam.teacher_name && (
          <p className="mt-3 text-xs text-slate-500">
            Invigilator / Teacher: <span className="font-medium text-slate-700">{exam.teacher_name}</span>
          </p>
        )}

        {exam.notes && (
          <p className="mt-2 text-xs italic text-slate-400 line-clamp-2">
            Notes: {exam.notes}
          </p>
        )}
      </div>

      {/* Actions */}
      {(onEdit || onDelete) && (
        <div className="mt-4 flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
          {onEdit && (
            <button
              onClick={() => onEdit(exam)}
              className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-blue-600"
            >
              Edit
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(exam.id)}
              className="rounded-lg border border-red-200 px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
            >
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  )
}
