import { useState, useEffect } from 'react'
import { getStudentFees, getInvoices } from '../../services/financeService'

export default function FinanceDashboard() {
  const [studentFees, setStudentFees] = useState([])
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchFinanceData = async () => {
      setLoading(true)
      setError(null)

      const feesResult = await getStudentFees()
      if (!feesResult.ok) {
        setError('Failed to load student fees')
        setLoading(false)
        return
      }

      const invoicesResult = await getInvoices()
      if (!invoicesResult.ok) {
        setError('Failed to load invoices')
        setLoading(false)
        return
      }

      setStudentFees(Array.isArray(feesResult.data) ? feesResult.data : [])
      setInvoices(Array.isArray(invoicesResult.data) ? invoicesResult.data : [])
      setLoading(false)
    }

    fetchFinanceData()
  }, [])

  const calculateTotals = (fees) => {
    return fees.reduce(
      (acc, fee) => ({
        due: acc.due + parseFloat(fee.amount_due || 0),
        paid: acc.paid + parseFloat(fee.amount_paid || 0),
        outstanding: acc.outstanding + parseFloat(fee.outstanding_balance || 0),
      }),
      { due: 0, paid: 0, outstanding: 0 }
    )
  }

  const totals = calculateTotals(studentFees)
  const pendingCount = studentFees.filter(f => f.status === 'pending' || f.status === 'partial').length
  const overdueCount = studentFees.filter(f => f.status === 'overdue').length

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Loading financial data...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Financial Dashboard</h1>
          <p className="text-gray-600 mt-1">View your fees, invoices, and payment history</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-gray-600 text-sm font-medium">Total Due</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">
              ${totals.due.toFixed(2)}
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-gray-600 text-sm font-medium">Amount Paid</p>
            <p className="text-2xl font-bold text-green-600 mt-2">
              ${totals.paid.toFixed(2)}
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-gray-600 text-sm font-medium">Outstanding Balance</p>
            <p className={`text-2xl font-bold mt-2 ${
              totals.outstanding > 0 ? 'text-orange-600' : 'text-gray-600'
            }`}>
              ${totals.outstanding.toFixed(2)}
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-gray-600 text-sm font-medium">Overdue Items</p>
            <p className={`text-2xl font-bold mt-2 ${
              overdueCount > 0 ? 'text-red-600' : 'text-gray-600'
            }`}>
              {overdueCount}
            </p>
          </div>
        </div>

        {/* Fees Section */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Student Fees ({studentFees.length})</h2>
          </div>
          {studentFees.length === 0 ? (
            <div className="p-6 text-center text-gray-600">
              No fees found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Fee Name</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Amount Due</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Paid</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Balance</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Due Date</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {studentFees.map((fee) => (
                    <tr key={fee.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3 text-sm text-gray-900">{fee.fee_name}</td>
                      <td className="px-6 py-3 text-sm text-gray-900">${parseFloat(fee.amount_due).toFixed(2)}</td>
                      <td className="px-6 py-3 text-sm text-green-600">${parseFloat(fee.amount_paid).toFixed(2)}</td>
                      <td className="px-6 py-3 text-sm text-orange-600">${parseFloat(fee.outstanding_balance).toFixed(2)}</td>
                      <td className="px-6 py-3 text-sm text-gray-600">{new Date(fee.due_date).toLocaleDateString()}</td>
                      <td className="px-6 py-3 text-sm">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          fee.status === 'paid' ? 'bg-green-100 text-green-800' :
                          fee.status === 'overdue' ? 'bg-red-100 text-red-800' :
                          fee.status === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {fee.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Invoices Section */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Recent Invoices ({invoices.length})</h2>
          </div>
          {invoices.length === 0 ? (
            <div className="p-6 text-center text-gray-600">
              No invoices found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Invoice #</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Issued Date</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Due Date</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Total Amount</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Paid Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {invoices.slice(0, 5).map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3 text-sm font-medium text-blue-600">{invoice.invoice_number}</td>
                      <td className="px-6 py-3 text-sm text-gray-600">{new Date(invoice.issue_date).toLocaleDateString()}</td>
                      <td className="px-6 py-3 text-sm text-gray-600">{new Date(invoice.due_date).toLocaleDateString()}</td>
                      <td className="px-6 py-3 text-sm text-gray-900 font-medium">${parseFloat(invoice.total_amount).toFixed(2)}</td>
                      <td className="px-6 py-3 text-sm text-green-600">${parseFloat(invoice.paid_amount).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
