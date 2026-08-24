import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

function ForcePasswordReset() {
  const navigate = useNavigate()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()

    setError('')
    setSuccess('')

    const preAuthUserId =
      localStorage.getItem('preAuthUserId')

    if (!preAuthUserId) {
      setError(
        'Password reset session is missing. Please login again.'
      )
      return
    }

    if (!password || !confirmPassword) {
      setError('Please enter both password fields.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    if (password.length < 8) {
      setError(
        'Password must contain at least 8 characters.'
      )
      return
    }

    try {
      setLoading(true)

      const response = await fetch(
        '/api/accounts/force-password-reset/',
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json',
          },

          body: JSON.stringify({
            pre_auth_token: preAuthUserId,
            new_password: password,
          }),
        }
      )

      const responseText = await response.text()

      let data

      try {
        data = JSON.parse(responseText)
      } catch {
        throw new Error(
          `Server returned an unexpected response (${response.status}).`
        )
      }

      if (!response.ok) {
        throw new Error(
          data.error ||
          data.detail ||
          'Password reset failed.'
        )
      }

      if (data.token) {
        localStorage.setItem(
          'authToken',
          data.token
        )
      }

      localStorage.removeItem('preAuthUserId')

      setSuccess(
        'Password updated successfully. Redirecting...'
      )

      setTimeout(() => {
        navigate('/dashboard')
      }, 1000)

    } catch (error) {
      console.error(error)

      setError(
        error.message ||
        'Password reset failed.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4 py-10">

      <div className="w-full max-w-md">

        {/* Brand */}
        <div className="mb-8 text-center">

          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 shadow-lg">
            <span className="text-2xl font-bold text-white">
              S
            </span>
          </div>

          <h1 className="text-3xl font-bold text-slate-900">
            SSMS
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            School Management System
          </p>

        </div>

        {/* Card */}
        <div className="rounded-2xl bg-white p-8 shadow-xl ring-1 ring-slate-200">

          <h2 className="text-2xl font-bold text-slate-900">
            Set New Password
          </h2>

          <p className="mt-2 mb-6 text-sm leading-6 text-slate-500">
            For security, you must change your temporary
            password before continuing.
          </p>

          {/* Error */}
          {error && (
            <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="mb-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              {success}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >

            {/* New password */}
            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                New Password
              </label>

              <input
                id="password"
                type="password"
                placeholder="Enter new password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                required
                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            {/* Confirm password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Confirm New Password
              </label>

              <input
                id="confirmPassword"
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(event.target.value)
                }
                required
                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            {/* Password requirement */}
            <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
              Password must contain at least 8 characters.
            </div>

            {/* Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white shadow-md transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? 'Updating...'
                : 'Update Password'}
            </button>

          </form>

        </div>

      </div>
    </div>
  )
}

export default ForcePasswordReset