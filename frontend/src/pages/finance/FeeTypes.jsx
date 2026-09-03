import { useState, useEffect } from 'react'
import { getFeeTypes, createFeeType } from '../../services/financeService'

export default function FeeTypes() {
  const [feeTypes, setFeeTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    amount: '',
    is_required: false,
    academic_year: '',
    is_active: true,
  })

  useEffect(() => {
    fetchFeeTypes()
  }, [])

  const fetchFeeTypes = async () => {
    setLoading(true)
    setError(null)

    const result = await getFeeTypes()
    if (!result.ok) {
      setError('Failed to load fee types')
      setLoading(false)
      return
    }

    setFeeTypes(Array.isArray(result.data) ? result.data : [])
    setLoading(false)
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.name || !formData.category || !formData.amount || !formData.academic_year) {
      setError('Please fill in all required fields')
      return
    }

    setSubmitting(true)
    setError(null)

    const result = await createFeeType({
      name: formData.name,
      category: formData.category,
      description: formData.description,
      amount: parseFloat(formData.amount),
      is_required: formData.is_required,
      academic_year: formData.academic_year,
      is_active: formData.is_active,
    })

    if (!result.ok) {
      setError('Failed to create fee type')
      setSubmitting(false)
      return
    }

    // Reset form and refresh list
    setFormData({
      name: '',
      category: '',
      description: '',
      amount: '',
      is_required: false,
      academic_year: '',
      is_active: true,
    })
    setShowForm(false)
    await fetchFeeTypes()
    setSubmitting(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Loading fee types...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Fee Types</h1>
            <p className="text-gray-600 mt-1">Manage fee types for the school</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
          >
            {showForm ? 'Cancel' : 'Create Fee Type'}
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Create Form */}
        {showForm && (
          <div className="bg-white rounded-lg shadow mb-8 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Create New Fee Type</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fee Type Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g., Tuition Fee"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category *
                  </label>
                  <input
                    type="text"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    placeholder="e.g., tuition, library, sports"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* Academic Year */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Academic Year *
                  </label>
                  <input
                    type="text"
                    name="academic_year"
                    value={formData.academic_year}
                    onChange={handleInputChange}
                    placeholder="e.g., 2024/2025"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* Description */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Optional description for this fee type"
                    rows="3"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  ></textarea>
                </div>

                {/* Checkboxes */}
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="is_required"
                      checked={formData.is_required}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Is Required</span>
                  </label>
                </div>

                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={formData.is_active}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Is Active</span>
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition font-medium"
                >
                  {submitting ? 'Creating...' : 'Create Fee Type'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Fee Types List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">
              All Fee Types ({feeTypes.length})
            </h2>
          </div>

          {feeTypes.length === 0 ? (
            <div className="p-6 text-center text-gray-600">
              No fee types found. Create one to get started.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Fee Name</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Category</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Amount</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Academic Year</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Required</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Active</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {feeTypes.map((feeType) => (
                    <tr key={feeType.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3 text-sm font-medium text-gray-900">{feeType.name}</td>
                      <td className="px-6 py-3 text-sm text-gray-600">{feeType.category}</td>
                      <td className="px-6 py-3 text-sm text-gray-900">
                        ${parseFloat(feeType.amount).toFixed(2)}
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-600">{feeType.academic_year}</td>
                      <td className="px-6 py-3 text-sm">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          feeType.is_required ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {feeType.is_required ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-sm">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          feeType.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {feeType.is_active ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-600 max-w-xs truncate">
                        {feeType.description || '—'}
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
