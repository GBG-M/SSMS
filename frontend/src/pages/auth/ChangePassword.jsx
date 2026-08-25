import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const API_BASE_URL = '/api/accounts'

export default function ChangePassword() {
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    old_password: '',
    new_password: '',
    confirm_password: '',
  })

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  function handleChange(event) {
    const { name, value } = event.target

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()

    setError('')
    setSuccess('')

    if (formData.new_password !== formData.confirm_password) {
      setError('New passwords do not match.')
      return
    }

    if (formData.new_password.length < 8) {
      setError('New password must be at least 8 characters.')
      return
    }

    const token = localStorage.getItem('token')

    if (!token) {
      navigate('/login')
      return
    }

    setLoading(true)

    try {
      const response = await fetch(
        `${API_BASE_URL}/change-password/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Token ${token}`,
          },
          body: JSON.stringify({
            old_password: formData.old_password,
            new_password: formData.new_password,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token')
          navigate('/login')
          return
        }

        const message =
          data.old_password?.[0] ||
          data.new_password?.[0] ||
          data.detail ||
          data.error ||
          'Failed to change password.'

        throw new Error(message)
      }

      setSuccess(
        data.message || 'Password changed successfully.'
      )

      setFormData({
        old_password: '',
        new_password: '',
        confirm_password: '',
      })
    } catch (err) {
      setError(err.message || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">

          <div>
            <h1 className="text-xl font-bold text-slate-800">
              School Management System
            </h1>

            <p className="text-sm text-slate-500">
              Account Security
            </p>
          </div>

          <button
            onClick={() => navigate('/profile')}
            className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-200"
          >
            ← Profile
          </button>

        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-2xl px-6 py-12">

        {/* Title */}
        <div className="mb-8 text-center">

          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-2xl">
            🔐
          </div>

          <h2 className="text-3xl font-bold text-slate-800">
            Change Password
          </h2>

          <p className="mt-2 text-slate-500">
            Keep your account secure by using a strong password.
          </p>

        </div>

        {/* Card */}
        <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">

          {/* Error */}
          {error && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-5 py-4 text-sm text-green-700">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit}>

            {/* Current password */}
            <div className="mb-6">
              <label
                htmlFor="old_password"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Current Password
              </label>

              <input
                id="old_password"
                name="old_password"
                type="password"
                value={formData.old_password}
                onChange={handleChange}
                required
                autoComplete="current-password"
                placeholder="Enter your current password"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            {/* New password */}
            <div className="mb-6">
              <label
                htmlFor="new_password"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                New Password
              </label>

              <input
                id="new_password"
                name="new_password"
                type="password"
                value={formData.new_password}
                onChange={handleChange}
                required
                autoComplete="new-password"
                placeholder="Enter your new password"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />

              <p className="mt-2 text-xs text-slate-400">
                Use at least 8 characters.
              </p>
            </div>

            {/* Confirm password */}
            <div className="mb-8">
              <label
                htmlFor="confirm_password"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Confirm New Password
              </label>

              <input
                id="confirm_password"
                name="confirm_password"
                type="password"
                value={formData.confirm_password}
                onChange={handleChange}
                required
                autoComplete="new-password"
                placeholder="Confirm your new password"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            {/* Buttons */}
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

              <button
                type="button"
                onClick={() => navigate('/profile')}
                className="rounded-xl bg-slate-100 px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-200"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Changing...' : 'Change Password'}
              </button>

            </div>

          </form>

        </div>

        {/* Security tips */}
        <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-6">

          <h3 className="font-semibold text-blue-900">
            Password security tips
          </h3>

          <ul className="mt-3 space-y-2 text-sm text-blue-800">
            <li>• Use at least 8 characters.</li>
            <li>• Use a combination of letters and numbers.</li>
            <li>• Avoid using easily guessed information.</li>
            <li>• Never share your password with others.</li>
          </ul>

        </div>

      </main>
    </div>
  )
}