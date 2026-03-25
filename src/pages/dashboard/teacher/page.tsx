import { useAppSelector, useAppDispatch } from '@/store/hooks'
import { logoutUser } from '@/store/slices/authSlice'
import { useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { toast } from 'sonner'

export default function TeacherDashboard() {
  const user = useAppSelector((s) => s.auth.user)
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await dispatch(logoutUser())
    navigate('/login', { replace: true })
    toast.success('Logged out successfully')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 p-8">
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
          <h1 className="text-4xl font-bold text-green-900 mb-2">Teacher Portal</h1>
          <p className="text-green-700 mb-6">Manage classes and student progress</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-green-900 mb-3">Teaching Tools</h2>
              <ul className="text-green-700 space-y-2">
                <li>✓ Class Management</li>
                <li>✓ Assignments</li>
                <li>✓ Grading</li>
                <li>✓ Student Progress Tracking</li>
              </ul>
            </div>

            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-green-900 mb-3">User Information</h2>
              <div className="text-green-700 space-y-2">
                <p><strong>Name:</strong> {user?.username}</p>
                <p><strong>Email:</strong> {user?.email}</p>
                <p><strong>ID:</strong> {user?.userId}</p>
                <p><strong>Roles:</strong> {user?.roles.join(', ')}</p>
              </div>
            </div>
          </div>

          <div className="mt-8 p-4 bg-green-100 border-l-4 border-green-500 text-green-900">
            <p className="font-semibold">Welcome to Teacher Dashboard</p>
            <p className="text-sm mt-2">Manage your classes, assignments, and track student progress.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
