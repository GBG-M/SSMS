import { useState, useEffect } from 'react'
import FinanceLayout from '../../components/finance/FinanceLayout'
import {
  getInvoices,
  getInvoiceDetail,
  createInvoice,
  deleteInvoice,
  recordPayment,
  getStudentsLookup,
} from '../../services/financeService'

export default function Invoices() {
  const [invoices, setInvoices] = useState([])
  const [students, setStudents] = useState([])
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showPayModal, setShowPayModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // Create Invoice Form State
  const [invoiceForm, setInvoiceForm] = useState({
    student: '',
    due_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    subtotal: '',
    tax: '0.00',
    notes: '',
  })

  // Quick Payment Form State
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    payment_method: 'bank_transfer',
    transaction_reference: '',
    notes: '',
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    setError(null)
    const [invRes, studentsList] = await Promise.all([
      getInvoices(),
      getStudentsLookup(),
    ])

    if (!invRes.ok) {
      setError('Failed to load invoices.')
    } else {
      setInvoices(invRes.data || [])
    }
    setStudents(studentsList || [])
    setLoading(false)
  }

  const handleViewDetails = async (invoiceId) => {
    setDetailLoading(true)
    setError(null)
    const result = await getInvoiceDetail(invoiceId)
    if (result.ok) {
      setSelectedInvoice(result.data)
    } else {
      setError('Failed to load invoice details.')
    }
    setDetailLoading(false)
  }

  const handleCloseDetail = () => {
    setSelectedInvoice(null)
  }

  const handleCreateSubmit = async (e) => {
    e.preventDefault()
    if (!invoiceForm.student || !invoiceForm.subtotal || !invoiceForm.due_date) {
      setError('Please fill in all required fields.')
      return
    }

    setSubmitting(true)
    setError(null)

    const subtotal = parseFloat(invoiceForm.subtotal) || 0
    const tax = parseFloat(invoiceForm.tax) || 0
    const total_amount = subtotal + tax

    const payload = {
      student: invoiceForm.student,
      due_date: invoiceForm.due_date,
      subtotal,
      tax,
      total_amount,
      notes: invoiceForm.notes.trim(),
    }

    const result = await createInvoice(payload)
    if (!result.ok) {
      setError(result.error || 'Failed to generate invoice.')
      setSubmitting(false)
      return
    }

    setSuccess('Invoice generated successfully!')
    setShowCreateModal(false)
    setInvoiceForm({
      student: '',
      due_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      subtotal: '',
      tax: '0.00',
      notes: '',
    })
    await loadData()
    setSubmitting(false)
  }

  const handleOpenPayment = (invoice) => {
    setSelectedInvoice(invoice)
    const balance = parseFloat(invoice.balance || 0)
    setPaymentForm({
      amount: balance > 0 ? balance.toFixed(2) : '0.00',
      payment_method: 'bank_transfer',
      transaction_reference: `TXN-${Date.now().toString().slice(-6)}`,
      notes: `Payment for ${invoice.invoice_number}`,
    })
    setShowPayModal(true)
  }

  const handlePaymentSubmit = async (e) => {
    e.preventDefault()
    if (!selectedInvoice) return

    const amount = parseFloat(paymentForm.amount)
    if (!amount || amount <= 0) {
      setError('Payment amount must be greater than zero.')
      return
    }

    setSubmitting(true)
    setError(null)

    const payload = {
      invoice: selectedInvoice.id,
      student: selectedInvoice.student,
      amount,
      payment_method: paymentForm.payment_method,
      transaction_reference: paymentForm.transaction_reference.trim(),
      notes: paymentForm.notes.trim(),
      status: 'completed',
    }

    const result = await recordPayment(payload)
    if (!result.ok) {
      setError(result.error || 'Failed to record payment.')
      setSubmitting(false)
      return
    }

    setSuccess(`Payment of $${amount.toFixed(2)} recorded successfully!`)
    setShowPayModal(false)
    await loadData()
    if (selectedInvoice) {
      const refreshed = await getInvoiceDetail(selectedInvoice.id)
      if (refreshed.ok) {
        setSelectedInvoice(refreshed.data)
      }
    }
    setSubmitting(false)
  }

  const handleDelete = async (invoiceId) => {
    if (!window.confirm('Are you sure you want to delete this invoice? Related payments may be affected.')) {
      return
    }
    setDeletingId(invoiceId)
    const result = await deleteInvoice(invoiceId)
    if (result.ok) {
      setSuccess('Invoice deleted successfully.')
      if (selectedInvoice && selectedInvoice.id === invoiceId) {
        setSelectedInvoice(null)
      }
      loadData()
    } else {
      setError('Failed to delete invoice.')
    }
    setDeletingId(null)
  }

  // Summary Metrics
  const totals = invoices.reduce(
    (acc, inv) => ({
      total: acc.total + parseFloat(inv.total_amount || 0),
      paid: acc.paid + parseFloat(inv.paid_amount || 0),
      balance: acc.balance + parseFloat(inv.balance || 0),
    }),
    { total: 0, paid: 0, balance: 0 }
  )

  const filteredInvoices = invoices.filter((inv) => {
    const num = (inv.invoice_number || '').toLowerCase()
    const name = (inv.student_name || '').toLowerCase()
    const sId = (inv.student_id_number || '').toLowerCase()
    const search = searchTerm.toLowerCase()

    const matchesSearch = num.includes(search) || name.includes(search) || sId.includes(search)
    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status) => {
    switch (status) {
      case 'paid':
        return 'bg-emerald-100 text-emerald-800'
      case 'overdue':
        return 'bg-rose-100 text-rose-800'
      case 'partial':
        return 'bg-amber-100 text-amber-800'
      case 'pending':
      default:
        return 'bg-blue-100 text-blue-800'
    }
  }

  const headerActions = (
    <button
      onClick={() => {
        setShowCreateModal(true)
        setError(null)
        setSuccess(null)
      }}
      className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-emerald-600/30 transition hover:bg-emerald-700"
    >
      <span>+</span>
      <span>Generate Invoice</span>
    </button>
  )

  return (
    <FinanceLayout
      title="Invoices Management"
      subtitle="Issue student fee invoices, monitor payment schedules, and reconcile outstanding tuition balances."
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
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Invoiced</span>
          <p className="mt-1 text-2xl font-bold text-slate-900">${totals.total.toFixed(2)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Collected Payments</span>
          <p className="mt-1 text-2xl font-bold text-emerald-600">${totals.paid.toFixed(2)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Unpaid Balance</span>
          <p className="mt-1 text-2xl font-bold text-amber-600">${totals.balance.toFixed(2)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Overdue Count</span>
          <p className="mt-1 text-2xl font-bold text-rose-600">
            {invoices.filter((i) => i.status === 'overdue').length}
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="w-full sm:w-80">
          <input
            type="text"
            placeholder="Search invoice #, student name, or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {['all', 'pending', 'partial', 'paid', 'overdue'].map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`capitalize px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                statusFilter === tab
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Invoices List / Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-emerald-600 border-r-transparent mb-2"></div>
            <p>Loading invoices...</p>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <p className="text-base font-semibold">No invoices found.</p>
            <p className="text-xs text-slate-400 mt-1">Generate an invoice or modify your filter settings.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-4">Invoice #</th>
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4">Total Amount</th>
                  <th className="px-6 py-4">Paid</th>
                  <th className="px-6 py-4">Balance</th>
                  <th className="px-6 py-4">Due Date</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredInvoices.map((inv) => {
                  const percentPaid =
                    parseFloat(inv.total_amount) > 0
                      ? Math.min(100, Math.round((parseFloat(inv.paid_amount) / parseFloat(inv.total_amount)) * 100))
                      : 0

                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-6 py-4 font-mono font-bold text-emerald-700">
                        {inv.invoice_number}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">{inv.student_name || '—'}</div>
                        <div className="text-xs text-slate-400">{inv.student_id_number || ''}</div>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-900">
                        ${parseFloat(inv.total_amount).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 font-semibold text-emerald-600">
                        ${parseFloat(inv.paid_amount).toFixed(2)}
                        <span className="ml-1 text-xs text-slate-400 font-normal">({percentPaid}%)</span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-amber-600">
                        ${parseFloat(inv.balance).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {new Date(inv.due_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${getStatusBadge(inv.status)}`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => handleViewDetails(inv.id)}
                            disabled={detailLoading}
                            className="rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
                          >
                            Details
                          </button>
                          {parseFloat(inv.balance) > 0 && (
                            <button
                              onClick={() => handleOpenPayment(inv)}
                              className="rounded-lg px-2.5 py-1 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition shadow-xs"
                            >
                              Pay
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(inv.id)}
                            disabled={deletingId === inv.id}
                            className="rounded-lg p-1 text-slate-400 hover:text-rose-600 transition"
                            title="Delete Invoice"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invoice Detail Modal */}
      {selectedInvoice && !showPayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4 mb-4">
              <div>
                <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">Invoice Statement</span>
                <h3 className="text-xl font-bold font-mono text-slate-900 mt-0.5">
                  {selectedInvoice.invoice_number}
                </h3>
              </div>
              <button
                onClick={handleCloseDetail}
                className="text-slate-400 hover:text-slate-600 font-bold text-xl"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <span className="text-xs text-slate-500">Student</span>
                <p className="font-semibold text-slate-900">{selectedInvoice.student_name}</p>
                <p className="text-xs text-slate-400">{selectedInvoice.student_id_number}</p>
              </div>
              <div>
                <span className="text-xs text-slate-500">Issued Date</span>
                <p className="font-semibold text-slate-900">
                  {new Date(selectedInvoice.issue_date).toLocaleDateString()}
                </p>
              </div>
              <div>
                <span className="text-xs text-slate-500">Due Date</span>
                <p className="font-semibold text-slate-900">
                  {new Date(selectedInvoice.due_date).toLocaleDateString()}
                </p>
              </div>
              <div>
                <span className="text-xs text-slate-500">Status</span>
                <p>
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold capitalize ${getStatusBadge(selectedInvoice.status)}`}>
                    {selectedInvoice.status}
                  </span>
                </p>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="mb-6 rounded-xl border border-slate-200 p-4 space-y-2 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-medium text-slate-900">${parseFloat(selectedInvoice.subtotal || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Tax:</span>
                <span className="font-medium text-slate-900">${parseFloat(selectedInvoice.tax || 0).toFixed(2)}</span>
              </div>
              <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-base text-slate-900">
                <span>Total Amount:</span>
                <span>${parseFloat(selectedInvoice.total_amount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-semibold text-emerald-600">
                <span>Amount Paid:</span>
                <span>${parseFloat(selectedInvoice.paid_amount).toFixed(2)}</span>
              </div>
              <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-amber-600 text-lg">
                <span>Remaining Balance:</span>
                <span>${parseFloat(selectedInvoice.balance).toFixed(2)}</span>
              </div>
            </div>

            {/* Notes if any */}
            {selectedInvoice.notes && (
              <div className="mb-6 p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900">
                <span className="font-semibold">Notes:</span> {selectedInvoice.notes}
              </div>
            )}

            {/* Payments History on this invoice */}
            <div className="mb-6">
              <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-2">Payment History</h4>
              {!selectedInvoice.payments || selectedInvoice.payments.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No payments have been recorded for this invoice yet.</p>
              ) : (
                <div className="rounded-xl border border-slate-200 overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                      <tr>
                        <th className="px-3 py-2">Date</th>
                        <th className="px-3 py-2">Method</th>
                        <th className="px-3 py-2">Reference</th>
                        <th className="px-3 py-2">Amount</th>
                        <th className="px-3 py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedInvoice.payments.map((p) => (
                        <tr key={p.id}>
                          <td className="px-3 py-2">{p.payment_date}</td>
                          <td className="px-3 py-2 capitalize">{p.payment_method}</td>
                          <td className="px-3 py-2 text-slate-500">{p.transaction_reference || '—'}</td>
                          <td className="px-3 py-2 font-bold text-emerald-600">${parseFloat(p.amount).toFixed(2)}</td>
                          <td className="px-3 py-2 capitalize">{p.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex justify-between items-center pt-4 border-t border-slate-100">
              <button
                onClick={handleCloseDetail}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
              >
                Close
              </button>
              {parseFloat(selectedInvoice.balance) > 0 && (
                <button
                  onClick={() => setShowPayModal(true)}
                  className="rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-sm shadow-emerald-600/30 hover:bg-emerald-700 transition"
                >
                  Record Payment
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Invoice Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <h3 className="text-xl font-bold text-slate-900">Generate New Invoice</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-xl"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">
                  Select Student *
                </label>
                <select
                  value={invoiceForm.student}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, student: e.target.value })}
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">
                    Subtotal ($) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={invoiceForm.subtotal}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, subtotal: e.target.value })}
                    required
                    placeholder="0.00"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">
                    Tax ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={invoiceForm.tax}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, tax: e.target.value })}
                    placeholder="0.00"
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
                  value={invoiceForm.due_date}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, due_date: e.target.value })}
                  required
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">
                  Notes / Billing Description
                </label>
                <textarea
                  rows="2"
                  value={invoiceForm.notes}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, notes: e.target.value })}
                  placeholder="Terms, fee items breakdown, or payment instructions..."
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                ></textarea>
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
                  {submitting ? 'Generating...' : 'Generate Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {showPayModal && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Record Payment</h3>
                <p className="text-xs text-slate-500 mt-0.5">Invoice: {selectedInvoice.invoice_number}</p>
              </div>
              <button
                onClick={() => setShowPayModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-xl"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">
                  Payment Amount ($) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  required
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">
                  Payment Method *
                </label>
                <select
                  value={paymentForm.payment_method}
                  onChange={(e) => setPaymentForm({ ...paymentForm, payment_method: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cash">Cash</option>
                  <option value="card">Credit/Debit Card</option>
                  <option value="mobile_money">Mobile Money</option>
                  <option value="cheque">Cheque</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">
                  Transaction Reference
                </label>
                <input
                  type="text"
                  value={paymentForm.transaction_reference}
                  onChange={(e) => setPaymentForm({ ...paymentForm, transaction_reference: e.target.value })}
                  placeholder="e.g. TXN-123456"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPayModal(false)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-sm shadow-emerald-600/30 hover:bg-emerald-700 transition disabled:opacity-50"
                >
                  {submitting ? 'Processing...' : 'Confirm Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </FinanceLayout>
  )
}
