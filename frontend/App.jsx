import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { Layout } from 'antd'
import { AuthProvider } from './contexts/AuthContext'
import { ToolProvider } from './contexts/ToolContext'
import Sidebar from './components/Layout/Sidebar'
import WorkArea from './components/Layout/WorkArea'
import ResultPanel from './components/Layout/ResultPanel'
import Header from './components/Layout/Header'
import Profile from './pages/Profile'
import './App.css'

const { Content } = Layout

// 主页面布局组件
const MainLayout = () => (
  <Layout style={{ minHeight: '100vh' }}>
    <Sidebar />
    <Layout>
      <Header />
      <Content style={{ margin: 0, padding: 0, display: 'flex' }}>
        <WorkArea />
        <ResultPanel />
      </Content>
    </Layout>
  </Layout>
)

// 个人中心布局组件
const ProfileLayout = () => (
  <Layout style={{ minHeight: '100vh' }}>
    <Header />
    <Content style={{ padding: '24px', background: '#f5f5f5' }}>
      <Profile />
    </Content>
  </Layout>
)

function App() {
  return (
    <AuthProvider>
      <ToolProvider>
        <Routes>
          <Route path="/" element={<MainLayout />} />
          <Route path="/profile" element={<ProfileLayout />} />
        </Routes>
      </ToolProvider>
    </AuthProvider>
  )
}

export default App