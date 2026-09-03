import { useEffect, useState } from 'react'
import { getPayments } from '../../services/financeService'

const paymentMethods = {
  cash: 'Cash',
  bank_transfer: 'Bank transfer',
  mobile_money: 'Mobile money',
  card: 'Card',
  cheque: 'Cheque',
}

function formatAmount(value) {
  return `$${Number.parseFloat(value || 0).toFixed(2)}`
}

function formatDate(value) {
  if (!value) return '-'
  return new Date(value).toLocaleDateString()
}

export default function Payments() {
  const [payments, setPayments] = useState([])
  const [status, setStatus] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function loadPayments() {
      setLoading(true)
      setError('')
      const result = await getPayments(status === 'all' ? {} : { status })
      if (!active) return
      if (!result.ok) {
        setError('Unable to load payment history.')
        setPayments([])
      } else {
        setPayments(Array.isArray(result.data) ? result.data : [])
      }
      setLoading(false)
    }

    loadPayments()
    return () => { active = false }
  }, [status])

  const total = payments.reduce((sum, payment) => sum + Number.parseFloat(payment.amount || 0), 0)

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">Finance</p>
            <h1 className="text-3xl font-bold text-gray-900">Payment history</h1>
            <p className="mt-1 text-gray-600">Review completed and pending payments in your account scope.</p>
          </div>
          <label className="text-sm font-medium text-gray-700">
            Status
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="mt-1 block rounded-lg border border-gray-300 bg-white px-3 py-2 font-normal text-gray-900"
            >
              <option value="all">All statuses</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </label>
        </div>

        {error && <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">{error}</div>}

        <section className="mb-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Payments shown</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{payments.length}</p>
          </div>
          <div className="rounded-lg bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Total shown</p>
            <p className="mt-1 text-2xl font-bold text-green-600">{formatAmount(total)}</p>
          </div>
        </section>

        <section className="overflow-hidden rounded-lg bg-white shadow-sm">
          {loading ? (
            <p className="p-8 text-center text-gray-600">Loading payment history...</p>
          ) : payments.length === 0 ? (
            <p className="p-8 text-center text-gray-600">No payments found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="border-b border-gray-200 bg-gray-50 text-sm text-gray-700">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Date</th>
                    <th className="px-6 py-4 font-semibold">Student</th>
                    <th className="px-6 py-4 font-semibold">Reference</th>
                    <th className="px-6 py-4 font-semibold">Method</th>
                    <th className="px-6 py-4 font-semibold">Amount</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {payments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">{formatDate(payment.payment_date)}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{payment.student_name || '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{payment.transaction_reference || '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{paymentMethods[payment.payment_method] || payment.payment_method}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-gray-900">{formatAmount(payment.amount)}</td>
                      <td className="px-6 py-4 text-sm capitalize text-gray-700">{payment.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
