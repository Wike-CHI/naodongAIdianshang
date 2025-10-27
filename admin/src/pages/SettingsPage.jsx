import React, { useState, useEffect } from 'react'
import { Card, Form, Input, Button, Switch, Select, message, Tabs, Upload, Avatar, Divider, Space, Tag, Table, Modal, InputNumber } from 'antd'
import { SaveOutlined, UploadOutlined, UserOutlined, SettingOutlined, SecurityScanOutlined, BellOutlined, DatabaseOutlined, ApiOutlined } from '@ant-design/icons'
import { systemAPI, usersAPI } from '../services/api'

const { Option } = Select
const { TextArea } = Input

const SettingsPage = () => {
  const [loading, setLoading] = useState(false)
  const [systemConfig, setSystemConfig] = useState({})
  const [adminUsers, setAdminUsers] = useState([])
  const [form] = Form.useForm()
  const [userForm] = Form.useForm()
  const [modalVisible, setModalVisible] = useState(false)
  const [editingUser, setEditingUser] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  // 加载所有数据
  const loadData = async () => {
    try {
      setLoading(true)
      await Promise.all([
        loadSystemConfig(),
        loadAdminUsers()
      ])
    } catch (error) {
      console.error('加载数据失败:', error)
      message.error('加载数据失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  // 加载系统配置
  const loadSystemConfig = async () => {
    try {
      const result = await systemAPI.getSystemStats()
      
      if (result.success) {
        const config = result.data || {}
        setSystemConfig(config)
        form.setFieldsValue(config)
      } else {
        setSystemConfig({})
      }
    } catch (error) {
      console.error('加载系统配置失败:', error)
      setSystemConfig({})
    }
  }

  // 加载管理员用户
  const loadAdminUsers = async () => {
    try {
      const result = await usersAPI.getUsers({ role: 'admin' })
      
      if (result.success) {
        setAdminUsers(result.data?.users || [])
      } else {
        setAdminUsers([])
      }
    } catch (error) {
      console.error('加载管理员用户失败:', error)
      setAdminUsers([])
    }
  }

  // 保存系统配置
  const handleSaveConfig = async () => {
    try {
      const values = await form.validateFields()
      message.success('系统配置保存成功')
      setSystemConfig(values)
    } catch (error) {
      console.error('保存系统配置失败:', error)
      message.error('保存系统配置失败，请稍后重试')
    }
  }

  // 添加管理员用户
  const handleAddUser = () => {
    setEditingUser(null)
    userForm.resetFields()
    setModalVisible(true)
  }

  // 编辑管理员用户
  const handleEditUser = (user) => {
    setEditingUser(user)
    userForm.setFieldsValue(user)
    setModalVisible(true)
  }

  // 保存管理员用户
  const handleSaveUser = async () => {
    try {
      const values = await userForm.validateFields()
      
      message.success(editingUser ? '管理员用户更新成功' : '管理员用户创建成功')
      setModalVisible(false)
      setEditingUser(null)
      userForm.resetFields()
      loadAdminUsers()
    } catch (error) {
      console.error('保存管理员用户失败:', error)
      message.error('保存管理员用户失败，请稍后重试')
    }
  }

  // 删除管理员用户
  const handleDeleteUser = async (userId) => {
    try {
      message.success('管理员用户删除成功')
      loadAdminUsers()
    } catch (error) {
      console.error('删除管理员用户失败:', error)
      message.error('删除管理员用户失败，请稍后重试')
    }
  }

  // 管理员用户表格列
  const userColumns = [
    {
      title: '用户信息',
      key: 'userInfo',
      width: 200,
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Avatar 
            src={record.avatar} 
            icon={<UserOutlined />} 
            style={{ marginRight: 12 }}
          />
          <div>
            <div style={{ fontWeight: 600 }}>{record.username}</div>
            <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
              {record.email}
            </div>
          </div>
        </div>
      )
    },
    {
      title: '角色权限',
      dataIndex: 'permissions',
      key: 'permissions',
      width: 200,
      render: (permissions) => (
        <div>
          {permissions?.map(permission => (
            <Tag key={permission} color="blue" style={{ marginBottom: 4 }}>
              {permission}
            </Tag>
          ))}
        </div>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => (
        <Tag color={status === 'active' ? 'success' : 'default'}>
          {status === 'active' ? '正常' : '禁用'}
        </Tag>
      )
    },
    {
      title: '最后登录',
      dataIndex: 'lastLoginAt',
      key: 'lastLoginAt',
      width: 150,
      render: (date) => date ? new Date(date).toLocaleString() : '从未登录'
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date) => date ? new Date(date).toLocaleDateString() : '-'
    },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Button 
            type="text" 
            size="small"
            onClick={() => handleEditUser(record)}
          >
            编辑
          </Button>
          <Button 
            type="text" 
            size="small" 
            danger
            onClick={() => handleDeleteUser(record._id)}
          >
            删除
          </Button>
        </Space>
      )
    }
  ]

  return (
    <div>
      <Tabs 
        defaultActiveKey="system"
        items={[
          {
            key: 'system',
            label: <span><SettingOutlined />系统配置</span>,
            children: (
              <Card title="基础配置" style={{ marginBottom: 24 }}>
                <Form form={form} layout="vertical" onFinish={handleSaveConfig}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                    <Form.Item
                      name="siteName"
                      label="网站名称"
                      rules={[{ required: true, message: '请输入网站名称' }]}
                    >
                      <Input placeholder="请输入网站名称" />
                    </Form.Item>
                    
                    <Form.Item
                      name="siteUrl"
                      label="网站地址"
                      rules={[{ required: true, message: '请输入网站地址' }]}
                    >
                      <Input placeholder="https://example.com" />
                    </Form.Item>
                    
                    <Form.Item
                      name="adminEmail"
                      label="管理员邮箱"
                      rules={[
                        { required: true, message: '请输入管理员邮箱' },
                        { type: 'email', message: '请输入有效的邮箱地址' }
                      ]}
                    >
                      <Input placeholder="admin@example.com" />
                    </Form.Item>
                    
                    <Form.Item
                      name="maxFileSize"
                      label="最大文件大小(MB)"
                      rules={[{ required: true, message: '请输入最大文件大小' }]}
                    >
                      <InputNumber min={1} max={100} style={{ width: '100%' }} />
                    </Form.Item>
                  </div>
                  
                  <Form.Item
                    name="siteDescription"
                    label="网站描述"
                  >
                    <TextArea rows={3} placeholder="请输入网站描述" />
                  </Form.Item>
                  
                  <Divider />
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                    <Form.Item
                      name="enableRegistration"
                      label="允许用户注册"
                      valuePropName="checked"
                    >
                      <Switch checkedChildren="开启" unCheckedChildren="关闭" />
                    </Form.Item>
                    
                    <Form.Item
                      name="enableEmailVerification"
                      label="邮箱验证"
                      valuePropName="checked"
                    >
                      <Switch checkedChildren="开启" unCheckedChildren="关闭" />
                    </Form.Item>
                    
                    <Form.Item
                      name="enableMaintenance"
                      label="维护模式"
                      valuePropName="checked"
                    >
                      <Switch checkedChildren="开启" unCheckedChildren="关闭" />
                    </Form.Item>
                    
                    <Form.Item
                      name="enableAnalytics"
                      label="数据统计"
                      valuePropName="checked"
                    >
                      <Switch checkedChildren="开启" unCheckedChildren="关闭" />
                    </Form.Item>
                  </div>
                  
                  <Form.Item>
                    <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading}>
                      保存配置
                    </Button>
                  </Form.Item>
                </Form>
              </Card>
            )
          },
          {
            key: 'security',
            label: <span><SecurityScanOutlined />安全设置</span>,
            children: (
              <Card title="安全配置">
                <Form layout="vertical">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                    <Form.Item
                      name="sessionTimeout"
                      label="会话超时时间(分钟)"
                    >
                      <InputNumber min={5} max={1440} style={{ width: '100%' }} />
                    </Form.Item>
                    
                    <Form.Item
                      name="maxLoginAttempts"
                      label="最大登录尝试次数"
                    >
                      <InputNumber min={3} max={10} style={{ width: '100%' }} />
                    </Form.Item>
                    
                    <Form.Item
                      name="passwordMinLength"
                      label="密码最小长度"
                    >
                      <InputNumber min={6} max={20} style={{ width: '100%' }} />
                    </Form.Item>
                    
                    <Form.Item
                      name="enableTwoFactor"
                      label="双因子认证"
                      valuePropName="checked"
                    >
                      <Switch checkedChildren="开启" unCheckedChildren="关闭" />
                    </Form.Item>
                  </div>
                  
                  <Form.Item>
                    <Button type="primary" icon={<SaveOutlined />}>
                      保存安全设置
                    </Button>
                  </Form.Item>
                </Form>
              </Card>
            )
          },
          {
            key: 'admins',
            label: <span><UserOutlined />管理员</span>,
            children: (
              <Card>
                <div style={{ marginBottom: 16 }}>
                  <Button type="primary" onClick={handleAddUser}>
                    添加管理员
                  </Button>
                </div>
                
                <Table
                  columns={userColumns}
                  dataSource={adminUsers}
                  rowKey="_id"
                  loading={loading}
                  pagination={{
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
                  }}
                />
              </Card>
            )
          },
          {
            key: 'database',
            label: <span><DatabaseOutlined />数据库</span>,
            children: (
              <Card title="数据库状态">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                  <div>
                    <h4>连接状态</h4>
                    <Tag color="success">正常连接</Tag>
                  </div>
                  <div>
                    <h4>数据库大小</h4>
                    <span>125.6 MB</span>
                  </div>
                  <div>
                    <h4>总用户数</h4>
                    <span>1,234</span>
                  </div>
                  <div>
                    <h4>总生成记录</h4>
                    <span>5,678</span>
                  </div>
                </div>
                
                <Divider />
                
                <Space>
                  <Button>备份数据库</Button>
                  <Button>优化数据库</Button>
                  <Button danger>清理缓存</Button>
                </Space>
              </Card>
            )
          }
        ]}
      />

      {/* 添加/编辑管理员用户模态框 */}
      <Modal
        title={editingUser ? '编辑管理员' : '添加管理员'}
        open={modalVisible}
        onOk={handleSaveUser}
        onCancel={() => {
          setModalVisible(false)
          setEditingUser(null)
          userForm.resetFields()
        }}
        width={600}
        destroyOnHidden
      >
        <Form form={userForm} layout="vertical">
          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input placeholder="请输入用户名" />
          </Form.Item>
          
          <Form.Item
            name="email"
            label="邮箱"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' }
            ]}
          >
            <Input placeholder="请输入邮箱" />
          </Form.Item>
          
          {!editingUser && (
            <Form.Item
              name="password"
              label="密码"
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password placeholder="请输入密码" />
            </Form.Item>
          )}
          
          <Form.Item
            name="permissions"
            label="权限"
            rules={[{ required: true, message: '请选择权限' }]}
          >
            <Select mode="multiple" placeholder="请选择权限">
              <Option value="user_management">用户管理</Option>
              <Option value="tool_management">工具管理</Option>
              <Option value="content_management">内容管理</Option>
              <Option value="system_settings">系统设置</Option>
              <Option value="data_analytics">数据分析</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="status"
            label="状态"
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Select placeholder="请选择状态">
              <Option value="active">正常</Option>
              <Option value="inactive">禁用</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default SettingsPage