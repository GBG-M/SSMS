import { useEffect, useState } from 'react'
import FinanceLayout from '../../components/finance/FinanceLayout'
import {
  getPayments,
  recordPayment,
  deletePayment,
  getInvoices,
} from '../../services/financeService'

const paymentMethodLabels = {
  cash: 'Cash',
  bank_transfer: 'Bank Transfer',
  mobile_money: 'Mobile Money',
  card: 'Credit/Debit Card',
  cheque: 'Cheque',
}

export default function Payments() {
  const [payments, setPayments] = useState([])
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [methodFilter, setMethodFilter] = useState('all')

  // Modals
  const [showRecordModal, setShowRecordModal] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  // Payment Form State
  const [paymentForm, setPaymentForm] = useState({
    invoice: '',
    amount: '',
    payment_method: 'bank_transfer',
    transaction_reference: '',
    payment_date: new Date().toISOString().split('T')[0],
    notes: '',
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    setError(null)
    const [paymentsRes, invoicesRes] = await Promise.all([
      getPayments(),
      getInvoices(),
    ])

    if (!paymentsRes.ok) {
      setError('Unable to load payment history.')
    } else {
      setPayments(paymentsRes.data || [])
    }

    if (invoicesRes.ok) {
      setInvoices(invoicesRes.data || [])
    }
    setLoading(false)
  }

  const handleInvoiceSelect = (invoiceId) => {
    const inv = invoices.find((i) => i.id === invoiceId)
    if (inv) {
      const balance = parseFloat(inv.balance || inv.total_amount || 0)
      setPaymentForm({
        ...paymentForm,
        invoice: invoiceId,
        amount: balance > 0 ? balance.toFixed(2) : '',
        transaction_reference: `TXN-${Date.now().toString().slice(-6)}`,
      })
    } else {
      setPaymentForm({ ...paymentForm, invoice: invoiceId })
    }
  }

  const handleRecordSubmit = async (e) => {
    e.preventDefault()
    if (!paymentForm.invoice || !paymentForm.amount) {
      setError('Please select an invoice and enter the amount.')
      return
    }

    const amount = parseFloat(paymentForm.amount)
    if (isNaN(amount) || amount <= 0) {
      setError('Payment amount must be greater than zero.')
      return
    }

    setSubmitting(true)
    setError(null)

    const selectedInv = invoices.find((i) => i.id === paymentForm.invoice)

    const payload = {
      invoice: paymentForm.invoice,
      student: selectedInv ? selectedInv.student : undefined,
      amount,
      payment_method: paymentForm.payment_method,
      transaction_reference: paymentForm.transaction_reference.trim() || `TXN-${Date.now().toString().slice(-6)}`,
      payment_date: paymentForm.payment_date,
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
    setShowRecordModal(false)
    setPaymentForm({
      invoice: '',
      amount: '',
      payment_method: 'bank_transfer',
      transaction_reference: '',
      payment_date: new Date().toISOString().split('T')[0],
      notes: '',
    })
    await loadData()
    setSubmitting(false)
  }

  const handleDelete = async (paymentId) => {
    if (!window.confirm('Are you sure you want to delete this payment? The invoice balance will be restored.')) {
      return
    }

    setDeletingId(paymentId)
    const result = await deletePayment(paymentId)
    if (result.ok) {
      setSuccess('Payment record deleted and invoice balance recalculated.')
      loadData()
    } else {
      setError('Failed to delete payment record.')
    }
    setDeletingId(null)
  }

  // Summary Metrics
  const totalCollected = payments
    .filter((p) => p.status === 'completed')
    .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0)

  const filteredPayments = payments.filter((p) => {
    const sName = (p.student_name || '').toLowerCase()
    const sId = (p.student_id_number || '').toLowerCase()
    const ref = (p.transaction_reference || '').toLowerCase()
    const invNum = (p.invoice_number || '').toLowerCase()
    const search = searchTerm.toLowerCase()

    const matchesSearch = sName.includes(search) || sId.includes(search) || ref.includes(search) || invNum.includes(search)
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter
    const matchesMethod = methodFilter === 'all' || p.payment_method === methodFilter

    return matchesSearch && matchesStatus && matchesMethod
  })

  const headerActions = (
    <button
      onClick={() => {
        setShowRecordModal(true)
        setError(null)
        setSuccess(null)
      }}
      className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-emerald-600/30 transition hover:bg-emerald-700"
    >
      <span>+</span>
      <span>Record Payment</span>
    </button>
  )

  return (
    <FinanceLayout
      title="Payments Ledger"
      subtitle="Verify transactions, audit student payment receipts, and track collection channels."
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
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Transactions</span>
          <p className="mt-1 text-2xl font-bold text-slate-900">{payments.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Collected</span>
          <p className="mt-1 text-2xl font-bold text-emerald-600">${totalCollected.toFixed(2)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Completed</span>
          <p className="mt-1 text-2xl font-bold text-blue-600">
            {payments.filter((p) => p.status === 'completed').length}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Pending / Failed</span>
          <p className="mt-1 text-2xl font-bold text-amber-600">
            {payments.filter((p) => p.status !== 'completed').length}
          </p>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="w-full sm:w-80">
          <input
            type="text"
            placeholder="Search reference, student, or invoice..."
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
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>

          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="all">All Payment Channels</option>
            <option value="bank_transfer">Bank Transfer</option>
            <option value="cash">Cash</option>
            <option value="card">Credit/Debit Card</option>
            <option value="mobile_money">Mobile Money</option>
            <option value="cheque">Cheque</option>
          </select>
        </div>
      </div>

      {/* Payments Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-emerald-600 border-r-transparent mb-2"></div>
            <p>Loading payments ledger...</p>
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <p className="text-base font-semibold">No payment records found.</p>
            <p className="text-xs text-slate-400 mt-1">Record a payment or adjust your search filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4">Invoice #</th>
                  <th className="px-6 py-4">Reference</th>
                  <th className="px-6 py-4">Method</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-6 py-4 text-slate-600 whitespace-nowrap">
                      {new Date(payment.payment_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{payment.student_name || '—'}</div>
                      <div className="text-xs text-slate-400">{payment.student_id_number || ''}</div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-emerald-700 font-semibold">
                      {payment.invoice_number || '—'}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-600">
                      {payment.transaction_reference || '—'}
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      {paymentMethodLabels[payment.payment_method] || payment.payment_method}
                    </td>
                    <td className="px-6 py-4 font-bold text-emerald-600 whitespace-nowrap">
                      ${parseFloat(payment.amount).toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${
                          payment.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : payment.status === 'pending'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => setSelectedPayment(payment)}
                          className="rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
                        >
                          Receipt
                        </button>
                        <button
                          onClick={() => handleDelete(payment.id)}
                          disabled={deletingId === payment.id}
                          className="rounded-lg p-1 text-slate-400 hover:text-rose-600 transition disabled:opacity-50"
                          title="Delete payment record"
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

      {/* Record Payment Modal */}
      {showRecordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <h3 className="text-xl font-bold text-slate-900">Record Fee Payment</h3>
              <button
                onClick={() => setShowRecordModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-xl"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRecordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">
                  Select Invoice *
                </label>
                <select
                  value={paymentForm.invoice}
                  onChange={(e) => handleInvoiceSelect(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="">-- Choose Invoice to Pay --</option>
                  {invoices.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.invoice_number} | {inv.student_name} | Balance: ${parseFloat(inv.balance || 0).toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">
                    Amount ($) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                    required
                    placeholder="0.00"
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
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">
                    Payment Date *
                  </label>
                  <input
                    type="date"
                    value={paymentForm.payment_date}
                    onChange={(e) => setPaymentForm({ ...paymentForm, payment_date: e.target.value })}
                    required
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">
                    Transaction Reference
                  </label>
                  <input
                    type="text"
                    value={paymentForm.transaction_reference}
                    onChange={(e) => setPaymentForm({ ...paymentForm, transaction_reference: e.target.value })}
                    placeholder="e.g. TXN-998811"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">
                  Notes
                </label>
                <textarea
                  rows="2"
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                  placeholder="Optional transaction remark..."
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowRecordModal(false)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-sm shadow-emerald-600/30 hover:bg-emerald-700 transition disabled:opacity-50"
                >
                  {submitting ? 'Recording...' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Receipt Modal */}
      {selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 font-bold">
                  ✓
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Payment Receipt</h3>
                  <p className="text-xs text-slate-500">{selectedPayment.transaction_reference}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPayment(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-xl"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-sm mb-6">
              <div className="flex justify-between">
                <span className="text-slate-500">Student:</span>
                <span className="font-semibold text-slate-900">{selectedPayment.student_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Invoice:</span>
                <span className="font-mono text-emerald-700 font-semibold">{selectedPayment.invoice_number || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Date:</span>
                <span className="text-slate-900">{new Date(selectedPayment.payment_date).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Channel:</span>
                <span className="capitalize text-slate-900">
                  {paymentMethodLabels[selectedPayment.payment_method] || selectedPayment.payment_method}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status:</span>
                <span className="capitalize font-semibold text-emerald-600">{selectedPayment.status}</span>
              </div>
              <div className="border-t border-slate-200 pt-2 flex justify-between items-center">
                <span className="font-bold text-slate-700">Amount Paid:</span>
                <span className="text-xl font-bold text-emerald-700">${parseFloat(selectedPayment.amount).toFixed(2)}</span>
              </div>
            </div>

            {selectedPayment.notes && (
              <p className="text-xs text-slate-500 mb-6 italic">
                Notes: {selectedPayment.notes}
              </p>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={() => window.print()}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
              >
                🖨️ Print
              </button>
              <button
                onClick={() => setSelectedPayment(null)}
                className="rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-sm shadow-emerald-600/30 hover:bg-emerald-700 transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </FinanceLayout>
  )
}
