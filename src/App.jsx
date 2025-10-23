import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { Layout } from 'antd'
import { AuthProvider } from './contexts/AuthContext'
import { ToolProvider } from './contexts/ToolContext'
import Home from './pages/Home'
import Login from './pages/Login'
import Profile from './pages/Profile'
import Subscription from './pages/Subscription'
import ReferralManagement from './pages/ReferralManagement'
import './App.css'

const { Content } = Layout

function App() {
  return (
    <AuthProvider>
      <ToolProvider>
        <Layout className="app-layout">
          <Content>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/subscription" element={<Subscription />} />
              <Route path="/referral" element={<ReferralManagement />} />
            </Routes>
          </Content>
        </Layout>
      </ToolProvider>
    </AuthProvider>
  )
}

export default App