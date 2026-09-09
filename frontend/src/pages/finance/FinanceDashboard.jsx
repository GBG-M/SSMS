import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import FinanceLayout from '../../components/finance/FinanceLayout'
import {
  getStudentFees,
  getInvoices,
  getPayments,
  getFeeTypes,
  getInvoiceDetail,
} from '../../services/financeService'

export default function FinanceDashboard() {
  const [studentFees, setStudentFees] = useState([])
  const [invoices, setInvoices] = useState([])
  const [payments, setPayments] = useState([])
  const [feeTypes, setFeeTypes] = useState([])
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setLoading(true)
    setError(null)

    const [feesRes, invRes, payRes, typesRes] = await Promise.all([
      getStudentFees(),
      getInvoices(),
      getPayments(),
      getFeeTypes(),
    ])

    if (!feesRes.ok && !invRes.ok) {
      setError('Failed to load finance data.')
    } else {
      setStudentFees(feesRes.data || [])
      setInvoices(invRes.data || [])
      setPayments(payRes.data || [])
      setFeeTypes(typesRes.data || [])
    }
    setLoading(false)
  }

  const handleViewInvoice = async (invoiceId) => {
    const res = await getInvoiceDetail(invoiceId)
    if (res.ok) {
      setSelectedInvoice(res.data)
    }
  }

  // Calculate Aggregates
  const totalInvoiced = invoices.reduce((sum, inv) => sum + parseFloat(inv.total_amount || 0), 0)
  const totalCollected = invoices.reduce((sum, inv) => sum + parseFloat(inv.paid_amount || 0), 0)
  const outstandingBalance = Math.max(0, totalInvoiced - totalCollected)
  const collectionRate = totalInvoiced > 0 ? Math.round((totalCollected / totalInvoiced) * 100) : 100

  const overdueCount = invoices.filter((i) => i.status === 'overdue').length
  const pendingCount = invoices.filter((i) => i.status === 'pending').length
  const paidCount = invoices.filter((i) => i.status === 'paid').length
  const partialCount = invoices.filter((i) => i.status === 'partial').length

  const headerActions = (
    <div className="flex items-center gap-2">
      <Link
        to="/finance/invoices"
        className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-white shadow-sm shadow-emerald-600/30 hover:bg-emerald-700 transition"
      >
        <span>+</span>
        <span>New Invoice</span>
      </Link>
      <Link
        to="/finance/payments"
        className="inline-flex items-center gap-1.5 rounded-xl bg-white border border-slate-300 px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
      >
        <span>Record Payment</span>
      </Link>
    </div>
  )

  const quickNavCards = [
    {
      title: 'Fee Types',
      desc: 'Set tuition rates, laboratory, library & exam fee structures.',
      path: '/finance/fee-types',
      icon: '🏷️',
      badge: `${feeTypes.length} configured`,
      color: 'from-blue-500 to-indigo-600',
    },
    {
      title: 'Student Fees',
      desc: 'Manage individual student allocations, dues & balance adjustments.',
      path: '/finance/student-fees',
      icon: '🎓',
      badge: `${studentFees.length} fee records`,
      color: 'from-emerald-500 to-teal-600',
    },
    {
      title: 'Invoices',
      desc: 'Generate formal billing statements and monitor settlement dates.',
      path: '/finance/invoices',
      icon: '📄',
      badge: `${invoices.length} issued`,
      color: 'from-amber-500 to-orange-600',
    },
    {
      title: 'Payments Ledger',
      desc: 'Review settled receipts, payment methods, and bank reconciliations.',
      path: '/finance/payments',
      icon: '💳',
      badge: `${payments.length} transactions`,
      color: 'from-purple-500 to-violet-600',
    },
  ]

  return (
    <FinanceLayout
      title="Financial Overview & Analytics"
      subtitle="Comprehensive dashboard of tuition billings, fee structures, receipts, and outstanding accounts receivable."
      actions={headerActions}
    >
      {/* Alert Messages */}
      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700 font-bold ml-4">✕</button>
        </div>
      )}

      {/* KPI Cards Row */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Invoiced */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Billed</span>
            <span className="rounded-lg bg-blue-50 p-2 text-blue-600">📊</span>
          </div>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            ${totalInvoiced.toFixed(2)}
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
            <span>{invoices.length} total invoices issued</span>
          </div>
        </div>

        {/* Total Collected */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Collected</span>
            <span className="rounded-lg bg-emerald-50 p-2 text-emerald-600">✓</span>
          </div>
          <p className="mt-2 text-3xl font-bold tracking-tight text-emerald-600">
            ${totalCollected.toFixed(2)}
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
            <span className="font-semibold text-emerald-600">{collectionRate}%</span> collection efficiency
          </div>
        </div>

        {/* Outstanding Balance */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Receivables</span>
            <span className="rounded-lg bg-amber-50 p-2 text-amber-600">⏳</span>
          </div>
          <p className="mt-2 text-3xl font-bold tracking-tight text-amber-600">
            ${outstandingBalance.toFixed(2)}
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
            <span>{partialCount + pendingCount} unpaid or partial accounts</span>
          </div>
        </div>

        {/* Overdue Items */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Overdue Invoices</span>
            <span className="rounded-lg bg-rose-50 p-2 text-rose-600">⚠️</span>
          </div>
          <p className={`mt-2 text-3xl font-bold tracking-tight ${overdueCount > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
            {overdueCount}
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
            <span>Past due date settlement</span>
          </div>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="mb-8">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3">Finance Modules</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickNavCards.map((card) => (
            <Link
              key={card.title}
              to={card.path}
              className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-emerald-500/50 transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl">{card.icon}</span>
                  <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                    {card.badge}
                  </span>
                </div>
                <h4 className="text-base font-bold text-slate-900 group-hover:text-emerald-600 transition">
                  {card.title}
                </h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{card.desc}</p>
              </div>
              <div className="mt-4 flex items-center text-xs font-semibold text-emerald-600 group-hover:translate-x-1 transition-transform">
                Open module →
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Two Column Layout: Recent Invoices & Recent Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Recent Invoices */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center">
            <div>
              <h3 className="text-base font-bold text-slate-900">Recent Invoices</h3>
              <p className="text-xs text-slate-500">Latest billing records</p>
            </div>
            <Link
              to="/finance/invoices"
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
            >
              View all ({invoices.length}) →
            </Link>
          </div>

          {invoices.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">No invoices found.</div>
          ) : (
            <div className="divide-y divide-slate-100 text-xs sm:text-sm">
              {invoices.slice(0, 5).map((inv) => (
                <div key={inv.id} className="p-4 flex items-center justify-between hover:bg-slate-50/80 transition">
                  <div>
                    <div className="font-mono font-bold text-emerald-700">{inv.invoice_number}</div>
                    <div className="text-slate-600 font-medium">{inv.student_name}</div>
                    <div className="text-xs text-slate-400">Due: {new Date(inv.due_date).toLocaleDateString()}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-slate-900">${parseFloat(inv.total_amount).toFixed(2)}</div>
                    <div className="text-xs font-semibold text-emerald-600">
                      Paid: ${parseFloat(inv.paid_amount).toFixed(2)}
                    </div>
                    <button
                      onClick={() => handleViewInvoice(inv.id)}
                      className="mt-1 text-xs text-blue-600 hover:underline"
                    >
                      Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Payments */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center">
            <div>
              <h3 className="text-base font-bold text-slate-900">Recent Transactions</h3>
              <p className="text-xs text-slate-500">Settled receipts & channel audits</p>
            </div>
            <Link
              to="/finance/payments"
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
            >
              View all ({payments.length}) →
            </Link>
          </div>

          {payments.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">No payments recorded yet.</div>
          ) : (
            <div className="divide-y divide-slate-100 text-xs sm:text-sm">
              {payments.slice(0, 5).map((p) => (
                <div key={p.id} className="p-4 flex items-center justify-between hover:bg-slate-50/80 transition">
                  <div>
                    <div className="font-semibold text-slate-900">{p.student_name || 'Student'}</div>
                    <div className="text-xs text-slate-400">
                      {p.transaction_reference || p.payment_date} • <span className="capitalize">{p.payment_method}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-emerald-600">${parseFloat(p.amount).toFixed(2)}</div>
                    <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800 capitalize">
                      {p.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Invoice Detail Modal if opened from Dashboard */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div>
                <h3 className="text-lg font-bold font-mono text-slate-900">{selectedInvoice.invoice_number}</h3>
                <p className="text-xs text-slate-500">Student: {selectedInvoice.student_name}</p>
              </div>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-xl"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-sm bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6">
              <div className="flex justify-between">
                <span className="text-slate-600">Total Billed:</span>
                <span className="font-bold text-slate-900">${parseFloat(selectedInvoice.total_amount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-emerald-600">
                <span>Amount Paid:</span>
                <span className="font-semibold">${parseFloat(selectedInvoice.paid_amount).toFixed(2)}</span>
              </div>
              <div className="border-t border-slate-200 pt-2 flex justify-between text-amber-600 font-bold">
                <span>Balance:</span>
                <span>${parseFloat(selectedInvoice.balance).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-500 text-xs">
                <span>Due Date:</span>
                <span>{new Date(selectedInvoice.due_date).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setSelectedInvoice(null)}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
              >
                Close
              </button>
              <Link
                to="/finance/invoices"
                className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition"
              >
                Go to Invoices →
              </Link>
            </div>
          </div>
        </div>
      )}
    </FinanceLayout>
  )
}
