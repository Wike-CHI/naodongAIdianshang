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
  Spin
} from 'antd';
import { 
  UserOutlined, 
  LockOutlined, 
  MailOutlined, 
  PhoneOutlined 
} from '@ant-design/icons';
import './Register.css';

const { Title, Text } = Typography;

const Register = () => {
  const [form] = Form.useForm();
  const { register, authLoading, authError } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const onFinish = async (values) => {
    try {
      console.log('📝 开始注册流程:', values);
      
      // 确保至少提供一种联系方式
      if (!values.email && !values.phone) {
        message.error('请提供邮箱或手机号');
        return;
      }

      const result = await register(values);
      
      if (result.success) {
        console.log('✅ 注册成功，跳转到主页');
        message.success('注册成功！');
        navigate('/');
      } else {
        console.error('❌ 注册失败:', result.error);
        message.error(result.error || '注册失败，请重试');
      }
    } catch (error) {
      console.error('❌ 注册过程中发生未处理的错误:', error);
      message.error('注册过程中发生错误，请重试');
    }
  };

  const onFinishFailed = (errorInfo) => {
    console.warn('⚠️ 表单验证失败:', errorInfo);
    message.error('请检查表单填写是否正确');
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Row justify="center" align="middle" style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <Col xs={20} sm={16} md={12} lg={10} xl={8}>
        <Card 
          title={
            <Title level={2} style={{ textAlign: 'center', marginBottom: 0 }}>
              <UserOutlined /> 注册
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
          
          <Form
            form={form}
            name="register"
            onFinish={onFinish}
            onFinishFailed={onFinishFailed}
            layout="vertical"
            requiredMark={false}
          >
            <Form.Item
              name="username"
              rules={[
                { required: true, message: '请输入用户名' },
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

            <Form.Item
              name="email"
              rules={[
                { type: 'email', message: '请输入有效的邮箱地址' }
              ]}
            >
              <Input 
                prefix={<MailOutlined />} 
                placeholder="邮箱（可选）" 
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="phone"
              rules={[
                { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号码' }
              ]}
            >
              <Input 
                prefix={<PhoneOutlined />} 
                placeholder="手机号（可选）" 
                size="large"
              />
            </Form.Item>

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
                iconRender={visible => (
                  <span onClick={togglePasswordVisibility}>
                    {visible ? '🙈' : '👁️'}
                  </span>
                )}
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
                {authLoading ? <Spin size="small" /> : '注册'}
              </Button>
            </Form.Item>

            <Form.Item>
              <Text type="secondary">
                注册即表示您同意我们的 <Link to="/terms">服务条款</Link> 和 <Link to="/privacy">隐私政策</Link>
              </Text>
            </Form.Item>

            <Form.Item>
              <Text>
                已有账户？<Link to="/login">立即登录</Link>
              </Text>
            </Form.Item>
          </Form>
        </Card>
      </Col>
    </Row>
  );
};

export default Register;