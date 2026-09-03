import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  fetchAcademicYears,
  fetchCourses,
  fetchClassSections,
  fetchEnrollments,
} from '../../services/academicService'

export default function AcademicsOverview() {
  const [stats, setStats] = useState({
    totalAcademicYears: 0,
    activeCourses: 0,
    totalClassSections: 0,
    totalEnrollments: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [recentData, setRecentData] = useState({
    academicYears: [],
    courses: [],
    sections: [],
  })

  const token = localStorage.getItem('authToken')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const [yearsData, coursesData, sectionsData, enrollmentsData] =
        await Promise.all([
          fetchAcademicYears(token),
          fetchCourses(token),
          fetchClassSections(token),
          fetchEnrollments(token),
        ])

      const years = yearsData.results || yearsData || []
      const courses = coursesData.results || coursesData || []
      const sections = sectionsData.results || sectionsData || []
      const enrollments = enrollmentsData.results || enrollmentsData || []

      setStats({
        totalAcademicYears: years.length,
        activeCourses: courses.filter((c) => c.is_active).length,
        totalClassSections: sections.length,
        totalEnrollments: enrollments.length,
      })

      setRecentData({
        academicYears: years.slice(0, 3),
        courses: courses.slice(0, 3),
        sections: sections.slice(0, 3),
      })
    } catch (err) {
      setError('Failed to load academic data')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-slate-600">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 mb-6">
          Academic Management
        </h1>

        {error && (
          <div className="bg-red-100 text-red-800 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Statistics Cards */}
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-slate-500">Academic Years</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {stats.totalAcademicYears}
                </p>
              </div>
              <div className="text-2xl">📅</div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-slate-500">Active Courses</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {stats.activeCourses}
                </p>
              </div>
              <div className="text-2xl">📚</div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-slate-500">Class Sections</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {stats.totalClassSections}
                </p>
              </div>
              <div className="text-2xl">🏫</div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-slate-500">Enrollments</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {stats.totalEnrollments}
                </p>
              </div>
              <div className="text-2xl">👥</div>
            </div>
          </div>
        </div>

        {/* Management Modules */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          <Link
            to="/academics/years"
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition transform hover:-translate-y-1"
          >
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              Academic Years
            </h3>
            <p className="text-sm text-slate-600">
              Manage school academic years and calendar
            </p>
          </Link>

          <Link
            to="/academics/subjects"
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition transform hover:-translate-y-1"
          >
            <h3 className="text-lg font-bold text-slate-900 mb-2">Subjects</h3>
            <p className="text-sm text-slate-600">
              Create and manage subjects and disciplines
            </p>
          </Link>

          <Link
            to="/academics/courses"
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition transform hover:-translate-y-1"
          >
            <h3 className="text-lg font-bold text-slate-900 mb-2">Courses</h3>
            <p className="text-sm text-slate-600">
              Manage courses and their content
            </p>
          </Link>

          <Link
            to="/academics/sections"
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition transform hover:-translate-y-1"
          >
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              Class Sections
            </h3>
            <p className="text-sm text-slate-600">
              Manage class sections and classrooms
            </p>
          </Link>

          <Link
            to="/academics/grades"
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition transform hover:-translate-y-1"
          >
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              Grade Book
            </h3>
            <p className="text-sm text-slate-600">
              Record and manage student grades
            </p>
          </Link>

          <Link
            to="/academics/enrollments"
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition transform hover:-translate-y-1"
          >
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              Enrollments
            </h3>
            <p className="text-sm text-slate-600">
              Manage student enrollments in courses
            </p>
          </Link>
        </div>

        {/* Recent Items */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-bold text-slate-900 mb-4">
              Recent Academic Years
            </h3>
            {recentData.academicYears.length === 0 ? (
              <p className="text-sm text-slate-500">No academic years</p>
            ) : (
              <ul className="space-y-2">
                {recentData.academicYears.map((year) => (
                  <li key={year.id} className="text-sm">
                    <span className="font-semibold">{year.name}</span>
                    {year.is_active && (
                      <span className="ml-2 text-green-600 text-xs">
                        (Active)
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-bold text-slate-900 mb-4">
              Recent Courses
            </h3>
            {recentData.courses.length === 0 ? (
              <p className="text-sm text-slate-500">No courses</p>
            ) : (
              <ul className="space-y-2">
                {recentData.courses.map((course) => (
                  <li key={course.id} className="text-sm">
                    <span className="font-semibold">{course.course_code}</span>
                    <p className="text-xs text-slate-600">{course.title}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-bold text-slate-900 mb-4">
              Recent Class Sections
            </h3>
            {recentData.sections.length === 0 ? (
              <p className="text-sm text-slate-500">No sections</p>
            ) : (
              <ul className="space-y-2">
                {recentData.sections.map((section) => (
                  <li key={section.id} className="text-sm">
                    <span className="font-semibold">{section.name}</span>
                    <p className="text-xs text-slate-600">
                      {section.section_code}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
