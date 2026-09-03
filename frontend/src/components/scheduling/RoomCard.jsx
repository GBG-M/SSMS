export default function RoomCard({ room, onEdit, onDelete }) {
  return (
    <div className="flex flex-col justify-between rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-1 hover:shadow-md">
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-2xl text-blue-600">
            🏢
          </div>
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              room.is_active
                ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20'
                : 'bg-slate-100 text-slate-500'
            }`}
          >
            {room.is_active ? '● Active' : 'Inactive'}
          </span>
        </div>

        <h3 className="text-lg font-bold text-slate-900">{room.name}</h3>
        <p className="text-xs font-semibold text-blue-600">Room #{room.room_number}</p>

        <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-lg bg-slate-50 p-2.5">
            <span className="text-slate-400 block mb-0.5">Building</span>
            <span className="font-semibold text-slate-800">{room.building || 'Main Campus'}</span>
          </div>
          <div className="rounded-lg bg-slate-50 p-2.5">
            <span className="text-slate-400 block mb-0.5">Capacity</span>
            <span className="font-semibold text-slate-800">{room.capacity} seats</span>
          </div>
        </div>

        {typeof room.total_schedules === 'number' && (
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500 px-1">
            <span>Scheduled Sessions:</span>
            <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
              {room.total_schedules} bookings
            </span>
          </div>
        )}
      </div>

      {(onEdit || onDelete) && (
        <div className="mt-4 flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
          {onEdit && (
            <button
              onClick={() => onEdit(room)}
              className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-blue-600"
            >
              Edit
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(room.id)}
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
