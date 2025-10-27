import React, { useState, useEffect } from 'react'
import { Card, Row, Col, Statistic, Table, Button, Space, Tag, Modal, Form, Input, InputNumber, Select, message, DatePicker, Tabs, Switch } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, GiftOutlined, CreditCardOutlined, TrophyOutlined, UserOutlined } from '@ant-design/icons'
import { Line, Pie } from '@ant-design/charts'
import { creditAPI, subscriptionAPI } from '../services/api'

const { RangePicker } = DatePicker
const { Option } = Select

const CreditsPage = () => {
  const [loading, setLoading] = useState(false)
  const [statsData, setStatsData] = useState({
    totalCredits: 0,
    usedCredits: 0,
    activeUsers: 0,
    transactions: 0
  })
  const [creditRules, setCreditRules] = useState([])
  const [subscriptionPlans, setSubscriptionPlans] = useState([])
  const [transactions, setTransactions] = useState([])
  const [chartData, setChartData] = useState({
    usageTrend: [],
    distributionData: []
  })
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  })
  const [modalVisible, setModalVisible] = useState(false)
  const [editingRule, setEditingRule] = useState(null)
  const [form] = Form.useForm()

  useEffect(() => {
    loadData()
  }, [])

  // 加载所有数据
  const loadData = async () => {
    try {
      setLoading(true)
      await Promise.all([
        loadStatsData(),
        loadCreditRules(),
        loadSubscriptionPlans(),
        loadTransactions(),
        loadChartData()
      ])
    } catch (error) {
      console.error('加载数据失败:', error)
      message.error('加载数据失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  // 加载统计数据
  const loadStatsData = async () => {
    try {
      const result = await creditAPI.getStats()
      
      if (result.success) {
        setStatsData(result.data)
      } else {
        // 设置默认数据
        setStatsData({
          totalCredits: 0,
          usedCredits: 0,
          activeUsers: 0,
          transactions: 0
        })
      }
    } catch (error) {
      console.error('加载统计数据失败:', error)
      setStatsData({
        totalCredits: 0,
        usedCredits: 0,
        activeUsers: 0,
        transactions: 0
      })
    }
  }

  // 加载积分规则
  const loadCreditRules = async () => {
    try {
      const result = await creditAPI.getRules()
      
      if (result.success) {
        setCreditRules(result.data || [])
      } else {
        setCreditRules([])
      }
    } catch (error) {
      console.error('加载积分规则失败:', error)
      setCreditRules([])
    }
  }

  // 加载订阅套餐
  const loadSubscriptionPlans = async () => {
    try {
      const result = await subscriptionAPI.getPlans()
      
      if (result.success) {
        setSubscriptionPlans(result.data || [])
      } else {
        setSubscriptionPlans([])
      }
    } catch (error) {
      console.error('加载订阅套餐失败:', error)
      setSubscriptionPlans([])
    }
  }

  // 加载交易记录
  const loadTransactions = async () => {
    try {
      const params = {
        page: pagination.current,
        limit: pagination.pageSize
      }
      
      const result = await creditAPI.getTransactions(params)
      
      if (result.success) {
        setTransactions(result.data.transactions || [])
        setPagination(prev => ({
          ...prev,
          total: result.data.total || 0
        }))
      } else {
        setTransactions([])
        setPagination(prev => ({ ...prev, total: 0 }))
      }
    } catch (error) {
      console.error('加载交易记录失败:', error)
      setTransactions([])
      setPagination(prev => ({ ...prev, total: 0 }))
    }
  }

  // 加载图表数据
  const loadChartData = async () => {
    try {
      const result = await creditAPI.getChartData()
      
      if (result.success) {
        setChartData({
          usageTrend: result.data.usageTrend || [],
          distributionData: result.data.distributionData || []
        })
      } else {
        setChartData({
          usageTrend: [],
          distributionData: []
        })
      }
    } catch (error) {
      console.error('加载图表数据失败:', error)
      setChartData({
        usageTrend: [],
        distributionData: []
      })
    }
  }

  // 添加积分规则
  const handleAddRule = () => {
    setEditingRule(null)
    form.resetFields()
    setModalVisible(true)
  }

  // 编辑积分规则
  const handleEditRule = (rule) => {
    setEditingRule(rule)
    form.setFieldsValue(rule)
    setModalVisible(true)
  }

  // 保存积分规则
  const handleSaveRule = async () => {
    try {
      const values = await form.validateFields()
      
      let result
      if (editingRule) {
        result = await creditAPI.updateRule(editingRule._id, values)
      } else {
        result = await creditAPI.createRule(values)
      }
      
      if (result.success) {
        message.success(editingRule ? '规则更新成功' : '规则创建成功')
        setModalVisible(false)
        setEditingRule(null)
        form.resetFields()
        loadCreditRules()
      } else {
        message.error(result.message || '保存规则失败')
      }
    } catch (error) {
      console.error('保存规则失败:', error)
      message.error('保存规则失败，请稍后重试')
    }
  }

  // 删除积分规则
  const handleDeleteRule = async (ruleId) => {
    try {
      const result = await creditAPI.deleteRule(ruleId)
      
      if (result.success) {
        message.success('规则删除成功')
        loadCreditRules()
      } else {
        message.error(result.message || '删除规则失败')
      }
    } catch (error) {
      console.error('删除规则失败:', error)
      message.error('删除规则失败，请稍后重试')
    }
  }

  // 积分规则表格列
  const ruleColumns = [
    {
      title: '规则名称',
      dataIndex: 'name',
      key: 'name',
      width: 150
    },
    {
      title: '规则类型',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type) => {
        const typeConfig = {
          signup: { color: 'green', text: '注册奖励' },
          daily: { color: 'blue', text: '每日签到' },
          referral: { color: 'orange', text: '推荐奖励' },
          purchase: { color: 'purple', text: '购买奖励' },
          task: { color: 'cyan', text: '任务奖励' }
        }
        const config = typeConfig[type] || { color: 'default', text: type }
        return <Tag color={config.color}>{config.text}</Tag>
      }
    },
    {
      title: '积分数量',
      dataIndex: 'credits',
      key: 'credits',
      width: 100,
      render: (credits) => (
        <span style={{ color: '#faad14', fontWeight: 600 }}>+{credits}</span>
      )
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      key: 'enabled',
      width: 80,
      render: (enabled) => (
        <Tag color={enabled ? 'success' : 'default'}>
          {enabled ? '启用' : '禁用'}
        </Tag>
      )
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
            icon={<EditOutlined />}
            onClick={() => handleEditRule(record)}
          >
            编辑
          </Button>
          <Button 
            type="text" 
            size="small" 
            danger 
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteRule(record._id)}
          >
            删除
          </Button>
        </Space>
      )
    }
  ]

  // 交易记录表格列
  const transactionColumns = [
    {
      title: '用户',
      dataIndex: 'user',
      key: 'user',
      width: 120,
      render: (user) => user?.username || user?.wechatId || '-'
    },
    {
      title: '交易类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type) => {
        const typeConfig = {
          earn: { color: 'green', text: '获得' },
          spend: { color: 'red', text: '消费' },
          refund: { color: 'blue', text: '退款' }
        }
        const config = typeConfig[type] || { color: 'default', text: type }
        return <Tag color={config.color}>{config.text}</Tag>
      }
    },
    {
      title: '积分变化',
      dataIndex: 'amount',
      key: 'amount',
      width: 100,
      render: (amount, record) => (
        <span style={{ 
          color: record.type === 'earn' ? '#52c41a' : '#ff4d4f',
          fontWeight: 600 
        }}>
          {record.type === 'earn' ? '+' : '-'}{Math.abs(amount)}
        </span>
      )
    },
    {
      title: '余额',
      dataIndex: 'balance',
      key: 'balance',
      width: 100,
      render: (balance) => balance || 0
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true
    },
    {
      title: '时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (date) => date ? new Date(date).toLocaleString() : '-'
    }
  ]

  // 订阅套餐表格列
  const planColumns = [
    {
      title: '套餐名称',
      dataIndex: 'name',
      key: 'name',
      width: 120
    },
    {
      title: '价格',
      dataIndex: 'price',
      key: 'price',
      width: 100,
      render: (price) => `¥${price}`
    },
    {
      title: '积分数量',
      dataIndex: 'credits',
      key: 'credits',
      width: 100,
      render: (credits) => (
        <span style={{ color: '#faad14', fontWeight: 600 }}>{credits}</span>
      )
    },
    {
      title: '有效期',
      dataIndex: 'duration',
      key: 'duration',
      width: 100,
      render: (duration) => `${duration}天`
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      key: 'enabled',
      width: 80,
      render: (enabled) => (
        <Tag color={enabled ? 'success' : 'default'}>
          {enabled ? '启用' : '禁用'}
        </Tag>
      )
    },
    {
      title: '销量',
      dataIndex: 'salesCount',
      key: 'salesCount',
      width: 80,
      render: (count) => count || 0
    }
  ]

  // 使用趋势图配置
  const usageTrendConfig = {
    data: chartData.usageTrend,
    xField: 'date',
    yField: 'value',
    seriesField: 'type',
    smooth: true,
    animation: {
      appear: {
        animation: 'path-in',
        duration: 1000,
      },
    },
  }

  // 积分分布图配置
  const distributionConfig = {
    data: chartData.distributionData,
    angleField: 'value',
    colorField: 'type',
    radius: 0.8,
    label: {
      type: 'outer',
      content: '{name} {percentage}',
    },
    interactions: [
      {
        type: 'element-active',
      },
    ],
  }

  return (
    <div>
      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总积分发放"
              value={statsData.totalCredits}
              prefix={<CreditCardOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已消费积分"
              value={statsData.usedCredits}
              prefix={<GiftOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="活跃用户"
              value={statsData.activeUsers}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="交易笔数"
              value={statsData.transactions}
              prefix={<TrophyOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 图表区域 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={16}>
          <Card title="积分使用趋势" loading={loading}>
            <Line {...usageTrendConfig} height={300} />
          </Card>
        </Col>
        <Col span={8}>
          <Card title="积分分布" loading={loading}>
            <Pie {...distributionConfig} height={300} />
          </Card>
        </Col>
      </Row>

      {/* 标签页内容 */}
      <Card>
        <Tabs 
          defaultActiveKey="rules"
          items={[
            {
              key: 'rules',
              label: '积分规则',
              children: (
                <div>
                  <div style={{ marginBottom: 16 }}>
                    <Button type="primary" icon={<PlusOutlined />} onClick={handleAddRule}>
                      添加规则
                    </Button>
                  </div>
                  <Table
                    columns={ruleColumns}
                    dataSource={creditRules}
                    rowKey="_id"
                    loading={loading}
                    pagination={false}
                  />
                </div>
              )
            },
            {
              key: 'plans',
              label: '订阅套餐',
              children: (
                <Table
                  columns={planColumns}
                  dataSource={subscriptionPlans}
                  rowKey="_id"
                  loading={loading}
                  pagination={false}
                />
              )
            },
            {
              key: 'transactions',
              label: '交易记录',
              children: (
                <Table
                  columns={transactionColumns}
                  dataSource={transactions}
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
                />
              )
            }
          ]}
        />
      </Card>

      {/* 添加/编辑规则模态框 */}
      <Modal
        title={editingRule ? '编辑积分规则' : '添加积分规则'}
        open={modalVisible}
        onOk={handleSaveRule}
        onCancel={() => {
          setModalVisible(false)
          setEditingRule(null)
          form.resetFields()
        }}
        width={600}
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="规则名称"
            rules={[{ required: true, message: '请输入规则名称' }]}
          >
            <Input placeholder="请输入规则名称" />
          </Form.Item>
          
          <Form.Item
            name="type"
            label="规则类型"
            rules={[{ required: true, message: '请选择规则类型' }]}
          >
            <Select placeholder="请选择规则类型">
              <Option value="signup">注册奖励</Option>
              <Option value="daily">每日签到</Option>
              <Option value="referral">推荐奖励</Option>
              <Option value="purchase">购买奖励</Option>
              <Option value="task">任务奖励</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="credits"
            label="积分数量"
            rules={[
              { required: true, message: '请输入积分数量' },
              { type: 'number', min: 1, message: '积分数量必须大于0' }
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="请输入积分数量"
              min={1}
            />
          </Form.Item>
          
          <Form.Item
            name="description"
            label="规则描述"
            rules={[{ required: true, message: '请输入规则描述' }]}
          >
            <Input.TextArea rows={3} placeholder="请输入规则描述" />
          </Form.Item>
          
          <Form.Item name="enabled" label="启用状态" valuePropName="checked">
            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default CreditsPage