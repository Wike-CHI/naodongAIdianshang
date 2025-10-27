import React, { useState, useEffect } from 'react'
import { Table, Card, Button, Space, Tag, Avatar, Input, Select, DatePicker, Modal, Form, message, Popconfirm, Tooltip } from 'antd'
import { SearchOutlined, PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, UserOutlined, CrownOutlined } from '@ant-design/icons'
import { AvatarWithFallback } from '../utils/avatarUtils'
import { usersAPI } from '../services/api'

const { Search } = Input
const { Option } = Select
const { RangePicker } = DatePicker

const UsersPage = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedRowKeys, setSelectedRowKeys] = useState([])
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [membershipFilter, setMembershipFilter] = useState('')
  const [dateRange, setDateRange] = useState([])
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  })
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [form] = Form.useForm()

  useEffect(() => {
    loadUsers()
  }, [pagination.current, pagination.pageSize, searchText, statusFilter, membershipFilter, dateRange])

  // 加载用户数据
  const loadUsers = async () => {
    try {
      setLoading(true)
      const params = {
        page: pagination.current,
        limit: pagination.pageSize,
        search: searchText,
        status: statusFilter,
        membership: membershipFilter,
        startDate: dateRange[0]?.format('YYYY-MM-DD'),
        endDate: dateRange[1]?.format('YYYY-MM-DD')
      }

      const result = await usersAPI.getUsers(params)
      
      if (result.success) {
        setUsers(result.data.users || [])
        setPagination(prev => ({
          ...prev,
          total: result.data.total || 0
        }))
      } else {
        message.error(result.message || '加载用户数据失败')
      }
    } catch (error) {
      console.error('加载用户数据失败:', error)
      message.error('加载用户数据失败，请稍后重试')
      
      // 设置默认数据以防API失败
      setUsers([])
      setPagination(prev => ({ ...prev, total: 0 }))
    } finally {
      setLoading(false)
    }
  }

  // 搜索用户
  const handleSearch = (value) => {
    setSearchText(value)
    setPagination(prev => ({ ...prev, current: 1 }))
  }

  // 筛选变化
  const handleFilterChange = (type, value) => {
    if (type === 'status') {
      setStatusFilter(value)
    } else if (type === 'membership') {
      setMembershipFilter(value)
    } else if (type === 'dateRange') {
      setDateRange(value)
    }
    setPagination(prev => ({ ...prev, current: 1 }))
  }

  // 编辑用户
  const handleEdit = (user) => {
    setEditingUser(user)
    form.setFieldsValue({
      username: user.username,
      email: user.email,
      wechatId: user.wechatId,
      credits: user.credits,
      membership: user.membership,
      status: user.status
    })
    setEditModalVisible(true)
  }

  // 保存用户编辑
  const handleSaveEdit = async () => {
    try {
      const values = await form.validateFields()
      const result = await usersAPI.updateUser(editingUser._id, values)
      
      if (result.success) {
        message.success('用户信息更新成功')
        setEditModalVisible(false)
        setEditingUser(null)
        form.resetFields()
        loadUsers()
      } else {
        message.error(result.message || '更新用户信息失败')
      }
    } catch (error) {
      console.error('更新用户信息失败:', error)
      message.error('更新用户信息失败，请稍后重试')
    }
  }

  // 删除用户
  const handleDelete = async (userId) => {
    try {
      const result = await usersAPI.deleteUser(userId)
      
      if (result.success) {
        message.success('用户删除成功')
        loadUsers()
      } else {
        message.error(result.message || '删除用户失败')
      }
    } catch (error) {
      console.error('删除用户失败:', error)
      message.error('删除用户失败，请稍后重试')
    }
  }

  // 批量删除
  const handleBatchDelete = async () => {
    try {
      const result = await usersAPI.batchDeleteUsers(selectedRowKeys)
      
      if (result.success) {
        message.success(`成功删除 ${selectedRowKeys.length} 个用户`)
        setSelectedRowKeys([])
        loadUsers()
      } else {
        message.error(result.message || '批量删除失败')
      }
    } catch (error) {
      console.error('批量删除失败:', error)
      message.error('批量删除失败，请稍后重试')
    }
  }

  // 表格列定义
  const columns = [
    {
      title: '用户信息',
      key: 'userInfo',
      width: 200,
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <AvatarWithFallback seed={record._id} size={40} style={{ marginRight: 12 }} />
          <div>
            <div style={{ fontWeight: 600 }}>{record.username}</div>
            <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
              ID: {record._id?.slice(-8)}
            </div>
          </div>
        </div>
      )
    },
    {
      title: '联系方式',
      key: 'contact',
      width: 180,
      render: (_, record) => (
        <div>
          <div>{record.email || '未设置'}</div>
          <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
            微信: {record.wechatId || '未绑定'}
          </div>
        </div>
      )
    },
    {
      title: '积分',
      dataIndex: 'credits',
      key: 'credits',
      width: 100,
      render: (credits) => (
        <span style={{ color: '#faad14', fontWeight: 600 }}>
          {credits?.toLocaleString() || 0}
        </span>
      )
    },
    {
      title: '会员等级',
      dataIndex: 'membership',
      key: 'membership',
      width: 120,
      render: (membership) => {
        const membershipConfig = {
          basic: { color: 'default', icon: <UserOutlined />, text: '基础版' },
          premium: { color: 'gold', icon: <CrownOutlined />, text: '高级版' },
          enterprise: { color: 'purple', icon: <CrownOutlined />, text: '企业版' }
        }
        const config = membershipConfig[membership] || membershipConfig.basic
        return (
          <Tag color={config.color} icon={config.icon}>
            {config.text}
          </Tag>
        )
      }
    },
    {
      title: '注册时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date) => date ? new Date(date).toLocaleDateString() : '-'
    },
    {
      title: '最后活跃',
      dataIndex: 'lastActiveAt',
      key: 'lastActiveAt',
      width: 120,
      render: (date) => date ? new Date(date).toLocaleDateString() : '从未活跃'
    },
    {
      title: '生成次数',
      dataIndex: 'totalGenerations',
      key: 'totalGenerations',
      width: 100,
      render: (count) => count?.toLocaleString() || 0
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => (
        <Tag color={status === 'active' ? 'green' : status === 'suspended' ? 'red' : 'orange'}>
          {status === 'active' ? '正常' : status === 'suspended' ? '已封禁' : '待激活'}
        </Tag>
      )
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button type="text" size="small" icon={<EyeOutlined />} />
          </Tooltip>
          <Tooltip title="编辑">
            <Button 
              type="text" 
              size="small" 
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Popconfirm
            title="确定要删除这个用户吗？"
            onConfirm={() => handleDelete(record._id)}
            okText="确定"
            cancelText="取消"
          >
            <Tooltip title="删除">
              <Button type="text" size="small" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    }
  ]

  // 行选择配置
  const rowSelection = {
    selectedRowKeys,
    onChange: setSelectedRowKeys,
    getCheckboxProps: (record) => ({
      disabled: record.role === 'admin' // 管理员不能被选中删除
    })
  }

  return (
    <div>
      <Card>
        {/* 搜索和筛选区域 */}
        <div style={{ marginBottom: 16 }}>
          <Space wrap>
            <Search
              placeholder="搜索用户名、邮箱或微信ID"
              allowClear
              style={{ width: 300 }}
              onSearch={handleSearch}
            />
            <Select
              placeholder="状态筛选"
              allowClear
              style={{ width: 120 }}
              onChange={(value) => handleFilterChange('status', value)}
            >
              <Option value="active">正常</Option>
              <Option value="suspended">已封禁</Option>
              <Option value="pending">待激活</Option>
            </Select>
            <Select
              placeholder="会员筛选"
              allowClear
              style={{ width: 120 }}
              onChange={(value) => handleFilterChange('membership', value)}
            >
              <Option value="basic">基础版</Option>
              <Option value="premium">高级版</Option>
              <Option value="enterprise">企业版</Option>
            </Select>
            <RangePicker
              placeholder={['开始日期', '结束日期']}
              onChange={(dates) => handleFilterChange('dateRange', dates)}
            />
            <Button type="primary" icon={<SearchOutlined />} onClick={loadUsers}>
              搜索
            </Button>
          </Space>
        </div>

        {/* 批量操作区域 */}
        {selectedRowKeys.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <Space>
              <span>已选择 {selectedRowKeys.length} 项</span>
              <Popconfirm
                title={`确定要删除选中的 ${selectedRowKeys.length} 个用户吗？`}
                onConfirm={handleBatchDelete}
                okText="确定"
                cancelText="取消"
              >
                <Button danger>批量删除</Button>
              </Popconfirm>
              <Button onClick={() => setSelectedRowKeys([])}>取消选择</Button>
            </Space>
          </div>
        )}

        {/* 用户表格 */}
        <Table
          rowSelection={rowSelection}
          columns={columns}
          dataSource={users}
          rowKey="_id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
            onChange: (page, pageSize) => {
              setPagination(prev => ({ ...prev, current: page, pageSize }))
            }
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* 编辑用户模态框 */}
      <Modal
        title="编辑用户"
        open={editModalVisible}
        onOk={handleSaveEdit}
        onCancel={() => {
          setEditModalVisible(false)
          setEditingUser(null)
          form.resetFields()
        }}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="email"
            label="邮箱"
            rules={[{ type: 'email', message: '请输入有效的邮箱地址' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="wechatId" label="微信ID">
            <Input />
          </Form.Item>
          <Form.Item
            name="credits"
            label="积分"
            rules={[{ type: 'number', min: 0, message: '积分不能为负数' }]}
          >
            <Input type="number" />
          </Form.Item>
          <Form.Item name="membership" label="会员等级">
            <Select>
              <Option value="basic">基础版</Option>
              <Option value="premium">高级版</Option>
              <Option value="enterprise">企业版</Option>
            </Select>
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select>
              <Option value="active">正常</Option>
              <Option value="suspended">已封禁</Option>
              <Option value="pending">待激活</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default UsersPage