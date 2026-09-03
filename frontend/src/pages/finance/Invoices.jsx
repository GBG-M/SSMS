import { useState, useEffect } from 'react'
import { getInvoices, getInvoiceDetail } from '../../services/financeService'

export default function Invoices() {
  const [invoices, setInvoices] = useState([])
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)

  useEffect(() => {
    fetchInvoices()
  }, [])

  const fetchInvoices = async () => {
    setLoading(true)
    setError(null)

    const result = await getInvoices()
    if (!result.ok) {
      setError('Failed to load invoices')
      setLoading(false)
      return
    }

    setInvoices(Array.isArray(result.data) ? result.data : [])
    setLoading(false)
  }

  const handleViewDetails = async (invoiceId) => {
    setDetailLoading(true)
    const result = await getInvoiceDetail(invoiceId)
    if (result.ok) {
      setSelectedInvoice(result.data)
    } else {
      setError('Failed to load invoice details')
    }
    setDetailLoading(false)
  }

  const handleCloseDetail = () => {
    setSelectedInvoice(null)
  }

  const calculatePaymentPercentage = (invoice) => {
    const total = parseFloat(invoice.total_amount)
    const paid = parseFloat(invoice.paid_amount)
    return total > 0 ? Math.round((paid / total) * 100) : 0
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Loading invoices...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Invoices</h1>
          <p className="text-gray-600 mt-1">View and manage all invoices</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Invoices List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">
              All Invoices ({invoices.length})
            </h2>
          </div>

          {invoices.length === 0 ? (
            <div className="p-6 text-center text-gray-600">
              No invoices found.
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {invoices.map((invoice) => {
                const paymentPercentage = calculatePaymentPercentage(invoice)
                return (
                  <div key={invoice.id} className="p-6 hover:bg-gray-50 transition">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-blue-600 mb-2">
                          {invoice.invoice_number}
                        </h3>
                        <p className="text-sm text-gray-600 mb-1">
                          <span className="font-medium">Student:</span> {invoice.student_name}
                        </p>
                        <p className="text-sm text-gray-600 mb-1">
                          <span className="font-medium">Issue Date:</span> {new Date(invoice.issue_date).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-gray-600 mb-3">
                          <span className="font-medium">Due Date:</span> {new Date(invoice.due_date).toLocaleDateString()}
                        </p>

                        {/* Progress Bar */}
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${paymentPercentage}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">
                          {paymentPercentage}% paid
                        </p>
                      </div>

                      <div className="text-right">
                        <div className="mb-3">
                          <p className="text-xs text-gray-600">Total Amount</p>
                          <p className="text-2xl font-bold text-gray-900">
                            ${parseFloat(invoice.total_amount).toFixed(2)}
                          </p>
                        </div>
                        <div className="mb-4">
                          <p className="text-xs text-gray-600">Paid</p>
                          <p className="text-lg font-bold text-green-600">
                            ${parseFloat(invoice.paid_amount).toFixed(2)}
                          </p>
                        </div>
                        <button
                          onClick={() => handleViewDetails(invoice.id)}
                          disabled={detailLoading}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition text-sm font-medium"
                        >
                          {detailLoading ? 'Loading...' : 'View Details'}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Invoice Detail Modal */}
        {selectedInvoice && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Invoice Details</h2>
                <button
                  onClick={handleCloseDetail}
                  className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
                >
                  ×
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6">
                <div className="mb-6">
                  <p className="text-2xl font-bold text-blue-600 mb-2">
                    {selectedInvoice.invoice_number}
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-600 font-medium">STUDENT</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {selectedInvoice.student_name}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 font-medium">ISSUED BY</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {selectedInvoice.issued_by || 'Admin'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 font-medium">ISSUE DATE</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {new Date(selectedInvoice.issue_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 font-medium">DUE DATE</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {new Date(selectedInvoice.due_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Invoice Items */}
                {selectedInvoice.items && selectedInvoice.items.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-3">Invoice Items</h3>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left text-gray-700 font-medium pb-2">Description</th>
                          <th className="text-right text-gray-700 font-medium pb-2">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedInvoice.items.map((item, idx) => (
                          <tr key={idx} className="border-b border-gray-100">
                            <td className="py-2 text-gray-900">{item.description}</td>
                            <td className="py-2 text-right text-gray-900">
                              ${parseFloat(item.amount).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Summary */}
                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-700">Subtotal:</span>
                      <span className="font-semibold text-gray-900">
                        ${parseFloat(selectedInvoice.subtotal).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Tax:</span>
                      <span className="font-semibold text-gray-900">
                        ${parseFloat(selectedInvoice.tax).toFixed(2)}
                      </span>
                    </div>
                    <div className="border-t border-gray-200 pt-2 flex justify-between">
                      <span className="text-lg font-bold text-gray-900">Total Amount:</span>
                      <span className="text-lg font-bold text-gray-900">
                        ${parseFloat(selectedInvoice.total_amount).toFixed(2)}
                      </span>
                    </div>
                    <div className="border-t border-gray-200 pt-2 flex justify-between">
                      <span className="text-lg font-bold text-green-600">Amount Paid:</span>
                      <span className="text-lg font-bold text-green-600">
                        ${parseFloat(selectedInvoice.paid_amount).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Close Button */}
                <button
                  onClick={handleCloseDetail}
                  className="w-full px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
