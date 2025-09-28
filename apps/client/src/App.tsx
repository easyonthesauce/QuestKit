import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useSocketConnection } from '@/hooks/useSocket'

// Layout components
import AuthLayout from '@/components/layouts/AuthLayout'
import DashboardLayout from '@/components/layouts/DashboardLayout'

// Auth pages
import LoginPage from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'
import FamilySetupPage from '@/pages/auth/FamilySetupPage'

// Dashboard pages
import DashboardPage from '@/pages/dashboard/DashboardPage'
import QuestsPage from '@/pages/quests/QuestsPage'
import RewardsPage from '@/pages/rewards/RewardsPage'
import FamilyPage from '@/pages/family/FamilyPage'
import ProfilePage from '@/pages/profile/ProfilePage'

// Components
import LoadingSpinner from '@/components/ui/LoadingSpinner'

function App() {
  const { user, isAuthenticated, isLoading } = useAuthStore()
  
  // Initialize socket connection for authenticated users
  useSocketConnection(isAuthenticated)

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/auth" element={<AuthLayout />}>
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="family-setup" element={<FamilySetupPage />} />
      </Route>

      {/* Protected routes */}
      <Route 
        path="/*" 
        element={
          isAuthenticated ? (
            <DashboardLayout>
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/quests" element={<QuestsPage />} />
                <Route path="/rewards" element={<RewardsPage />} />
                <Route path="/family" element={<FamilyPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </DashboardLayout>
          ) : (
            <Navigate to="/auth/login" replace />
          )
        } 
      />
    </Routes>
  )
}

export default App