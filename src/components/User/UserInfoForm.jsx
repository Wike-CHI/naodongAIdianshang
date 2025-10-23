import React, { useState } from 'react'
import { Modal, Form, Input, Select, Button, message } from 'antd'
import { UserOutlined, PhoneOutlined, WechatOutlined, ShopOutlined, MailOutlined, EnvironmentOutlined } from '@ant-design/icons'
import { useAuth } from '../../contexts/AuthContext'
import { mockApi } from '../../services/mockApi'

const { Option } = Select

const businessCategories = [
  '女装',
  '男装', 
  '童装',
  '鞋包配饰',
  '家居用品',
  '美妆护肤',
  '食品饮料',
  '数码电器',
  '其他'
]

const UserInfoForm = ({ visible, onCancel }) => {
  const { user, updateUserInfo } = useAuth()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)

  // 手机号验证规则
  const phoneValidator = (_, value) => {
    if (!value) {
      return Promise.resolve()
    }
    const phoneRegex = /^1[3-9]\d{9}$/
    if (!phoneRegex.test(value)) {
      return Promise.reject(new Error('请输入正确的手机号码'))
    }
    return Promise.resolve()
  }

  // 邮箱验证规则
  const emailValidator = (_, value) => {
    if (!value) {
      return Promise.resolve()
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(value)) {
      return Promise.reject(new Error('请输入正确的邮箱地址'))
    }
    return Promise.resolve()
  }

  const handleSubmit = async (values) => {
    setLoading(true)
    try {
      const response = await mockApi.updateUserInfo(values)
      if (response.success) {
        updateUserInfo(values)
        message.success('用户信息更新成功！')
        onCancel()
      } else {
        message.error('更新失败，请重试')
      }
    } catch (error) {
      console.error('更新用户信息失败:', error)
      message.error('更新失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      title="编辑个人信息"
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={600}
      destroyOnHidden
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          username: user?.username || '',
          phone: user?.phone || '',
          wechat: user?.wechat || '',
          shopName: user?.shopName || '',
          businessCategory: user?.businessCategory || '',
          shopAddress: user?.shopAddress || '',
          email: user?.email || ''
        }}
      >
        <Form.Item
          label="用户名"
          name="username"
          rules={[
            { required: true, message: '请输入用户名' },
            { min: 2, max: 20, message: '用户名长度为2-20个字符' }
          ]}
        >
          <Input 
            prefix={<UserOutlined />} 
            placeholder="请输入用户名"
            maxLength={20}
          />
        </Form.Item>

        <Form.Item
          label="手机号码"
          name="phone"
          rules={[{ validator: phoneValidator }]}
        >
          <Input 
            prefix={<PhoneOutlined />} 
            placeholder="请输入手机号码"
            maxLength={11}
          />
        </Form.Item>

        <Form.Item
          label="微信号"
          name="wechat"
        >
          <Input 
            prefix={<WechatOutlined />} 
            placeholder="请输入微信号"
            maxLength={50}
          />
        </Form.Item>

        <Form.Item
          label="店铺名称"
          name="shopName"
        >
          <Input 
            prefix={<ShopOutlined />} 
            placeholder="请输入店铺名称"
            maxLength={100}
          />
        </Form.Item>

        <Form.Item
          label="经营类目"
          name="businessCategory"
        >
          <Select placeholder="请选择经营类目">
            {businessCategories.map(category => (
              <Option key={category} value={category}>
                {category}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          label="店铺地址"
          name="shopAddress"
        >
          <Input.TextArea 
            prefix={<EnvironmentOutlined />} 
            placeholder="请输入店铺地址"
            rows={3}
            maxLength={200}
            showCount
          />
        </Form.Item>

        <Form.Item
          label="联系邮箱"
          name="email"
          rules={[{ validator: emailValidator }]}
        >
          <Input 
            prefix={<MailOutlined />} 
            placeholder="请输入邮箱地址"
            maxLength={100}
          />
        </Form.Item>

        <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
          <Button 
            onClick={onCancel} 
            style={{ marginRight: 8 }}
          >
            取消
          </Button>
          <Button 
            type="primary" 
            htmlType="submit" 
            loading={loading}
          >
            保存
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default UserInfoForm