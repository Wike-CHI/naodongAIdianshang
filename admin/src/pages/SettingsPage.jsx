import React, { useState, useEffect } from 'react'
import { Card, Form, Input, Button, Switch, Select, message, Tabs, Table, Space, Modal, InputNumber, Upload } from 'antd'
import { SaveOutlined, PlusOutlined, EditOutlined, DeleteOutlined, UploadOutlined, KeyOutlined } from '@ant-design/icons'

const { TextArea } = Input
const { Option } = Select

const SettingsPage = () => {
  const [loading, setLoading] = useState(false)
  const [systemConfig, setSystemConfig] = useState({})
  const [adminUsers, setAdminUsers] = useState([])
  const [modalVisible, setModalVisible] = useState(false)
  const [editingAdmin, setEditingAdmin] = useState(null)
  const [activeTab, setActiveTab] = useState('system')
  const [form] = Form.useForm()
  const [adminForm] = Form.useForm()

  // 模拟数据
  useEffect(() => {
    setLoading(true)
    setTimeout(() => {
      // 系统配置数据
      setSystemConfig({
        siteName: '脑洞AI管理后台',
        siteDescription: '智能AI工具管理平台',
        contactEmail: 'admin@naodongai.com',
        maxFileSize: 10,
        allowedFileTypes: 'jpg,jpeg,png,gif,pdf,doc,docx',
        enableRegistration: true,
        enableEmailVerification: false,
        defaultCredits: 10,
        maxDailyGenerations: 100,
        sessionTimeout: 30,
        enableMaintenance: false,
        maintenanceMessage: '系统维护中，请稍后再试',
        enableAnalytics: true,
        analyticsCode: 'GA-XXXXXXXXX',
        enableNotifications: true,
        smtpHost: 'smtp.example.com',
        smtpPort: 587,
        smtpUser: 'noreply@naodongai.com',
        smtpPassword: '********',
        enableSsl: true
      })

      // 管理员用户数据
      setAdminUsers([
        {
          id: '1',
          username: 'admin',
          email: 'admin@naodongai.com',
          role: 'super_admin',
          status: 'active',
          lastLogin: '2024-01-20 14:30:25',
          createdAt: '2024-01-01',
          permissions: ['user_management', 'tool_management', 'system_settings', 'financial_management']
        },
        {
          id: '2',
          username: 'manager',
          email: 'manager@naodongai.com',
          role: 'admin',
          status: 'active',
          lastLogin: '2024-01-19 16:45:10',
          createdAt: '2024-01-05',
          permissions: ['user_management', 'tool_management']
        },
        {
          id: '3',
          username: 'support',
          email: 'support@naodongai.com',
          role: 'operator',
          status: 'inactive',
          lastLogin: '2024-01-15 09:20:30',
          createdAt: '2024-01-10',
          permissions: ['user_management']
        }
      ])
      setLoading(false)
    }, 1000)
  }, [])

  // 管理员用户表格列定义
  const adminColumns = [
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      width: 120,
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 600 }}>{text}</div>
          <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
            {record.email}
          </div>
        </div>
      )
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      width: 120,
      render: (role) => {
        const roleMap = {
          super_admin: { color: 'red', text: '超级管理员' },
          admin: { color: 'blue', text: '管理员' },
          operator: { color: 'green', text: '操作员' }
        }
        const config = roleMap[role] || { color: 'default', text: role }
        return (
          <span style={{ 
            padding: '2px 8px', 
            borderRadius: '4px', 
            backgroundColor: config.color === 'red' ? '#fff2f0' : 
                           config.color === 'blue' ? '#f0f5ff' : '#f6ffed',
            color: config.color === 'red' ? '#cf1322' : 
                   config.color === 'blue' ? '#1890ff' : '#389e0d',
            fontSize: '12px'
          }}>
            {config.text}
          </span>
        )
      }
    },
    {
      title: '权限',
      dataIndex: 'permissions',
      key: 'permissions',
      render: (permissions) => (
        <div>
          {permissions.slice(0, 2).map(perm => {
            const permMap = {
              user_management: '用户管理',
              tool_management: '工具管理',
              system_settings: '系统设置',
              financial_management: '财务管理'
            }
            return (
              <span key={perm} style={{ 
                display: 'inline-block',
                padding: '1px 6px',
                margin: '1px',
                backgroundColor: '#f0f0f0',
                borderRadius: '2px',
                fontSize: '11px'
              }}>
                {permMap[perm] || perm}
              </span>
            )
          })}
          {permissions.length > 2 && (
            <span style={{ fontSize: '12px', color: '#8c8c8c' }}>
              +{permissions.length - 2}
            </span>
          )}
        </div>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status) => (
        <span style={{
          padding: '2px 8px',
          borderRadius: '4px',
          backgroundColor: status === 'active' ? '#f6ffed' : '#fff2f0',
          color: status === 'active' ? '#389e0d' : '#cf1322',
          fontSize: '12px'
        }}>
          {status === 'active' ? '正常' : '停用'}
        </span>
      )
    },
    {
      title: '最后登录',
      dataIndex: 'lastLogin',
      key: 'lastLogin',
      width: 150
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditAdmin(record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            icon={<KeyOutlined />}
            onClick={() => handleResetPassword(record)}
          >
            重置密码
          </Button>
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteAdmin(record)}
          >
            删除
          </Button>
        </Space>
      )
    }
  ]

  // 处理系统配置保存
  const handleSystemConfigSave = async (values) => {
    try {
      setSystemConfig({ ...systemConfig, ...values })
      message.success('系统配置保存成功')
    } catch (error) {
      message.error('保存失败')
    }
  }

  // 处理管理员编辑
  const handleEditAdmin = (admin) => {
    setEditingAdmin(admin)
    adminForm.setFieldsValue(admin)
    setModalVisible(true)
  }

  // 处理管理员新增
  const handleAddAdmin = () => {
    setEditingAdmin(null)
    adminForm.resetFields()
    setModalVisible(true)
  }

  // 处理管理员删除
  const handleDeleteAdmin = (admin) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除管理员"${admin.username}"吗？`,
      onOk: () => {
        setAdminUsers(adminUsers.filter(a => a.id !== admin.id))
        message.success('删除成功')
      }
    })
  }

  // 处理密码重置
  const handleResetPassword = (admin) => {
    Modal.confirm({
      title: '重置密码',
      content: `确定要重置管理员"${admin.username}"的密码吗？新密码将发送到其邮箱。`,
      onOk: () => {
        message.success('密码重置成功，新密码已发送到邮箱')
      }
    })
  }

  // 处理管理员表单提交
  const handleAdminSubmit = async (values) => {
    try {
      if (editingAdmin) {
        setAdminUsers(adminUsers.map(admin => 
          admin.id === editingAdmin.id ? { ...admin, ...values } : admin
        ))
        message.success('更新成功')
      } else {
        const newAdmin = {
          id: Date.now().toString(),
          ...values,
          status: 'active',
          lastLogin: '-',
          createdAt: new Date().toISOString().split('T')[0]
        }
        setAdminUsers([...adminUsers, newAdmin])
        message.success('添加成功')
      }
      setModalVisible(false)
      adminForm.resetFields()
    } catch (error) {
      message.error('操作失败')
    }
  }

  const tabItems = [
    {
      key: 'system',
      label: '系统配置',
      children: (
        <>
          <Card title="基本设置" style={{ marginBottom: 16 }}>
            <Form
              layout="vertical"
              initialValues={systemConfig}
              onFinish={handleSystemConfigSave}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Form.Item
                  name="siteName"
                  label="网站名称"
                  rules={[{ required: true, message: '请输入网站名称' }]}
                >
                  <Input placeholder="请输入网站名称" />
                </Form.Item>
                
                <Form.Item
                  name="contactEmail"
                  label="联系邮箱"
                  rules={[
                    { required: true, message: '请输入联系邮箱' },
                    { type: 'email', message: '请输入有效的邮箱地址' }
                  ]}
                >
                  <Input placeholder="请输入联系邮箱" />
                </Form.Item>
              </div>
              
              <Form.Item
                name="siteDescription"
                label="网站描述"
              >
                <TextArea rows={3} placeholder="请输入网站描述" />
              </Form.Item>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                <Form.Item
                  name="maxFileSize"
                  label="最大文件大小(MB)"
                >
                  <InputNumber min={1} max={100} style={{ width: '100%' }} />
                </Form.Item>
                
                <Form.Item
                  name="defaultCredits"
                  label="新用户默认积分"
                >
                  <InputNumber min={0} style={{ width: '100%' }} />
                </Form.Item>
                
                <Form.Item
                  name="sessionTimeout"
                  label="会话超时(分钟)"
                >
                  <InputNumber min={5} max={1440} style={{ width: '100%' }} />
                </Form.Item>
              </div>
              
              <Form.Item
                name="allowedFileTypes"
                label="允许的文件类型"
              >
                <Input placeholder="用逗号分隔，如：jpg,png,pdf" />
              </Form.Item>
              
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
                保存配置
              </Button>
            </Form>
          </Card>

          <Card title="功能开关" style={{ marginBottom: 16 }}>
            <Form
              layout="vertical"
              initialValues={systemConfig}
              onFinish={handleSystemConfigSave}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Form.Item name="enableRegistration" valuePropName="checked">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>允许用户注册</span>
                    <Switch />
                  </div>
                </Form.Item>
                
                <Form.Item name="enableEmailVerification" valuePropName="checked">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>邮箱验证</span>
                    <Switch />
                  </div>
                </Form.Item>
                
                <Form.Item name="enableMaintenance" valuePropName="checked">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>维护模式</span>
                    <Switch />
                  </div>
                </Form.Item>
                
                <Form.Item name="enableAnalytics" valuePropName="checked">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>数据统计</span>
                    <Switch />
                  </div>
                </Form.Item>
              </div>
              
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
                保存设置
              </Button>
            </Form>
          </Card>

          <Card title="邮件配置">
            <Form
              layout="vertical"
              initialValues={systemConfig}
              onFinish={handleSystemConfigSave}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Form.Item
                  name="smtpHost"
                  label="SMTP服务器"
                >
                  <Input placeholder="请输入SMTP服务器地址" />
                </Form.Item>
                
                <Form.Item
                  name="smtpPort"
                  label="SMTP端口"
                >
                  <InputNumber min={1} max={65535} style={{ width: '100%' }} />
                </Form.Item>
                
                <Form.Item
                  name="smtpUser"
                  label="SMTP用户名"
                >
                  <Input placeholder="请输入SMTP用户名" />
                </Form.Item>
                
                <Form.Item
                  name="smtpPassword"
                  label="SMTP密码"
                >
                  <Input.Password placeholder="请输入SMTP密码" />
                </Form.Item>
              </div>
              
              <Form.Item name="enableSsl" valuePropName="checked">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '200px' }}>
                  <span>启用SSL</span>
                  <Switch />
                </div>
              </Form.Item>
              
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
                保存邮件配置
              </Button>
            </Form>
          </Card>
        </>
      )
    },
    {
      key: 'admins',
      label: '管理员账户',
      children: (
        <>
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddAdmin}>
              添加管理员
            </Button>
            <Space>
              <Button>批量操作</Button>
              <Button>导出列表</Button>
            </Space>
          </div>

          <Table
            columns={adminColumns}
            dataSource={adminUsers}
            rowKey="id"
            loading={loading}
            pagination={{
              total: adminUsers.length,
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `共 ${total} 条记录`
            }}
          />
        </>
      )
    },
    {
      key: 'info',
      label: '系统信息',
      children: (
        <>
          <Card title="系统信息">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <p><strong>系统版本：</strong>v1.0.0</p>
                <p><strong>Node.js版本：</strong>v18.17.0</p>
                <p><strong>数据库版本：</strong>MySQL 8.0</p>
                <p><strong>Redis版本：</strong>v7.0.5</p>
              </div>
              <div>
                <p><strong>服务器时间：</strong>{new Date().toLocaleString()}</p>
                <p><strong>运行时间：</strong>15天 8小时 32分钟</p>
                <p><strong>内存使用：</strong>2.1GB / 8GB</p>
                <p><strong>磁盘使用：</strong>45GB / 100GB</p>
              </div>
            </div>
          </Card>

          <Card title="系统日志" style={{ marginTop: 16 }}>
            <div style={{ backgroundColor: '#f5f5f5', padding: 16, borderRadius: 4, fontFamily: 'monospace', fontSize: '12px' }}>
              <div>[2024-01-20 14:30:25] INFO: 系统启动成功</div>
              <div>[2024-01-20 14:25:10] INFO: 数据库连接成功</div>
              <div>[2024-01-20 14:20:05] INFO: Redis连接成功</div>
              <div>[2024-01-20 14:15:30] WARN: 磁盘空间使用率较高</div>
              <div>[2024-01-20 14:10:15] INFO: 定时任务执行成功</div>
            </div>
            <div style={{ marginTop: 8, textAlign: 'right' }}>
              <Button size="small">查看完整日志</Button>
            </div>
          </Card>
        </>
      )
    }
  ]

  return (
    <div>
      <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />

      {/* 管理员编辑/新增模态框 */}
      <Modal
        title={editingAdmin ? '编辑管理员' : '添加管理员'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => adminForm.submit()}
        width={500}
      >
        <Form
          form={adminForm}
          layout="vertical"
          onFinish={handleAdminSubmit}
        >
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
          
          <Form.Item
            name="role"
            label="角色"
            rules={[{ required: true, message: '请选择角色' }]}
          >
            <Select placeholder="请选择角色">
              <Option value="super_admin">超级管理员</Option>
              <Option value="admin">管理员</Option>
              <Option value="operator">操作员</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="permissions"
            label="权限"
            rules={[{ required: true, message: '请选择权限' }]}
          >
            <Select mode="multiple" placeholder="请选择权限">
              <Option value="user_management">用户管理</Option>
              <Option value="tool_management">工具管理</Option>
              <Option value="system_settings">系统设置</Option>
              <Option value="financial_management">财务管理</Option>
            </Select>
          </Form.Item>
          
          {!editingAdmin && (
            <Form.Item
              name="password"
              label="密码"
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password placeholder="请输入密码" />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  )
}

export default SettingsPage