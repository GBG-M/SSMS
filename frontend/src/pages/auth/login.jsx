
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../../services/authService'

export default function Login() {
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (event) => {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    setError('')
    setLoading(true)

    try {
      const result = await login(
        formData.email,
        formData.password
      )

      const { data } = result

      // Password reset required
      if (data.status === 'password_reset_required') {
        if (!data.pre_auth_user_id) {
          setError(
            'Password reset is required, but the server did not provide the pre-auth user ID.'
          )
          return
        }

        localStorage.setItem(
          'preAuthUserId',
          data.pre_auth_user_id
        )

        navigate('/force-password-reset')
        return
      }

      // TOTP setup required
      if (data.status === 'totp_setup_required') {
        if (data.pre_auth_user_id) {
          localStorage.setItem(
            'preAuthUserId',
            data.pre_auth_user_id
          )
        }

        setError(
          'Two-factor authentication setup is required.'
        )
        return
      }

      // TOTP verification required
      if (data.status === 'totp_verification_required') {
        if (data.pre_auth_user_id) {
          localStorage.setItem(
            'preAuthUserId',
            data.pre_auth_user_id
          )
        }

        setError(
          'Two-factor authentication verification is required.'
        )
        return
      }

      // ---------------------------------------------
      // Successful login
      // Supports DRF Token and JWT
      // ---------------------------------------------

      const token =
        data.token ||
        data.access ||
        data.access_token

      if (result.ok && token) {
        console.log('Login response:', data)
        localStorage.setItem(
          'authToken',
          token
        )

        /*
         * DRF Token authentication:
         *     data.token
         *
         * JWT authentication:
         *     data.access
         *     data.access_token
         */
        if (data.token) {
          localStorage.setItem(
            'authType',
            'Token'
          )
        } else {
          localStorage.setItem(
            'authType',
            'Bearer'
          )
        }

        localStorage.setItem(
          'userEmail',
          data.email || formData.email
        )

        localStorage.removeItem('preAuthUserId')

// Get the logged-in user's profile
const profileResponse = await fetch('/api/accounts/profile/', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Token ${token}`,
  },
})

const profile = await profileResponse.json()

if (!profileResponse.ok) {
  throw new Error(
    profile.detail ||
    profile.error ||
    'Failed to load user profile.'
  )
}

// Redirect based on role
const roles = (profile.role_names || []).map((r) => String(r).toLowerCase())

if (roles.includes('student')) {
  navigate('/student/dashboard')
} else {
  navigate('/dashboard')
}

return
      }

      // Login failed
      setError(
        data.error ||
        data.detail ||
        data.message ||
        'Invalid email or password.'
      )

    } catch (error) {
      console.error('Login error:', error)

      setError(
        'Unable to connect to the server. Make sure Django is running.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4 py-10">

      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">

          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 shadow-lg">
            <span className="text-2xl font-bold text-white">
              S
            </span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            SSMS
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            School Management System
          </p>

        </div>

        {/* Login Card */}
        <div className="rounded-2xl bg-white p-8 shadow-xl ring-1 ring-slate-200">

          <div className="mb-7">
            <h2 className="text-2xl font-bold text-slate-900">
              Welcome back
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Sign in to access your school account.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Email address
              </label>

              <input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Password
              </label>

              <div className="relative">

                <input
                  id="password"
                  name="password"
                  type={
                    showPassword
                      ? 'text'
                      : 'password'
                  }
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 pr-20 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      (previous) => !previous
                    )
                  }
                  className="absolute inset-y-0 right-0 flex items-center px-4 text-sm font-semibold text-slate-500 transition hover:text-blue-600"
                >
                  {showPassword
                    ? 'Hide'
                    : 'Show'}
                </button>

              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white shadow-md transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? 'Signing in...'
                : 'Sign In'}
            </button>

          </form>

        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          © 2026 School Management System
        </p>

      </div>

    </div>
  )
}
