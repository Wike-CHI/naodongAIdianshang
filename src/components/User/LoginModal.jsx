import React, { useState } from 'react'
import { Modal, Tabs, Form, Input, Button, message, Space, Divider } from 'antd'
import { WechatOutlined, MobileOutlined, UserOutlined, LockOutlined } from '@ant-design/icons'
import { useAuth } from '../../contexts/AuthContext'
import { mockApi } from '../../services/mockApi'

const LoginModal = ({ visible, onCancel }) => {
  const { login } = useAuth()
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('wechat')

  const handleWechatLogin = async () => {
    setLoading(true)
    try {
      // 模拟微信登录
      await new Promise(resolve => setTimeout(resolve, 2000))
      const response = await mockApi.login({ type: 'wechat' })
      
      if (response.success) {
        login(response.data)
        message.success('登录成功！')
        onCancel()
      }
    } catch (error) {
      message.error('登录失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const handlePhoneLogin = async (values) => {
    setLoading(true)
    try {
      const response = await mockApi.login({ 
        type: 'phone', 
        phone: values.phone, 
        code: values.code 
      })
      
      if (response.success) {
        login(response.data)
        message.success('登录成功！')
        onCancel()
      }
    } catch (error) {
      message.error('登录失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordLogin = async (values) => {
    setLoading(true)
    try {
      const response = await mockApi.login({ 
        type: 'password', 
        username: values.username, 
        password: values.password 
      })
      
      if (response.success) {
        login(response.data)
        message.success('登录成功！')
        onCancel()
      }
    } catch (error) {
      message.error('用户名或密码错误')
    } finally {
      setLoading(false)
    }
  }

  const tabItems = [
    {
      key: 'wechat',
      label: (
        <Space>
          <WechatOutlined />
          微信登录
        </Space>
      ),
      children: (
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div style={{ 
            width: '200px', 
            height: '200px', 
            border: '1px solid #d9d9d9',
            borderRadius: '8px',
            margin: '0 auto 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#fafafa'
          }}>
            <div style={{ textAlign: 'center', color: '#666' }}>
              <WechatOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
              <div>微信扫码登录</div>
            </div>
          </div>
          <Button 
            type="primary" 
            size="large" 
            loading={loading}
            onClick={handleWechatLogin}
            style={{ width: '200px' }}
          >
            {loading ? '登录中...' : '模拟微信登录'}
          </Button>
        </div>
      )
    },
    {
      key: 'phone',
      label: (
        <Space>
          <MobileOutlined />
          手机登录
        </Space>
      ),
      children: (
        <Form onFinish={handlePhoneLogin} layout="vertical">
          <Form.Item
            name="phone"
            label="手机号"
            rules={[
              { required: true, message: '请输入手机号' },
              { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' }
            ]}
          >
            <Input 
              prefix={<MobileOutlined />} 
              placeholder="请输入手机号" 
              size="large"
            />
          </Form.Item>
          
          <Form.Item
            name="code"
            label="验证码"
            rules={[{ required: true, message: '请输入验证码' }]}
          >
            <Space.Compact style={{ width: '100%' }}>
              <Input 
                placeholder="请输入验证码" 
                size="large"
                style={{ flex: 1 }}
              />
              <Button size="large">获取验证码</Button>
            </Space.Compact>
          </Form.Item>
          
          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              size="large" 
              loading={loading}
              block
            >
              登录
            </Button>
          </Form.Item>
        </Form>
      )
    },
    {
      key: 'password',
      label: (
        <Space>
          <UserOutlined />
          账号登录
        </Space>
      ),
      children: (
        <Form onFinish={handlePasswordLogin} layout="vertical">
          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input 
              prefix={<UserOutlined />} 
              placeholder="请输入用户名" 
              size="large"
            />
          </Form.Item>
          
          <Form.Item
            name="password"
            label="密码"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password 
              prefix={<LockOutlined />} 
              placeholder="请输入密码" 
              size="large"
            />
          </Form.Item>
          
          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              size="large" 
              loading={loading}
              block
            >
              登录
            </Button>
          </Form.Item>
          
          <div style={{ textAlign: 'center' }}>
            <Button type="link" size="small">忘记密码？</Button>
            <Divider type="vertical" />
            <Button type="link" size="small">注册账号</Button>
          </div>
        </Form>
      )
    }
  ]

  return (
    <Modal
      title="登录 / 注册"
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={400}
      centered
    >
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
        centered
      />
    </Modal>
  )
}

export default LoginModal