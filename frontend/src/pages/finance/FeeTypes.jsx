import { useState, useEffect } from 'react'
import FinanceLayout from '../../components/finance/FinanceLayout'
import {
  getFeeTypes,
  createFeeType,
  updateFeeType,
  deleteFeeType,
} from '../../services/financeService'

export default function FeeTypes() {
  const [feeTypes, setFeeTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingFeeType, setEditingFeeType] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const initialFormState = {
    name: '',
    category: 'tuition',
    description: '',
    amount: '',
    is_required: true,
    academic_year: '2025/2026',
    is_active: true,
  }

  const [formData, setFormData] = useState(initialFormState)

  useEffect(() => {
    fetchFeeTypes()
  }, [])

  const fetchFeeTypes = async () => {
    setLoading(true)
    setError(null)
    const result = await getFeeTypes()
    if (!result.ok) {
      setError('Failed to load fee types')
    } else {
      setFeeTypes(result.data || [])
    }
    setLoading(false)
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    })
  }

  const handleOpenCreate = () => {
    setEditingFeeType(null)
    setFormData(initialFormState)
    setShowCreateModal(true)
    setError(null)
    setSuccess(null)
  }

  const handleOpenEdit = (feeType) => {
    setEditingFeeType(feeType)
    setFormData({
      name: feeType.name,
      category: feeType.category,
      description: feeType.description || '',
      amount: feeType.amount,
      is_required: feeType.is_required,
      academic_year: feeType.academic_year,
      is_active: feeType.is_active,
    })
    setShowCreateModal(true)
    setError(null)
    setSuccess(null)
  }

  const handleToggleActive = async (feeType) => {
    const result = await updateFeeType(feeType.id, { is_active: !feeType.is_active })
    if (result.ok) {
      setSuccess(`Fee type "${feeType.name}" status updated.`)
      fetchFeeTypes()
    } else {
      setError('Failed to update fee type status.')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name || !formData.amount || !formData.academic_year) {
      setError('Please fill in all required fields.')
      return
    }

    setSubmitting(true)
    setError(null)

    const payload = {
      name: formData.name.trim(),
      category: formData.category,
      description: formData.description.trim(),
      amount: parseFloat(formData.amount),
      is_required: formData.is_required,
      academic_year: formData.academic_year.trim(),
      is_active: formData.is_active,
    }

    let result
    if (editingFeeType) {
      result = await updateFeeType(editingFeeType.id, payload)
    } else {
      result = await createFeeType(payload)
    }

    if (!result.ok) {
      setError(result.error || `Failed to ${editingFeeType ? 'update' : 'create'} fee type.`)
      setSubmitting(false)
      return
    }

    setSuccess(`Fee type ${editingFeeType ? 'updated' : 'created'} successfully!`)
    setShowCreateModal(false)
    setEditingFeeType(null)
    setFormData(initialFormState)
    await fetchFeeTypes()
    setSubmitting(false)
  }

  const handleDelete = async (feeTypeId) => {
    if (!window.confirm('Are you sure you want to delete this fee type? This action cannot be undone.')) {
      return
    }

    setDeletingId(feeTypeId)
    const result = await deleteFeeType(feeTypeId)
    if (result.ok) {
      setSuccess('Fee type deleted successfully.')
      fetchFeeTypes()
    } else {
      setError('Failed to delete fee type. It might be referenced by existing student fees.')
    }
    setDeletingId(null)
  }

  // Filtered fee types
  const filteredFeeTypes = feeTypes.filter((fee) => {
    const matchesSearch =
      fee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fee.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fee.academic_year.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesCategory = categoryFilter === 'all' || fee.category === categoryFilter
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && fee.is_active) ||
      (statusFilter === 'inactive' && !fee.is_active)

    return matchesSearch && matchesCategory && matchesStatus
  })

  // Header action button
  const headerActions = (
    <button
      onClick={handleOpenCreate}
      className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-emerald-600/30 transition hover:bg-emerald-700 focus:outline-none"
    >
      <span>+</span>
      <span>Add Fee Type</span>
    </button>
  )

  return (
    <FinanceLayout
      title="Fee Types Management"
      subtitle="Configure standard school fees, categories, amounts, and academic year schedules."
      actions={headerActions}
    >
      {/* Alert Messages */}
      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700 font-bold ml-4">✕</button>
        </div>
      )}
      {success && (
        <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 flex justify-between items-center">
          <span>{success}</span>
          <button onClick={() => setSuccess(null)} className="text-emerald-500 hover:text-emerald-700 font-bold ml-4">✕</button>
        </div>
      )}

      {/* Metrics Row */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Fee Types</span>
          <p className="mt-1 text-2xl font-bold text-slate-900">{feeTypes.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Active Types</span>
          <p className="mt-1 text-2xl font-bold text-emerald-600">
            {feeTypes.filter((f) => f.is_active).length}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Mandatory Fees</span>
          <p className="mt-1 text-2xl font-bold text-blue-600">
            {feeTypes.filter((f) => f.is_required).length}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Filtered Count</span>
          <p className="mt-1 text-2xl font-bold text-slate-700">{filteredFeeTypes.length}</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="w-full sm:w-80">
          <input
            type="text"
            placeholder="Search fee type name or year..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
        <div className="flex flex-wrap gap-3 w-full sm:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="all">All Categories</option>
            <option value="tuition">Tuition</option>
            <option value="exam">Exam</option>
            <option value="library">Library</option>
            <option value="sports">Sports</option>
            <option value="boarding">Boarding</option>
            <option value="miscellaneous">Miscellaneous</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Fee Types Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-emerald-600 border-r-transparent mb-2"></div>
            <p>Loading fee types...</p>
          </div>
        ) : filteredFeeTypes.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <p className="text-base font-semibold">No fee types found.</p>
            <p className="text-xs text-slate-400 mt-1">Adjust your search or create a new fee type to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-4">Fee Name</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Academic Year</th>
                  <th className="px-6 py-4">Requirement</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredFeeTypes.map((fee) => (
                  <tr key={fee.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      <div>{fee.name}</div>
                      {fee.description && (
                        <div className="text-xs text-slate-400 max-w-xs truncate font-normal mt-0.5">
                          {fee.description}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="capitalize text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md text-xs font-medium">
                        {fee.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-emerald-700">
                      ${parseFloat(fee.amount).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-slate-600">{fee.academic_year}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${
                          fee.is_required
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {fee.is_required ? 'Mandatory' : 'Optional'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleActive(fee)}
                        title="Click to toggle active state"
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold cursor-pointer transition ${
                          fee.is_active
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${fee.is_active ? 'bg-emerald-600' : 'bg-rose-600'}`} />
                        <span>{fee.is_active ? 'Active' : 'Inactive'}</span>
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => handleOpenEdit(fee)}
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-emerald-700 transition"
                          title="Edit Fee Type"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => handleDelete(fee.id)}
                          disabled={deletingId === fee.id}
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition disabled:opacity-50"
                          title="Delete Fee Type"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <h3 className="text-xl font-bold text-slate-900">
                {editingFeeType ? 'Edit Fee Type' : 'Create New Fee Type'}
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-xl"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">
                  Fee Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g. Tuition Fee, Science Lab Fee"
                  required
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">
                    Category *
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="tuition">Tuition</option>
                    <option value="exam">Exam</option>
                    <option value="library">Library</option>
                    <option value="sports">Sports</option>
                    <option value="boarding">Boarding</option>
                    <option value="miscellaneous">Miscellaneous</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">
                    Amount ($) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    name="amount"
                    value={formData.amount}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    required
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">
                  Academic Year *
                </label>
                <input
                  type="text"
                  name="academic_year"
                  value={formData.academic_year}
                  onChange={handleInputChange}
                  placeholder="e.g. 2025/2026"
                  required
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  rows="2"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Optional details or terms of the fee..."
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                ></textarea>
              </div>

              <div className="flex gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_required"
                    checked={formData.is_required}
                    onChange={handleInputChange}
                    className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-sm font-medium text-slate-700">Mandatory Fee</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleInputChange}
                    className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-sm font-medium text-slate-700">Active</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-sm shadow-emerald-600/30 hover:bg-emerald-700 transition disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingFeeType ? 'Update Fee Type' : 'Create Fee Type'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </FinanceLayout>
  )
}
