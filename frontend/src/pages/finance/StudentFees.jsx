import { useState, useEffect } from 'react'
import { getStudentFees, updateStudentFee } from '../../services/financeService'

export default function StudentFees() {
  const [fees, setFees] = useState([])
  const [filteredFees, setFilteredFees] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [academicYearFilter, setAcademicYearFilter] = useState('all')
  const [uniqueYears, setUniqueYears] = useState([])

  useEffect(() => {
    fetchStudentFees()
  }, [])

  const fetchStudentFees = async () => {
    setLoading(true)
    setError(null)

    const result = await getStudentFees()
    if (!result.ok) {
      setError('Failed to load student fees')
      setLoading(false)
      return
    }

    const feesArray = Array.isArray(result.data) ? result.data : []
    setFees(feesArray)

    // Extract unique academic years
    const years = [...new Set(feesArray.map(f => f.academic_year))]
    setUniqueYears(years)

    applyFilters(feesArray, statusFilter, academicYearFilter)
    setLoading(false)
  }

  const applyFilters = (feesArray, status, year) => {
    let filtered = feesArray

    if (status !== 'all') {
      filtered = filtered.filter(f => f.status === status)
    }

    if (year !== 'all') {
      filtered = filtered.filter(f => f.academic_year === year)
    }

    setFilteredFees(filtered)
  }

  const handleStatusFilterChange = (e) => {
    const newStatus = e.target.value
    setStatusFilter(newStatus)
    applyFilters(fees, newStatus, academicYearFilter)
  }

  const handleYearFilterChange = (e) => {
    const newYear = e.target.value
    setAcademicYearFilter(newYear)
    applyFilters(fees, statusFilter, newYear)
  }

  const handleUpdateFee = async (feeId, updates) => {
    const result = await updateStudentFee(feeId, updates)
    if (!result.ok) {
      setError('Failed to update fee')
      return
    }

    // Refresh fees
    await fetchStudentFees()
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800'
      case 'overdue':
        return 'bg-red-100 text-red-800'
      case 'partial':
        return 'bg-yellow-100 text-yellow-800'
      case 'pending':
        return 'bg-blue-100 text-blue-800'
      case 'waived':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Loading student fees...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Student Fees</h1>
          <p className="text-gray-600 mt-1">Manage and track all student fee records</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow mb-6 p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Status
              </label>
              <select
                value={statusFilter}
                onChange={handleStatusFilterChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="partial">Partial</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
                <option value="waived">Waived</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Academic Year
              </label>
              <select
                value={academicYearFilter}
                onChange={handleYearFilterChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Years</option>
                {uniqueYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Fees Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">
              Fees ({filteredFees.length})
            </h2>
          </div>

          {filteredFees.length === 0 ? (
            <div className="p-6 text-center text-gray-600">
              No fees match the selected filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Student Name</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Fee Name</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Amount Due</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Amount Paid</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Balance</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Due Date</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Academic Year</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredFees.map((fee) => (
                    <tr key={fee.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3 text-sm text-gray-900">{fee.student_name}</td>
                      <td className="px-6 py-3 text-sm text-gray-900">{fee.fee_name}</td>
                      <td className="px-6 py-3 text-sm text-gray-900 font-medium">
                        ${parseFloat(fee.amount_due).toFixed(2)}
                      </td>
                      <td className="px-6 py-3 text-sm text-green-600 font-medium">
                        ${parseFloat(fee.amount_paid).toFixed(2)}
                      </td>
                      <td className="px-6 py-3 text-sm text-orange-600 font-medium">
                        ${parseFloat(fee.outstanding_balance).toFixed(2)}
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-600">
                        {new Date(fee.due_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-3 text-sm">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(fee.status)}`}>
                          {fee.status}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-600">
                        {fee.academic_year}
                      </td>
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
