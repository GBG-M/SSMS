import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createUser, provisionStudentAccount } from '../../services/authService'

const API_BASE_URL = '/api/accounts'

export default function Users() {
  const navigate = useNavigate()

  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // Registration Modal State
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false)
  const [registerTab, setRegisterTab] = useState('staff') // 'staff' | 'student'
  const [registerLoading, setRegisterLoading] = useState(false)
  const [registerError, setRegisterError] = useState('')
  const [registerSuccess, setRegisterSuccess] = useState('')
  const [createdCredentials, setCreatedCredentials] = useState(null)
  const [copied, setCopied] = useState(false)
  const [showStaffPassword, setShowStaffPassword] = useState(false)

  const calculatePasswordStrength = (pwd) => {
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

  const printCredentialsVoucher = (creds) => {
    if (!creds) return
    const printWindow = window.open('', '_blank', 'width=700,height=800')
    if (!printWindow) {
      alert('Please allow popups to print the credentials voucher.')
      return
    }

    const isStudent = creds.type === 'Student & Guardian'
    const content = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>SSMS Credentials Voucher - ${creds.name}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #1e293b; line-height: 1.5; }
          .header { text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 16px; margin-bottom: 24px; }
          .title { font-size: 20px; font-weight: 800; color: #1e293b; margin: 0; }
          .subtitle { font-size: 12px; color: #64748b; margin-top: 4px; }
          .badge { display: inline-block; padding: 4px 12px; font-size: 11px; font-weight: 700; border-radius: 9999px; background: #dbeafe; color: #1e40af; margin-top: 8px; }
          .card { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 12px; padding: 18px; margin-bottom: 18px; }
          .card-title { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #475569; margin-bottom: 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; }
          .row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px; }
          .label { color: #64748b; }
          .value { font-weight: 600; color: #0f172a; }
          .mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
          .password-box { background: #fef3c7; border: 1px solid #fde68a; border-radius: 8px; padding: 10px 14px; margin-top: 10px; display: flex; justify-content: space-between; align-items: center; }
          .password-box .pwd { font-size: 16px; font-weight: 800; color: #78350f; font-family: monospace; letter-spacing: 0.1em; }
          .footer { margin-top: 32px; border-top: 1px dashed #cbd5e1; padding-top: 16px; font-size: 11px; color: #64748b; }
          .notice { font-size: 11px; color: #94a3b8; margin-top: 4px; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 class="title">SMART SCHOOL MANAGEMENT SYSTEM</h1>
          <div class="subtitle">Official Institutional Onboarding & Credentials Voucher</div>
          <div class="badge">${creds.role} ONBOARDING</div>
        </div>

        ${isStudent ? `
          <div class="card">
            <div class="card-title">👨‍🎓 Student Account Details</div>
            <div class="row"><span class="label">Full Name:</span><span class="value">${creds.name}</span></div>
            <div class="row"><span class="label">Student ID:</span><span class="value mono">${creds.studentId}</span></div>
            <div class="row"><span class="label">Portal Login / Email:</span><span class="value">${creds.email}</span></div>
            <div class="row"><span class="label">Username:</span><span class="value mono">${creds.studentUsername || 'N/A'}</span></div>
            ${creds.studentTemporaryPassword ? `
              <div class="password-box">
                <span class="label">Temporary Initial Password:</span>
                <span class="pwd">${creds.studentTemporaryPassword}</span>
              </div>
            ` : ''}
          </div>

          <div class="card">
            <div class="card-title">👨‍👩‍👧 Guardian / Parent Account Details</div>
            <div class="row"><span class="label">Guardian Name:</span><span class="value">${creds.parentName || 'Parent'}</span></div>
            <div class="row"><span class="label">Guardian Email:</span><span class="value">${creds.parentEmail}</span></div>
            ${creds.parentIsExisting ? `
              <div class="row"><span class="label">Account Status:</span><span class="value" style="color: #059669;">Existing Active Portal Account (Password Unchanged)</span></div>
            ` : `
              <div class="row"><span class="label">Username:</span><span class="value mono">${creds.parentUsername || 'N/A'}</span></div>
              ${creds.parentTemporaryPassword ? `
                <div class="password-box">
                  <span class="label">Temporary Initial Password:</span>
                  <span class="pwd">${creds.parentTemporaryPassword}</span>
                </div>
              ` : ''}
            `}
          </div>
        ` : `
          <div class="card">
            <div class="card-title">👨‍🏫 Staff / Faculty Account Details</div>
            <div class="row"><span class="label">Full Name:</span><span class="value">${creds.name}</span></div>
            <div class="row"><span class="label">Institutional Email:</span><span class="value">${creds.email}</span></div>
            <div class="row"><span class="label">Assigned Role:</span><span class="value">${creds.role}</span></div>
            <div class="row"><span class="label">Username:</span><span class="value mono">${creds.username || 'N/A'}</span></div>
            ${creds.temporaryPassword ? `
              <div class="password-box">
                <span class="label">Temporary Initial Password:</span>
                <span class="pwd">${creds.temporaryPassword}</span>
              </div>
            ` : ''}
          </div>
        `}

        <div class="footer">
          <strong>Security & Privacy Governance Notice:</strong>
          <div class="notice">
            • This credentials slip contains confidential initial access keys generated under institutional FERPA/GDPR compliance.<br/>
            • The temporary password is valid for the initial login session only. The user will be automatically prompted to establish their private permanent password upon first access.<br/>
            • Date Dispatched: ${new Date().toLocaleDateString()} | SSMS Registrar & IT Desk
          </div>
        </div>
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `
    printWindow.document.write(content)
    printWindow.document.close()
  }

  // Staff Form
  const [staffForm, setStaffForm] = useState({
    email: '',
    first_name: '',
    last_name: '',
    username: '',
    role: 'teacher',
    password: '',
    autoPassword: true,
  })

  // Student Form
  const [studentForm, setStudentForm] = useState({
    student_id: '',
    first_name: '',
    last_name: '',
    email: '',
    grade_level: 'Grade 10',
    program: 'General Secondary',
    parent_email: '',
    parent_phone: '',
    parent_first_name: '',
    parent_last_name: '',
    relationship: 'Parent',
  })

  useEffect(() => {
    fetchUsers()
  }, [])

  const resetRegisterForms = () => {
    setStaffForm({
      email: '',
      first_name: '',
      last_name: '',
      username: '',
      role: 'teacher',
      password: '',
      autoPassword: true,
    })
    setStudentForm({
      student_id: '',
      first_name: '',
      last_name: '',
      email: '',
      grade_level: 'Grade 10',
      program: 'General Secondary',
      parent_email: '',
      parent_phone: '',
      parent_first_name: '',
      parent_last_name: '',
      relationship: 'Parent',
    })
    setCreatedCredentials(null)
    setRegisterError('')
    setRegisterSuccess('')
    setCopied(false)
  }

  const handleStaffSubmit = async (e) => {
    e.preventDefault()
    setRegisterLoading(true)
    setRegisterError('')
    setRegisterSuccess('')
    try {
      if (!staffForm.email || !staffForm.first_name || !staffForm.last_name) {
        throw new Error('Please fill in email, first name, and last name.')
      }

      const payload = {
        email: staffForm.email.trim(),
        first_name: staffForm.first_name.trim(),
        last_name: staffForm.last_name.trim(),
        username: staffForm.username.trim() || undefined,
        role_names: [staffForm.role],
        password: staffForm.autoPassword ? '' : staffForm.password.trim(),
        must_reset_password: true,
      }

      const res = await createUser(payload)
      setCreatedCredentials({
        name: `${payload.first_name} ${payload.last_name}`,
        email: payload.email,
        username: res.user?.username || payload.email.split('@')[0],
        role: staffForm.role.toUpperCase().replace('_', ' '),
        temporaryPassword: res.temporary_password,
        type: 'Staff / Faculty',
      })
      setRegisterSuccess(`Account for ${payload.first_name} ${payload.last_name} created successfully!`)
      fetchUsers()
    } catch (err) {
      setRegisterError(err.message || 'Failed to register staff user.')
    } finally {
      setRegisterLoading(false)
    }
  }

  const handleStudentSubmit = async (e) => {
    e.preventDefault()
    setRegisterLoading(true)
    setRegisterError('')
    setRegisterSuccess('')
    try {
      if (
        !studentForm.student_id ||
        !studentForm.first_name ||
        !studentForm.last_name ||
        !studentForm.email ||
        !studentForm.parent_email ||
        !studentForm.parent_phone
      ) {
        throw new Error('Please fill in Student ID, student names, student email, parent email, and parent phone.')
      }

      if (studentForm.email.trim().toLowerCase() === studentForm.parent_email.trim().toLowerCase()) {
        throw new Error('Student email and parent email cannot be identical. Each portal account requires a distinct email address.')
      }

      const payload = {
        student: {
          student_id: studentForm.student_id.trim(),
          first_name: studentForm.first_name.trim(),
          last_name: studentForm.last_name.trim(),
          email: studentForm.email.trim().toLowerCase(),
          grade_level: studentForm.grade_level,
          current_grade: studentForm.grade_level.replace(/\D/g, '') || '10',
          program: studentForm.program,
        },
        parent_email: studentForm.parent_email.trim().toLowerCase(),
        parent_phone: studentForm.parent_phone.trim(),
        parent_first_name: studentForm.parent_first_name.trim() || 'Parent',
        parent_last_name: studentForm.parent_last_name.trim() || studentForm.last_name.trim(),
        relationship: studentForm.relationship,
        campus_code: 'MAIN',
      }

      const res = await provisionStudentAccount(payload)
      setCreatedCredentials({
        name: `${payload.student.first_name} ${payload.student.last_name}`,
        studentId: res.student_id,
        email: res.student_email,
        studentUsername: res.student_username || res.student_email.split('@')[0],
        studentTemporaryPassword: res.student_temporary_password,
        parentName: `${payload.parent_first_name} ${payload.parent_last_name}`,
        parentEmail: res.parent_email,
        parentUsername: res.parent_username || res.parent_email.split('@')[0],
        parentTemporaryPassword: res.parent_temporary_password,
        parentIsExisting: res.parent_is_existing,
        role: 'STUDENT & PARENT',
        type: 'Student & Guardian',
        note: 'Welcome credentials generated with mandatory first-login password reset.',
      })
      setRegisterSuccess(`Student ${res.student_id} and guardian provisioned successfully!`)
      fetchUsers()
    } catch (err) {
      setRegisterError(err.message || 'Failed to provision student and guardian.')
    } finally {
      setRegisterLoading(false)
    }
  }

  const copyToClipboard = (text) => {
    if (!text) return
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    })
  }

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
       * Current backend response:
       *
       * {
       *   "count": 1,
       *   "next": null,
       *   "previous": null,
       *   "results": [...]
       * }
       *
       * The fallback also supports a "users" response.
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

      const childrenMatch = (user.children || []).some((c) =>
        (c.full_name && c.full_name.toLowerCase().includes(searchValue)) ||
        (c.student_id && c.student_id.toLowerCase().includes(searchValue))
      )
      const studentIdMatch = user.student_profile?.student_id
        ? user.student_profile.student_id.toLowerCase().includes(searchValue)
        : false

      const matchesSearch =
        !searchValue ||
        username.toLowerCase().includes(searchValue) ||
        email.toLowerCase().includes(searchValue) ||
        fullName.toLowerCase().includes(searchValue) ||
        childrenMatch ||
        studentIdMatch

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

            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-xl bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700">
                {users.length} user{users.length === 1 ? '' : 's'}
              </div>

              <button
                type="button"
                onClick={() => {
                  resetRegisterForms()
                  setIsRegisterModalOpen(true)
                }}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition hover:bg-blue-700"
              >
                <span>＋</span>
                <span>Register User</span>
              </button>
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

                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                    Actions
                  </th>

                </tr>

              </thead>


              <tbody className="divide-y divide-slate-100">

                {filteredUsers.length === 0 ? (

                  <tr>

                    <td
                      colSpan="6"
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

                            {/* Linked Children indicator for Parents */}
                            {user.children && user.children.length > 0 && (
                              <span
                                className="inline-flex items-center gap-1 rounded-full bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 text-[11px] font-bold text-indigo-700"
                                title={user.children.map((c) => `${c.full_name} (${c.student_id})`).join(', ')}
                              >
                                <span>👨‍👧</span>
                                <span>{user.children.length} {user.children.length === 1 ? 'Child' : 'Children'}</span>
                              </span>
                            )}

                            {/* Student ID badge for Students */}
                            {user.student_profile?.student_id && (
                              <span
                                className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-mono font-bold text-emerald-700"
                                title={`Grade: ${user.student_profile.current_grade} • Class: ${user.student_profile.current_class}`}
                              >
                                <span>🎓</span>
                                <span>{user.student_profile.student_id}</span>
                              </span>
                            )}

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


                        {/* Actions */}
                        <td className="px-6 py-5">

                          <button
                            type="button"
                            onClick={() =>
                              navigate(
                                `/admin/users/${user.id}`
                              )
                            }
                            className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100"
                          >
                            View Details
                          </button>

                        </td>

                      </tr>
                    )
                  })

                )}

              </tbody>

            </table>

          </div>

        </div>


        {/* Footer */}
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

        {/* ================= REGISTRATION MODAL ================= */}
        {isRegisterModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="relative w-full max-w-2xl rounded-2xl bg-white p-6 sm:p-8 shadow-2xl ring-1 ring-slate-200">
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setIsRegisterModalOpen(false)}
                className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-800"
              >
                ✕
              </button>

              {/* Modal Header */}
              <div className="mb-6">
                <span className="inline-flex items-center rounded-lg bg-blue-100 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-blue-800">
                  Institutional Registration
                </span>
                <h3 className="mt-2 text-xl sm:text-2xl font-bold text-slate-900">
                  Register Institutional Account
                </h3>
                <p className="mt-1 text-xs sm:text-sm text-slate-500">
                  Create verified staff accounts or provision student & guardian portals.
                </p>
              </div>

              {/* Success Result Display (Credentials Handover Card) */}
              {createdCredentials ? (
                <div className="space-y-5">
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-5 text-emerald-900">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white font-bold text-lg">
                        ✓
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-emerald-950">
                          Account Provisioned Successfully
                        </h4>
                        <p className="text-xs text-emerald-700">
                          {createdCredentials.type} account has been activated with mandatory first-login password reset.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Credentials Box */}
                  <div className="rounded-2xl bg-slate-50 border border-slate-200 p-5 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Account Details
                      </span>
                      <span className="inline-flex rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-800">
                        {createdCredentials.role}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-slate-400 block font-medium">Full Name</span>
                        <span className="text-slate-900 font-bold text-sm">{createdCredentials.name}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">Email Address</span>
                        <span className="text-slate-900 font-semibold">{createdCredentials.email}</span>
                      </div>
                      {createdCredentials.username && (
                        <div>
                          <span className="text-slate-400 block font-medium">Username</span>
                          <span className="text-slate-900 font-mono font-medium">{createdCredentials.username}</span>
                        </div>
                      )}
                      {createdCredentials.studentId && (
                        <div>
                          <span className="text-slate-400 block font-medium">Student ID</span>
                          <span className="text-slate-900 font-mono font-bold text-blue-600">{createdCredentials.studentId}</span>
                        </div>
                      )}
                      {createdCredentials.parentEmail && (
                        <div>
                          <span className="text-slate-400 block font-medium">Linked Parent Email</span>
                          <span className="text-slate-900 font-semibold">{createdCredentials.parentEmail}</span>
                        </div>
                      )}
                    </div>

                    {/* Student & Guardian Dual Onboarding Voucher */}
                    {createdCredentials.type === 'Student & Guardian' ? (
                      <div className="space-y-4 pt-2">
                        {/* Student Slip */}
                        <div className="rounded-xl bg-blue-50/60 border border-blue-200 p-4">
                          <div className="flex items-center justify-between pb-2 border-b border-blue-100">
                            <span className="text-[11px] font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                              <span>👨‍🎓</span> Student Portal Credentials
                            </span>
                            <span className="text-[11px] font-mono font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                              {createdCredentials.studentId}
                            </span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2.5 text-xs">
                            <div>
                              <span className="text-slate-500 block text-[11px]">Student Login Email</span>
                              <span className="font-semibold text-slate-800">{createdCredentials.email}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block text-[11px]">Portal Username</span>
                              <span className="font-mono text-slate-800">{createdCredentials.studentUsername}</span>
                            </div>
                            {createdCredentials.studentTemporaryPassword && (
                              <div className="sm:col-span-2 rounded-lg bg-white border border-blue-200 p-2.5 mt-1 flex items-center justify-between">
                                <div>
                                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Temporary Student Password</span>
                                  <span className="font-mono text-sm font-extrabold text-blue-950 tracking-wider">
                                    {createdCredentials.studentTemporaryPassword}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Guardian Slip */}
                        <div className="rounded-xl bg-amber-50/70 border border-amber-200 p-4">
                          <div className="flex items-center justify-between pb-2 border-b border-amber-100">
                            <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                              <span>👨‍👩‍👧</span> Guardian / Parent Credentials
                            </span>
                            {createdCredentials.parentIsExisting ? (
                              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                                Existing Account Linked
                              </span>
                            ) : (
                              <span className="text-[10px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                                New Parent Account
                              </span>
                            )}
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2.5 text-xs">
                            <div>
                              <span className="text-slate-500 block text-[11px]">Guardian Email</span>
                              <span className="font-semibold text-slate-800">{createdCredentials.parentEmail}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block text-[11px]">Guardian Name</span>
                              <span className="font-medium text-slate-800">{createdCredentials.parentName || 'Parent / Guardian'}</span>
                            </div>
                            {createdCredentials.parentTemporaryPassword ? (
                              <div className="sm:col-span-2 rounded-lg bg-white border border-amber-200 p-2.5 mt-1 flex items-center justify-between">
                                <div>
                                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Temporary Parent Password</span>
                                  <span className="font-mono text-sm font-extrabold text-amber-950 tracking-wider">
                                    {createdCredentials.parentTemporaryPassword}
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <div className="sm:col-span-2 rounded-lg bg-emerald-50 border border-emerald-200 p-2 text-[11px] text-emerald-800">
                                ✓ Guardian already has active SSMS credentials. The new student has been attached to their family dashboard without changing their existing password.
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Copy & Print Voucher Action */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-xl bg-slate-100 p-3">
                          <p className="text-[11px] text-slate-600">
                            Print or copy this voucher slip for physical or direct onboarding handover.
                          </p>
                          <div className="flex items-center gap-2 w-full sm:w-auto">
                            <button
                              type="button"
                              onClick={() => printCredentialsVoucher(createdCredentials)}
                              className="flex-1 sm:flex-none rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition flex items-center justify-center gap-1.5"
                            >
                              <span>🖨️ Print Slip</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const slip = `========================================\nSSMS INSTITUTIONAL CREDENTIALS VOUCHER\n========================================\nSTUDENT ACCOUNT:\n- Full Name: ${createdCredentials.name}\n- Student ID: ${createdCredentials.studentId}\n- Login Email: ${createdCredentials.email}\n- Username: ${createdCredentials.studentUsername}\n- Temporary Password: ${createdCredentials.studentTemporaryPassword || 'N/A'}\n\nGUARDIAN ACCOUNT:\n- Guardian Name: ${createdCredentials.parentName}\n- Guardian Email: ${createdCredentials.parentEmail}\n${createdCredentials.parentIsExisting ? '- Status: Linked to existing active guardian portal account (password unchanged).' : `- Username: ${createdCredentials.parentUsername}\n- Temporary Password: ${createdCredentials.parentTemporaryPassword}`}\n\nNOTICE:\nTemporary credentials are valid for initial login only. Password reset is mandatory on first access.\n========================================`
                                copyToClipboard(slip)
                              }}
                              className="flex-1 sm:flex-none rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-slate-800 transition flex items-center justify-center gap-1.5"
                            >
                              <span>{copied ? '✓ Copied Voucher!' : '📋 Copy Complete Voucher'}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Single User (Staff / Faculty) Slip */
                      createdCredentials.temporaryPassword && (
                        <div className="mt-4 rounded-xl bg-amber-50 border border-amber-200 p-4">
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">
                                Temporary Initial Password
                              </span>
                              <span className="font-mono text-base font-extrabold text-amber-950 tracking-wider">
                                {createdCredentials.temporaryPassword}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => printCredentialsVoucher(createdCredentials)}
                                className="rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-900 shadow-sm hover:bg-amber-100/50 transition flex items-center gap-1"
                              >
                                <span>🖨️ Print</span>
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  copyToClipboard(
                                    `Email: ${createdCredentials.email}\nUsername: ${createdCredentials.username}\nTemporary Password: ${createdCredentials.temporaryPassword}`
                                  )
                                }
                                className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white shadow hover:bg-amber-700 transition"
                              >
                                {copied ? '✓ Copied!' : 'Copy Credentials'}
                              </button>
                            </div>
                          </div>
                          <p className="mt-2 text-[11px] text-amber-700">
                            🔒 Zero-knowledge security policy: This temporary password will only be displayed once. The user must use it for their initial login, where they will be prompted to choose their private password.
                          </p>
                        </div>
                      )
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => resetRegisterForms()}
                      className="rounded-xl bg-slate-100 px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-200 transition"
                    >
                      Register Another User
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsRegisterModalOpen(false)}
                      className="rounded-xl bg-blue-600 px-5 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-blue-700 shadow transition"
                    >
                      Done
                    </button>
                  </div>
                </div>
              ) : (
                /* Registration Form with Tabs */
                <div>
                  {/* Tabs */}
                  <div className="mb-6 flex border-b border-slate-200">
                    <button
                      type="button"
                      onClick={() => {
                        setRegisterTab('staff')
                        setRegisterError('')
                      }}
                      className={`flex items-center gap-2 border-b-2 py-2.5 px-4 text-xs sm:text-sm font-semibold transition ${
                        registerTab === 'staff'
                          ? 'border-blue-600 text-blue-600'
                          : 'border-transparent text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <span>👨‍🏫</span>
                      <span>Staff & Faculty</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setRegisterTab('student')
                        setRegisterError('')
                      }}
                      className={`flex items-center gap-2 border-b-2 py-2.5 px-4 text-xs sm:text-sm font-semibold transition ${
                        registerTab === 'student'
                          ? 'border-blue-600 text-blue-600'
                          : 'border-transparent text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <span>👨‍🎓</span>
                      <span>Student & Guardian</span>
                    </button>
                  </div>

                  {registerError && (
                    <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700">
                      {registerError}
                    </div>
                  )}

                  {/* Tab 1: Staff & Faculty Form */}
                  {registerTab === 'staff' && (
                    <form onSubmit={handleStaffSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            First Name *
                          </label>
                          <input
                            type="text"
                            required
                            value={staffForm.first_name}
                            onChange={(e) =>
                              setStaffForm({ ...staffForm, first_name: e.target.value })
                            }
                            placeholder="e.g. Sarah"
                            className="w-full rounded-xl border border-slate-300 p-2.5 text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Last Name *
                          </label>
                          <input
                            type="text"
                            required
                            value={staffForm.last_name}
                            onChange={(e) =>
                              setStaffForm({ ...staffForm, last_name: e.target.value })
                            }
                            placeholder="e.g. Jenkins"
                            className="w-full rounded-xl border border-slate-300 p-2.5 text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Institutional Email *
                          </label>
                          <input
                            type="email"
                            required
                            value={staffForm.email}
                            onChange={(e) =>
                              setStaffForm({ ...staffForm, email: e.target.value })
                            }
                            placeholder="username@ssms.edu"
                            className="w-full rounded-xl border border-slate-300 p-2.5 text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Assigned System Role *
                          </label>
                          <select
                            value={staffForm.role}
                            onChange={(e) =>
                              setStaffForm({ ...staffForm, role: e.target.value })
                            }
                            className="w-full rounded-xl border border-slate-300 p-2.5 text-xs outline-none focus:border-blue-500 bg-white"
                          >
                            <option value="teacher">Teacher (Faculty)</option>
                            <option value="academic_coordinator">Academic Coordinator (Registrar)</option>
                            <option value="admin">Administrator</option>
                          </select>
                        </div>
                      </div>

                      {/* Password Settings */}
                      <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 space-y-2.5">
                        <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={staffForm.autoPassword}
                            onChange={(e) =>
                              setStaffForm({ ...staffForm, autoPassword: e.target.checked })
                            }
                            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span>Auto-generate strong temporary password (Recommended)</span>
                        </label>

                        {!staffForm.autoPassword && (
                          <div className="pt-2">
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                              Custom Temporary Password (min 8 characters)
                            </label>
                            <div className="relative">
                              <input
                                type={showStaffPassword ? 'text' : 'password'}
                                value={staffForm.password}
                                onChange={(e) =>
                                  setStaffForm({ ...staffForm, password: e.target.value })
                                }
                                placeholder="Enter temporary password..."
                                className="w-full rounded-xl border border-slate-300 p-2.5 pr-20 text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                              />

                              <button
                                type="button"
                                onClick={() => setShowStaffPassword((prev) => !prev)}
                                className="absolute inset-y-0 right-0 flex items-center px-3 text-xs font-semibold text-slate-500 hover:text-blue-600 select-none"
                                aria-label={showStaffPassword ? 'Hide password' : 'Show password'}
                              >
                                {showStaffPassword ? '🙈 Hide' : '👁️ Show'}
                              </button>
                            </div>

                            {/* Live Password Strength Meter */}
                            {staffForm.password && (
                              <div className="mt-2 space-y-1">
                                <div className="flex items-center justify-between text-[11px]">
                                  <span className="text-slate-500">Security Strength:</span>
                                  <span className="font-semibold text-slate-700">
                                    {calculatePasswordStrength(staffForm.password).label}
                                  </span>
                                </div>
                                <div className="grid grid-cols-4 gap-1 h-1.5 rounded-full overflow-hidden bg-slate-200">
                                  {[1, 2, 3, 4].map((step) => (
                                    <div
                                      key={step}
                                      className={`h-full transition-all duration-300 ${
                                        step <= calculatePasswordStrength(staffForm.password).score
                                          ? calculatePasswordStrength(staffForm.password).color
                                          : 'bg-slate-200'
                                      }`}
                                    />
                                  ))}
                                </div>
                                <div className="flex flex-wrap gap-2 pt-1 text-[10px] text-slate-500">
                                  <span className={staffForm.password.length >= 8 ? 'text-emerald-600 font-bold' : ''}>
                                    {staffForm.password.length >= 8 ? '✓' : '•'} 8+ Chars
                                  </span>
                                  <span className={/[A-Z]/.test(staffForm.password) ? 'text-emerald-600 font-bold' : ''}>
                                    {/[A-Z]/.test(staffForm.password) ? '✓' : '•'} Uppercase
                                  </span>
                                  <span className={/[0-9]/.test(staffForm.password) ? 'text-emerald-600 font-bold' : ''}>
                                    {/[0-9]/.test(staffForm.password) ? '✓' : '•'} Number
                                  </span>
                                  <span className={/[^A-Za-z0-9]/.test(staffForm.password) ? 'text-emerald-600 font-bold' : ''}>
                                    {/[^A-Za-z0-9]/.test(staffForm.password) ? '✓' : '•'} Special
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        <p className="text-[11px] text-slate-500">
                          ✓ The user will be required to set their own permanent password on their first login.
                        </p>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => setIsRegisterModalOpen(false)}
                          className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={registerLoading}
                          className="rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 shadow-md shadow-blue-500/20 transition disabled:opacity-50"
                        >
                          {registerLoading ? 'Registering Staff...' : 'Create Staff Account'}
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Tab 2: Student & Guardian Form */}
                  {registerTab === 'student' && (
                    <form onSubmit={handleStudentSubmit} className="space-y-4">
                      {/* Student Info */}
                      <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        1. Student Details
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Student ID *
                          </label>
                          <input
                            type="text"
                            required
                            value={studentForm.student_id}
                            onChange={(e) =>
                              setStudentForm({ ...studentForm, student_id: e.target.value })
                            }
                            placeholder="e.g. STU-2026-0042"
                            className="w-full rounded-xl border border-slate-300 p-2.5 text-xs outline-none focus:border-blue-500"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <div className="flex items-center justify-between mb-1">
                            <label className="block text-xs font-semibold text-slate-700">
                              Student Email * <span className="text-[11px] text-slate-400 font-normal">(Manual entry)</span>
                            </label>
                            <button
                              type="button"
                              onClick={() => {
                                const sid = studentForm.student_id.trim().toLowerCase() || 'stu'
                                setStudentForm({ ...studentForm, email: `${sid}@student.ssms.edu` })
                              }}
                              className="text-[10px] font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 hover:bg-blue-100 transition"
                              title="Auto-fill with standard institutional email domain"
                            >
                              ⚡ Auto-fill @student.ssms.edu
                            </button>
                          </div>
                          <input
                            type="email"
                            required
                            value={studentForm.email}
                            onChange={(e) =>
                              setStudentForm({ ...studentForm, email: e.target.value })
                            }
                            placeholder="e.g. alex.morgan@gmail.com or student@ssms.edu"
                            className="w-full rounded-xl border border-slate-300 p-2.5 text-xs outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            First Name *
                          </label>
                          <input
                            type="text"
                            required
                            value={studentForm.first_name}
                            onChange={(e) =>
                              setStudentForm({ ...studentForm, first_name: e.target.value })
                            }
                            placeholder="Student first name"
                            className="w-full rounded-xl border border-slate-300 p-2.5 text-xs outline-none focus:border-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Last Name *
                          </label>
                          <input
                            type="text"
                            required
                            value={studentForm.last_name}
                            onChange={(e) =>
                              setStudentForm({ ...studentForm, last_name: e.target.value })
                            }
                            placeholder="Student last name"
                            className="w-full rounded-xl border border-slate-300 p-2.5 text-xs outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Grade / Year Level *
                          </label>
                          <select
                            value={studentForm.grade_level}
                            onChange={(e) =>
                              setStudentForm({ ...studentForm, grade_level: e.target.value })
                            }
                            className="w-full rounded-xl border border-slate-300 p-2.5 text-xs outline-none focus:border-blue-500 bg-white"
                          >
                            <option value="Grade 9">Grade 9</option>
                            <option value="Grade 10">Grade 10</option>
                            <option value="Grade 11">Grade 11</option>
                            <option value="Grade 12">Grade 12</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Program Track
                          </label>
                          <input
                            type="text"
                            value={studentForm.program}
                            onChange={(e) =>
                              setStudentForm({ ...studentForm, program: e.target.value })
                            }
                            placeholder="e.g. Natural Science / General"
                            className="w-full rounded-xl border border-slate-300 p-2.5 text-xs outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>

                      {/* Parent / Guardian Info */}
                      <div className="pt-2 text-xs font-bold uppercase tracking-wider text-slate-400 border-t border-slate-200">
                        2. Guardian & Emergency Contact
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Parent Email *
                          </label>
                          <input
                            type="email"
                            required
                            value={studentForm.parent_email}
                            onChange={(e) =>
                              setStudentForm({ ...studentForm, parent_email: e.target.value })
                            }
                            placeholder="parent@example.com"
                            className="w-full rounded-xl border border-slate-300 p-2.5 text-xs outline-none focus:border-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Parent Phone *
                          </label>
                          <input
                            type="tel"
                            required
                            value={studentForm.parent_phone}
                            onChange={(e) =>
                              setStudentForm({ ...studentForm, parent_phone: e.target.value })
                            }
                            placeholder="+251 91 123 4567"
                            className="w-full rounded-xl border border-slate-300 p-2.5 text-xs outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Guardian Full Name
                          </label>
                          <input
                            type="text"
                            value={studentForm.parent_first_name}
                            onChange={(e) =>
                              setStudentForm({ ...studentForm, parent_first_name: e.target.value })
                            }
                            placeholder="e.g. John Doe"
                            className="w-full rounded-xl border border-slate-300 p-2.5 text-xs outline-none focus:border-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Relationship
                          </label>
                          <select
                            value={studentForm.relationship}
                            onChange={(e) =>
                              setStudentForm({ ...studentForm, relationship: e.target.value })
                            }
                            className="w-full rounded-xl border border-slate-300 p-2.5 text-xs outline-none focus:border-blue-500 bg-white"
                          >
                            <option value="Parent">Parent</option>
                            <option value="Mother">Mother</option>
                            <option value="Father">Father</option>
                            <option value="Guardian">Legal Guardian</option>
                          </select>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => setIsRegisterModalOpen(false)}
                          className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={registerLoading}
                          className="rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 shadow-md shadow-blue-500/20 transition disabled:opacity-50"
                        >
                          {registerLoading ? 'Provisioning Accounts...' : 'Enroll Student & Guardian'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

      </main>

    </div>
  )
}