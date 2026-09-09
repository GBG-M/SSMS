import { useState, useEffect } from 'react'
import FinanceLayout from '../../components/finance/FinanceLayout'
import {
  getStudentFees,
  createStudentFee,
  updateStudentFee,
  deleteStudentFee,
  getFeeTypes,
  getStudentsLookup,
} from '../../services/financeService'

export default function StudentFees() {
  const [fees, setFees] = useState([])
  const [feeTypes, setFeeTypes] = useState([])
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [yearFilter, setYearFilter] = useState('all')

  // Modals
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [editingFee, setEditingFee] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  // Form State for Assigning Fee
  const [assignForm, setAssignForm] = useState({
    student: '',
    fee_type: '',
    amount_due: '',
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    academic_year: '2025/2026',
  })

  useEffect(() => {
    loadAllData()
  }, [])

  const loadAllData = async () => {
    setLoading(true)
    setError(null)

    const [feesRes, typesRes, studentsList] = await Promise.all([
      getStudentFees(),
      getFeeTypes(),
      getStudentsLookup(),
    ])

    if (!feesRes.ok) {
      setError('Failed to load student fee records.')
    } else {
      setFees(feesRes.data || [])
    }

    if (typesRes.ok) {
      setFeeTypes(typesRes.data || [])
    }
    setStudents(studentsList || [])
    setLoading(false)
  }

  const handleFeeTypeChange = (feeTypeId) => {
    const selectedType = feeTypes.find((t) => t.id === feeTypeId)
    if (selectedType) {
      setAssignForm({
        ...assignForm,
        fee_type: feeTypeId,
        amount_due: selectedType.amount,
        academic_year: selectedType.academic_year || assignForm.academic_year,
      })
    } else {
      setAssignForm({ ...assignForm, fee_type: feeTypeId })
    }
  }

  const handleAssignSubmit = async (e) => {
    e.preventDefault()
    if (!assignForm.student || !assignForm.fee_type || !assignForm.amount_due || !assignForm.due_date) {
      setError('Please fill in all required fields.')
      return
    }

    setSubmitting(true)
    setError(null)

    const payload = {
      student: assignForm.student,
      fee_type: assignForm.fee_type,
      amount_due: parseFloat(assignForm.amount_due),
      due_date: assignForm.due_date,
      academic_year: assignForm.academic_year,
    }

    const result = await createStudentFee(payload)
    if (!result.ok) {
      setError(result.error || 'Failed to assign fee to student.')
      setSubmitting(false)
      return
    }

    setSuccess('Fee assigned to student successfully!')
    setShowAssignModal(false)
    setAssignForm({
      student: '',
      fee_type: '',
      amount_due: '',
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      academic_year: '2025/2026',
    })
    await loadAllData()
    setSubmitting(false)
  }

  const handleUpdateStatus = async (feeId, newStatus) => {
    const result = await updateStudentFee(feeId, { status: newStatus })
    if (result.ok) {
      setSuccess(`Fee status updated to ${newStatus}.`)
      loadAllData()
    } else {
      setError('Failed to update fee status.')
    }
  }

  const handleDelete = async (feeId) => {
    if (!window.confirm('Are you sure you want to delete this fee record?')) return
    setDeletingId(feeId)
    const result = await deleteStudentFee(feeId)
    if (result.ok) {
      setSuccess('Student fee record removed.')
      loadAllData()
    } else {
      setError('Failed to delete fee record.')
    }
    setDeletingId(null)
  }

  // Calculate Summary
  const totals = fees.reduce(
    (acc, f) => ({
      due: acc.due + parseFloat(f.amount_due || 0),
      paid: acc.paid + parseFloat(f.amount_paid || 0),
      outstanding: acc.outstanding + parseFloat(f.outstanding_balance || 0),
    }),
    { due: 0, paid: 0, outstanding: 0 }
  )

  const uniqueYears = [...new Set(fees.map((f) => f.academic_year).filter(Boolean))]

  const filteredFees = fees.filter((f) => {
    const sName = (f.student_name || '').toLowerCase()
    const sId = (f.student_id_number || '').toLowerCase()
    const fName = (f.fee_name || '').toLowerCase()
    const search = searchTerm.toLowerCase()

    const matchesSearch = sName.includes(search) || sId.includes(search) || fName.includes(search)
    const matchesStatus = statusFilter === 'all' || f.status === statusFilter
    const matchesYear = yearFilter === 'all' || f.academic_year === yearFilter

    return matchesSearch && matchesStatus && matchesYear
  })

  const getStatusBadge = (status) => {
    switch (status) {
      case 'paid':
        return 'bg-emerald-100 text-emerald-800'
      case 'overdue':
        return 'bg-rose-100 text-rose-800'
      case 'partial':
        return 'bg-amber-100 text-amber-800'
      case 'waived':
        return 'bg-purple-100 text-purple-800'
      case 'pending':
      default:
        return 'bg-blue-100 text-blue-800'
    }
  }

  const headerActions = (
    <button
      onClick={() => {
        setShowAssignModal(true)
        setError(null)
        setSuccess(null)
      }}
      className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-emerald-600/30 transition hover:bg-emerald-700"
    >
      <span>+</span>
      <span>Assign Fee</span>
    </button>
  )

  return (
    <FinanceLayout
      title="Student Fees Management"
      subtitle="Track, assign, and reconcile student tuition, laboratory, and miscellaneous fee commitments."
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
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Billed</span>
          <p className="mt-1 text-2xl font-bold text-slate-900">${totals.due.toFixed(2)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Paid</span>
          <p className="mt-1 text-2xl font-bold text-emerald-600">${totals.paid.toFixed(2)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Outstanding Balance</span>
          <p className="mt-1 text-2xl font-bold text-amber-600">${totals.outstanding.toFixed(2)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Overdue / Waived</span>
          <p className="mt-1 text-2xl font-bold text-rose-600">
            {fees.filter((f) => f.status === 'overdue').length} / {fees.filter((f) => f.status === 'waived').length}
          </p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="w-full sm:w-80">
          <input
            type="text"
            placeholder="Search student, student ID, or fee..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
        <div className="flex flex-wrap gap-3 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="partial">Partial</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
            <option value="waived">Waived</option>
          </select>

          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="all">All Academic Years</option>
            {uniqueYears.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Fees Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-emerald-600 border-r-transparent mb-2"></div>
            <p>Loading student fees...</p>
          </div>
        ) : filteredFees.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <p className="text-base font-semibold">No student fees found.</p>
            <p className="text-xs text-slate-400 mt-1">Assign a fee to a student or adjust your filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4">Fee Name</th>
                  <th className="px-6 py-4">Amount Due</th>
                  <th className="px-6 py-4">Paid</th>
                  <th className="px-6 py-4">Balance</th>
                  <th className="px-6 py-4">Due Date</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredFees.map((fee) => (
                  <tr key={fee.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{fee.student_name || '—'}</div>
                      <div className="text-xs text-slate-400">{fee.student_id_number || ''}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-800">{fee.fee_name || '—'}</div>
                      <div className="text-xs text-slate-400">{fee.academic_year}</div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      ${parseFloat(fee.amount_due).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 font-semibold text-emerald-600">
                      ${parseFloat(fee.amount_paid).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 font-semibold text-amber-600">
                      ${parseFloat(fee.outstanding_balance).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {new Date(fee.due_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${getStatusBadge(fee.status)}`}>
                        {fee.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-2">
                        {fee.status !== 'waived' && fee.status !== 'paid' && (
                          <button
                            onClick={() => handleUpdateStatus(fee.id, 'waived')}
                            className="text-xs font-medium text-purple-600 hover:text-purple-800 transition px-2 py-1 bg-purple-50 rounded-lg hover:bg-purple-100"
                            title="Mark fee as waived"
                          >
                            Waive
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(fee.id)}
                          disabled={deletingId === fee.id}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition disabled:opacity-50"
                          title="Delete fee record"
                        >
                          🗑️
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

      {/* Assign Fee Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <h3 className="text-xl font-bold text-slate-900">Assign Fee to Student</h3>
              <button
                onClick={() => setShowAssignModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-xl"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAssignSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">
                  Select Student *
                </label>
                <select
                  value={assignForm.student}
                  onChange={(e) => setAssignForm({ ...assignForm, student: e.target.value })}
                  required
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="">-- Choose Student --</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.full_name || `${s.first_name} ${s.last_name}`} ({s.student_id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">
                  Select Fee Type *
                </label>
                <select
                  value={assignForm.fee_type}
                  onChange={(e) => handleFeeTypeChange(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="">-- Choose Fee Type --</option>
                  {feeTypes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} (${parseFloat(t.amount).toFixed(2)}) - {t.academic_year}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">
                    Amount Due ($) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={assignForm.amount_due}
                    onChange={(e) => setAssignForm({ ...assignForm, amount_due: e.target.value })}
                    required
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">
                    Academic Year *
                  </label>
                  <input
                    type="text"
                    value={assignForm.academic_year}
                    onChange={(e) => setAssignForm({ ...assignForm, academic_year: e.target.value })}
                    required
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">
                  Due Date *
                </label>
                <input
                  type="date"
                  value={assignForm.due_date}
                  onChange={(e) => setAssignForm({ ...assignForm, due_date: e.target.value })}
                  required
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-sm shadow-emerald-600/30 hover:bg-emerald-700 transition disabled:opacity-50"
                >
                  {submitting ? 'Assigning...' : 'Assign Fee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </FinanceLayout>
  )
}
