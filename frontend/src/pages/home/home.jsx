import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">

      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">

          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-lg font-bold text-white">
              S
            </div>

            <div>
              <h1 className="text-xl font-bold tracking-tight">
                SSMS
              </h1>
              <p className="text-xs text-slate-500">
                School Management System
              </p>
            </div>
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            <a href="#home" className="text-sm font-medium text-blue-600">
              Home
            </a>

            <a href="#features" className="text-sm font-medium text-slate-600 hover:text-blue-600">
              Features
            </a>

            <a href="#about" className="text-sm font-medium text-slate-600 hover:text-blue-600">
              About
            </a>

            <a href="#contact" className="text-sm font-medium text-slate-600 hover:text-blue-600">
              Contact
            </a>
          </div>

          <Link
            to="/login"
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Login
          </Link>

        </nav>
      </header>

      {/* Hero */}
      <main>

        <section
          id="home"
          className="overflow-hidden bg-gradient-to-br from-blue-50 via-white to-slate-50"
        >
          <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-20 lg:grid-cols-2 lg:px-8 lg:py-28">

            <div>
              <div className="mb-6 inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-4 py-2">
                <span className="mr-2 h-2 w-2 rounded-full bg-blue-600" />
                <span className="text-sm font-semibold text-blue-700">
                  Smart School Management
                </span>
              </div>

              <h2 className="max-w-2xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                Manage your school
                <span className="block text-blue-600">
                  smarter and easier.
                </span>
              </h2>

              <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
                SSMS brings school administration, teachers, students,
                and parents together in one secure and centralized platform.
              </p>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <Link
                  to="/login"
                  className="rounded-lg bg-blue-600 px-7 py-3.5 text-center text-sm font-semibold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700"
                >
                  Get Started
                </Link>

                <a
                  href="#features"
                  className="rounded-lg border border-slate-300 bg-white px-7 py-3.5 text-center text-sm font-semibold text-slate-700 hover:border-blue-300 hover:text-blue-600"
                >
                  Explore Features
                </a>
              </div>

              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-500">
                <span>✓ Secure</span>
                <span>✓ Centralized</span>
                <span>✓ Easy to use</span>
              </div>
            </div>

            {/* Dashboard preview */}
            <div className="relative">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">

                <div className="mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
                  <div className="h-3 w-3 rounded-full bg-red-400" />
                  <div className="h-3 w-3 rounded-full bg-yellow-400" />
                  <div className="h-3 w-3 rounded-full bg-green-400" />
                  <div className="ml-4 h-7 flex-1 rounded-md bg-slate-100" />
                </div>

                <div className="grid grid-cols-3 gap-4">

                  <div className="rounded-xl bg-slate-900 p-4">
                    <div className="mb-6 flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-xs font-bold text-white">
                      S
                    </div>

                    <div className="space-y-3">
                      <div className="h-8 rounded-lg bg-blue-600" />
                      <div className="h-8 rounded-lg bg-slate-800" />
                      <div className="h-8 rounded-lg bg-slate-800" />
                      <div className="h-8 rounded-lg bg-slate-800" />
                    </div>
                  </div>

                  <div className="col-span-2 space-y-4">
                    <div>
                      <div className="h-3 w-32 rounded bg-slate-800" />
                      <div className="mt-2 h-2 w-48 rounded bg-slate-200" />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                        <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white">
                          🎓
                        </div>
                        <div className="h-3 w-16 rounded bg-blue-300" />
                        <div className="mt-2 h-5 w-12 rounded bg-blue-700" />
                      </div>

                      <div className="rounded-xl border border-green-100 bg-green-50 p-4">
                        <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-green-600 text-white">
                          👨‍🏫
                        </div>
                        <div className="h-3 w-16 rounded bg-green-300" />
                        <div className="mt-2 h-5 w-12 rounded bg-green-700" />
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                      <div className="mb-4 h-3 w-28 rounded bg-slate-200" />

                      <div className="flex h-28 items-end gap-3">
                        <div className="h-12 flex-1 rounded-t bg-blue-200" />
                        <div className="h-20 flex-1 rounded-t bg-blue-300" />
                        <div className="h-16 flex-1 rounded-t bg-blue-400" />
                        <div className="h-24 flex-1 rounded-t bg-blue-500" />
                        <div className="h-20 flex-1 rounded-t bg-blue-400" />
                        <div className="h-28 flex-1 rounded-t bg-blue-600" />
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>

          </div>
        </section>

        {/* Stats */}
        <section className="border-y border-slate-200 bg-white">
          <div className="mx-auto grid max-w-7xl grid-cols-2 md:grid-cols-4">

            <div className="px-6 py-8 text-center">
              <p className="text-3xl font-bold text-blue-600">4+</p>
              <p className="mt-1 text-sm text-slate-500">User Roles</p>
            </div>

            <div className="px-6 py-8 text-center">
              <p className="text-3xl font-bold text-blue-600">24/7</p>
              <p className="mt-1 text-sm text-slate-500">Access</p>
            </div>

            <div className="px-6 py-8 text-center">
              <p className="text-3xl font-bold text-blue-600">100%</p>
              <p className="mt-1 text-sm text-slate-500">Centralized</p>
            </div>

            <div className="px-6 py-8 text-center">
              <p className="text-3xl font-bold text-blue-600">Secure</p>
              <p className="mt-1 text-sm text-slate-500">Authentication</p>
            </div>

          </div>
        </section>

        {/* Features */}
        <section id="features" className="bg-slate-50 px-6 py-20 lg:py-28">
          <div className="mx-auto max-w-7xl">

            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-bold uppercase tracking-widest text-blue-600">
                Powerful Features
              </p>

              <h3 className="mt-3 text-3xl font-bold sm:text-4xl">
                Everything your school needs
              </h3>

              <p className="mt-4 text-lg text-slate-600">
                A centralized platform designed to simplify school
                management and improve communication.
              </p>
            </div>

            <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">

              {[
                ['🏫', 'Administration', 'Manage school accounts, users, roles, and administrative activities.'],
                ['👨‍🏫', 'Teachers', 'Tools for teachers to manage academic activities and communicate effectively.'],
                ['🎓', 'Students', 'Secure access to school information, academic activities, and personal accounts.'],
                ['👨‍👩‍👧', 'Parents', 'Stay connected with children’s school activities and important information.'],
              ].map(([icon, title, description]) => (
                <div
                  key={title}
                  className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-2xl">
                    {icon}
                  </div>

                  <h4 className="mt-5 text-lg font-bold">
                    {title}
                  </h4>

                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {description}
                  </p>
                </div>
              ))}

            </div>
          </div>
        </section>

        {/* About */}
        <section id="about" className="bg-white px-6 py-20 lg:py-28">
          <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-2">

            <div>
              <p className="text-sm font-bold uppercase tracking-widest text-blue-600">
                About SSMS
              </p>

              <h3 className="mt-3 text-3xl font-bold sm:text-4xl">
                One platform for the entire school community.
              </h3>

              <p className="mt-6 leading-8 text-slate-600">
                The School Management System brings administrators,
                teachers, students, and parents together through a secure
                centralized platform.
              </p>

              <div className="mt-8 space-y-4 text-slate-600">
                <p>✓ Secure role-based access</p>
                <p>✓ Centralized account management</p>
                <p>✓ Easy and accessible user experience</p>
              </div>
            </div>

            <div className="rounded-3xl bg-slate-900 p-8 text-white">
              <div className="grid gap-6 sm:grid-cols-2">

                <div className="rounded-2xl bg-white/10 p-6">
                  <p className="text-3xl">🔐</p>
                  <h4 className="mt-4 font-bold">Secure</h4>
                  <p className="mt-2 text-sm text-slate-300">
                    Authentication protects school accounts.
                  </p>
                </div>

                <div className="rounded-2xl bg-white/10 p-6">
                  <p className="text-3xl">📊</p>
                  <h4 className="mt-4 font-bold">Organized</h4>
                  <p className="mt-2 text-sm text-slate-300">
                    School information stays organized in one system.
                  </p>
                </div>

                <div className="rounded-2xl bg-white/10 p-6">
                  <p className="text-3xl">⚡</p>
                  <h4 className="mt-4 font-bold">Efficient</h4>
                  <p className="mt-2 text-sm text-slate-300">
                    Reduce repetitive manual work.
                  </p>
                </div>

                <div className="rounded-2xl bg-white/10 p-6">
                  <p className="text-3xl">🌐</p>
                  <h4 className="mt-4 font-bold">Accessible</h4>
                  <p className="mt-2 text-sm text-slate-300">
                    Convenient access to school services.
                  </p>
                </div>

              </div>
            </div>

          </div>
        </section>

        {/* Call to Action */}
        <section className="bg-blue-600 px-6 py-20">
          <div className="mx-auto max-w-4xl text-center">

            <h3 className="text-3xl font-bold text-white sm:text-4xl">
              Ready to access your school portal?
            </h3>

            <p className="mx-auto mt-4 max-w-2xl text-blue-100">
              Sign in to your SSMS account and access the services
              available for your role.
            </p>

            <Link
              to="/login"
              className="mt-8 inline-block rounded-lg bg-white px-7 py-3.5 text-sm font-bold text-blue-600 hover:bg-blue-50"
            >
              Login to SSMS
            </Link>

          </div>
        </section>

      </main>

      {/* Footer */}
      <footer id="contact" className="bg-slate-950 px-6 py-12 text-slate-300">
        <div className="mx-auto max-w-7xl">

          <div className="grid gap-10 md:grid-cols-3">

            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 font-bold text-white">
                  S
                </div>

                <div>
                  <h4 className="font-bold text-white">SSMS</h4>
                  <p className="text-xs text-slate-400">
                    School Management System
                  </p>
                </div>
              </div>

              <p className="mt-5 max-w-sm text-sm leading-6 text-slate-400">
                A centralized platform designed to simplify school
                management and connect the entire school community.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-white">
                Quick Links
              </h4>

              <div className="mt-4 space-y-3 text-sm">
                <a href="#home" className="block hover:text-white">Home</a>
                <a href="#features" className="block hover:text-white">Features</a>
                <a href="#about" className="block hover:text-white">About</a>

                <Link to="/login" className="block hover:text-white">
                  Login
                </Link>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-white">
                Contact
              </h4>

              <div className="mt-4 space-y-3 text-sm text-slate-400">
                <p>School Management System</p>
                <p>Support available through the school administration.</p>
              </div>
            </div>

          </div>

          <div className="mt-10 border-t border-slate-800 pt-6 text-center text-sm text-slate-500">
            © {new Date().getFullYear()} SSMS. All rights reserved.
          </div>

        </div>
      </footer>

    </div>
  )
}