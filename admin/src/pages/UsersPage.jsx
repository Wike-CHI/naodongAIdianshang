import React, { useState, useEffect } from 'react'
import { Table, Button, Space, Tag, Modal, Form, Input, InputNumber, message, Avatar, Tabs, Card, Statistic } from 'antd'
import { UserOutlined, EditOutlined, EyeOutlined, PlusOutlined, MinusOutlined, SearchOutlined } from '@ant-design/icons'
import { AvatarWithFallback } from '../utils/avatarUtils'

const { Search } = Input

const UsersPage = () => {
  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState([])
  const [creditModalVisible, setCreditModalVisible] = useState(false)
  const [recordModalVisible, setRecordModalVisible] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [userRecords, setUserRecords] = useState([])
  const [form] = Form.useForm()

  // 模拟数据
  useEffect(() => {
    setLoading(true)
    setTimeout(() => {
      setUsers([
        {
          id: '1',
          username: 'user001',
          wechatId: 'wx_user001',
          avatarSeed: '1',
          credits: 1250,
          membershipLevel: 'premium',
          registeredAt: '2024-01-15',
          lastActiveAt: '2024-01-20',
          totalGeneration: 156,
          status: 'active'
        },
        {
          id: '2',
          username: 'user002',
          wechatId: 'wx_user002',
          avatarSeed: '2',
          credits: 580,
          membershipLevel: 'basic',
          registeredAt: '2024-01-12',
          lastActiveAt: '2024-01-19',
          totalGeneration: 89,
          status: 'active'
        },
        {
          id: '3',
          username: 'user003',
          wechatId: 'wx_user003',
          avatarSeed: '3',
          credits: 0,
          membershipLevel: 'free',
          registeredAt: '2024-01-10',
          lastActiveAt: '2024-01-18',
          totalGeneration: 25,
          status: 'inactive'
        }
      ])
      setLoading(false)
    }, 1000)
  }, [])

  // 表格列定义
  const columns = [
    {
      title: '用户信息',
      key: 'userInfo',
      width: 200,
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <AvatarWithFallback seed={record.avatarSeed} size={40} style={{ marginRight: 12 }} />
          <div>
            <div style={{ fontWeight: 600 }}>{record.username}</div>
            <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
              {record.wechatId}
            </div>
          </div>
        </div>
      )
    },
    {
      title: '积分余额',
      dataIndex: 'credits',
      key: 'credits',
      width: 120,
      render: (credits) => (
        <span style={{ 
          color: credits > 0 ? '#52c41a' : '#f5222d', 
          fontWeight: 600,
          fontSize: '16px'
        }}>
          {credits}
        </span>
      ),
      sorter: (a, b) => a.credits - b.credits
    },
    {
      title: '会员等级',
      dataIndex: 'membershipLevel',
      key: 'membershipLevel',
      width: 100,
      render: (level) => {
        const config = {
          free: { color: 'default', text: '免费用户' },
          basic: { color: 'blue', text: '基础会员' },
          premium: { color: 'gold', text: '高级会员' },
          vip: { color: 'purple', text: 'VIP会员' }
        }
        return <Tag color={config[level]?.color}>{config[level]?.text}</Tag>
      }
    },
    {
      title: '生成次数',
      dataIndex: 'totalGeneration',
      key: 'totalGeneration',
      width: 100,
      sorter: (a, b) => a.totalGeneration - b.totalGeneration
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
          {status === 'active' ? '活跃' : '非活跃'}
        </Tag>
      )
    },
    {
      title: '注册时间',
      dataIndex: 'registeredAt',
      key: 'registeredAt',
      width: 120
    },
    {
      title: '最后活跃',
      dataIndex: 'lastActiveAt',
      key: 'lastActiveAt',
      width: 120
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleCreditAdjust(record)}
          >
            调整积分
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewRecords(record)}
          >
            查看记录
          </Button>
        </Space>
      )
    }
  ]

  // 生成记录列定义
  const recordColumns = [
    {
      title: '工具名称',
      dataIndex: 'toolName',
      key: 'toolName'
    },
    {
      title: '消耗积分',
      dataIndex: 'creditCost',
      key: 'creditCost',
      render: (cost) => <span style={{ color: '#faad14' }}>-{cost}</span>
    },
    {
      title: '生成状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'success' ? 'green' : status === 'failed' ? 'red' : 'orange'}>
          {status === 'success' ? '成功' : status === 'failed' ? '失败' : '处理中'}
        </Tag>
      )
    },
    {
      title: '生成时间',
      dataIndex: 'createdAt',
      key: 'createdAt'
    }
  ]

  // 处理积分调整
  const handleCreditAdjust = (user) => {
    setSelectedUser(user)
    form.setFieldsValue({
      currentCredits: user.credits,
      adjustType: 'add',
      amount: 0,
      reason: ''
    })
    setCreditModalVisible(true)
  }

  // 处理查看记录
  const handleViewRecords = (user) => {
    setSelectedUser(user)
    // 模拟获取用户记录
    setUserRecords([
      {
        id: '1',
        toolName: '模特图裂变',
        creditCost: 10,
        status: 'success',
        createdAt: '2024-01-20 14:30:25'
      },
      {
        id: '2',
        toolName: '商品图场景更换',
        creditCost: 8,
        status: 'success',
        createdAt: '2024-01-20 13:15:10'
      },
      {
        id: '3',
        toolName: '商品图换色',
        creditCost: 5,
        status: 'failed',
        createdAt: '2024-01-20 12:45:30'
      }
    ])
    setRecordModalVisible(true)
  }

  // 处理积分调整提交
  const handleCreditSubmit = async (values) => {
    try {
      const { adjustType, amount, reason } = values
      const newCredits = adjustType === 'add' 
        ? selectedUser.credits + amount 
        : selectedUser.credits - amount

      // 更新用户积分
      setUsers(users.map(user => 
        user.id === selectedUser.id 
          ? { ...user, credits: Math.max(0, newCredits) }
          : user
      ))

      message.success(`积分${adjustType === 'add' ? '增加' : '减少'}成功`)
      setCreditModalVisible(false)
      form.resetFields()
    } catch (error) {
      message.error('操作失败')
    }
  }

  // 统计数据
  const stats = {
    totalUsers: users.length,
    activeUsers: users.filter(u => u.status === 'active').length,
    premiumUsers: users.filter(u => u.membershipLevel === 'premium').length,
    totalCredits: users.reduce((sum, u) => sum + u.credits, 0)
  }

  return (
    <div>
      {/* 统计卡片 */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
          <Card>
            <Statistic title="总用户数" value={stats.totalUsers} prefix={<UserOutlined />} />
          </Card>
          <Card>
            <Statistic title="活跃用户" value={stats.activeUsers} valueStyle={{ color: '#3f8600' }} />
          </Card>
          <Card>
            <Statistic title="高级会员" value={stats.premiumUsers} valueStyle={{ color: '#faad14' }} />
          </Card>
          <Card>
            <Statistic title="总积分" value={stats.totalCredits} valueStyle={{ color: '#1890ff' }} />
          </Card>
        </div>
      </div>

      {/* 搜索和操作栏 */}
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Space>
          <Search
            placeholder="搜索用户名或微信号"
            allowClear
            style={{ width: 300 }}
            onSearch={(value) => console.log('搜索:', value)}
          />
        </Space>
        <Space>
          <Button>批量操作</Button>
          <Button>导出数据</Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={users}
        rowKey="id"
        loading={loading}
        pagination={{
          total: users.length,
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条记录`
        }}
      />

      {/* 积分调整模态框 */}
      <Modal
        title="调整用户积分"
        open={creditModalVisible}
        onCancel={() => setCreditModalVisible(false)}
        onOk={() => form.submit()}
        width={500}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreditSubmit}
        >
          <div style={{ marginBottom: 16, padding: 16, background: '#f5f5f5', borderRadius: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
              <AvatarWithFallback seed={selectedUser?.avatarSeed} size={32} style={{ marginRight: 8 }} />
              <span style={{ fontWeight: 600 }}>{selectedUser?.username}</span>
            </div>
            <div style={{ color: '#8c8c8c' }}>
              当前积分余额: <span style={{ color: '#1890ff', fontWeight: 600 }}>{selectedUser?.credits}</span>
            </div>
          </div>

          <Form.Item
            name="adjustType"
            label="调整类型"
            rules={[{ required: true }]}
          >
            <Space>
              <Button
                type={form.getFieldValue('adjustType') === 'add' ? 'primary' : 'default'}
                icon={<PlusOutlined />}
                onClick={() => form.setFieldsValue({ adjustType: 'add' })}
              >
                增加积分
              </Button>
              <Button
                type={form.getFieldValue('adjustType') === 'subtract' ? 'primary' : 'default'}
                icon={<MinusOutlined />}
                onClick={() => form.setFieldsValue({ adjustType: 'subtract' })}
              >
                减少积分
              </Button>
            </Space>
          </Form.Item>

          <Form.Item
            name="amount"
            label="调整数量"
            rules={[
              { required: true, message: '请输入调整数量' },
              { type: 'number', min: 1, message: '数量必须大于0' }
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="请输入调整数量"
              min={1}
            />
          </Form.Item>

          <Form.Item
            name="reason"
            label="调整原因"
            rules={[{ required: true, message: '请输入调整原因' }]}
          >
            <Input.TextArea
              rows={3}
              placeholder="请输入调整原因，此信息将记录在操作日志中"
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 用户记录模态框 */}
      <Modal
        title={`${selectedUser?.username} 的生成记录`}
        open={recordModalVisible}
        onCancel={() => setRecordModalVisible(false)}
        footer={null}
        width={800}
      >
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
            <AvatarWithFallback seed={selectedUser?.avatarSeed} size={40} style={{ marginRight: 12 }} />
            <div>
              <div style={{ fontWeight: 600 }}>{selectedUser?.username}</div>
              <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
                总生成次数: {selectedUser?.totalGeneration} | 当前积分: {selectedUser?.credits}
              </div>
            </div>
          </div>
        </div>

        <Table
          columns={recordColumns}
          dataSource={userRecords}
          rowKey="id"
          size="small"
          pagination={{
            pageSize: 5,
            showTotal: (total) => `共 ${total} 条记录`
          }}
        />
      </Modal>
    </div>
  )
}

export default UsersPage