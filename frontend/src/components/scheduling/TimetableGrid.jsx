import { useState } from 'react'
import ScheduleCard from './ScheduleCard'

const DAYS = [
  { key: 'MONDAY', label: 'Monday' },
  { key: 'TUESDAY', label: 'Tuesday' },
  { key: 'WEDNESDAY', label: 'Wednesday' },
  { key: 'THURSDAY', label: 'Thursday' },
  { key: 'FRIDAY', label: 'Friday' },
  { key: 'SATURDAY', label: 'Saturday' },
  { key: 'SUNDAY', label: 'Sunday' },
]

export default function TimetableGrid({
  schedules = [],
  loading = false,
  onEdit,
  onDelete,
}) {
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'list'
  const [selectedDay, setSelectedDay] = useState('ALL')
  const [includeWeekends, setIncludeWeekends] = useState(false)

  const activeDays = includeWeekends ? DAYS : DAYS.slice(0, 5)

  // Group schedules by day of week
  const schedulesByDay = activeDays.reduce((acc, day) => {
    acc[day.key] = schedules
      .filter((s) => s.day_of_week === day.key)
      .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''))
    return acc
  }, {})

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="text-sm font-medium">Loading schedule timetable...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-3.5 shadow-sm ring-1 ring-slate-200">
        {/* Left Day Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setSelectedDay('ALL')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              selectedDay === 'ALL'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Days ({schedules.length})
          </button>
          {activeDays.map((d) => {
            const count = (schedulesByDay[d.key] || []).length
            return (
              <button
                key={d.key}
                onClick={() => setSelectedDay(d.key)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  selectedDay === d.key
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {d.label} {count > 0 && <span className="opacity-75">({count})</span>}
              </button>
            )
          })}
        </div>

        {/* Right Options */}
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs font-medium text-slate-600 cursor-pointer">
            <input
              type="checkbox"
              checked={includeWeekends}
              onChange={(e) => setIncludeWeekends(e.target.checked)}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span>Include Weekends</span>
          </label>

          <div className="flex rounded-lg bg-slate-100 p-0.5">
            <button
              onClick={() => setViewMode('grid')}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                viewMode === 'grid'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              📅 Week Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                viewMode === 'list'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              📋 List View
            </button>
          </div>
        </div>
      </div>

      {/* VIEW: Weekly Grid */}
      {viewMode === 'grid' && selectedDay === 'ALL' ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {activeDays.map((day) => {
            const daySchedules = schedulesByDay[day.key] || []
            return (
              <div
                key={day.key}
                className="flex flex-col rounded-2xl bg-slate-50/70 p-3 ring-1 ring-slate-200/80"
              >
                {/* Day Header */}
                <div className="mb-3 flex items-center justify-between border-b border-slate-200/80 pb-2 px-1">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                    {day.label}
                  </h3>
                  <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-bold text-slate-700">
                    {daySchedules.length}
                  </span>
                </div>

                {/* Day Class Cards */}
                <div className="space-y-3 flex-1">
                  {daySchedules.length > 0 ? (
                    daySchedules.map((schedule) => (
                      <ScheduleCard
                        key={schedule.id}
                        schedule={schedule}
                        onEdit={onEdit}
                        onDelete={onDelete}
                      />
                    ))
                  ) : (
                    <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                      No classes scheduled
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* VIEW: Filtered Day or List View */
        <div className="space-y-6">
          {activeDays
            .filter((d) => selectedDay === 'ALL' || d.key === selectedDay)
            .map((day) => {
              const daySchedules = schedulesByDay[day.key] || []
              if (selectedDay === 'ALL' && daySchedules.length === 0) return null

              return (
                <div key={day.key} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
                  <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-sm font-bold text-blue-700">
                        {day.label.slice(0, 2)}
                      </div>
                      <h3 className="text-lg font-bold text-slate-900">{day.label}</h3>
                    </div>
                    <span className="text-xs font-semibold text-slate-500">
                      {daySchedules.length} {daySchedules.length === 1 ? 'class' : 'classes'}
                    </span>
                  </div>

                  {daySchedules.length > 0 ? (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {daySchedules.map((schedule) => (
                        <ScheduleCard
                          key={schedule.id}
                          schedule={schedule}
                          onEdit={onEdit}
                          onDelete={onDelete}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="py-8 text-center text-sm text-slate-400">
                      No classes scheduled for {day.label}.
                    </p>
                  )}
                </div>
              )
            })}
        </div>
      )}
    </div>
  )
}
