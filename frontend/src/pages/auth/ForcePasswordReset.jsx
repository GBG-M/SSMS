import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'

function ForcePasswordReset() {
  const navigate = useNavigate()

  const [email, setEmail] = useState(() => localStorage.getItem('userEmail') || '')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const preAuthUserId = localStorage.getItem('preAuthUserId')

  const calculateStrength = (pwd) => {
    let score = 0
    if (!pwd) return { score: 0, label: '', color: 'bg-slate-200' }
    if (pwd.length >= 8) score++
    if (/[A-Z]/.test(pwd)) score++
    if (/[0-9]/.test(pwd)) score++
    if (/[^A-Za-z0-9]/.test(pwd)) score++

    if (score <= 1) return { score: 1, label: 'Weak', color: 'bg-red-500' }
    if (score === 2) return { score: 2, label: 'Fair', color: 'bg-amber-500' }
    if (score === 3) return { score: 3, label: 'Good', color: 'bg-blue-500' }
    return { score: 4, label: 'Strong', color: 'bg-emerald-500' }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    setError('')
    setSuccess('')

    const targetIdentifier = preAuthUserId || email.trim()

    if (!targetIdentifier) {
      setError('Please provide your registered school email address or log in first.')
      return
    }

    // Validate passwords
    if (!password || !confirmPassword) {
      setError('Please enter both password fields.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    if (password.length < 8) {
      setError('Password must contain at least 8 characters.')
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
            pre_auth_user_id: targetIdentifier,
            new_password: password,
            confirm_password: confirmPassword,
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

      // Backend returned an error
      if (!response.ok) {
        let errMsg = data.error || data.detail
        if (!errMsg && data.new_password) {
          errMsg = Array.isArray(data.new_password) ? data.new_password.join(' ') : data.new_password
        }
        if (!errMsg && data.confirm_password) {
          errMsg = Array.isArray(data.confirm_password) ? data.confirm_password.join(' ') : data.confirm_password
        }
        throw new Error(errMsg || 'Password reset failed. Please check your credentials.')
      }

      if (!data.token) {
        throw new Error(
          'Password was updated, but the server did not return an authentication token.'
        )
      }

      // Save authentication token
      localStorage.setItem('authToken', data.token)
      localStorage.setItem('authType', 'Token')

      // Save email if backend returned it or if provided
      const resolvedEmail = data.email || email.trim()
      if (resolvedEmail) {
        localStorage.setItem('userEmail', resolvedEmail)
      }

      // Pre-auth session is no longer needed
      localStorage.removeItem('preAuthUserId')

      setSuccess('Password updated successfully! Logging you in...')

      // Redirect role-appropriately
      const roleNames = (data.role_names || []).map((r) => String(r).toLowerCase())

      setTimeout(() => {
        if (roleNames.includes('student')) {
          navigate('/student/dashboard', { replace: true })
        } else {
          navigate('/dashboard', { replace: true })
        }
      }, 1000)

    } catch (err) {
      console.error('Password reset error:', err)
      setError(err.message || 'Password reset failed.')
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
            For security, you must change your temporary password before continuing into the portal.
          </p>

          {/* Account indicator if coming from login */}
          {preAuthUserId ? (
            <div className="mb-5 rounded-lg bg-blue-50 border border-blue-200 p-3 text-xs text-blue-900 flex items-center justify-between">
              <div>
                <span className="font-semibold text-blue-700 block">Resetting account:</span>
                <span className="text-slate-700 font-medium">{email || 'Authenticated User'}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  localStorage.removeItem('preAuthUserId')
                  setEmail('')
                  window.location.reload()
                }}
                className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 underline ml-2"
              >
                Change account
              </button>
            </div>
          ) : null}

          {/* Error alert */}
          {error && (
            <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Success alert */}
          {success && (
            <div className="mb-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* If direct visit without preAuthUserId, show email input */}
            {!preAuthUserId && (
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Registered Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="e.g. user@school.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100"
                />
                <p className="mt-1 text-xs text-slate-400">
                  Enter the email assigned to your temporary account.
                </p>
              </div>
            )}

            {/* New password */}
            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                New Password
              </label>

              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter new password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  minLength={8}
                  disabled={loading}
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 pr-20 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 flex items-center px-4 text-xs font-semibold text-slate-500 transition hover:text-blue-600 select-none"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? '🙈 Hide' : '👁️ Show'}
                </button>
              </div>

              {/* Password Strength Indicator */}
              {password && (
                <div className="mt-2 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Security Strength:</span>
                    <span className="font-semibold text-slate-700">{calculateStrength(password).label}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1 h-1.5 rounded-full overflow-hidden bg-slate-100">
                    {[1, 2, 3, 4].map((step) => (
                      <div
                        key={step}
                        className={`h-full transition-all duration-300 ${
                          step <= calculateStrength(password).score
                            ? calculateStrength(password).color
                            : 'bg-slate-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Confirm password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Confirm New Password
              </label>

              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  required
                  minLength={8}
                  disabled={loading}
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 pr-20 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100"
                />

                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 flex items-center px-4 text-xs font-semibold text-slate-500 transition hover:text-blue-600 select-none"
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? '🙈 Hide' : '👁️ Show'}
                </button>
              </div>

              {confirmPassword && (
                <div className="mt-1 text-[11px] font-semibold">
                  {password === confirmPassword ? (
                    <span className="text-emerald-600">✓ Passwords match</span>
                  ) : (
                    <span className="text-red-500">✗ Passwords do not match</span>
                  )}
                </div>
              )}
            </div>

            {/* Password requirement hint */}
            <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
              Password must contain at least 8 characters with a mix of letters, numbers, and symbols.
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white shadow-md transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Updating Password...' : 'Update Password & Enter Portal'}
            </button>

          </form>

          {/* Navigation Links */}
          <div className="mt-6 text-center text-sm text-slate-500">
            Remember your credentials?{' '}
            <Link
              to="/login"
              className="font-semibold text-blue-600 hover:text-blue-700 hover:underline"
            >
              Back to Sign In
            </Link>
          </div>

        </div>
      </div>
    </div>
  )
}

export default ForcePasswordReset