import React, { useState, useEffect } from 'react'
import { Table, Button, Space, Tag, Modal, Form, Input, Select, message, Tabs, Card, InputNumber, DatePicker, Statistic } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, DollarOutlined, CrownOutlined, HistoryOutlined } from '@ant-design/icons'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import dayjs from 'dayjs'

const { TextArea } = Input
const { Option } = Select
const { RangePicker } = DatePicker

const CreditsPage = () => {
  const [loading, setLoading] = useState(false)
  const [creditRules, setCreditRules] = useState([])
  const [membershipPlans, setMembershipPlans] = useState([])
  const [transactions, setTransactions] = useState([])
  const [modalVisible, setModalVisible] = useState(false)
  const [planModalVisible, setPlanModalVisible] = useState(false)
  const [editingRule, setEditingRule] = useState(null)
  const [editingPlan, setEditingPlan] = useState(null)
  const [activeTab, setActiveTab] = useState('rules')
  const [form] = Form.useForm()
  const [planForm] = Form.useForm()

  // 统计数据
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalUsers: 0,
    activeMembers: 0,
    todayTransactions: 0
  })

  // 图表数据
  const [chartData, setChartData] = useState([])
  const [pieData, setPieData] = useState([])

  // 模拟数据
  useEffect(() => {
    setLoading(true)
    setTimeout(() => {
      // 积分规则数据
      setCreditRules([
        {
          id: '1',
          name: '文本生成',
          description: '每次文本生成消耗积分',
          creditCost: 1,
          category: 'text',
          status: 'active',
          createdAt: '2024-01-15',
          usageCount: 15420
        },
        {
          id: '2',
          name: '图像生成',
          description: '每次图像生成消耗积分',
          creditCost: 5,
          category: 'image',
          status: 'active',
          createdAt: '2024-01-12',
          usageCount: 8930
        },
        {
          id: '3',
          name: '高清图像',
          description: '高清图像生成消耗更多积分',
          creditCost: 10,
          category: 'image',
          status: 'active',
          createdAt: '2024-01-10',
          usageCount: 3250
        },
        {
          id: '4',
          name: '视频生成',
          description: '视频生成功能（测试中）',
          creditCost: 20,
          category: 'video',
          status: 'inactive',
          createdAt: '2024-01-08',
          usageCount: 120
        }
      ])

      // 会员套餐数据
      setMembershipPlans([
        {
          id: '1',
          name: '基础套餐',
          description: '适合轻度使用用户',
          price: 29.9,
          credits: 100,
          duration: 30,
          features: ['文本生成', '基础图像生成', '客服支持'],
          status: 'active',
          subscribers: 1250,
          createdAt: '2024-01-15'
        },
        {
          id: '2',
          name: '专业套餐',
          description: '适合专业用户和小团队',
          price: 99.9,
          credits: 500,
          duration: 30,
          features: ['所有基础功能', '高清图像生成', '优先处理', '专属客服'],
          status: 'active',
          subscribers: 680,
          createdAt: '2024-01-12'
        },
        {
          id: '3',
          name: '企业套餐',
          description: '适合大型团队和企业',
          price: 299.9,
          credits: 2000,
          duration: 30,
          features: ['所有功能', '无限制使用', 'API接入', '定制服务'],
          status: 'active',
          subscribers: 150,
          createdAt: '2024-01-10'
        }
      ])

      // 交易记录数据
      setTransactions([
        {
          id: '1',
          userId: 'user_001',
          username: '张三',
          type: 'purchase',
          planName: '专业套餐',
          amount: 99.9,
          credits: 500,
          status: 'completed',
          paymentMethod: '微信支付',
          createdAt: '2024-01-20 14:30:25'
        },
        {
          id: '2',
          userId: 'user_002',
          username: '李四',
          type: 'consume',
          description: '图像生成',
          amount: -5,
          credits: -5,
          status: 'completed',
          createdAt: '2024-01-20 13:15:10'
        },
        {
          id: '3',
          userId: 'user_003',
          username: '王五',
          type: 'purchase',
          planName: '基础套餐',
          amount: 29.9,
          credits: 100,
          status: 'completed',
          paymentMethod: '支付宝',
          createdAt: '2024-01-20 11:45:30'
        }
      ])

      // 统计数据
      setStats({
        totalRevenue: 15680.5,
        totalUsers: 2080,
        activeMembers: 1250,
        todayTransactions: 45
      })

      // 图表数据
      setChartData([
        { name: '1月1日', revenue: 1200, transactions: 25 },
        { name: '1月2日', revenue: 1800, transactions: 35 },
        { name: '1月3日', revenue: 1500, transactions: 28 },
        { name: '1月4日', revenue: 2200, transactions: 42 },
        { name: '1月5日', revenue: 1900, transactions: 38 },
        { name: '1月6日', revenue: 2500, transactions: 48 },
        { name: '1月7日', revenue: 2100, transactions: 40 }
      ])

      setPieData([
        { name: '基础套餐', value: 1250, color: '#8884d8' },
        { name: '专业套餐', value: 680, color: '#82ca9d' },
        { name: '企业套餐', value: 150, color: '#ffc658' }
      ])

      setLoading(false)
    }, 1000)
  }, [])

  // 积分规则表格列定义
  const ruleColumns = [
    {
      title: '规则名称',
      dataIndex: 'name',
      key: 'name',
      width: 150,
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 600 }}>{text}</div>
          <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
            {record.description}
          </div>
        </div>
      )
    },
    {
      title: '积分消耗',
      dataIndex: 'creditCost',
      key: 'creditCost',
      width: 100,
      render: (cost) => (
        <span style={{ fontWeight: 600, color: '#f5222d' }}>
          {cost} 积分
        </span>
      )
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 100,
      render: (category) => {
        const categoryMap = {
          text: { color: 'blue', text: '文本' },
          image: { color: 'green', text: '图像' },
          video: { color: 'purple', text: '视频' }
        }
        const config = categoryMap[category] || { color: 'default', text: category }
        return <Tag color={config.color}>{config.text}</Tag>
      }
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
          {status === 'active' ? '启用' : '停用'}
        </Tag>
      )
    },
    {
      title: '使用次数',
      dataIndex: 'usageCount',
      key: 'usageCount',
      width: 100,
      render: (count) => count.toLocaleString()
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120
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
            onClick={() => handleEditRule(record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteRule(record)}
          >
            删除
          </Button>
        </Space>
      )
    }
  ]

  // 会员套餐表格列定义
  const planColumns = [
    {
      title: '套餐名称',
      dataIndex: 'name',
      key: 'name',
      width: 150,
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}>
            <CrownOutlined style={{ marginRight: 4, color: '#faad14' }} />
            {text}
          </div>
          <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
            {record.description}
          </div>
        </div>
      )
    },
    {
      title: '价格/积分',
      key: 'priceCredits',
      width: 120,
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 600, color: '#f5222d' }}>
            ¥{record.price}
          </div>
          <div style={{ fontSize: '12px', color: '#52c41a' }}>
            {record.credits} 积分
          </div>
        </div>
      )
    },
    {
      title: '有效期',
      dataIndex: 'duration',
      key: 'duration',
      width: 80,
      render: (duration) => `${duration}天`
    },
    {
      title: '订阅用户',
      dataIndex: 'subscribers',
      key: 'subscribers',
      width: 100,
      render: (count) => (
        <span style={{ fontWeight: 600 }}>
          {count.toLocaleString()}
        </span>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
          {status === 'active' ? '上架' : '下架'}
        </Tag>
      )
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120
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
            onClick={() => handleEditPlan(record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeletePlan(record)}
          >
            删除
          </Button>
        </Space>
      )
    }
  ]

  // 交易记录表格列定义
  const transactionColumns = [
    {
      title: '用户',
      key: 'user',
      width: 120,
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 600 }}>{record.username}</div>
          <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
            {record.userId}
          </div>
        </div>
      )
    },
    {
      title: '交易类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type, record) => {
        if (type === 'purchase') {
          return <Tag color="green">购买套餐</Tag>
        } else if (type === 'consume') {
          return <Tag color="orange">消费积分</Tag>
        }
        return <Tag>{type}</Tag>
      }
    },
    {
      title: '描述',
      key: 'description',
      render: (_, record) => {
        if (record.type === 'purchase') {
          return record.planName
        } else if (record.type === 'consume') {
          return record.description
        }
        return '-'
      }
    },
    {
      title: '金额变动',
      dataIndex: 'amount',
      key: 'amount',
      width: 100,
      render: (amount) => (
        <span style={{ 
          fontWeight: 600, 
          color: amount > 0 ? '#52c41a' : '#f5222d' 
        }}>
          {amount > 0 ? '+' : ''}¥{Math.abs(amount)}
        </span>
      )
    },
    {
      title: '积分变动',
      dataIndex: 'credits',
      key: 'credits',
      width: 100,
      render: (credits) => (
        <span style={{ 
          fontWeight: 600, 
          color: credits > 0 ? '#52c41a' : '#f5222d' 
        }}>
          {credits > 0 ? '+' : ''}{credits}
        </span>
      )
    },
    {
      title: '支付方式',
      dataIndex: 'paymentMethod',
      key: 'paymentMethod',
      width: 100,
      render: (method) => method || '-'
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status) => (
        <Tag color={status === 'completed' ? 'green' : status === 'pending' ? 'orange' : 'red'}>
          {status === 'completed' ? '完成' : status === 'pending' ? '处理中' : '失败'}
        </Tag>
      )
    },
    {
      title: '交易时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150
    }
  ]

  // 处理积分规则编辑
  const handleEditRule = (rule) => {
    setEditingRule(rule)
    form.setFieldsValue(rule)
    setModalVisible(true)
  }

  // 处理积分规则新增
  const handleAddRule = () => {
    setEditingRule(null)
    form.resetFields()
    setModalVisible(true)
  }

  // 处理积分规则删除
  const handleDeleteRule = (rule) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除积分规则"${rule.name}"吗？`,
      onOk: () => {
        setCreditRules(creditRules.filter(r => r.id !== rule.id))
        message.success('删除成功')
      }
    })
  }

  // 处理会员套餐编辑
  const handleEditPlan = (plan) => {
    setEditingPlan(plan)
    planForm.setFieldsValue({
      ...plan,
      features: plan.features.join('\n')
    })
    setPlanModalVisible(true)
  }

  // 处理会员套餐新增
  const handleAddPlan = () => {
    setEditingPlan(null)
    planForm.resetFields()
    setPlanModalVisible(true)
  }

  // 处理会员套餐删除
  const handleDeletePlan = (plan) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除会员套餐"${plan.name}"吗？`,
      onOk: () => {
        setMembershipPlans(membershipPlans.filter(p => p.id !== plan.id))
        message.success('删除成功')
      }
    })
  }

  // 处理积分规则表单提交
  const handleRuleSubmit = async (values) => {
    try {
      if (editingRule) {
        setCreditRules(creditRules.map(rule => 
          rule.id === editingRule.id ? { ...rule, ...values } : rule
        ))
        message.success('更新成功')
      } else {
        const newRule = {
          id: Date.now().toString(),
          ...values,
          usageCount: 0,
          createdAt: new Date().toISOString().split('T')[0]
        }
        setCreditRules([...creditRules, newRule])
        message.success('添加成功')
      }
      setModalVisible(false)
      form.resetFields()
    } catch (error) {
      message.error('操作失败')
    }
  }

  // 处理会员套餐表单提交
  const handlePlanSubmit = async (values) => {
    try {
      const planData = {
        ...values,
        features: values.features.split('\n').filter(f => f.trim())
      }
      
      if (editingPlan) {
        setMembershipPlans(membershipPlans.map(plan => 
          plan.id === editingPlan.id ? { ...plan, ...planData } : plan
        ))
        message.success('更新成功')
      } else {
        const newPlan = {
          id: Date.now().toString(),
          ...planData,
          subscribers: 0,
          createdAt: new Date().toISOString().split('T')[0]
        }
        setMembershipPlans([...membershipPlans, newPlan])
        message.success('添加成功')
      }
      setPlanModalVisible(false)
      planForm.resetFields()
    } catch (error) {
      message.error('操作失败')
    }
  }

  return (
    <div>
      {/* 统计卡片 */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          <Card>
            <Statistic
              title="总收入"
              value={stats.totalRevenue}
              precision={2}
              prefix="¥"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
          <Card>
            <Statistic
              title="总用户数"
              value={stats.totalUsers}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
          <Card>
            <Statistic
              title="付费会员"
              value={stats.activeMembers}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
          <Card>
            <Statistic
              title="今日交易"
              value={stats.todayTransactions}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </div>
      </div>

      {/* 图表区域 */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
          <Card title="收入趋势">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="revenue" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
          <Card title="套餐分布">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={60}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </div>
      </div>

      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab}
        items={[
          {
            key: 'rules',
            label: '积分规则',
            children: (
              <>
                <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
                  <Button type="primary" icon={<PlusOutlined />} onClick={handleAddRule}>
                    添加积分规则
                  </Button>
                  <Space>
                    <Button>批量设置</Button>
                    <Button>导出规则</Button>
                  </Space>
                </div>

                <Table
                  columns={ruleColumns}
                  dataSource={creditRules}
                  rowKey="id"
                  loading={loading}
                  pagination={{
                    total: creditRules.length,
                    pageSize: 10,
                    showSizeChanger: true,
                    showTotal: (total) => `共 ${total} 条记录`
                  }}
                />
              </>
            )
          },
          {
            key: 'plans',
            label: '会员套餐',
            children: (
              <>
                <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
                  <Button type="primary" icon={<CrownOutlined />} onClick={handleAddPlan}>
                    添加会员套餐
                  </Button>
                  <Space>
                    <Button>套餐分析</Button>
                    <Button>导出数据</Button>
                  </Space>
                </div>

                <Table
                  columns={planColumns}
                  dataSource={membershipPlans}
                  rowKey="id"
                  loading={loading}
                  pagination={{
                    total: membershipPlans.length,
                    pageSize: 10,
                    showSizeChanger: true,
                    showTotal: (total) => `共 ${total} 条记录`
                  }}
                />
              </>
            )
          },
          {
            key: 'transactions',
            label: '财务记录',
            children: (
              <>
                <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
                  <Space>
                    <RangePicker />
                    <Select defaultValue="all" style={{ width: 120 }}>
                      <Option value="all">全部类型</Option>
                      <Option value="purchase">购买套餐</Option>
                      <Option value="consume">消费积分</Option>
                    </Select>
                  </Space>
                  <Space>
                    <Button icon={<HistoryOutlined />}>导出记录</Button>
                    <Button>财务报表</Button>
                  </Space>
                </div>

                <Table
                  columns={transactionColumns}
                  dataSource={transactions}
                  rowKey="id"
                  loading={loading}
                  pagination={{
                    total: transactions.length,
                    pageSize: 10,
                    showSizeChanger: true,
                    showTotal: (total) => `共 ${total} 条记录`
                  }}
                />
              </>
            )
          }
        ]}
      />

      {/* 积分规则编辑/新增模态框 */}
      <Modal
        title={editingRule ? '编辑积分规则' : '添加积分规则'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        width={500}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleRuleSubmit}
        >
          <Form.Item
            name="name"
            label="规则名称"
            rules={[{ required: true, message: '请输入规则名称' }]}
          >
            <Input placeholder="请输入规则名称" />
          </Form.Item>
          
          <Form.Item
            name="description"
            label="规则描述"
            rules={[{ required: true, message: '请输入规则描述' }]}
          >
            <TextArea rows={2} placeholder="请输入规则描述" />
          </Form.Item>
          
          <Form.Item
            name="category"
            label="功能分类"
            rules={[{ required: true, message: '请选择功能分类' }]}
          >
            <Select placeholder="请选择功能分类">
              <Option value="text">文本生成</Option>
              <Option value="image">图像生成</Option>
              <Option value="video">视频生成</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="creditCost"
            label="积分消耗"
            rules={[{ required: true, message: '请输入积分消耗' }]}
          >
            <InputNumber
              min={1}
              placeholder="请输入积分消耗"
              style={{ width: '100%' }}
              addonAfter="积分"
            />
          </Form.Item>
          
          <Form.Item
            name="status"
            label="状态"
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Select placeholder="请选择状态">
              <Option value="active">启用</Option>
              <Option value="inactive">停用</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* 会员套餐编辑/新增模态框 */}
      <Modal
        title={editingPlan ? '编辑会员套餐' : '添加会员套餐'}
        open={planModalVisible}
        onCancel={() => setPlanModalVisible(false)}
        onOk={() => planForm.submit()}
        width={600}
      >
        <Form
          form={planForm}
          layout="vertical"
          onFinish={handlePlanSubmit}
        >
          <Form.Item
            name="name"
            label="套餐名称"
            rules={[{ required: true, message: '请输入套餐名称' }]}
          >
            <Input placeholder="请输入套餐名称" />
          </Form.Item>
          
          <Form.Item
            name="description"
            label="套餐描述"
            rules={[{ required: true, message: '请输入套餐描述' }]}
          >
            <TextArea rows={2} placeholder="请输入套餐描述" />
          </Form.Item>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            <Form.Item
              name="price"
              label="套餐价格"
              rules={[{ required: true, message: '请输入套餐价格' }]}
            >
              <InputNumber
                min={0}
                precision={2}
                placeholder="0.00"
                style={{ width: '100%' }}
                addonBefore="¥"
              />
            </Form.Item>
            
            <Form.Item
              name="credits"
              label="包含积分"
              rules={[{ required: true, message: '请输入包含积分' }]}
            >
              <InputNumber
                min={1}
                placeholder="积分数量"
                style={{ width: '100%' }}
              />
            </Form.Item>
            
            <Form.Item
              name="duration"
              label="有效期"
              rules={[{ required: true, message: '请输入有效期' }]}
            >
              <InputNumber
                min={1}
                placeholder="天数"
                style={{ width: '100%' }}
                addonAfter="天"
              />
            </Form.Item>
          </div>
          
          <Form.Item
            name="features"
            label="套餐特性"
            rules={[{ required: true, message: '请输入套餐特性' }]}
          >
            <TextArea
              rows={4}
              placeholder="每行一个特性，如：&#10;文本生成&#10;基础图像生成&#10;客服支持"
            />
          </Form.Item>
          
          <Form.Item
            name="status"
            label="状态"
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Select placeholder="请选择状态">
              <Option value="active">上架</Option>
              <Option value="inactive">下架</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default CreditsPage