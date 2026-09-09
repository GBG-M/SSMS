import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const API_BASE_URL = '/api/accounts'

export default function Profile() {
  const navigate = useNavigate()

  const [profile, setProfile] = useState(null)

  const [formData, setFormData] = useState({
    email: '',
    username: '',
    first_name: '',
    last_name: '',
  })

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Get authentication token
  const getToken = () => {
    return localStorage.getItem('authToken')
  }

  // Load current user's profile
  useEffect(() => {
    fetchProfile()
  }, [])

  async function fetchProfile() {
    setLoading(true)
    setError('')

    const token = getToken()

    if (!token) {
      navigate('/login')
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/profile/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Token ${token}`,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('authToken')
          navigate('/login')
          return
        }

        throw new Error(
          data.detail ||
          data.error ||
          'Failed to load profile.'
        )
      }

      setProfile(data)

      setFormData({
        email: data.email || '',
        username: data.username || '',
        first_name: data.first_name || '',
        last_name: data.last_name || '',
      })
    } catch (err) {
      setError(err.message || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  function handleChange(event) {
    const { name, value } = event.target

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()

    setSaving(true)
    setError('')
    setSuccess('')

    const token = getToken()

    try {
      const response = await fetch(`${API_BASE_URL}/profile/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify({
          username: formData.username,
          first_name: formData.first_name,
          last_name: formData.last_name,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.detail ||
          data.error ||
          'Failed to update profile.'
        )
      }

      const updatedUser = data.user || data

      setProfile(updatedUser)
      localStorage.setItem('userProfile', JSON.stringify(updatedUser))

      setFormData({
        email: updatedUser.email || '',
        username: updatedUser.username || '',
        first_name: updatedUser.first_name || '',
        last_name: updatedUser.last_name || '',
      })

      setSuccess('Profile updated successfully.')
    } catch (err) {
      setError(err.message || 'Something went wrong.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600"></div>

          <p className="text-slate-600">
            Loading profile...
          </p>
        </div>
      </div>
    )
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
              My Profile
            </p>
          </div>

          <button
            onClick={() => {
              const roles = (profile?.role_names || []).map(r => String(r).toLowerCase())
              if (roles.includes('student')) navigate('/student/dashboard')
              else if (roles.includes('teacher')) navigate('/teacher/dashboard')
              else if (roles.includes('parent')) navigate('/parent/dashboard')
              else navigate('/dashboard')
            }}
            className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-200"
          >
            ← Back to Portal
          </button>

        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-5xl px-6 py-10">

        {/* Page title */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-800">
            My Profile
          </h2>

          <p className="mt-2 text-slate-500">
            View and update your account information.
          </p>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-5 py-4 text-sm text-green-700">
            {success}
          </div>
        )}

        <div className="grid gap-8 md:grid-cols-3">

          {/* Profile card */}
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">

            <div className="flex flex-col items-center text-center">

              {/* Avatar */}
              <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-blue-100 text-3xl font-bold text-blue-700">
                {(
                  formData.first_name?.charAt(0) ||
                  formData.username?.charAt(0) ||
                  formData.email?.charAt(0) ||
                  'U'
                ).toUpperCase()}
              </div>

              <h3 className="text-xl font-bold text-slate-800">
                {formData.first_name || formData.username || 'User'}
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                {formData.email}
              </p>

              {/* Role Badges */}
              <div className="mt-4 flex flex-wrap justify-center gap-1.5">
                {profile?.role_names && profile.role_names.length > 0 ? (
                  profile.role_names.map((r) => {
                    const rLower = String(r).toLowerCase()
                    let color = 'bg-blue-50 text-blue-700 border-blue-200'
                    let icon = '👤'
                    if (rLower === 'admin') {
                      color = 'bg-purple-50 text-purple-700 border-purple-200'
                      icon = '👑'
                    } else if (rLower === 'teacher') {
                      color = 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      icon = '👨‍🏫'
                    } else if (rLower === 'student') {
                      color = 'bg-indigo-50 text-indigo-700 border-indigo-200'
                      icon = '👨‍🎓'
                    } else if (rLower === 'parent') {
                      color = 'bg-amber-50 text-amber-700 border-amber-200'
                      icon = '👨‍👩‍👧'
                    } else if (rLower === 'academic_coordinator') {
                      color = 'bg-cyan-50 text-cyan-700 border-cyan-200'
                      icon = '🏛️'
                    }
                    return (
                      <span
                        key={r}
                        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${color}`}
                      >
                        <span>{icon}</span>
                        <span>{r.replaceAll('_', ' ').toUpperCase()}</span>
                      </span>
                    )
                  })
                ) : (
                  <div className="mt-4 rounded-full bg-blue-50 px-4 py-2 text-xs font-semibold text-blue-700">
                    Account
                  </div>
                )}
              </div>

              {/* Student Metadata */}
              {profile?.student_profile && (
                <div className="mt-5 w-full rounded-xl bg-slate-50 p-3 text-left text-xs text-slate-600 border border-slate-200">
                  <div className="font-bold text-slate-800 mb-1">Student Record</div>
                  <div>ID: <span className="font-mono font-bold text-indigo-600">{profile.student_profile.student_id}</span></div>
                  {profile.student_profile.current_grade && (
                    <div>Grade: {profile.student_profile.current_grade} ({profile.student_profile.current_class || 'General'})</div>
                  )}
                </div>
              )}

              {/* Linked Children */}
              {profile?.children && profile.children.length > 0 && (
                <div className="mt-5 w-full rounded-xl bg-slate-50 p-3 text-left text-xs text-slate-600 border border-slate-200">
                  <div className="font-bold text-slate-800 mb-1">Linked Children ({profile.children.length})</div>
                  {profile.children.map((c) => (
                    <div key={c.id} className="text-slate-700 py-0.5 truncate">
                      🎓 {c.full_name} ({c.student_id})
                    </div>
                  ))}
                </div>
              )}

            </div>

          </div>

          {/* Profile form */}
          <div className="md:col-span-2">

            <form
              onSubmit={handleSubmit}
              className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200"
            >

              <div className="mb-8">
                <h3 className="text-xl font-bold text-slate-800">
                  Personal Information
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Update your personal account information.
                </p>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">

                {/* First name */}
                <div>
                  <label
                    htmlFor="first_name"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    First Name
                  </label>

                  <input
                    id="first_name"
                    name="first_name"
                    type="text"
                    value={formData.first_name}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    placeholder="Enter first name"
                  />
                </div>

                {/* Last name */}
                <div>
                  <label
                    htmlFor="last_name"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Last Name
                  </label>

                  <input
                    id="last_name"
                    name="last_name"
                    type="text"
                    value={formData.last_name}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    placeholder="Enter last name"
                  />
                </div>

                {/* Username */}
                <div>
                  <label
                    htmlFor="username"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Username
                  </label>

                  <input
                    id="username"
                    name="username"
                    type="text"
                    value={formData.username}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    placeholder="Enter username"
                  />
                </div>

                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Email
                  </label>

                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    disabled
                    className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-slate-500"
                  />

                  <p className="mt-2 text-xs text-slate-400">
                    Email cannot be changed here.
                  </p>
                </div>

              </div>

              {/* Save button */}
              <div className="mt-8 flex justify-end">

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>

              </div>

            </form>

          </div>

        </div>

        {/* Security section */}
        <div className="mt-8 rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">

          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">

            <div>
              <h3 className="text-xl font-bold text-slate-800">
                Account Security
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Manage your password and account security settings.
              </p>
            </div>

            <button
              onClick={() => navigate('/change-password')}
              className="rounded-xl bg-slate-800 px-5 py-3 font-semibold text-white transition hover:bg-slate-900"
            >
              Change Password
            </button>

          </div>

        </div>

      </main>
    </div>
  )
}