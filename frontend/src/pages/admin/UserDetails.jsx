import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

const API_BASE_URL = '/api/accounts'

export default function UserDetails() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [deactivating, setDeactivating] = useState(false)
  const [success, setSuccess] = useState('')

  const [showDeactivateModal, setShowDeactivateModal] = useState(false)

  useEffect(() => {
    fetchUser()
  }, [id])

  async function fetchUser() {
    setLoading(true)
    setError('')
    setSuccess('')

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
          'You do not have permission to view this user.'
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
          'Failed to load user details.'
        )
      }

      setUser(data)
    } catch (err) {
      console.error('User details error:', err)

      setError(
        err.message ||
        'Unable to load user details.'
      )
    } finally {
      setLoading(false)
    }
  }

  function formatRole(role) {
    return role
      .replaceAll('_', ' ')
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase()
      )
  }

  function formatDate(dateValue) {
    if (!dateValue) {
      return 'Never'
    }

    const date = new Date(dateValue)

    if (Number.isNaN(date.getTime())) {
      return '—'
    }

    return date.toLocaleString()
  }

  function openDeactivateModal() {
    setError('')
    setSuccess('')
    setShowDeactivateModal(true)
  }

  function closeDeactivateModal() {
    if (!deactivating) {
      setShowDeactivateModal(false)
    }
  }

  async function handleDeactivate() {
    const token = localStorage.getItem('authToken')

    if (!token) {
      navigate('/login')
      return
    }

    setDeactivating(true)
    setError('')
    setSuccess('')

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
            is_active: false,
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
          'You do not have permission to deactivate this user.'
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
          'Failed to deactivate user.'
        )
      }

      const updatedUser = data.user || data

      setUser(updatedUser)
      setSuccess('User deactivated successfully.')
      setShowDeactivateModal(false)
    } catch (err) {
      console.error('Deactivate user error:', err)

      setError(
        err.message ||
        'Unable to deactivate user.'
      )
    } finally {
      setDeactivating(false)
    }
  }

  async function handleReactivate() {
    const token = localStorage.getItem('authToken')

    if (!token) {
      navigate('/login')
      return
    }

    setDeactivating(true)
    setError('')
    setSuccess('')

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
            is_active: true,
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
          'You do not have permission to reactivate this user.'
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
          'Failed to reactivate user.'
        )
      }

      const updatedUser = data.user || data

      setUser(updatedUser)
      setSuccess('User reactivated successfully.')
    } catch (err) {
      console.error('Reactivate user error:', err)

      setError(
        err.message ||
        'Unable to reactivate user.'
      )
    } finally {
      setDeactivating(false)
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
              User Details
            </p>

          </div>
        </header>

        <main className="flex min-h-[70vh] items-center justify-center px-6">

          <div className="text-center">

            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600"></div>

            <p className="text-sm text-slate-500">
              Loading user details...
            </p>

          </div>

        </main>

      </div>
    )
  }

  if (error && !user) {
    return (
      <div className="min-h-screen bg-slate-50">

        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">

            <div>
              <h1 className="text-xl font-bold text-slate-800">
                School Management System
              </h1>

              <p className="text-sm text-slate-500">
                User Details
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate('/admin/users')}
              className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-200"
            >
              ← Users
            </button>

          </div>
        </header>

        <main className="mx-auto max-w-3xl px-6 py-10">

          <div className="rounded-2xl border border-red-200 bg-red-50 p-6">

            <h2 className="text-lg font-bold text-red-800">
              Unable to load user
            </h2>

            <p className="mt-2 text-sm text-red-700">
              {error}
            </p>

          </div>

        </main>

      </div>
    )
  }

  if (!user) {
    return null
  }

  const roles =
    Array.isArray(user.role_names) &&
    user.role_names.length > 0
      ? user.role_names
      : user.is_superuser
        ? ['admin']
        : []

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
            onClick={() => navigate('/admin/users')}
            className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-200"
          >
            ← Users
          </button>

        </div>

      </header>


      {/* Main */}
      <main className="mx-auto max-w-5xl px-6 py-10">

        {/* Page title */}
        <div className="mb-8">

          <p className="text-sm font-semibold uppercase tracking-widest text-blue-600">
            Administration
          </p>

          <h2 className="mt-2 text-3xl font-bold text-slate-900">
            User Details
          </h2>

          <p className="mt-2 text-slate-500">
            View and manage this user's account information.
          </p>

        </div>


        {/* Error message */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4">

            <p className="text-sm font-medium text-red-700">
              {error}
            </p>

          </div>
        )}


        {/* Success message */}
        {success && (
          <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-5 py-4">

            <p className="text-sm font-medium text-green-700">
              {success}
            </p>

          </div>
        )}


        {/* User summary */}
        <div className="mb-8 rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">

          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">

            {/* Avatar */}
            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-blue-100 text-3xl font-bold text-blue-700">
              {(
                user.first_name?.charAt(0) ||
                user.username?.charAt(0) ||
                'U'
              ).toUpperCase()}
            </div>

            <div className="min-w-0">

              <h3 className="text-2xl font-bold text-slate-800">
                {user.full_name ||
                  user.username ||
                  'Unknown User'}
              </h3>

              <p className="mt-1 text-slate-500">
                @{user.username || 'unknown'}
              </p>

              <p className="mt-1 break-all text-sm text-slate-500">
                {user.email || '—'}
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-2">

                {roles.length > 0 ? (
                  roles.map((role) => (
                    <span
                      key={role}
                      className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700"
                    >
                      {formatRole(role)}
                    </span>
                  ))
                ) : (
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                    No role assigned
                  </span>
                )}

                {user.is_active ? (
                  <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                    Active
                  </span>
                ) : (
                  <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
                    Inactive
                  </span>
                )}

              </div>

            </div>

          </div>

        </div>


        {/* Information grid */}
        <div className="grid gap-6 md:grid-cols-2">

          {/* Personal information */}
          <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">

            <h3 className="text-lg font-bold text-slate-800">
              Personal Information
            </h3>

            <div className="mt-6 space-y-4">

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  First Name
                </p>

                <p className="mt-1 text-sm text-slate-700">
                  {user.first_name || '—'}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Last Name
                </p>

                <p className="mt-1 text-sm text-slate-700">
                  {user.last_name || '—'}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Username
                </p>

                <p className="mt-1 text-sm text-slate-700">
                  {user.username || '—'}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Email
                </p>

                <p className="mt-1 break-all text-sm text-slate-700">
                  {user.email || '—'}
                </p>
              </div>

            </div>

          </section>


          {/* Account status */}
          <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">

            <h3 className="text-lg font-bold text-slate-800">
              Account Status
            </h3>

            <div className="mt-6 space-y-4">

              <div className="flex items-center justify-between gap-4">

                <span className="text-sm text-slate-600">
                  Account
                </span>

                {user.is_active ? (
                  <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                    Active
                  </span>
                ) : (
                  <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
                    Inactive
                  </span>
                )}

              </div>


              <div className="flex items-center justify-between gap-4">

                <span className="text-sm text-slate-600">
                  Staff
                </span>

                <span className="text-sm font-semibold text-slate-800">
                  {user.is_staff ? 'Yes' : 'No'}
                </span>

              </div>


              <div className="flex items-center justify-between gap-4">

                <span className="text-sm text-slate-600">
                  Superuser
                </span>

                <span className="text-sm font-semibold text-slate-800">
                  {user.is_superuser ? 'Yes' : 'No'}
                </span>

              </div>


              <div className="flex items-center justify-between gap-4">

                <span className="text-sm text-slate-600">
                  Password reset required
                </span>

                <span className="text-sm font-semibold text-slate-800">
                  {user.must_reset_password ? 'Yes' : 'No'}
                </span>

              </div>


              <div className="flex items-center justify-between gap-4">

                <span className="text-sm text-slate-600">
                  TOTP required
                </span>

                <span className="text-sm font-semibold text-slate-800">
                  {user.requires_totp ? 'Yes' : 'No'}
                </span>

              </div>


              <div className="flex items-center justify-between gap-4">

                <span className="text-sm text-slate-600">
                  TOTP enabled
                </span>

                <span className="text-sm font-semibold text-slate-800">
                  {user.totp_enabled ? 'Yes' : 'No'}
                </span>

              </div>

            </div>

          </section>


          {/* Account dates */}
          <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">

            <h3 className="text-lg font-bold text-slate-800">
              Account Dates
            </h3>

            <div className="mt-6 space-y-4">

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Date Joined
                </p>

                <p className="mt-1 text-sm text-slate-700">
                  {formatDate(user.date_joined)}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Last Login
                </p>

                <p className="mt-1 text-sm text-slate-700">
                  {formatDate(user.last_login)}
                </p>
              </div>

            </div>

          </section>


          {/* Roles */}
          <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">

            <h3 className="text-lg font-bold text-slate-800">
              Assigned Roles
            </h3>

            <div className="mt-6">

              {roles.length > 0 ? (
                <div className="flex flex-wrap gap-3">

                  {roles.map((role) => (
                    <span
                      key={role}
                      className="rounded-xl bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700"
                    >
                      {formatRole(role)}
                    </span>
                  ))}

                </div>
              ) : (
                <div className="rounded-xl bg-slate-50 px-4 py-4 text-sm text-slate-500">
                  No application role has been assigned to this user.
                </div>
              )}

            </div>

          </section>

        </div>


        {/* Admin actions */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end">

          <button
            type="button"
            onClick={() => navigate('/admin/users')}
            className="rounded-xl bg-slate-100 px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-200"
          >
            Back to Users
          </button>

          <button
            type="button"
            onClick={() =>
              navigate(`/admin/users/${user.id}/edit`)
            }
            className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
          >
            Edit User
          </button>

          {user.is_active ? (
            <button
              type="button"
              onClick={openDeactivateModal}
              disabled={deactivating}
              className="rounded-xl bg-red-600 px-6 py-3 font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {deactivating
                ? 'Deactivating...'
                : 'Deactivate User'}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleReactivate}
              disabled={deactivating}
              className="rounded-xl bg-green-600 px-6 py-3 font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {deactivating
                ? 'Reactivating...'
                : 'Reactivate User'}
            </button>
          )}

        </div>

      </main>


      {/* Deactivate confirmation modal */}
      {showDeactivateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">

          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">

            <h3 className="text-xl font-bold text-slate-800">
              Deactivate User
            </h3>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              Are you sure you want to deactivate{' '}
              <span className="font-semibold text-slate-800">
                {user.full_name || user.username}
              </span>
              ?
            </p>

            <p className="mt-2 text-sm text-slate-500">
              The account will be marked as inactive and should no longer
              be allowed to log in.
            </p>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

              <button
                type="button"
                onClick={closeDeactivateModal}
                disabled={deactivating}
                className="rounded-xl bg-slate-100 px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-200 disabled:opacity-60"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDeactivate}
                disabled={deactivating}
                className="rounded-xl bg-red-600 px-5 py-3 font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deactivating
                  ? 'Deactivating...'
                  : 'Yes, Deactivate'}
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  )
}