import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Form, 
  Input, 
  Button, 
  Card, 
  message, 
  Typography, 
  Row, 
  Col,
  Spin,
  Divider,
  Space
} from 'antd';
import { 
  UserOutlined, 
  LockOutlined, 
  MailOutlined, 
  PhoneOutlined,
  WechatOutlined
} from '@ant-design/icons';
import './Login.css';

const { Title, Text } = Typography;

const Login = () => {
  const [form] = Form.useForm();
  const { login, wechatLogin, authLoading, authError } = useAuth();
  const navigate = useNavigate();
  const [loginMethod, setLoginMethod] = useState('account'); // 'account' or 'phone'

  const onFinish = async (values) => {
    try {
      console.log('🔐 开始登录流程:', { ...values, password: '[HIDDEN]' });
      
      // 根据登录方式调整参数
      let loginData = { ...values };
      
      if (loginMethod === 'phone') {
        // 手机号登录
        if (!values.phone) {
          message.error('请输入手机号');
          return;
        }
        loginData = { phone: values.phone, password: values.password };
      } else {
        // 账户登录（邮箱或用户名）
        if (!values.email && !values.username) {
          message.error('请输入邮箱或用户名');
          return;
        }
        loginData = { 
          email: values.email, 
          username: values.username, 
          password: values.password 
        };
      }

      const result = await login(loginData);
      
      if (result.success) {
        console.log('✅ 登录成功，跳转到主页');
        message.success('登录成功！');
        navigate('/');
      } else {
        console.error('❌ 登录失败:', result.error);
        message.error(result.error || '登录失败，请重试');
      }
    } catch (error) {
      console.error('❌ 登录过程中发生未处理的错误:', error);
      message.error('登录过程中发生错误，请重试');
    }
  };

  const onFinishFailed = (errorInfo) => {
    console.warn('⚠️ 表单验证失败:', errorInfo);
    message.error('请检查表单填写是否正确');
  };

  const handleWechatLogin = async () => {
    try {
      console.log('📱 开始微信登录');
      const result = await wechatLogin();
      
      if (result.success) {
        console.log('✅ 微信登录成功，跳转到主页');
        message.success('微信登录成功！');
        navigate('/');
      } else {
        console.error('❌ 微信登录失败:', result.error);
        message.error(result.error || '微信登录失败，请重试');
      }
    } catch (error) {
      console.error('❌ 微信登录过程中发生未处理的错误:', error);
      message.error('微信登录过程中发生错误，请重试');
    }
  };

  return (
    <Row justify="center" align="middle" style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <Col xs={20} sm={16} md={12} lg={10} xl={8}>
        <Card 
          title={
            <Title level={2} style={{ textAlign: 'center', marginBottom: 0 }}>
              <UserOutlined /> 登录
            </Title>
          }
          bordered={false}
          style={{ borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
        >
          {authError && (
            <div style={{ 
              marginBottom: 16, 
              padding: 12, 
              backgroundColor: '#fff2f0', 
              border: '1px solid #ffccc7', 
              borderRadius: 4,
              color: '#ff4d4f'
            }}>
              <Text type="danger">{authError}</Text>
            </div>
          )}
          
          <Space direction="vertical" style={{ width: '100%' }}>
            <Button 
              type={loginMethod === 'account' ? 'primary' : 'default'} 
              onClick={() => setLoginMethod('account')}
              block
            >
              账户密码登录
            </Button>
            
            <Button 
              type={loginMethod === 'phone' ? 'primary' : 'default'} 
              onClick={() => setLoginMethod('phone')}
              block
            >
              手机号登录
            </Button>
          </Space>
          
          <Divider />
          
          <Form
            form={form}
            name="login"
            onFinish={onFinish}
            onFinishFailed={onFinishFailed}
            layout="vertical"
            requiredMark={false}
          >
            {loginMethod === 'account' ? (
              <>
                <Form.Item
                  name="email"
                  rules={[
                    { type: 'email', message: '请输入有效的邮箱地址' }
                  ]}
                >
                  <Input 
                    prefix={<MailOutlined />} 
                    placeholder="邮箱" 
                    size="large"
                  />
                </Form.Item>
                
                <Form.Item
                  name="username"
                  rules={[
                    { min: 2, message: '用户名至少2个字符' },
                    { max: 20, message: '用户名最多20个字符' }
                  ]}
                >
                  <Input 
                    prefix={<UserOutlined />} 
                    placeholder="用户名" 
                    size="large"
                  />
                </Form.Item>
              </>
            ) : (
              <Form.Item
                name="phone"
                rules={[
                  { required: true, message: '请输入手机号' },
                  { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号码' }
                ]}
              >
                <Input 
                  prefix={<PhoneOutlined />} 
                  placeholder="手机号" 
                  size="large"
                />
              </Form.Item>
            )}
            
            <Form.Item
              name="password"
              rules={[
                { required: true, message: '请输入密码' },
                { min: 6, message: '密码至少6个字符' }
              ]}
            >
              <Input.Password 
                prefix={<LockOutlined />} 
                placeholder="密码" 
                size="large"
              />
            </Form.Item>

            <Form.Item>
              <Button 
                type="primary" 
                htmlType="submit" 
                size="large" 
                block
                loading={authLoading}
              >
                {authLoading ? <Spin size="small" /> : '登录'}
              </Button>
            </Form.Item>
          </Form>
          
          <Divider>其他登录方式</Divider>
          
          <Row justify="center">
            <Col>
              <Button 
                type="default" 
                icon={<WechatOutlined />} 
                onClick={handleWechatLogin}
                loading={authLoading}
              >
                微信登录
              </Button>
            </Col>
          </Row>
          
          <Divider />
          
          <Row justify="space-between">
            <Col>
              <Text>
                <Link to="/register">注册账户</Link>
              </Text>
            </Col>
            <Col>
              <Text>
                <Link to="/forgot-password">忘记密码</Link>
              </Text>
            </Col>
          </Row>
        </Card>
      </Col>
    </Row>
  );
};

export default Login;