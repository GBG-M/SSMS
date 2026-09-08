import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { registerUser } from '../../services/authService'

export default function Register() {
  const navigate = useNavigate()

  const [role, setRole] = useState('student')
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    username: '',
    phone_number: '',
    password: '',
    confirm_password: '',
    agree_terms: false,
  })

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [registeredUser, setRegisteredUser] = useState(null)
  const [showPolicyModal, setShowPolicyModal] = useState(false)

  // Real-time password validation indicators
  const passwordCriteria = useMemo(() => {
    const pwd = formData.password
    const conf = formData.confirm_password
    return {
      minLength: pwd.length >= 8,
      hasNumber: /\d/.test(pwd),
      hasLetter: /[a-zA-Z]/.test(pwd),
      passwordsMatch: Boolean(pwd && conf && pwd === conf),
    }
  }, [formData.password, formData.confirm_password])

  const isPasswordSecure =
    passwordCriteria.minLength &&
    passwordCriteria.hasNumber &&
    passwordCriteria.hasLetter &&
    passwordCriteria.passwordsMatch

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
    if (error) setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!formData.first_name.trim() || !formData.last_name.trim()) {
      setError('Please provide both your first name and last name.')
      return
    }

    if (!formData.email.trim()) {
      setError('Please enter a valid email address.')
      return
    }

    if (!passwordCriteria.minLength) {
      setError('Password must contain at least 8 characters.')
      return
    }

    if (formData.password !== formData.confirm_password) {
      setError('Passwords do not match. Please verify both fields.')
      return
    }

    if (!formData.agree_terms) {
      setError('You must agree to the institutional security and data privacy policy.')
      return
    }

    setLoading(true)

    try {
      const payload = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        email: formData.email.trim().toLowerCase(),
        username: formData.username.trim() || undefined,
        phone_number: formData.phone_number.trim(),
        password: formData.password,
        confirm_password: formData.confirm_password,
        role: role,
      }

      const res = await registerUser(payload)
      setRegisteredUser(res.user || {
        first_name: payload.first_name,
        last_name: payload.last_name,
        email: payload.email,
        role_names: [role],
      })

      // Auto redirect to relevant dashboard after 3 seconds
      setTimeout(() => {
        if (role === 'student') navigate('/student/dashboard')
        else if (role === 'parent') navigate('/parent/dashboard')
        else if (role === 'teacher') navigate('/teacher/dashboard')
        else navigate('/dashboard')
      }, 3200)

    } catch (err) {
      setError(err.message || 'Failed to complete registration. Please check your details.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-slate-100 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-xl ring-1 ring-slate-200/80 p-6 sm:p-10 transition-all">

        {/* Branding & Header */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 shadow-md shadow-blue-500/30 text-2xl text-white">
            🎓
          </div>

          <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-0.5 text-xs font-bold uppercase tracking-wider text-blue-700 border border-blue-200 mb-2">
            <span className="h-2 w-2 rounded-full bg-blue-600 animate-pulse"></span>
            Institutional Security & RBAC
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Create Your Portal Account
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1.5 max-w-md mx-auto">
            Smart School Management System (SSMS) — Secure, encrypted institutional registration for students, parents, and faculty.
          </p>
        </div>

        {/* Success Screen */}
        {registeredUser ? (
          <div className="text-center py-6 animate-fade-in">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 text-3xl mb-4 shadow-inner">
              ✓
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Welcome to SSMS!</h2>
            <p className="text-sm text-slate-600 mt-2">
              Your account has been securely provisioned and activated.
            </p>

            <div className="mt-6 rounded-2xl bg-slate-50 border border-slate-200 p-5 max-w-md mx-auto text-left space-y-2 text-xs">
              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="text-slate-500">Name:</span>
                <span className="font-semibold text-slate-900">
                  {registeredUser.first_name} {registeredUser.last_name}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="text-slate-500">Registered Email:</span>
                <span className="font-mono font-medium text-slate-800">{registeredUser.email}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="text-slate-500">Portal Role:</span>
                <span className="font-bold uppercase tracking-wider text-blue-600">
                  {role}
                </span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-slate-500">Status:</span>
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span> Verified & Active
                </span>
              </div>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  if (role === 'student') navigate('/student/dashboard')
                  else if (role === 'parent') navigate('/parent/dashboard')
                  else if (role === 'teacher') navigate('/teacher/dashboard')
                  else navigate('/dashboard')
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-xs sm:text-sm font-bold text-white shadow-md shadow-blue-500/25 hover:bg-blue-700 transition"
              >
                <span>Enter Portal Dashboard</span>
                <span>→</span>
              </button>
              <Link
                to="/login"
                className="w-full sm:w-auto rounded-xl border border-slate-200 bg-white px-5 py-3 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Return to Login
              </Link>
            </div>
            <p className="text-[11px] text-slate-400 mt-4 animate-pulse">
              Redirecting you to your portal automatically in a moment...
            </p>
          </div>
        ) : (
          <>
            {/* Persona / Role Selector */}
            <div className="mb-6">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Select Your Account Type
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => setRole('student')}
                  className={`flex flex-col items-center justify-center gap-1 rounded-2xl p-3 border text-xs font-semibold transition ${
                    role === 'student'
                      ? 'border-blue-600 bg-blue-50/70 text-blue-700 shadow-sm ring-1 ring-blue-500'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-xl">👨‍🎓</span>
                  <span>Student</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('parent')}
                  className={`flex flex-col items-center justify-center gap-1 rounded-2xl p-3 border text-xs font-semibold transition ${
                    role === 'parent'
                      ? 'border-blue-600 bg-blue-50/70 text-blue-700 shadow-sm ring-1 ring-blue-500'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-xl">👨‍👩‍👧</span>
                  <span>Parent / Guardian</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('teacher')}
                  className={`flex flex-col items-center justify-center gap-1 rounded-2xl p-3 border text-xs font-semibold transition ${
                    role === 'teacher'
                      ? 'border-blue-600 bg-blue-50/70 text-blue-700 shadow-sm ring-1 ring-blue-500'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-xl">👨‍🏫</span>
                  <span>Faculty / Staff</span>
                </button>
              </div>
            </div>

            {/* Error Notification */}
            {error && (
              <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-3.5 sm:p-4 text-xs text-red-700 flex items-start gap-2.5 animate-shake">
                <span className="text-base">⚠️</span>
                <div className="flex-1 font-medium">{error}</div>
                <button
                  type="button"
                  onClick={() => setError('')}
                  className="text-red-400 hover:text-red-700 font-bold"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Main Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    required
                    value={formData.first_name}
                    onChange={handleChange}
                    placeholder="e.g. Alex"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    required
                    value={formData.last_name}
                    onChange={handleChange}
                    placeholder="e.g. Morgan"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                  />
                </div>
              </div>

              {/* Email & Username */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder={
                      role === 'teacher'
                        ? 'faculty@ssms.edu'
                        : 'personal.email@example.com'
                    }
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Desired Username <span className="text-[10px] text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="e.g. alex_morgan"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Contact Phone Number <span className="text-[10px] text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="tel"
                  name="phone_number"
                  value={formData.phone_number}
                  onChange={handleChange}
                  placeholder="+1 (555) 000-0000"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                />
              </div>

              {/* Password Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Minimum 8 characters"
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 pr-14 text-xs text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400 hover:text-blue-600"
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirm_password"
                      required
                      value={formData.confirm_password}
                      onChange={handleChange}
                      placeholder="Re-enter password"
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 pr-14 text-xs text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400 hover:text-blue-600"
                    >
                      {showConfirmPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Password Strength Checklist */}
              {formData.password && (
                <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3 text-[11px] space-y-1.5">
                  <div className="font-semibold text-slate-600">Password Security Standards:</div>
                  <div className="grid grid-cols-2 gap-2">
                    <div
                      className={`flex items-center gap-1.5 ${
                        passwordCriteria.minLength ? 'text-emerald-600 font-semibold' : 'text-slate-400'
                      }`}
                    >
                      <span>{passwordCriteria.minLength ? '✓' : '○'}</span>
                      <span>8+ characters</span>
                    </div>
                    <div
                      className={`flex items-center gap-1.5 ${
                        passwordCriteria.hasNumber ? 'text-emerald-600 font-semibold' : 'text-slate-400'
                      }`}
                    >
                      <span>{passwordCriteria.hasNumber ? '✓' : '○'}</span>
                      <span>Contains a number</span>
                    </div>
                    <div
                      className={`flex items-center gap-1.5 ${
                        passwordCriteria.hasLetter ? 'text-emerald-600 font-semibold' : 'text-slate-400'
                      }`}
                    >
                      <span>{passwordCriteria.hasLetter ? '✓' : '○'}</span>
                      <span>Contains letters</span>
                    </div>
                    <div
                      className={`flex items-center gap-1.5 ${
                        passwordCriteria.passwordsMatch ? 'text-emerald-600 font-semibold' : 'text-slate-400'
                      }`}
                    >
                      <span>{passwordCriteria.passwordsMatch ? '✓' : '○'}</span>
                      <span>Passwords match</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Compliance & Terms Agreement */}
              <div className="pt-2">
                <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-600">
                  <input
                    type="checkbox"
                    name="agree_terms"
                    checked={formData.agree_terms}
                    onChange={handleChange}
                    className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>
                    I agree to the institutional{' '}
                    <button
                      type="button"
                      onClick={() => setShowPolicyModal(true)}
                      className="text-blue-600 hover:underline font-semibold"
                    >
                      Data Governance Policy
                    </button>{' '}
                    and confirm this account is created for official school access.
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading || !formData.agree_terms || !isPasswordSecure}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-xs sm:text-sm font-bold text-white shadow-md shadow-blue-500/25 hover:bg-blue-700 active:scale-[0.99] transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                      <span>Registering Portal Account...</span>
                    </>
                  ) : (
                    <span>Complete Secure Registration →</span>
                  )}
                </button>
              </div>
            </form>

            {/* Bottom Links */}
            <div className="mt-6 pt-5 border-t border-slate-200 text-center text-xs text-slate-600 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                Already have an active account?{' '}
                <Link to="/login" className="font-bold text-blue-600 hover:text-blue-700 hover:underline">
                  Sign In to Portal
                </Link>
              </div>
              <Link to="/" className="text-slate-500 hover:text-slate-700">
                ← Return to Home
              </Link>
            </div>
          </>
        )}

        {/* Policy Modal */}
        {showPolicyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl ring-1 ring-slate-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <h3 className="font-bold text-slate-900 text-sm">Institutional Policy Disclosure</h3>
                <button
                  onClick={() => setShowPolicyModal(false)}
                  className="text-slate-400 hover:text-slate-600 font-bold"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-3 text-xs text-slate-600 leading-relaxed max-h-80 overflow-y-auto pr-1">
                <p>
                  <strong>Role-Based Access Control (RBAC):</strong> Accounts created via self-registration are verified through institutional directory services. Administrative and coordinator roles require official authorization from Central IT.
                </p>
                <p>
                  <strong>Student Data Privacy:</strong> All student records, grades, and academic histories are protected under institutional privacy standards and accessible solely to verified parents, teachers, and enrolled students.
                </p>
                <p>
                  <strong>Password Security:</strong> Passwords are cryptographically hashed using PBKDF2 with SHA-256 and salted. Credentials must never be shared across individuals.
                </p>
              </div>
              <div className="mt-5 text-right">
                <button
                  type="button"
                  onClick={() => setShowPolicyModal(false)}
                  className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                >
                  Understood
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}