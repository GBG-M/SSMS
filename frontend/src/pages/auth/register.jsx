import { Link } from "react-router-dom"

export default function Register() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-xl ring-1 ring-slate-200/80 p-8 sm:p-10">
        {/* Institutional Branding */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-500/30 text-3xl text-white">
            🎓
          </div>

          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-blue-700 border border-blue-200">
            <span className="h-2 w-2 rounded-full bg-blue-600 animate-pulse"></span>
            Institutional Governance & Security
          </span>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mt-3">
            Account Registration Policy
          </h1>

          <p className="text-slate-500 text-xs sm:text-sm mt-2 max-w-lg mx-auto">
            Smart School Management System (SSMS) is a private, role-gated institutional ERP. Open public registration is disabled to uphold student data confidentiality and compliance standards.
          </p>
        </div>

        {/* Security Notice Banner */}
        <div className="mb-8 rounded-2xl bg-slate-50 border border-slate-200 p-4 sm:p-5 flex items-start gap-3 text-xs text-slate-700">
          <span className="text-xl">🛡️</span>
          <div>
            <span className="font-bold text-slate-900 block mb-0.5">
              Role-Based Access Control (RBAC) Architecture
            </span>
            All portal accounts (Students, Guardians, Teachers, and Administrative Coordinators) are provisioned through verified institutional workflows rather than unverified self-registration.
          </div>
        </div>

        {/* 3 Step Onboarding Pathways */}
        <div className="space-y-4 mb-8">
          {/* Pathway 1: Students & Guardians */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm hover:border-blue-300 transition">
            <div className="flex items-start gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-xl text-blue-600">
                👨‍🎓
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Students & Parents (Enrollment)
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Student portal accounts and guardian access are provisioned automatically upon official enrollment verification by the Registrar. Activation details and Student IDs are dispatched to the registered parent email.
                </p>
              </div>
            </div>
          </div>

          {/* Pathway 2: Faculty & Staff */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm hover:border-blue-300 transition">
            <div className="flex items-start gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-xl text-emerald-600">
                👨‍🏫
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Teaching Faculty & Staff (HR Onboarding)
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Academic coordinators, department heads, and teachers receive institutional credentials (<span className="font-mono text-slate-700">@ssms.edu</span>) through IT Administration during employee onboarding.
                </p>
              </div>
            </div>
          </div>

          {/* Pathway 3: Temporary Password Handover */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm hover:border-blue-300 transition">
            <div className="flex items-start gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-xl text-amber-600">
                🔑
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Received Temporary Credentials?
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  If you have been issued temporary login credentials by your administrator, proceed to sign in. The system will prompt you to set your private password and configure two-factor authentication on first access.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            to="/login"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-xs sm:text-sm font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 transition"
          >
            <span>Sign In to Portal</span>
            <span>→</span>
          </Link>

          <Link
            to="/"
            className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            Return to Home
          </Link>
        </div>

        {/* Admissions Office Help Desk */}
        <div className="mt-8 pt-6 border-t border-slate-200 text-center text-xs text-slate-500">
          <span>Need assistance with your enrollment or account activation? Contact the </span>
          <span className="font-semibold text-slate-700">Registrar & Admissions Office</span>
          <div className="mt-1 font-mono text-slate-600">
            admissions@ssms.edu • Office Hours: Mon - Fri, 8:00 AM - 5:00 PM
          </div>
        </div>
      </div>
    </div>
  )
}