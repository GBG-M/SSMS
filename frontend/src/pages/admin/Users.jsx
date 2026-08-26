import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const API_BASE_URL = '/api/accounts'

export default function Users() {
  const navigate = useNavigate()

  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    fetchUsers()
  }, [])

  async function fetchUsers() {
    setLoading(true)
    setError('')

    const token = localStorage.getItem('authToken')

    if (!token) {
      navigate('/login')
      return
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/users/`,
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
          'You do not have permission to access user management.'
        )
        return
      }

      if (!response.ok) {
        throw new Error(
          data.detail ||
          data.error ||
          'Failed to load users.'
        )
      }

      /*
       * Your current backend response uses DRF pagination:
       *
       * {
       *   count: 1,
       *   next: null,
       *   previous: null,
       *   results: [...]
       * }
       *
       * The fallback also supports the custom "users" response
       * your backend view can return when pagination is disabled.
       */
      const userList = Array.isArray(data.results)
        ? data.results
        : Array.isArray(data.users)
          ? data.users
          : []

      setUsers(userList)
    } catch (err) {
      console.error('Users request error:', err)

      setError(
        err.message ||
        'Unable to load users.'
      )
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = useMemo(() => {
    const searchValue = search.trim().toLowerCase()

    return users.filter((user) => {
      const fullName = user.full_name || ''
      const username = user.username || ''
      const email = user.email || ''

      const matchesSearch =
        !searchValue ||
        username.toLowerCase().includes(searchValue) ||
        email.toLowerCase().includes(searchValue) ||
        fullName.toLowerCase().includes(searchValue)

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && user.is_active) ||
        (statusFilter === 'inactive' && !user.is_active)

      return matchesSearch && matchesStatus
    })
  }, [users, search, statusFilter])

  function getRoles(user) {
    if (
      Array.isArray(user.role_names) &&
      user.role_names.length > 0
    ) {
      return user.role_names
    }

    if (user.is_superuser) {
      return ['admin']
    }

    return ['No role']
  }

  function formatRole(role) {
    return role
      .replaceAll('_', ' ')
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase()
      )
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
              User Management
            </p>
          </div>
        </header>

        <main className="flex min-h-[70vh] items-center justify-center px-6">
          <div className="text-center">

            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600"></div>

            <p className="text-sm text-slate-500">
              Loading users...
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
            onClick={() => navigate('/dashboard')}
            className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-200"
          >
            ← Dashboard
          </button>

        </div>

      </header>


      {/* Main */}
      <main className="mx-auto max-w-7xl px-6 py-10">

        {/* Page heading */}
        <div className="mb-8">

          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">

            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-blue-600">
                Administration
              </p>

              <h2 className="mt-2 text-3xl font-bold text-slate-900">
                User Management
              </h2>

              <p className="mt-2 text-slate-500">
                View and manage accounts registered in the school system.
              </p>
            </div>

            <div className="rounded-xl bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700">
              {users.length} user{users.length === 1 ? '' : 's'}
            </div>

          </div>

        </div>


        {/* Error */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4">

            <p className="text-sm font-medium text-red-700">
              {error}
            </p>

          </div>
        )}


        {/* Controls */}
        <div className="mb-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">

          <div className="grid gap-4 md:grid-cols-[1fr_180px]">

            {/* Search */}
            <div>

              <label
                htmlFor="user-search"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Search users
              </label>

              <input
                id="user-search"
                type="search"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search by name, username, or email..."
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />

            </div>


            {/* Status */}
            <div>

              <label
                htmlFor="status-filter"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Status
              </label>

              <select
                id="status-filter"
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value)
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              >
                <option value="all">
                  All users
                </option>

                <option value="active">
                  Active
                </option>

                <option value="inactive">
                  Inactive
                </option>
              </select>

            </div>

          </div>

        </div>


        {/* User table */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">

          <div className="overflow-x-auto">

            <table className="min-w-full">

              <thead className="border-b border-slate-200 bg-slate-50">

                <tr>

                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                    User
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                    Email
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                    Role
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                    Status
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                    Account
                  </th>

                </tr>

              </thead>


              <tbody className="divide-y divide-slate-100">

                {filteredUsers.length === 0 ? (

                  <tr>

                    <td
                      colSpan="5"
                      className="px-6 py-12 text-center"
                    >

                      <div className="mx-auto max-w-md">

                        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-2xl">
                          👥
                        </div>

                        <h3 className="text-lg font-semibold text-slate-800">
                          No users found
                        </h3>

                        <p className="mt-2 text-sm text-slate-500">
                          Try changing your search or status filter.
                        </p>

                      </div>

                    </td>

                  </tr>

                ) : (

                  filteredUsers.map((user) => {

                    const roles = getRoles(user)

                    return (
                      <tr
                        key={user.id}
                        className="transition hover:bg-slate-50"
                      >

                        {/* User */}
                        <td className="px-6 py-5">

                          <div className="flex items-center gap-3">

                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">
                              {(
                                user.first_name?.charAt(0) ||
                                user.username?.charAt(0) ||
                                'U'
                              ).toUpperCase()}
                            </div>

                            <div>

                              <p className="font-semibold text-slate-800">
                                {user.full_name ||
                                  user.username ||
                                  'Unknown User'}
                              </p>

                              <p className="text-sm text-slate-500">
                                @{user.username || 'unknown'}
                              </p>

                            </div>

                          </div>

                        </td>


                        {/* Email */}
                        <td className="px-6 py-5 text-sm text-slate-600">
                          {user.email || '—'}
                        </td>


                        {/* Role */}
                        <td className="px-6 py-5">

                          <div className="flex flex-wrap gap-2">

                            {roles.map((role) => (
                              <span
                                key={role}
                                className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700"
                              >
                                {formatRole(role)}
                              </span>
                            ))}

                          </div>

                        </td>


                        {/* Status */}
                        <td className="px-6 py-5">

                          {user.is_active ? (
                            <span className="inline-flex items-center rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                              <span className="mr-2 h-2 w-2 rounded-full bg-green-500"></span>
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
                              <span className="mr-2 h-2 w-2 rounded-full bg-red-500"></span>
                              Inactive
                            </span>
                          )}

                        </td>


                        {/* Account */}
                        <td className="px-6 py-5">

                          <div className="text-xs text-slate-500">

                            {user.is_superuser && (
                              <p className="font-semibold text-purple-600">
                                Superuser
                              </p>
                            )}

                            {user.is_staff && (
                              <p className="font-semibold text-slate-600">
                                Staff
                              </p>
                            )}

                            {!user.is_superuser &&
                              !user.is_staff && (
                                <p>
                                  Standard user
                                </p>
                            )}

                          </div>

                        </td>

                      </tr>
                    )
                  })

                )}

              </tbody>

            </table>

          </div>

        </div>


        {/* Footer information */}
        <div className="mt-5 flex flex-col justify-between gap-2 text-sm text-slate-500 sm:flex-row">

          <p>
            Showing {filteredUsers.length} of {users.length} users
          </p>

          <button
            type="button"
            onClick={fetchUsers}
            className="font-semibold text-blue-600 transition hover:text-blue-700"
          >
            Refresh users
          </button>

        </div>

      </main>

    </div>
  )
}