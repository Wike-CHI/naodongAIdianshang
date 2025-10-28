import React from 'react'
import { Card, Typography } from 'antd'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import LoginModal from '../components/User/LoginModal'

const { Title } = Typography

const Login = () => {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/')
    }
  }, [isAuthenticated, navigate])

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: '#f5f5f5'
    }}>
      <Card style={{ width: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <Title level={2}>脑洞AI</Title>
          <p style={{ color: '#666' }}>多功能AI生成工具平台</p>
        </div>
        
        <LoginModal 
          visible={true} 
          onCancel={() => navigate('/')}
        />
      </Card>
    </div>
  )
}

export default Login