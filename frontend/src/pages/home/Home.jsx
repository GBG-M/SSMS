import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">

      {/* =========================
          NAVBAR
      ========================== */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-lg font-bold text-white shadow-sm">
              S
            </div>

            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                SSMS
              </h1>
              <p className="text-xs text-slate-500">
                School Management System
              </p>
            </div>
          </Link>

          {/* Navigation */}
          <div className="hidden items-center gap-8 md:flex">
            <a
              href="#home"
              className="text-sm font-medium text-blue-600 transition hover:text-blue-700"
            >
              Home
            </a>

            <a
              href="#features"
              className="text-sm font-medium text-slate-600 transition hover:text-blue-600"
            >
              Features
            </a>

            <a
              href="#about"
              className="text-sm font-medium text-slate-600 transition hover:text-blue-600"
            >
              About
            </a>

            <a
              href="#contact"
              className="text-sm font-medium text-slate-600 transition hover:text-blue-600"
            >
              Contact
            </a>
          </div>

          {/* Login */}
          <Link
            to="/login"
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            Login
          </Link>

        </nav>
      </header>


      {/* =========================
          HERO SECTION
      ========================== */}
      <main>

        <section
          id="home"
          className="overflow-hidden bg-gradient-to-br from-blue-50 via-white to-slate-50"
        >
          <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-20 lg:grid-cols-2 lg:px-8 lg:py-28">

            {/* Hero Text */}
            <div>

              <div className="mb-6 inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-4 py-2">
                <span className="mr-2 h-2 w-2 rounded-full bg-blue-600"></span>

                <span className="text-sm font-semibold text-blue-700">
                  Smart School Management
                </span>
              </div>

              <h2 className="max-w-2xl text-4xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
                Manage your school
                <span className="block text-blue-600">
                  smarter and easier.
                </span>
              </h2>

              <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
                SSMS brings school administration, teachers, students,
                and parents together in one secure and centralized platform.
              </p>

              {/* Buttons */}
              <div className="mt-8 flex flex-col gap-4 sm:flex-row">

                <Link
                  to="/login"
                  className="rounded-lg bg-blue-600 px-7 py-3.5 text-center text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
                >
                  Get Started
                </Link>

                <a
                  href="#features"
                  className="rounded-lg border border-slate-300 bg-white px-7 py-3.5 text-center text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-600"
                >
                  Explore Features
                </a>

              </div>

              {/* Small information */}
              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-500">

                <div className="flex items-center gap-2">
                  <span className="font-bold text-green-600">✓</span>
                  Secure
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-bold text-green-600">✓</span>
                  Centralized
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-bold text-green-600">✓</span>
                  Easy to use
                </div>

              </div>

            </div>


            {/* Hero Illustration */}
            <div className="relative">

              {/* Background decoration */}
              <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-blue-200/40 blur-3xl"></div>

              <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-indigo-200/40 blur-3xl"></div>


              {/* Main illustration */}
              <div className="relative rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-300/40">

                {/* Browser header */}
                <div className="mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
                  <div className="h-3 w-3 rounded-full bg-red-400"></div>
                  <div className="h-3 w-3 rounded-full bg-yellow-400"></div>
                  <div className="h-3 w-3 rounded-full bg-green-400"></div>

                  <div className="ml-4 h-7 flex-1 rounded-md bg-slate-100"></div>
                </div>


                {/* Dashboard preview */}
                <div className="grid grid-cols-3 gap-4">

                  {/* Sidebar */}
                  <div className="rounded-xl bg-slate-900 p-4">

                    <div className="mb-6 flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-xs font-bold text-white">
                        S
                      </div>

                      <div className="h-2 w-12 rounded bg-slate-600"></div>
                    </div>

                    <div className="space-y-3">

                      <div className="h-8 rounded-lg bg-blue-600"></div>

                      <div className="h-8 rounded-lg bg-slate-800"></div>

                      <div className="h-8 rounded-lg bg-slate-800"></div>

                      <div className="h-8 rounded-lg bg-slate-800"></div>

                      <div className="h-8 rounded-lg bg-slate-800"></div>

                    </div>

                  </div>


                  {/* Dashboard content */}
                  <div className="col-span-2 space-y-4">

                    <div>
                      <div className="h-3 w-32 rounded bg-slate-800"></div>
                      <div className="mt-2 h-2 w-48 rounded bg-slate-200"></div>
                    </div>


                    {/* Cards */}
                    <div className="grid grid-cols-2 gap-3">

                      <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                        <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white">
                          👨‍🎓
                        </div>

                        <div className="h-3 w-16 rounded bg-blue-300"></div>

                        <div className="mt-2 h-5 w-12 rounded bg-blue-700"></div>
                      </div>


                      <div className="rounded-xl border border-green-100 bg-green-50 p-4">
                        <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-green-600 text-white">
                          👨‍🏫
                        </div>

                        <div className="h-3 w-16 rounded bg-green-300"></div>

                        <div className="mt-2 h-5 w-12 rounded bg-green-700"></div>
                      </div>

                    </div>


                    {/* Chart */}
                    <div className="rounded-xl border border-slate-200 bg-white p-4">

                      <div className="mb-4 h-3 w-28 rounded bg-slate-200"></div>

                      <div className="flex h-28 items-end gap-3">

                        <div className="h-12 flex-1 rounded-t bg-blue-200"></div>

                        <div className="h-20 flex-1 rounded-t bg-blue-300"></div>

                        <div className="h-16 flex-1 rounded-t bg-blue-400"></div>

                        <div className="h-24 flex-1 rounded-t bg-blue-500"></div>

                        <div className="h-20 flex-1 rounded-t bg-blue-400"></div>

                        <div className="h-28 flex-1 rounded-t bg-blue-600"></div>

                      </div>

                    </div>

                  </div>

                </div>

              </div>

            </div>

          </div>
        </section>


        {/* =========================
            STATS
        ========================== */}
        <section className="border-y border-slate-200 bg-white">

          <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-slate-200 md:grid-cols-4">

            <div className="px-6 py-8 text-center">
              <p className="text-3xl font-bold text-blue-600">
                4+
              </p>

              <p className="mt-1 text-sm text-slate-500">
                User Roles
              </p>
            </div>


            <div className="px-6 py-8 text-center">
              <p className="text-3xl font-bold text-blue-600">
                24/7
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Access
              </p>
            </div>


            <div className="px-6 py-8 text-center">
              <p className="text-3xl font-bold text-blue-600">
                100%
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Centralized
              </p>
            </div>


            <div className="px-6 py-8 text-center">
              <p className="text-3xl font-bold text-blue-600">
                Secure
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Authentication
              </p>
            </div>

          </div>

        </section>


        {/* =========================
            FEATURES
        ========================== */}
        <section
          id="features"
          className="bg-slate-50 px-6 py-20 lg:py-28"
        >

          <div className="mx-auto max-w-7xl">

            {/* Section heading */}
            <div className="mx-auto max-w-2xl text-center">

              <p className="text-sm font-bold uppercase tracking-widest text-blue-600">
                Powerful Features
              </p>

              <h3 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Everything your school needs
              </h3>

              <p className="mt-4 text-lg text-slate-600">
                A centralized platform designed to simplify school
                management and improve communication.
              </p>

            </div>


            {/* Feature cards */}
            <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">

              {/* Administration */}
              <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">

                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-2xl">
                  🏫
                </div>

                <h4 className="mt-5 text-lg font-bold text-slate-900">
                  Administration
                </h4>

                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Manage school accounts, users, roles, and administrative
                  activities from one place.
                </p>

              </div>


              {/* Teachers */}
              <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">

                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-2xl">
                  👨‍🏫
                </div>

                <h4 className="mt-5 text-lg font-bold text-slate-900">
                  Teachers
                </h4>

                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Give teachers the tools they need to manage academic
                  activities and communicate effectively.
                </p>

              </div>


              {/* Students */}
              <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">

                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-2xl">
                  🎓
                </div>

                <h4 className="mt-5 text-lg font-bold text-slate-900">
                  Students
                </h4>

                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Students can securely access their school information,
                  academic activities, and personal account.
                </p>

              </div>


              {/* Parents */}
              <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">

                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 text-2xl">
                  👨‍👩‍👧
                </div>

                <h4 className="mt-5 text-lg font-bold text-slate-900">
                  Parents
                </h4>

                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Parents can stay connected with their children's school
                  activities and important information.
                </p>

              </div>

            </div>

          </div>

        </section>


        {/* =========================
            ABOUT
        ========================== */}
        <section
          id="about"
          className="bg-white px-6 py-20 lg:py-28"
        >

          <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-2">

            {/* Text */}
            <div>

              <p className="text-sm font-bold uppercase tracking-widest text-blue-600">
                About SSMS
              </p>

              <h3 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                One platform for the entire school community.
              </h3>

              <p className="mt-6 leading-8 text-slate-600">
                The School Management System is designed to bring
                administrators, teachers, students, and parents together
                through a secure and centralized digital platform.
              </p>

              <p className="mt-4 leading-8 text-slate-600">
                SSMS helps reduce manual work, organize school information,
                and provide users with convenient access to the services
                they need.
              </p>

              <div className="mt-8 space-y-4">

                <div className="flex items-start gap-3">
                  <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100 text-sm font-bold text-green-600">
                    ✓
                  </div>

                  <p className="text-slate-600">
                    Secure role-based access
                  </p>
                </div>


                <div className="flex items-start gap-3">
                  <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100 text-sm font-bold text-green-600">
                    ✓
                  </div>

                  <p className="text-slate-600">
                    Centralized account management
                  </p>
                </div>


                <div className="flex items-start gap-3">
                  <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100 text-sm font-bold text-green-600">
                    ✓
                  </div>

                  <p className="text-slate-600">
                    Easy and accessible user experience
                  </p>
                </div>

              </div>

            </div>


            {/* Information card */}
            <div className="rounded-3xl bg-slate-900 p-8 text-white shadow-xl lg:p-10">

              <div className="grid gap-6 sm:grid-cols-2">

                <div className="rounded-2xl bg-white/10 p-6">
                  <p className="text-3xl">🔐</p>

                  <h4 className="mt-4 font-bold">
                    Secure
                  </h4>

                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    Authentication and role-based authorization protect
                    school accounts.
                  </p>
                </div>


                <div className="rounded-2xl bg-white/10 p-6">
                  <p className="text-3xl">📊</p>

                  <h4 className="mt-4 font-bold">
                    Organized
                  </h4>

                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    Important school information is organized in one
                    centralized system.
                  </p>
                </div>


                <div className="rounded-2xl bg-white/10 p-6">
                  <p className="text-3xl">⚡</p>

                  <h4 className="mt-4 font-bold">
                    Efficient
                  </h4>

                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    Reduce repetitive manual work and improve daily
                    school operations.
                  </p>
                </div>


                <div className="rounded-2xl bg-white/10 p-6">
                  <p className="text-3xl">🌐</p>

                  <h4 className="mt-4 font-bold">
                    Accessible
                  </h4>

                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    Provide convenient access to school services through
                    a modern web application.
                  </p>
                </div>

              </div>

            </div>

          </div>

        </section>


        {/* =========================
            CALL TO ACTION
        ========================== */}
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
              className="mt-8 inline-block rounded-lg bg-white px-7 py-3.5 text-sm font-bold text-blue-600 shadow-lg transition hover:bg-blue-50"
            >
              Login to SSMS
            </Link>

          </div>

        </section>

      </main>


      {/* =========================
          FOOTER
      ========================== */}
      <footer
        id="contact"
        className="bg-slate-950 px-6 py-12 text-slate-300"
      >

        <div className="mx-auto max-w-7xl">

          <div className="grid gap-10 md:grid-cols-3">

            {/* Brand */}
            <div>

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 font-bold text-white">
                  S
                </div>

                <div>
                  <h4 className="font-bold text-white">
                    SSMS
                  </h4>

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


            {/* Quick links */}
            <div>

              <h4 className="font-semibold text-white">
                Quick Links
              </h4>

              <div className="mt-4 space-y-3 text-sm">

                <a
                  href="#home"
                  className="block transition hover:text-white"
                >
                  Home
                </a>

                <a
                  href="#features"
                  className="block transition hover:text-white"
                >
                  Features
                </a>

                <a
                  href="#about"
                  className="block transition hover:text-white"
                >
                  About
                </a>

                <Link
                  to="/login"
                  className="block transition hover:text-white"
                >
                  Login
                </Link>

              </div>

            </div>


            {/* Contact */}
            <div>

              <h4 className="font-semibold text-white">
                Contact
              </h4>

              <div className="mt-4 space-y-3 text-sm text-slate-400">

                <p>
                  School Management System
                </p>

                <p>
                  Support available through the school administration.
                </p>

              </div>

            </div>

          </div>


          {/* Copyright */}
          <div className="mt-10 border-t border-slate-800 pt-6 text-center text-sm text-slate-500">
            © {new Date().getFullYear()} SSMS. All rights reserved.
          </div>

        </div>

      </footer>

    </div>
  )
}