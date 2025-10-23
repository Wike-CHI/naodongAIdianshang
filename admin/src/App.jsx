import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { NotificationProvider } from './contexts/NotificationContext'
import LoginPage from './pages/LoginPage'
import AdminLayout from './components/AdminLayout'
import Dashboard from './pages/Dashboard'
import ToolsPage from './pages/ToolsPage'
import UsersPage from './pages/UsersPage'
import ApisPage from './pages/ApisPage'
import CreditsPage from './pages/CreditsPage'
import SettingsPage from './pages/SettingsPage'
import ReferralAdminPage from './pages/ReferralAdminPage'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Routes>
          <Route path="/admin/login" element={<LoginPage />} />
          <Route path="/admin" element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="tools" element={<ToolsPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="apis" element={<ApisPage />} />
            <Route path="credits" element={<CreditsPage />} />
            <Route path="referral" element={<ReferralAdminPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
          <Route path="/" element={<Navigate to="/admin" replace />} />
        </Routes>
      </NotificationProvider>
    </AuthProvider>
  )
}

export default App