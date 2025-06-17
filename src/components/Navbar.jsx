import { Link } from 'react-router-dom'
import { useAuth } from '../services/auth'

export default function Navbar() {
  const { user, logout } = useAuth()

  if (!user) return null

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="text-xl font-semibold text-gray-900">
              MikroTik Manager
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-gray-600">{user.username}</span>
            <button
              onClick={logout}
              className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}