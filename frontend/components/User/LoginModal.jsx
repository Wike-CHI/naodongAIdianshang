import React, { useState, useEffect } from 'react'
import { Modal, Tabs, Form, Input, Button, message, Space, Card, Avatar, Typography, Divider } from 'antd'
import { WechatOutlined, MobileOutlined, MailOutlined, UserOutlined, LockOutlined, GiftOutlined } from '@ant-design/icons'
import { useAuth } from '../../contexts/AuthContext'
import { referralCodeApi, referralRelationshipApi } from '../../services/referralApi'
import axios from 'axios'
import { API_ENDPOINTS } from '../../config/api'
import logger from '../../utils/logger'

const { Text } = Typography

// 手机验证码弹窗组件
const PhoneVerificationModal = ({ visible, onCancel, onSuccess, title = "手机号验证" }) => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [countdown, setCountdown] = useState(0)

  // 倒计时逻辑
  useEffect(() => {
    let timer
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000)
    }
    return () => clearTimeout(timer)
  }, [countdown])

  // 获取验证码
  const handleGetCode = async () => {
    try {
      const phone = form.getFieldValue('phone')
      if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
        message.error('请输入正确的手机号')
        return
      }
      
      // 模拟发送验证码
      message.success('验证码已发送')
      setCountdown(60)
    } catch (error) {
      message.error('发送验证码失败')
    }
  }

  // 验证手机号
  const handleVerify = async (values) => {
    setLoading(true)
    try {
      // 模拟验证码验证
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      if (values.code !== '123456') {
        message.error('验证码错误')
        return
      }

      message.success('手机号验证成功')
      onSuccess(values.phone)
    } catch (error) {
      message.error('验证失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      title={title}
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={400}
      centered
    >
      <Form form={form} onFinish={handleVerify} layout="vertical">
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
            <Button 
              size="large" 
              onClick={handleGetCode}
              disabled={countdown > 0}
            >
              {countdown > 0 ? `${countdown}s` : '获取验证码'}
            </Button>
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
            验证
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  )
}

const LoginModal = ({ visible, onCancel }) => {
  const { login, register } = useAuth()
  const [phoneForm] = Form.useForm()
  const [emailForm] = Form.useForm()
  const [registerForm] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('wechat')
  const [referralCode, setReferralCode] = useState('')
  const [referralInfo, setReferralInfo] = useState(null)
  const [validatingReferral, setValidatingReferral] = useState(false)
  const [phoneVerificationVisible, setPhoneVerificationVisible] = useState(false)
  const [pendingUserData, setPendingUserData] = useState(null)

  // 验证推广码
  const validateReferralCode = async (code) => {
    if (!code || code.length < 6) {
      setReferralInfo(null)
      return
    }

    setValidatingReferral(true)
    try {
      const response = await referralCodeApi.validateCode(code)
      if (response.success && response.data.valid) {
        setReferralInfo(response.data.referrer)
      } else {
        setReferralInfo(null)
      }
    } catch (error) {
      console.error('验证推广码失败:', error)
      setReferralInfo(null)
    } finally {
      setValidatingReferral(false)
    }
  }

  // 推广码输入变化处理
  const handleReferralCodeChange = (e) => {
    const code = e.target.value.toUpperCase()
    setReferralCode(code)
    
    // 防抖验证
    const timer = setTimeout(() => {
      validateReferralCode(code)
    }, 500)
    
    return () => clearTimeout(timer)
  }

  // 完成登录流程（可接收 token）
  const completeLogin = async (userData, phone, token) => {
    try {
      const updatedUserData = {
        ...userData,
        phone,
        phoneVerified: true
      }

      if (referralCode && referralInfo) {
        await referralRelationshipApi.createRelationship(updatedUserData.id, referralCode)
      }

      const result = await login({ phone, password: token || userData.password })

      if (result.success) {
        message.success('登录成功！')
        onCancel()
      } else {
        message.error(result.error || '登录失败')
      }
    } catch (error) {
      message.error('登录失败，请重试')
    }
  }

  // 微信登录
  const handleWechatLogin = async () => {
    setLoading(true)
    try {
      // 模拟微信登录
      await new Promise(resolve => setTimeout(resolve, 2000))
      const response = await axios.post(API_ENDPOINTS.AUTH.WECHAT_LOGIN)
      
      if (response.data.success) {
        // 保存用户数据，等待手机验证
        setPendingUserData(response.data.data)
        setPhoneVerificationVisible(true)
      } else {
        message.error(response.data.message || '微信登录失败')
      }
    } catch (error) {
      console.error('微信登录失败:', error)
      message.error(error.response?.data?.message || '微信登录失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  // 手机号+密码登录
  const handlePhoneLogin = async (values) => {
    setLoading(true)
    try {
      const result = await login({ phone: values.phone, password: values.password })
      
      if (result.success) {
        message.success('登录成功！')
        onCancel()
      } else {
        message.error(result.error || '登录失败')
      }
    } catch (error) {
      console.error('手机号登录失败:', error)
      message.error(error?.message || '登录失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  // 邮箱/用户名 + 密码登录
  const handleEmailLogin = async (values) => {
    setLoading(true)
    try {
      const payload = {};

      if (values.email) {
        payload.email = values.email;
      }

      if (values.username) {
        payload.username = values.username;
      }

      payload.password = values.password;

      const response = await axios.post(API_ENDPOINTS.AUTH.LOGIN, payload);

      if (response.data.success) {
        logger.log('登录响应数据:', response.data)
        const result = await login(payload)
        if (result.success) {
          message.success('登录成功！')
          onCancel()
        } else {
          message.error(result.error || '登录失败')
        }
      } else {
        message.error(response.data.message || '登录失败')
      }
    } catch (error) {
      console.error('邮箱登录失败:', error)
      message.error(error.response?.data?.message || '登录失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  // 邮箱+手机号注册
  const handleRegister = async (values) => {
    setLoading(true)
    try {
      const response = await axios.post(API_ENDPOINTS.AUTH.REGISTER, { 
        email: values.email,
        phone: values.phone,
        username: values.username,
        password: values.password
      })
      
      if (response.data.success) {
        logger.log('注册响应数据:', response.data)
        const result = await login({ email: values.email, phone: values.phone, username: values.username, password: values.password })
        if (result.success) {
          message.success('注册成功！')
          onCancel()
        } else {
          message.error(result.error || '登录失败')
        }
      } else {
        message.error(response.data.message || '注册失败')
      }
    } catch (error) {
      console.error('注册失败:', error)
      message.error(error.response?.data?.message || '注册失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  // 手机验证成功回调
  const handlePhoneVerificationSuccess = async (phone) => {
    setPhoneVerificationVisible(false)
    if (pendingUserData) {
      await completeLogin(pendingUserData, phone)
      setPendingUserData(null)
    }
  }

  // 推广码输入组件
  const ReferralCodeInput = () => (
    <div style={{ marginBottom: 16 }}>
      <div style={{ marginBottom: 8 }}>
        <Space style={{ fontSize: '14px', color: '#262626' }}>
          <GiftOutlined />
          推广码（可选）
        </Space>
      </div>
      <Input
        placeholder="请输入推广码（可选）"
        value={referralCode}
        onChange={handleReferralCodeChange}
        maxLength={12}
        style={{ textTransform: 'uppercase' }}
      />
      
      {validatingReferral && (
        <div style={{ textAlign: 'center', color: '#1890ff', fontSize: '12px', marginTop: 8 }}>
          验证推广码中...
        </div>
      )}
      
      {referralInfo && (
        <Card size="small" style={{ marginTop: 8, background: '#f6ffed', border: '1px solid #b7eb8f' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Avatar size="small" style={{ marginRight: 8, background: '#52c41a' }}>
              {referralInfo.name.slice(-2)}
            </Avatar>
            <div>
              <Text style={{ fontSize: '12px', color: '#52c41a' }}>
                推广者：{referralInfo.name}
              </Text>
              <br />
              <Text style={{ fontSize: '11px', color: '#8c8c8c' }}>
                使用此推广码注册，推广者将获得奖励
              </Text>
            </div>
          </div>
        </Card>
      )}
      
      {referralCode && !referralInfo && !validatingReferral && (
        <div style={{ fontSize: '12px', color: '#ff4d4f', marginTop: 4 }}>
          推广码无效或不存在
        </div>
      )}
    </div>
  )

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
        <div>
          <ReferralCodeInput />
          <div style={{ textAlign: 'center', padding: '20px' }}>
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
        <div>
          <ReferralCodeInput />
          <Form form={phoneForm} onFinish={handlePhoneLogin} layout="vertical">
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
              name="password"
              label="密码"
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password 
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
          </Form>
        </div>
      )
    },
    {
      key: 'email',
      label: (
        <Space>
          <MailOutlined />
          邮箱登录
        </Space>
      ),
      children: (
        <div>
          <ReferralCodeInput />
          <Form form={emailForm} onFinish={handleEmailLogin} layout="vertical">
            <Form.Item
              name="email"
              label="邮箱"
              rules={[{ type: 'email', message: '请输入正确的邮箱地址' }]}
            >
              <Input
                prefix={<MailOutlined />}
                placeholder="邮箱（可选）"
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="username"
              label="用户名"
              rules={[
                { min: 2, message: '用户名至少2个字符' },
                { max: 50, message: '用户名最多50个字符' }
              ]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="用户名（可选）"
                size="large"
              />
            </Form.Item>

            <Form.Item
              shouldUpdate={(prev, curr) => prev.email !== curr.email || prev.username !== curr.username}
              noStyle
            >
              {({ getFieldValue }) => {
                const hasIdentifier = Boolean(getFieldValue('email')) || Boolean(getFieldValue('username'));
                return (
                  <Form.Item
                    name="password"
                    label="密码"
                    rules={[
                      { required: hasIdentifier, message: '请输入密码' }
                    ]}
                  >
                    <Input.Password
                      placeholder="请输入密码"
                      size="large"
                    />
                  </Form.Item>
                );
              }}
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
        </div>
      )
    },
    {
      key: 'register',
      label: (
        <Space>
          <UserOutlined />
          注册账号
        </Space>
      ),
      children: (
        <div>
          <ReferralCodeInput />
          <Form form={registerForm} onFinish={handleRegister} layout="vertical">
            <Form.Item
              name="username"
              label="用户名"
              rules={[
                { required: true, message: '请输入用户名' },
                { min: 2, message: '用户名至少需要2个字符' },
                { max: 50, message: '用户名不能超过50个字符' }
              ]}
            >
              <Input 
                prefix={<UserOutlined />} 
                placeholder="请输入用户名" 
                size="large"
              />
            </Form.Item>
            
            <Form.Item
              name="email"
              label="邮箱"
              rules={[
                { required: true, message: '请输入邮箱' },
                { type: 'email', message: '请输入正确的邮箱地址' }
              ]}
            >
              <Input 
                prefix={<MailOutlined />} 
                placeholder="请输入邮箱" 
                size="large"
              />
            </Form.Item>
            
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
              name="password"
              label="密码"
              rules={[
                { required: true, message: '请输入密码' },
                { min: 6, message: '密码至少需要6个字符' }
              ]}
            >
              <Input.Password 
                prefix={<LockOutlined />} 
                placeholder="请输入密码" 
                size="large"
              />
            </Form.Item>
            
            <Form.Item
              name="confirm"
              label="确认密码"
              dependencies={['password']}
              rules={[
                { required: true, message: '请确认密码' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('两次输入的密码不一致'));
                  },
                }),
              ]}
            >
              <Input.Password 
                placeholder="请再次输入密码" 
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
                注册
              </Button>
            </Form.Item>
          </Form>
        </div>
      )
    }
  ]

  return (
    <>
      <Modal
        title="登录/注册"
        open={visible}
        onCancel={onCancel}
        footer={null}
        width={450}
        centered
      >
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          centered
        />
      </Modal>

      <PhoneVerificationModal
        visible={phoneVerificationVisible}
        onCancel={() => {
          setPhoneVerificationVisible(false)
          setPendingUserData(null)
        }}
        onSuccess={handlePhoneVerificationSuccess}
        title="绑定手机号"
      />
    </>
  )
}

export default LoginModal