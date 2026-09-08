import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getToken } from '../../services/authService'
import CommunicationsHub from '../../features/communications/CommunicationsHub'

export default function CommunicationsPage() {
  const navigate = useNavigate()
  const [userRole, setUserRole] = useState('STAFF')
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadUser() {
      const token = getToken()
      if (!token) {
        navigate('/login')
        return
      }

      try {
        const res = await fetch('/api/accounts/profile/', {
          headers: {
            Authorization: `Token ${token}`,
            'Content-Type': 'application/json',
          },
        })
        if (res.ok) {
          const data = await res.json()
          setProfile(data)
          const roles = data.role_names || (data.roles ? data.roles.map((r) => r.name || r) : [])
          if (roles.includes('admin') || roles.includes('academic_coordinator')) {
            setUserRole('STAFF')
          } else if (roles.includes('teacher')) {
            setUserRole('TEACHER')
          } else if (roles.includes('parent')) {
            setUserRole('PARENT')
          } else {
            setUserRole('STUDENT')
          }
        }
      } catch (err) {
        console.error('Failed to load profile for communications page:', err)
      } finally {
        setLoading(false)
      }
    }

    loadUser()
  }, [navigate])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-xs text-slate-500">
        Loading communications workspace...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 px-6 py-3.5 backdrop-blur shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition"
          >
            ←
          </button>
          <div>
            <h1 className="text-base font-bold text-slate-900">Institutional Communications</h1>
            <p className="text-xs text-slate-500">SSMS Unified Inquiry & Notice Board Workspace</p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <span className="font-semibold text-slate-700">
            {profile?.full_name || profile?.email}
          </span>
          <span className="rounded-md bg-indigo-50 px-2 py-0.5 font-bold text-indigo-700 uppercase">
            {userRole}
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-7xl p-6">
        <CommunicationsHub userRole={userRole} />
      </main>
    </div>
  )
}
