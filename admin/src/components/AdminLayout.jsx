import React, { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  Layout,
  Menu,
  Button,
  Dropdown,
  Avatar,
  Typography,
  Breadcrumb,
  Space
} from 'antd'
import {
  DashboardOutlined,
  ToolOutlined,
  UserOutlined,
  ApiOutlined,
  CreditCardOutlined,
  SettingOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  HomeOutlined
} from '@ant-design/icons'
import { useAuth } from '../contexts/AuthContext'

const { Header, Sider, Content } = Layout
const { Title } = Typography

const AdminLayout = () => {
  const [collapsed, setCollapsed] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // 菜单项配置
  const menuItems = [
    {
      key: '/admin/dashboard',
      icon: <DashboardOutlined />,
      label: '仪表板',
      title: '仪表板'
    },
    {
      key: '/admin/tools',
      icon: <ToolOutlined />,
      label: 'AI工具管理',
      title: 'AI工具管理'
    },
    {
      key: '/admin/users',
      icon: <UserOutlined />,
      label: '用户管理',
      title: '用户管理'
    },
    {
      key: '/admin/apis',
      icon: <ApiOutlined />,
      label: 'API接口管理',
      title: 'API接口管理'
    },
    {
      key: '/admin/credits',
      icon: <CreditCardOutlined />,
      label: '积分与会员',
      title: '积分与会员管理'
    },
    {
      key: '/admin/referral',
      icon: <UserOutlined />,
      label: '推广管理',
      title: '推广管理'
    },
    {
      key: '/admin/settings',
      icon: <SettingOutlined />,
      label: '系统设置',
      title: '系统设置'
    }
  ]

  // 处理菜单点击
  const handleMenuClick = ({ key }) => {
    navigate(key)
  }

  // 处理用户菜单点击
  const handleUserMenuClick = ({ key }) => {
    if (key === 'logout') {
      logout()
      navigate('/admin/login')
    }
  }

  // 用户下拉菜单
  const userMenuItems = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录'
    }
  ]

  // 获取当前页面标题
  const getCurrentPageTitle = () => {
    const currentItem = menuItems.find(item => item.key === location.pathname)
    return currentItem?.title || '管理后台'
  }

  // 生成面包屑
  const getBreadcrumbItems = () => {
    const pathSnippets = location.pathname.split('/').filter(i => i)
    const breadcrumbItems = [
      {
        title: (
          <span>
            <HomeOutlined />
            <span style={{ marginLeft: 4 }}>首页</span>
          </span>
        )
      }
    ]

    if (pathSnippets.length > 1) {
      const currentItem = menuItems.find(item => item.key === location.pathname)
      if (currentItem) {
        breadcrumbItems.push({
          title: currentItem.title
        })
      }
    }

    return breadcrumbItems
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={256}
        style={{
          background: '#001529'
        }}
      >
        <div style={{
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(255, 255, 255, 0.1)',
          margin: '16px',
          borderRadius: '8px'
        }}>
          <Title
            level={4}
            style={{
              color: 'white',
              margin: 0,
              fontSize: collapsed ? '16px' : '18px',
              transition: 'all 0.2s'
            }}
          >
            {collapsed ? '脑洞' : '脑洞AI管理'}
          </Title>
        </div>

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{
            borderRight: 0,
            background: 'transparent'
          }}
        />
      </Sider>

      <Layout>
        <Header
          style={{
            padding: '0 24px',
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 1px 4px rgba(0,21,41,.08)'
          }}
        >
          <Space align="center">
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{
                fontSize: '16px',
                width: 64,
                height: 64
              }}
            />
            <Breadcrumb items={getBreadcrumbItems()} />
          </Space>

          <Space align="center">
            <span style={{ color: '#666', fontSize: '14px' }}>
              欢迎，{user?.name || user?.username}
            </span>
            <Dropdown
              menu={{
                items: userMenuItems,
                onClick: handleUserMenuClick
              }}
              placement="bottomRight"
              arrow
            >
              <Button type="text" style={{ padding: '4px 8px' }}>
                <Avatar
                  size="small"
                  icon={<UserOutlined />}
                  style={{
                    backgroundColor: '#1890ff',
                    marginRight: '8px'
                  }}
                />
                <span>{user?.name || user?.username}</span>
              </Button>
            </Dropdown>
          </Space>
        </Header>

        <Content
          style={{
            margin: '24px',
            padding: '24px',
            background: '#fff',
            borderRadius: '8px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
            minHeight: 'calc(100vh - 112px)',
            overflow: 'auto'
          }}
        >
          <div className="page-header">
            <h1>{getCurrentPageTitle()}</h1>
            <div className="description">
              {getCurrentPageTitle() === '仪表板' && '系统概览和关键指标展示'}
              {getCurrentPageTitle() === 'AI工具管理' && '管理AI工具配置、提示词模板和API绑定'}
              {getCurrentPageTitle() === '用户管理' && '查看用户信息、调整积分和查看生成记录'}
              {getCurrentPageTitle() === 'API接口管理' && '配置API接口、参数映射和密钥管理'}
              {getCurrentPageTitle() === '积分与会员管理' && '管理积分规则、会员套餐和财务记录'}
              {getCurrentPageTitle() === '系统设置' && '全局配置和管理员账户设置'}
            </div>
          </div>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}

export default AdminLayout