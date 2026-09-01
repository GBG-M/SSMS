import { useNavigate } from "react-router-dom"
import { logout } from "../services/authService"

function LogoutButton() {
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate("/login")
  }

  return (
    <button
      onClick={handleLogout}
      className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-medium text-slate-300 transition hover:bg-red-600 hover:text-white"
    >
      <span>🚪</span>
      Logout
    </button>
  )
}

export default LogoutButton