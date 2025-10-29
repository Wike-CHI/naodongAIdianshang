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
// 导入AI工具页面
import AIModel from './pages/AIModel'
import TryOnClothes from './pages/TryOnClothes'
import GlassesTryon from './pages/GlassesTryon'
import ModelVideo from './pages/ModelVideo'
import ProductColorChange from './pages/ProductColorChange'
import ProductSceneChange from './pages/ProductSceneChange'
import ShoeTryon from './pages/ShoeTryon'
import PoseVariation from './pages/PoseVariation'
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
              {/* AI工具页面路由 */}
              <Route path="/ai-model" element={<AIModel />} />
              <Route path="/try-on-clothes" element={<TryOnClothes />} />
              <Route path="/glasses-tryon" element={<GlassesTryon />} />
              <Route path="/model-video" element={<ModelVideo />} />
              <Route path="/color-change" element={<ProductColorChange />} />
              <Route path="/scene-change" element={<ProductSceneChange />} />
              <Route path="/shoe-tryon" element={<ShoeTryon />} />
              <Route path="/pose-variation" element={<PoseVariation />} />
            </Routes>
          </Content>
        </Layout>
      </ToolProvider>
    </AuthProvider>
  )
}

export default App