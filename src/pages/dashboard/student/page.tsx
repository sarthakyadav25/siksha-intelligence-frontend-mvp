import { useAppSelector, useAppDispatch } from '@/store/hooks'
import { logout } from '@/store/slices/authSlice'
import { useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { api } from '@/lib/axios'
import { toast } from 'sonner'

export default function StudentDashboard() {
  const user = useAppSelector((s) => s.auth.user)
  const auth = useAppSelector((s) => s.auth)
  const refreshToken = useAppSelector((s) => s.auth.refreshToken)
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken })
      }
    } catch (err) {
      console.error('Logout API error:', err)
    } finally {
      dispatch(logout())
      navigate('/login', { replace: true })
      toast.success('Logged out successfully')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex justify-end mb-4">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-sm text-yellow-800">Debug Info:</p>
            <p className="text-xs text-yellow-700 font-mono">isAuthenticated: {String(auth.isAuthenticated)}</p>
            <p className="text-xs text-yellow-700 font-mono">user: {user?.username || 'null'}</p>
            <p className="text-xs text-yellow-700 font-mono">roles: {user?.roles.join(', ') || 'none'}</p>
          </div>

          <h1 className="text-4xl font-bold text-purple-900 mb-2">Student Learning Hub</h1>
          <p className="text-purple-700 mb-6">Access your courses and learning materials</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-purple-900 mb-3">Learning Resources</h2>
              <ul className="text-purple-700 space-y-2">
                <li>✓ My Courses</li>
                <li>✓ Assignments</li>
                <li>✓ Grades</li>
                <li>✓ Learning Materials</li>
              </ul>
            </div>

            <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-purple-900 mb-3">User Information</h2>
              <div className="text-purple-700 space-y-2">
                <p><strong>Name:</strong> {user?.username}</p>
                <p><strong>Email:</strong> {user?.email}</p>
                <p><strong>ID:</strong> {user?.userId}</p>
                <p><strong>Roles:</strong> {user?.roles.join(', ')}</p>
              </div>
            </div>
          </div>

          <div className="mt-8 p-4 bg-purple-100 border-l-4 border-purple-500 text-purple-900">
            <p className="font-semibold">Welcome to Student Dashboard</p>
            <p className="text-sm mt-2">Access your courses, view assignments, and track your learning progress.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
