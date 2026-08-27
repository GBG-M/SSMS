import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

const API_BASE_URL = '/api/accounts'

export default function EditUser() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    is_active: true,
    is_staff: false,
    must_reset_password: false,
    requires_totp: false,
    totp_enabled: false,
  })

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetchUser()
  }, [id])

  async function fetchUser() {
    setLoading(true)
    setError('')

    const token = localStorage.getItem('authToken')

    if (!token) {
      navigate('/login')
      return
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/users/${id}/`,
        {
          method: 'GET',
          headers: {
            Authorization: `Token ${token}`,
            'Content-Type': 'application/json',
          },
        }
      )

      const data = await response.json()

      if (response.status === 401) {
        localStorage.removeItem('authToken')
        localStorage.removeItem('userEmail')
        navigate('/login')
        return
      }

      if (response.status === 403) {
        setError(
          'You do not have permission to edit this user.'
        )
        return
      }

      if (response.status === 404) {
        setError('User was not found.')
        return
      }

      if (!response.ok) {
        throw new Error(
          data.detail ||
          data.error ||
          'Failed to load user.'
        )
      }

      setFormData({
        username: data.username || '',
        email: data.email || '',
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        is_active: Boolean(data.is_active),
        is_staff: Boolean(data.is_staff),
        must_reset_password: Boolean(
          data.must_reset_password
        ),
        requires_totp: Boolean(data.requires_totp),
        totp_enabled: Boolean(data.totp_enabled),
      })
    } catch (err) {
      console.error('Load user error:', err)

      setError(
        err.message ||
        'Unable to load user information.'
      )
    } finally {
      setLoading(false)
    }
  }

  function handleChange(event) {
    const { name, value, type, checked } = event.target

    setFormData((previousData) => ({
      ...previousData,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()

    setError('')
    setSuccess('')

    const token = localStorage.getItem('authToken')

    if (!token) {
      navigate('/login')
      return
    }

    setSaving(true)

    try {
      const response = await fetch(
        `${API_BASE_URL}/users/${id}/`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Token ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: formData.username,
            email: formData.email,
            first_name: formData.first_name,
            last_name: formData.last_name,
            is_active: formData.is_active,
            is_staff: formData.is_staff,
            must_reset_password:
              formData.must_reset_password,
            requires_totp:
              formData.requires_totp,
            totp_enabled:
              formData.totp_enabled,
          }),
        }
      )

      const data = await response.json()

      if (response.status === 401) {
        localStorage.removeItem('authToken')
        localStorage.removeItem('userEmail')
        navigate('/login')
        return
      }

      if (response.status === 403) {
        setError(
          'You do not have permission to edit this user.'
        )
        return
      }

      if (!response.ok) {
        const message =
          data.username?.[0] ||
          data.email?.[0] ||
          data.first_name?.[0] ||
          data.last_name?.[0] ||
          data.is_active?.[0] ||
          data.is_staff?.[0] ||
          data.must_reset_password?.[0] ||
          data.requires_totp?.[0] ||
          data.totp_enabled?.[0] ||
          data.detail ||
          data.error ||
          'Failed to update user.'

        throw new Error(message)
      }

      setSuccess(
        'User updated successfully.'
      )

      setTimeout(() => {
        navigate(`/admin/users/${id}`)
      }, 1000)
    } catch (err) {
      console.error('Update user error:', err)

      setError(
        err.message ||
        'Unable to update user.'
      )
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">

        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-6 py-4">

            <h1 className="text-xl font-bold text-slate-800">
              School Management System
            </h1>

            <p className="text-sm text-slate-500">
              Edit User
            </p>

          </div>
        </header>

        <main className="flex min-h-[70vh] items-center justify-center px-6">

          <div className="text-center">

            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600"></div>

            <p className="text-sm text-slate-500">
              Loading user...
            </p>

          </div>

        </main>

      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Header */}
      <header className="border-b border-slate-200 bg-white">

        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">

          <div>
            <h1 className="text-xl font-bold text-slate-800">
              School Management System
            </h1>

            <p className="text-sm text-slate-500">
              Admin User Management
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate(`/admin/users/${id}`)}
            className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-200"
          >
            ← User Details
          </button>

        </div>

      </header>


      {/* Main */}
      <main className="mx-auto max-w-4xl px-6 py-10">

        <div className="mb-8">

          <p className="text-sm font-semibold uppercase tracking-widest text-blue-600">
            Administration
          </p>

          <h2 className="mt-2 text-3xl font-bold text-slate-900">
            Edit User
          </h2>

          <p className="mt-2 text-slate-500">
            Update this user's account information and status.
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


        <form
          onSubmit={handleSubmit}
          className="space-y-8"
        >

          {/* Basic information */}
          <section className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">

            <div className="mb-6">
              <h3 className="text-xl font-bold text-slate-800">
                Basic Information
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Update the user's personal account information.
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
                  required
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
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
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>

            </div>

          </section>


          {/* Account settings */}
          <section className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">

            <div className="mb-6">
              <h3 className="text-xl font-bold text-slate-800">
                Account Settings
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Manage account status and security settings.
              </p>
            </div>


            <div className="space-y-5">

              {/* Active */}
              <label className="flex cursor-pointer items-start gap-4 rounded-xl border border-slate-200 p-4 transition hover:bg-slate-50">

                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                  className="mt-1 h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />

                <div>
                  <p className="font-semibold text-slate-800">
                    Active account
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Allow this user to access the system.
                  </p>
                </div>

              </label>


              {/* Staff */}
              <label className="flex cursor-pointer items-start gap-4 rounded-xl border border-slate-200 p-4 transition hover:bg-slate-50">

                <input
                  type="checkbox"
                  name="is_staff"
                  checked={formData.is_staff}
                  onChange={handleChange}
                  className="mt-1 h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />

                <div>
                  <p className="font-semibold text-slate-800">
                    Staff access
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Give this user Django staff access.
                  </p>
                </div>

              </label>


              {/* Password reset */}
              <label className="flex cursor-pointer items-start gap-4 rounded-xl border border-slate-200 p-4 transition hover:bg-slate-50">

                <input
                  type="checkbox"
                  name="must_reset_password"
                  checked={formData.must_reset_password}
                  onChange={handleChange}
                  className="mt-1 h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />

                <div>
                  <p className="font-semibold text-slate-800">
                    Require password reset
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Require the user to change their password before normal access.
                  </p>
                </div>

              </label>


              {/* TOTP required */}
              <label className="flex cursor-pointer items-start gap-4 rounded-xl border border-slate-200 p-4 transition hover:bg-slate-50">

                <input
                  type="checkbox"
                  name="requires_totp"
                  checked={formData.requires_totp}
                  onChange={handleChange}
                  className="mt-1 h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />

                <div>
                  <p className="font-semibold text-slate-800">
                    Require TOTP
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Require two-factor authentication for this account.
                  </p>
                </div>

              </label>


              {/* TOTP enabled */}
              <label className="flex cursor-pointer items-start gap-4 rounded-xl border border-slate-200 p-4 transition hover:bg-slate-50">

                <input
                  type="checkbox"
                  name="totp_enabled"
                  checked={formData.totp_enabled}
                  onChange={handleChange}
                  className="mt-1 h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />

                <div>
                  <p className="font-semibold text-slate-800">
                    TOTP enabled
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Mark TOTP as enabled for this account.
                  </p>
                </div>

              </label>

            </div>

          </section>


          {/* Actions */}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

            <button
              type="button"
              onClick={() => navigate(`/admin/users/${id}`)}
              disabled={saving}
              className="rounded-xl bg-slate-100 px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-200 disabled:opacity-60"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>

          </div>

        </form>

      </main>

    </div>
  )
}