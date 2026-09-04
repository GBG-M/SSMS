import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { adminForceUserPasswordReset, getUserLoginHistory } from '../../services/authService'

const API_BASE_URL = '/api/accounts'

export default function UserDetails() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [user, setUser] = useState(null)
  const [loginHistory, setLoginHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [actionLoading, setActionLoading] = useState(false)
  const [showDeactivateModal, setShowDeactivateModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  useEffect(() => {
    fetchUserData()
  }, [id])

  async function fetchUserData() {
    setLoading(true)
    setError('')
    setSuccess('')

    const token = localStorage.getItem('authToken')
    if (!token) {
      navigate('/login')
      return
    }

    try {
      const [userRes, historyData] = await Promise.all([
        fetch(`${API_BASE_URL}/users/${id}/`, {
          headers: {
            Authorization: `Token ${token}`,
            'Content-Type': 'application/json',
          },
        }),
        getUserLoginHistory(id).catch(() => []),
      ])

      const data = await userRes.json()

      if (userRes.status === 401) {
        localStorage.removeItem('authToken')
        navigate('/login')
        return
      }

      if (!userRes.ok) {
        throw new Error(data.detail || data.error || 'Failed to load user details.')
      }

      setUser(data)
      setLoginHistory(historyData)
    } catch (err) {
      console.error('User details error:', err)
      setError(err.message || 'Unable to load user details.')
    } finally {
      setLoading(false)
    }
  }

  function formatRole(role) {
    return role
      .replaceAll('_', ' ')
      .replace(/\b\w/g, (letter) => letter.toUpperCase())
  }

  function formatDate(dateValue) {
    if (!dateValue) return 'Never'
    const date = new Date(dateValue)
    if (Number.isNaN(date.getTime())) return '—'
    return date.toLocaleString()
  }

  async function handleToggleStatus(newActiveStatus) {
    const token = localStorage.getItem('authToken')
    if (!token) return

    setActionLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch(`${API_BASE_URL}/users/${id}/`, {
        method: 'PATCH',
        headers: {
          Authorization: `Token ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_active: newActiveStatus }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.detail || data.error || 'Status update failed.')
      }

      setUser(data)
      setSuccess(`User account ${newActiveStatus ? 'activated' : 'deactivated'} successfully.`)
      setShowDeactivateModal(false)
    } catch (err) {
      setError(err.message || 'Failed to update user status.')
    } finally {
      setActionLoading(false)
    }
  }

  async function handleForcePasswordReset() {
    setActionLoading(true)
    setError('')
    setSuccess('')

    try {
      const res = await adminForceUserPasswordReset(id)
      setSuccess(res.message || 'Mandatory password reset enabled for this user.')
      setUser((prev) => ({ ...prev, must_reset_password: true }))
    } catch (err) {
      setError(err.message || 'Failed to trigger password reset.')
    } finally {
      setActionLoading(false)
    }
  }

  async function handleDeleteUser() {
    const token = localStorage.getItem('authToken')
    if (!token) return

    setActionLoading(true)
    setError('')

    try {
      const response = await fetch(`${API_BASE_URL}/users/${id}/`, {
        method: 'DELETE',
        headers: {
          Authorization: `Token ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || data.detail || 'Failed to delete user.')
      }

      navigate('/users', { replace: true })
    } catch (err) {
      setError(err.message || 'Unable to delete user.')
      setShowDeleteModal(false)
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600"></div>
          <p className="text-sm text-slate-500">Loading user profile...</p>
        </div>
      </div>
    )
  }

  const displayName =
    user?.full_name ||
    `${user?.first_name || ''} ${user?.last_name || ''}`.trim() ||
    user?.username ||
    'User Details'

  const roles = user?.role_names && user.role_names.length > 0 ? user.role_names : ['No Role Assigned']

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <div>
            <h1 className="text-xl font-bold text-slate-800">SSMS Administration</h1>
            <p className="text-xs text-slate-500">User Details & Access Governance</p>
          </div>

          <button
            type="button"
            onClick={() => navigate('/users')}
            className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition"
          >
            ← Back to Users List
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-6xl px-6 py-10">
        {/* Banner */}
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
              User Overview
            </p>
            <h2 className="mt-1 text-3xl font-extrabold text-slate-900 tracking-tight">
              {displayName}
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              UUID: <span className="font-mono text-slate-700">{user?.id}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => navigate(`/admin/users/${id}/edit`)}
              className="rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow hover:bg-blue-700 transition"
            >
              ✏️ Edit User & Roles
            </button>

            {user?.is_active ? (
              <button
                onClick={() => setShowDeactivateModal(true)}
                className="rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-bold text-white shadow hover:bg-amber-600 transition"
              >
                ⏸️ Deactivate
              </button>
            ) : (
              <button
                onClick={() => handleToggleStatus(true)}
                disabled={actionLoading}
                className="rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow hover:bg-emerald-700 transition"
              >
                ▶️ Reactivate
              </button>
            )}

            <button
              onClick={() => setShowDeleteModal(true)}
              className="rounded-xl bg-red-600 px-4 py-2.5 text-xs font-bold text-white shadow hover:bg-red-700 transition"
            >
              🗑️ Delete
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs text-red-700 shadow-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-2xl border border-green-200 bg-green-50 p-4 text-xs text-green-700 shadow-sm">
            {success}
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left Column: User Summary Card */}
          <div className="space-y-6">
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 text-center">
              <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 text-3xl font-bold text-white shadow-md">
                {(displayName.charAt(0) || 'U').toUpperCase()}
              </div>

              <h3 className="text-xl font-bold text-slate-900">{displayName}</h3>
              <p className="text-xs text-slate-500 mt-0.5">{user?.email}</p>

              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <span
                  className={`rounded-full px-3 py-0.5 text-xs font-bold ${
                    user?.is_active
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {user?.is_active ? 'Active' : 'Inactive'}
                </span>

                {user?.is_staff && (
                  <span className="rounded-full bg-purple-100 px-3 py-0.5 text-xs font-bold text-purple-800">
                    Staff Member
                  </span>
                )}
              </div>

              {/* Roles Badges */}
              <div className="mt-5 border-t border-slate-100 pt-4 text-left">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Assigned Roles
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {roles.map((r) => (
                    <span
                      key={r}
                      className="rounded-lg bg-blue-50 border border-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700"
                    >
                      🛡️ {formatRole(r)}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Actions Card */}
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Security Governance
              </h4>

              <button
                type="button"
                onClick={handleForcePasswordReset}
                disabled={actionLoading || user?.must_reset_password}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-left text-xs font-semibold text-slate-700 hover:bg-slate-100 transition disabled:opacity-60"
              >
                <p className="font-bold text-slate-900">
                  {user?.must_reset_password ? '✅ Reset Enforced' : '🔑 Force Password Reset'}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {user?.must_reset_password
                    ? 'User must change password upon next login.'
                    : 'Require user to change password on next login.'}
                </p>
              </button>
            </div>
          </div>

          {/* Right Column: Detailed Info & Audit Trail */}
          <div className="lg:col-span-2 space-y-6">
            {/* Account Details */}
            <div className="rounded-2xl bg-white p-6 sm:p-8 shadow-sm ring-1 ring-slate-200">
              <h3 className="text-lg font-bold text-slate-900 mb-5 border-b border-slate-100 pb-3">
                Account Information
              </h3>

              <div className="grid gap-4 sm:grid-cols-2 text-xs">
                <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-100">
                  <p className="text-slate-400 font-semibold uppercase">Username</p>
                  <p className="font-bold text-slate-800 text-sm mt-0.5">{user?.username}</p>
                </div>

                <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-100">
                  <p className="text-slate-400 font-semibold uppercase">Email Address</p>
                  <p className="font-bold text-slate-800 text-sm mt-0.5">{user?.email}</p>
                </div>

                <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-100">
                  <p className="text-slate-400 font-semibold uppercase">First Name</p>
                  <p className="font-bold text-slate-800 text-sm mt-0.5">{user?.first_name || '—'}</p>
                </div>

                <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-100">
                  <p className="text-slate-400 font-semibold uppercase">Last Name</p>
                  <p className="font-bold text-slate-800 text-sm mt-0.5">{user?.last_name || '—'}</p>
                </div>

                <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-100">
                  <p className="text-slate-400 font-semibold uppercase">Date Joined</p>
                  <p className="font-bold text-slate-800 text-sm mt-0.5">{formatDate(user?.date_joined)}</p>
                </div>

                <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-100">
                  <p className="text-slate-400 font-semibold uppercase">Last Login</p>
                  <p className="font-bold text-slate-800 text-sm mt-0.5">{formatDate(user?.last_login)}</p>
                </div>
              </div>
            </div>

            {/* Login History / Audit Trail */}
            <div className="rounded-2xl bg-white p-6 sm:p-8 shadow-sm ring-1 ring-slate-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Security & Login Audit Trail</h3>
                  <p className="text-xs text-slate-500">Recent authentication events logged for this account</p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                  {loginHistory.length} Logged Events
                </span>
              </div>

              {loginHistory.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider bg-slate-50/50">
                        <th className="px-4 py-3 font-semibold">Timestamp</th>
                        <th className="px-4 py-3 font-semibold">IP Address</th>
                        <th className="px-4 py-3 font-semibold text-center">Status</th>
                        <th className="px-4 py-3 font-semibold">User Agent</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {loginHistory.slice(0, 10).map((h) => (
                        <tr key={h.id} className="hover:bg-slate-50/60 transition">
                          <td className="px-4 py-3 text-slate-800 font-medium">
                            {formatDate(h.login_time)}
                          </td>
                          <td className="px-4 py-3 text-slate-600 font-mono">
                            {h.ip_address}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                                h.is_successful
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {h.is_successful ? 'SUCCESS' : 'FAILED'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-500 truncate max-w-[180px]">
                            {h.user_agent || 'Web Client'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-slate-400">
                  No login history recorded yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Deactivate Modal */}
      {showDeactivateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900">Deactivate User Account</h3>
            <p className="mt-2 text-xs text-slate-500 leading-relaxed">
              Are you sure you want to deactivate <span className="font-bold text-slate-800">{user?.email}</span>?
              The user will not be able to log in until an administrator reactivates the account.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeactivateModal(false)}
                className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleToggleStatus(false)}
                disabled={actionLoading}
                className="rounded-xl bg-amber-600 px-5 py-2 text-xs font-bold text-white shadow hover:bg-amber-700"
              >
                {actionLoading ? 'Deactivating...' : 'Confirm Deactivate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-red-600">Delete User Account</h3>
            <p className="mt-2 text-xs text-slate-500 leading-relaxed">
              This action is permanent and cannot be undone. Are you sure you want to delete <span className="font-bold text-slate-800">{user?.email}</span>?
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteUser}
                disabled={actionLoading}
                className="rounded-xl bg-red-600 px-5 py-2 text-xs font-bold text-white shadow hover:bg-red-700"
              >
                {actionLoading ? 'Deleting...' : 'Permanently Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}