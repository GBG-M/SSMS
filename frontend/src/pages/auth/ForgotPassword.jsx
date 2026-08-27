import { useState } from "react"
import { Link } from "react-router-dom"

function ForgotPassword() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()

    setError("")
    setMessage("")

    if (!email) {
      setError("Please enter your email address.")
      return
    }

    setLoading(true)

    // TEMPORARY
    // Backend API will be connected later.

    setTimeout(() => {
      setLoading(false)

      setMessage(
        "If an account exists with this email, password reset instructions will be sent."
      )
    }, 800)
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">

      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">

        <div className="text-center mb-8">

          <h1 className="text-3xl font-bold text-blue-600">
            SSMS
          </h1>

          <h2 className="text-2xl font-semibold text-gray-800 mt-6">
            Forgot Password?
          </h2>

          <p className="text-gray-500 mt-2">
            Enter your email to reset your password.
          </p>

        </div>

        {error && (
          <div className="mb-5 rounded-lg bg-red-100 text-red-700 px-4 py-3">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-5 rounded-lg bg-green-100 text-green-700 px-4 py-3">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">

          <div>

            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
            />

          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Sending..." : "Send Reset Instructions"}
          </button>

        </form>

        <div className="text-center mt-6">

          <Link
            to="/login"
            className="font-semibold text-blue-600 hover:underline"
          >
            Back to Login
          </Link>

        </div>

      </div>

    </div>
  )
}

export default ForgotPassword