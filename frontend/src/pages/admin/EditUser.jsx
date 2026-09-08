import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getSystemRoles, updateUserRoles } from '../../services/authService'

const API_BASE_URL = '/api/accounts'

const AVAILABLE_ROLES = [
  { id: 'admin', label: 'Administrator', icon: '👑', desc: 'Full system management and configuration access' },
  { id: 'academic_coordinator', label: 'Academic Coordinator', icon: '🏛️', desc: 'Curriculum, gradebook, and course scheduling control' },
  { id: 'teacher', label: 'Teacher', icon: '👨‍🏫', desc: 'Class grading, attendance recording, and course instruction' },
  { id: 'student', label: 'Student', icon: '👨‍🎓', desc: 'Student portal access, grades, attendance, and documents' },
  { id: 'parent', label: 'Parent / Guardian', icon: '👨‍👩‍👧', desc: 'Parent portal access to monitor linked student progress' },
]

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

  const [selectedRoles, setSelectedRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Linked students management for Parent role
  const [linkedStudents, setLinkedStudents] = useState([])
  const [availableStudents, setAvailableStudents] = useState([])
  const [studentSearchTerm, setStudentSearchTerm] = useState('')
  const [loadingStudents, setLoadingStudents] = useState(false)

  useEffect(() => {
    fetchUser()
  }, [id])

  useEffect(() => {
    if (selectedRoles.includes('parent')) {
      fetchAvailableStudents()
    }
  }, [selectedRoles])

  async function fetchAvailableStudents() {
    try {
      setLoadingStudents(true)
      const token = localStorage.getItem('authToken')
      if (!token) return
      const res = await fetch('/api/students/students/', {
        headers: {
          Authorization: `Token ${token}`,
          'Content-Type': 'application/json',
        },
      })
      if (res.ok) {
        const json = await res.json()
        const list = Array.isArray(json) ? json : json.results || []
        setAvailableStudents(list)
      }
    } catch (err) {
      console.warn('Failed to load students for parent linking:', err)
    } finally {
      setLoadingStudents(false)
    }
  }

  function handleLinkStudent(student) {
    if (!linkedStudents.some((s) => s.id === student.id)) {
      setLinkedStudents((prev) => [...prev, student])
    }
    setStudentSearchTerm('')
  }

  function handleUnlinkStudent(studentId) {
    setLinkedStudents((prev) => prev.filter((s) => s.id !== studentId))
  }

  async function fetchUser() {
    setLoading(true)
    setError('')

    const token = localStorage.getItem('authToken')

    if (!token) {
      navigate('/login')
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/users/${id}/`, {
        method: 'GET',
        headers: {
          Authorization: `Token ${token}`,
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (response.status === 401) {
        localStorage.removeItem('authToken')
        localStorage.removeItem('userEmail')
        navigate('/login')
        return
      }

      if (response.status === 403) {
        setError('You do not have permission to edit this user.')
        return
      }

      if (response.status === 404) {
        setError('User was not found.')
        return
      }

      if (!response.ok) {
        throw new Error(data.detail || data.error || 'Failed to load user.')
      }

      setFormData({
        username: data.username || '',
        email: data.email || '',
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        is_active: Boolean(data.is_active),
        is_staff: Boolean(data.is_staff),
        must_reset_password: Boolean(data.must_reset_password),
        requires_totp: Boolean(data.requires_totp),
        totp_enabled: Boolean(data.totp_enabled),
      })

      const roles = (data.role_names || []).map((r) => String(r).toLowerCase())
      setSelectedRoles(roles)
      if (Array.isArray(data.children)) {
        setLinkedStudents(data.children)
      }
    } catch (err) {
      console.error('Load user error:', err)
      setError(err.message || 'Unable to load user information.')
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

  function handleRoleToggle(roleId) {
    setSelectedRoles((prev) =>
      prev.includes(roleId) ? prev.filter((r) => r !== roleId) : [...prev, roleId]
    )
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
      // 1. Update basic user details
      const response = await fetch(`${API_BASE_URL}/users/${id}/`, {
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
          must_reset_password: formData.must_reset_password,
          requires_totp: formData.requires_totp,
          totp_enabled: formData.totp_enabled,
          role_names: selectedRoles,
          student_ids: linkedStudents.map((s) => s.id),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || data.error || 'Failed to update user profile.')
      }

      // 2. Explicitly update roles endpoint
      try {
        await updateUserRoles(id, selectedRoles)
      } catch (roleErr) {
        console.warn('Role update fallback warning:', roleErr)
      }

      setSuccess('User and roles updated successfully.')
      setTimeout(() => {
        navigate(`/admin/users/${id}`)
      }, 1000)
    } catch (err) {
      console.error('Update user error:', err)
      setError(err.message || 'Unable to update user.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600"></div>
          <p className="text-sm text-slate-500">Loading user details...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-4">
          <div>
            <h1 className="text-xl font-bold text-slate-800">SSMS Administration</h1>
            <p className="text-xs text-slate-500">Edit User Account</p>
          </div>

          <button
            type="button"
            onClick={() => navigate(`/admin/users/${id}`)}
            className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition"
          >
            ← Back to Details
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
            Account Management
          </p>
          <h2 className="mt-1 text-3xl font-extrabold text-slate-900 tracking-tight">
            Edit User: {formData.username || formData.email}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Update personal credentials, role assignments, and security settings.
          </p>
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

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic information */}
          <section className="rounded-2xl bg-white p-6 sm:p-8 shadow-sm ring-1 ring-slate-200">
            <div className="mb-6 border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-900">Personal Information</h3>
              <p className="mt-1 text-xs text-slate-500">Update identity information.</p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">First Name</label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">Last Name</label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">Username *</label>
                <input
                  type="text"
                  name="username"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">Email Address *</label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition"
                />
              </div>
            </div>
          </section>

          {/* Role Assignments Section */}
          <section className="rounded-2xl bg-white p-6 sm:p-8 shadow-sm ring-1 ring-slate-200">
            <div className="mb-6 border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-900">System Role Assignments</h3>
              <p className="mt-1 text-xs text-slate-500">
                Select one or more roles that determine this user's portal access permissions.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {AVAILABLE_ROLES.map((r) => {
                const isChecked = selectedRoles.includes(r.id)
                return (
                  <label
                    key={r.id}
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${
                      isChecked
                        ? 'border-blue-500 bg-blue-50/50 shadow-sm'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleRoleToggle(r.id)}
                      className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900">
                        <span>{r.icon}</span>
                        <span>{r.label}</span>
                      </div>
                      <p className="mt-1 text-[11px] text-slate-500 leading-relaxed">{r.desc}</p>
                    </div>
                  </label>
                )
              })}
            </div>
          </section>

          {/* Linked Students Section for Parent Accounts */}
          {selectedRoles.includes('parent') && (
            <section className="rounded-2xl bg-white p-6 sm:p-8 shadow-sm ring-1 ring-slate-200">
              <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">👨‍👩‍👧</span>
                    <h3 className="text-lg font-bold text-slate-900">Linked Students (Parent Portal)</h3>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Associate enrolled students with this parent account. Linked children will appear on the parent dashboard.
                  </p>
                </div>
                <span className="rounded-full bg-indigo-50 border border-indigo-200 px-3 py-1 text-xs font-bold text-indigo-700 w-fit">
                  {linkedStudents.length} {linkedStudents.length === 1 ? 'Student Linked' : 'Students Linked'}
                </span>
              </div>

              {/* Current Linked Students List */}
              <div className="space-y-3 mb-6">
                <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Currently Linked Children
                </p>

                {linkedStudents.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center text-xs text-slate-500">
                    No students linked to this parent yet. Search and select a student below to link them.
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {linkedStudents.map((child) => (
                      <div
                        key={child.id || child.student_id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-indigo-100 bg-indigo-50/40 p-3.5 shadow-sm"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-sm">
                            {(child.first_name || 'S').charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-xs text-slate-900 truncate">
                              {child.full_name || `${child.first_name || ''} ${child.last_name || ''}`.trim()}
                            </p>
                            <p className="font-mono text-[11px] text-indigo-700">
                              {child.student_id} • {child.current_grade || 'Grade —'}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleUnlinkStudent(child.id)}
                          className="shrink-0 rounded-lg border border-red-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-red-600 hover:bg-red-50 hover:border-red-300 transition"
                          title="Unlink student"
                        >
                          ✕ Unlink
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Search and Link Students Widget */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  🔍 Search & Link Student from Directory
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={studentSearchTerm}
                    onChange={(e) => setStudentSearchTerm(e.target.value)}
                    placeholder="Search by student name or student ID (e.g. STU000001)..."
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition"
                  />
                  {studentSearchTerm && (
                    <button
                      type="button"
                      onClick={() => setStudentSearchTerm('')}
                      className="absolute right-3 top-2 text-xs text-slate-400 hover:text-slate-600"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Search Results Dropdown / Suggestions */}
                {studentSearchTerm.trim() && (
                  <div className="mt-2.5 max-h-56 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg space-y-1">
                    {loadingStudents ? (
                      <p className="p-3 text-center text-xs text-slate-400">Loading student directory...</p>
                    ) : (
                      (() => {
                        const term = studentSearchTerm.trim().toLowerCase()
                        const filtered = availableStudents.filter(
                          (s) =>
                            !linkedStudents.some((ls) => ls.id === s.id) &&
                            ((s.full_name && s.full_name.toLowerCase().includes(term)) ||
                              (s.first_name && s.first_name.toLowerCase().includes(term)) ||
                              (s.last_name && s.last_name.toLowerCase().includes(term)) ||
                              (s.student_id && s.student_id.toLowerCase().includes(term)) ||
                              (s.email && s.email.toLowerCase().includes(term)))
                        )

                        if (filtered.length === 0) {
                          return (
                            <p className="p-3 text-center text-xs text-slate-500">
                              No unlinked students matching "{studentSearchTerm}"
                            </p>
                          )
                        }

                        return filtered.slice(0, 8).map((s) => (
                          <div
                            key={s.id}
                            className="flex items-center justify-between gap-3 rounded-lg p-2 hover:bg-slate-50 transition"
                          >
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-800 truncate">
                                {s.full_name || `${s.first_name} ${s.last_name}`}
                              </p>
                              <p className="font-mono text-[11px] text-slate-500">
                                {s.student_id} • {s.current_grade || 'Grade —'} • {s.current_class || 'Class —'}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleLinkStudent(s)}
                              className="shrink-0 rounded-lg bg-indigo-600 px-3 py-1 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 transition"
                            >
                              + Link Student
                            </button>
                          </div>
                        ))
                      })()
                    )}
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Account Security & Flags */}
          <section className="rounded-2xl bg-white p-6 sm:p-8 shadow-sm ring-1 ring-slate-200">
            <div className="mb-6 border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-900">Security & Account Flags</h3>
              <p className="mt-1 text-xs text-slate-500">Manage account state and access privileges.</p>
            </div>

            <div className="space-y-3 text-xs">
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-3.5 hover:bg-slate-50 transition">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <p className="font-bold text-slate-800">Active User Account</p>
                  <p className="text-slate-500 text-[11px]">Allow this user to sign in and interact with SSMS.</p>
                </div>
              </label>

              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-3.5 hover:bg-slate-50 transition">
                <input
                  type="checkbox"
                  name="is_staff"
                  checked={formData.is_staff}
                  onChange={handleChange}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <p className="font-bold text-slate-800">Staff Privileges (Django Admin)</p>
                  <p className="text-slate-500 text-[11px]">Grants access to backend Django admin interface.</p>
                </div>
              </label>

              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-3.5 hover:bg-slate-50 transition">
                <input
                  type="checkbox"
                  name="must_reset_password"
                  checked={formData.must_reset_password}
                  onChange={handleChange}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <p className="font-bold text-slate-800">Force Mandatory Password Reset</p>
                  <p className="text-slate-500 text-[11px]">User will be prompted to set a new password on next login.</p>
                </div>
              </label>
            </div>
          </section>

          {/* Save Action */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => navigate(`/admin/users/${id}`)}
              className="rounded-xl bg-slate-100 px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-200 transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-blue-700 transition disabled:opacity-60"
            >
              {saving ? 'Saving User...' : 'Save All Changes'}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}