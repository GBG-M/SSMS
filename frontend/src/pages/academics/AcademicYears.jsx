import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  getAcademicYears,
  createAcademicYear,
  updateAcademicYear,
  deleteAcademicYear,
} from '../../services/academicService'

export default function AcademicYears() {
  const [years, setYears] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingYear, setEditingYear] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterActive, setFilterActive] = useState('ALL')
  const [formData, setFormData] = useState({
    name: '',
    start_date: '',
    end_date: '',
    is_active: false,
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    loadAcademicYears()
  }, [])

  async function loadAcademicYears() {
    setLoading(true)
    setError('')
    try {
      const data = await getAcademicYears()
      setYears(data)
    } catch (err) {
      setError(err.message || 'Failed to load academic years')
    } finally {
      setLoading(false)
    }
  }

  function openCreateModal() {
    setEditingYear(null)
    setFormData({
      name: '',
      start_date: '',
      end_date: '',
      is_active: false,
    })
    setError('')
    setModalOpen(true)
  }

  function openEditModal(year) {
    setEditingYear(year)
    setFormData({
      name: year.name,
      start_date: year.start_date,
      end_date: year.end_date,
      is_active: year.is_active,
    })
    setError('')
    setModalOpen(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (formData.start_date > formData.end_date) {
      setError('Start date cannot be after end date.')
      return
    }

    setSubmitting(true)
    setError('')
    try {
      if (editingYear) {
        await updateAcademicYear(editingYear.id, formData)
        setSuccess(`Academic year "${formData.name}" updated successfully.`)
      } else {
        await createAcademicYear(formData)
        setSuccess(`Academic year "${formData.name}" created successfully.`)
      }
      setModalOpen(false)
      loadAcademicYears()
      setTimeout(() => setSuccess(''), 4000)
    } catch (err) {
      setError(err.message || 'Failed to save academic year')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id, name) {
    if (!window.confirm(`Are you sure you want to delete academic year "${name}"? Courses and sections linked to this year cannot be deleted if protected.`)) {
      return
    }
    try {
      await deleteAcademicYear(id)
      setSuccess(`Academic year "${name}" deleted.`)
      loadAcademicYears()
      setTimeout(() => setSuccess(''), 4000)
    } catch (err) {
      setError(err.message || 'Failed to delete academic year')
    }
  }

  async function handleToggleActive(year) {
    try {
      await updateAcademicYear(year.id, {
        ...year,
        is_active: !year.is_active,
      })
      setSuccess(`Academic year "${year.name}" active status updated.`)
      loadAcademicYears()
      setTimeout(() => setSuccess(''), 4000)
    } catch (err) {
      setError(err.message || 'Failed to toggle status')
    }
  }

  const filteredYears = years.filter((year) => {
    const matchesSearch = year.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter =
      filterActive === 'ALL'
        ? true
        : filterActive === 'ACTIVE'
        ? year.is_active
        : !year.is_active
    return matchesSearch && matchesFilter
  })

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <Link to="/academics" className="hover:text-indigo-600 transition">Academics</Link>
                <span>/</span>
                <span className="text-indigo-600">Years</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1 flex items-center gap-2">
                📅 Academic Years & Calendar
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <Link
                to="/academics"
                className="px-4 py-2 border border-slate-300 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                ← Overview
              </Link>
              <button
                onClick={openCreateModal}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition flex items-center gap-2"
              >
                <span>+</span> Add Academic Year
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Alerts */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center justify-between shadow-sm">
            <div className="flex items-center space-x-2">
              <span>⚠️</span>
              <span className="font-medium text-sm">{error}</span>
            </div>
            <button onClick={() => setError('')} className="text-red-500 font-bold hover:text-red-700">✕</button>
          </div>
        )}

        {success && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-xl flex items-center justify-between shadow-sm">
            <div className="flex items-center space-x-2">
              <span>✓</span>
              <span className="font-medium text-sm">{success}</span>
            </div>
            <button onClick={() => setSuccess('')} className="text-emerald-500 font-bold hover:text-emerald-700">✕</button>
          </div>
        )}

        {/* Filter & Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              placeholder="Search year (e.g. 2025/2026)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <span className="absolute left-3 top-2.5 text-slate-400 text-sm">🔍</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <span className="text-xs font-semibold text-slate-500 uppercase">Status:</span>
            {['ALL', 'ACTIVE', 'INACTIVE'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterActive(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  filterActive === status
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Years List */}
        {loading ? (
          <div className="p-12 text-center text-slate-500 animate-pulse">Loading academic years...</div>
        ) : filteredYears.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
            <span className="text-4xl">📅</span>
            <h3 className="text-lg font-bold text-slate-800">No Academic Years Found</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">
              {searchTerm || filterActive !== 'ALL'
                ? 'Try adjusting your search query or filter.'
                : 'Create your first academic year to establish calendars, terms, and course offerings.'}
            </p>
            <button
              onClick={openCreateModal}
              className="mt-2 inline-flex items-center px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl text-sm hover:bg-indigo-700 transition"
            >
              + Create Academic Year
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredYears.map((year) => (
              <div
                key={year.id}
                className={`bg-white rounded-2xl border p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between relative overflow-hidden ${
                  year.is_active ? 'border-indigo-400 ring-2 ring-indigo-100' : 'border-slate-200/80'
                }`}
              >
                {year.is_active && (
                  <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] font-extrabold uppercase px-3 py-0.5 rounded-bl-xl tracking-wider">
                    Current Active Year
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl p-2.5 bg-indigo-50 text-indigo-700 rounded-xl font-bold">
                      📅
                    </span>
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full border ${
                        year.is_active
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {year.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <h3 className="text-xl font-extrabold text-slate-900 mt-4">{year.name}</h3>

                  <div className="mt-4 space-y-2 text-xs text-slate-600 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                    <div className="flex justify-between">
                      <span className="font-semibold text-slate-500">Term Start:</span>
                      <span className="font-mono font-medium text-slate-800">{year.start_date}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold text-slate-500">Term End:</span>
                      <span className="font-mono font-medium text-slate-800">{year.end_date}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleToggleActive(year)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition ${
                      year.is_active
                        ? 'text-amber-700 bg-amber-50 hover:bg-amber-100 border-amber-200'
                        : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200'
                    }`}
                  >
                    {year.is_active ? 'Set Inactive' : 'Set as Active'}
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditModal(year)}
                      className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                      title="Edit Year"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(year.id, year.name)}
                      className="p-1.5 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="Delete Year"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">
                {editingYear ? `Edit Academic Year: ${editingYear.name}` : 'Create Academic Year'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Year Name / Code *
                </label>
                <input
                  type="text"
                  placeholder="e.g. 2025/2026 or 2026-2027"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    End Date *
                  </label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              <div className="p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-indigo-900 block">Set as Primary Active Year</span>
                  <span className="text-[11px] text-indigo-700">Setting this will make other years inactive.</span>
                </div>
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-5 h-5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                />
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-md transition disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingYear ? 'Update Year' : 'Create Year'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

