import React, { useState } from 'react'
import { Layout, Button, Avatar, Dropdown, Space, Badge, Input } from 'antd'
import { UserOutlined, CrownOutlined, WalletOutlined, LogoutOutlined, WechatOutlined, SearchOutlined } from '@ant-design/icons'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import LoginModal from '../User/LoginModal'
import SubscriptionModal from '../Common/SubscriptionModal'

const { Header: AntHeader } = Layout

const Header = () => {
  const { user, logout, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [loginModalVisible, setLoginModalVisible] = useState(false)
  const [subscriptionModalVisible, setSubscriptionModalVisible] = useState(false)
  const [searchValue, setSearchValue] = useState('')

  const handleLogin = () => {
    setLoginModalVisible(true)
  }

  const handleLogout = () => {
    logout()
  }

  const handleSearch = (value) => {
    if (value.trim()) {
      console.log('搜索商品素材:', value)
      // 这里可以添加实际的搜索逻辑
      // 例如：navigate(`/search?q=${encodeURIComponent(value)}`)
    }
  }

  const handleSearchChange = (e) => {
    setSearchValue(e.target.value)
  }

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人中心',
      onClick: () => navigate('/profile')
    },
    {
      key: 'subscription',
      icon: <CrownOutlined />,
      label: '会员中心',
      onClick: () => navigate('/subscription')
    },
    {
      type: 'divider'
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout
    }
  ]

  return (
    <>
      <AntHeader style={{ 
        background: '#fff', 
        padding: '0 24px', 
        borderBottom: '1px solid #f0f0f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '35px' }}>
          <div style={{ 
            fontSize: '20px', 
            fontWeight: 'bold', 
            color: '#1890ff',
            cursor: 'pointer'
          }} onClick={() => navigate('/')}>
            脑洞AI
          </div>
          
          {/* 搜索导航栏 */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Input.Search
              placeholder="搜索商品素材..."
              value={searchValue}
              onChange={handleSearchChange}
              onSearch={handleSearch}
              style={{ 
                width: '300px',
                borderRadius: '20px'
              }}
              size="middle"
              enterButton={<SearchOutlined />}
            />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {isAuthenticated ? (
            <>
              <Space 
                style={{ 
                  cursor: 'pointer', 
                  padding: '4px 8px', 
                  borderRadius: '6px',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f0f0f0'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
                onClick={() => setSubscriptionModalVisible(true)}
              >
                <WalletOutlined style={{ fontSize: '16px', color: '#52c41a' }} />
                <span style={{ fontSize: '14px', color: '#52c41a', fontWeight: 'bold' }}>560</span>
                <span style={{ fontSize: '14px', color: '#666' }}>积分</span>
              </Space>
              
              {user?.membershipType === 'vip' && (
                <Space>
                  <CrownOutlined style={{ color: '#faad14', fontSize: '16px' }} />
                  <span style={{ fontSize: '14px', color: '#faad14' }}>VIP会员</span>
                </Space>
              )}

              <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
                <Space style={{ cursor: 'pointer' }}>
                  <Avatar 
                    src={user?.avatar} 
                    icon={<UserOutlined />} 
                    size="small"
                  />
                  <span>{user?.username}</span>
                </Space>
              </Dropdown>
            </>
          ) : (
            <Space>
              <Button 
                type="primary" 
                icon={<WechatOutlined />}
                onClick={handleLogin}
              >
                微信登录
              </Button>
            </Space>
          )}
        </div>
      </AntHeader>

      <LoginModal 
        visible={loginModalVisible}
        onCancel={() => setLoginModalVisible(false)}
      />
      
      <SubscriptionModal 
        visible={subscriptionModalVisible}
        onClose={() => setSubscriptionModalVisible(false)}
      />
    </>
  )
}

export default Header