import { useAppSelector, useAppDispatch } from '@/store/hooks'
import { logoutUser } from '@/store/slices/authSlice'
import { useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { toast } from 'sonner'

export default function SuperAdminDashboard() {
  const user = useAppSelector((s) => s.auth.user)
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await dispatch(logoutUser())
    navigate('/login', { replace: true })
    toast.success('Logged out successfully')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 p-8">
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
          <h1 className="text-4xl font-bold text-red-900 mb-2">SuperAdmin Overview</h1>
          <p className="text-red-700 mb-6">System-wide administration and monitoring</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-red-900 mb-3">System Management</h2>
              <ul className="text-red-700 space-y-2">
                <li>✓ User Management</li>
                <li>✓ School Administration</li>
                <li>✓ System Settings</li>
                <li>✓ Audit Logs</li>
              </ul>
            </div>

            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-red-900 mb-3">User Information</h2>
              <div className="text-red-700 space-y-2">
                <p><strong>Name:</strong> {user?.username}</p>
                <p><strong>Email:</strong> {user?.email}</p>
                <p><strong>ID:</strong> {user?.userId}</p>
                <p><strong>Roles:</strong> {user?.roles.join(', ')}</p>
              </div>
            </div>
          </div>

          <div className="mt-8 p-4 bg-red-100 border-l-4 border-red-500 text-red-900">
            <p className="font-semibold">Welcome to SuperAdmin Dashboard</p>
            <p className="text-sm mt-2">You have system-wide access to all features and settings.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
