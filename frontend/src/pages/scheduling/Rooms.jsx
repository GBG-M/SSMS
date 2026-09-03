import { useState, useEffect } from 'react'
import SchedulingLayout from '../../components/scheduling/SchedulingLayout'
import RoomCard from '../../components/scheduling/RoomCard'
import RoomModal from '../../components/scheduling/RoomModal'
import { fetchRooms, deleteRoom } from '../../services/scheduleService'
import { getCurrentUserProfile, hasSchedulingPermission } from '../../services/authService'

export default function Rooms() {
  const [currentUser, setCurrentUser] = useState(null)
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Filters
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL') // 'ALL', 'ACTIVE', 'INACTIVE'
  const [minCapacity, setMinCapacity] = useState('')

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRoom, setEditingRoom] = useState(null)

  const canManage = hasSchedulingPermission(currentUser)

  useEffect(() => {
    loadUser()
    loadRooms()
  }, [])

  async function loadUser() {
    const profile = await getCurrentUserProfile()
    setCurrentUser(profile)
  }

  async function loadRooms() {
    setLoading(true)
    setError('')
    try {
      const data = await fetchRooms({}, true)
      setRooms(data)
    } catch (err) {
      setError(err.message || 'Failed to load rooms.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this room? This may affect linked schedules.')) return
    try {
      await deleteRoom(id)
      setRooms((prev) => prev.filter((r) => r.id !== id))
    } catch (err) {
      alert(err.message || 'Failed to delete room.')
    }
  }

  const filteredRooms = rooms.filter((r) => {
    const matchesSearch =
      !search ||
      (r.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (r.room_number || '').toLowerCase().includes(search.toLowerCase()) ||
      (r.building || '').toLowerCase().includes(search.toLowerCase())

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && r.is_active) ||
      (statusFilter === 'INACTIVE' && !r.is_active)

    const matchesCapacity = !minCapacity || r.capacity >= parseInt(minCapacity, 10)

    return matchesSearch && matchesStatus && matchesCapacity
  })

  return (
    <SchedulingLayout
      title="Campus Rooms"
      subtitle="Manage lecture halls, laboratory spaces, capacity limitations, and room availability."
      actions={
        canManage ? (
          <button
            onClick={() => {
              setEditingRoom(null)
              setIsModalOpen(true)
            }}
            className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-sm shadow-blue-500/30 transition hover:bg-blue-700"
          >
            <span>＋</span>
            <span>Add Room</span>
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
              placeholder="Search by room name, number, building..."
              className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 outline-none focus:border-blue-600"
            />
            <span className="absolute left-3 top-2.5 text-slate-400">🔍</span>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 p-2 outline-none focus:border-blue-600 bg-white"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active Rooms Only</option>
            <option value="INACTIVE">Inactive Rooms Only</option>
          </select>

          {/* Min Capacity Filter */}
          <input
            type="number"
            min="0"
            value={minCapacity}
            onChange={(e) => setMinCapacity(e.target.value)}
            placeholder="Min seats..."
            className="w-28 rounded-xl border border-slate-200 p-2 outline-none focus:border-blue-600"
          />

          {(search || statusFilter !== 'ALL' || minCapacity) && (
            <button
              onClick={() => {
                setSearch('')
                setStatusFilter('ALL')
                setMinCapacity('')
              }}
              className="rounded-lg bg-slate-100 px-3 py-1.5 font-semibold text-slate-600 hover:bg-slate-200"
            >
              Reset
            </button>
          )}
        </div>

        <div className="text-slate-500 font-medium">
          Showing <span className="font-bold text-slate-900">{filteredRooms.length}</span> of {rooms.length} rooms
        </div>
      </div>

      {/* Room Grid */}
      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-col items-center gap-3 text-slate-500">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            <p className="text-sm font-medium">Loading campus rooms...</p>
          </div>
        </div>
      ) : filteredRooms.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredRooms.map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              onEdit={
                canManage
                  ? (item) => {
                      setEditingRoom(item)
                      setIsModalOpen(true)
                    }
                  : null
              }
              onDelete={canManage ? handleDelete : null}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl bg-white p-12 text-center shadow-sm ring-1 ring-slate-200">
          <span className="text-4xl mb-3">🏢</span>
          <h3 className="text-lg font-bold text-slate-900">No rooms found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm">
            {search || statusFilter !== 'ALL' || minCapacity
              ? 'No rooms match your filter criteria. Try resetting filters.'
              : 'There are no campus rooms configured yet.'}
          </p>
          {canManage && (
            <button
              onClick={() => {
                setEditingRoom(null)
                setIsModalOpen(true)
              }}
              className="mt-4 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700"
            >
              ＋ Add First Room
            </button>
          )}
        </div>
      )}

      {/* Room Modal */}
      {canManage && (
        <RoomModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSaved={loadRooms}
          initialData={editingRoom}
        />
      )}
    </SchedulingLayout>
  )
}
