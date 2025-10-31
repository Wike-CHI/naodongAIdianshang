import React, { useState, useEffect } from 'react'
import {
  Card,
  Table,
  Button,
  Switch,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  message,
  Popconfirm,
  Tooltip,
  Row,
  Col,
  Statistic,
  Progress,
  Drawer,
  Descriptions,
  Badge,
  Typography,
  Divider,
  Alert,
  Slider,
  Spin,
  Empty
} from 'antd'
import {
  RobotOutlined,
  SettingOutlined,
  EyeOutlined,
  ReloadOutlined,
  SaveOutlined,
  ThunderboltOutlined,
  UserOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  PlayCircleOutlined,
  ApiOutlined,
  BarChartOutlined,
  PieChartOutlined
} from '@ant-design/icons'
import api from '../services/api'
import aiStatsApi from '../services/aiStatsApi'

const { Title, Text, Paragraph } = Typography
const { TextArea } = Input
const { Option } = Select

const AIModelToolsPage = () => {
  const [loading, setLoading] = useState(false)
  const [tools, setTools] = useState([])
  const [stats, setStats] = useState({})
  const [toolUsageStats, setToolUsageStats] = useState([])
  const [creditStats, setCreditStats] = useState([])
  const [selectedRowKeys, setSelectedRowKeys] = useState([])
  const [configModalVisible, setConfigModalVisible] = useState(false)
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false)
  const [previewModalVisible, setPreviewModalVisible] = useState(false)
  const [statsModalVisible, setStatsModalVisible] = useState(false)
  const [currentTool, setCurrentTool] = useState(null)
  const [form] = Form.useForm()

  // 统一的通用选项配置 - 与前端保持一致
  const commonOptions = {
    resolution: {
      id: 'resolution',
      label: '分辨率',
      type: 'select',
      options: [
        { value: '0.5k', label: '0.5K (960×540)', width: 960, height: 540 },
        { value: '1080p', label: '1080P (1920×1080)', width: 1920, height: 1080 },
        { value: '2k', label: '2K (2560×1440)', width: 2560, height: 1440 }
      ],
      default: '1080p'
    },
    quantity: {
      id: 'quantity',
      label: '生成数量',
      type: 'slider',
      min: 1,
      max: 4,
      default: 1
    },
    mode: {
      id: 'mode',
      label: '生成模式',
      type: 'radio',
      options: [
        { value: 'fast', label: '快速模式' },
        { value: 'ultra', label: '极速模式' }
      ],
      default: 'fast'
    }
  }

  // 硬编码的AI工具列表 - 与前端保持一致
  // 隐藏姿态变换功能
  const hardcodedTools = [
    {
      id: 'ai-model',
      name: 'AI模特生成',
      description: '上传服装图，生成真实模特展示效果',
      category: 'model',
      icon: '🧍',
      creditCost: 15,
      enabled: true,
      usageCount: 0,
      lastUsed: null,
      inputConfig: {
        imageSlots: 2,
        optionSlots: 3,
        promptSlot: 1
      },
      features: ['商品图片输入', '模特风格选择', '背景场景设置']
    },
    {
      id: 'try-on-clothes',
      name: '同版型试衣',
      description: '让模特自动试穿相似版型的服装',
      category: 'tryon',
      icon: '👗',
      creditCost: 12,
      enabled: true,
      usageCount: 0,
      lastUsed: null,
      inputConfig: {
        imageSlots: 2,
        optionSlots: 3,
        promptSlot: 1
      },
      features: ['服装图片', '模特替换', '版型保持']
    },
    {
      id: 'glasses-tryon',
      name: '配件试戴',
      description: '生成眼镜、帽饰等配件试戴效果图',
      category: 'accessory',
      icon: '🕶️',
      creditCost: 10,
      enabled: true,
      usageCount: 0,
      lastUsed: null,
      inputConfig: {
        imageSlots: 2,
        optionSlots: 3,
        promptSlot: 1
      },
      features: ['配件图片', '佩戴位置', '尺寸调整']
    },
    // 隐藏姿态变换功能
    /*
    {
      id: 'pose-variation',
      name: '姿态变换',
      description: '智能调整模特姿态，匹配不同商品角度',
      category: 'modeling',
      icon: '🧘',
      creditCost: 9,
      enabled: true,
      usageCount: 0,
      lastUsed: null,
      inputConfig: {
        imageSlots: 2,
        optionSlots: 3,
        promptSlot: 1
      },
      features: ['姿态选择', '动作调整', '自然度控制']
    },
    */
    {
      id: 'shoe-tryon',
      name: '鞋靴试穿',
      description: '自动合成鞋靴穿着效果图',
      category: 'product',
      icon: '👟',
      creditCost: 11,
      enabled: true,
      usageCount: 0,
      lastUsed: null,
      inputConfig: {
        imageSlots: 2,
        optionSlots: 3,
        promptSlot: 1
      },
      features: ['鞋靴图片', '脚部匹配', '角度调整']
    },
    {
      id: 'scene-change',
      name: '场景更换',
      description: '快速替换电商宣传背景，增强氛围感',
      category: 'scene',
      icon: '🏙️',
      creditCost: 10,
      enabled: true,
      usageCount: 0,
      lastUsed: null,
      inputConfig: {
        imageSlots: 2,
        optionSlots: 3,
        promptSlot: 1
      },
      features: ['场景选择', '光线调整', '氛围设置']
    },
    {
      id: 'color-change',
      name: '商品换色',
      description: '一键生成多种颜色组合，提升SKU展示效率',
      category: 'product',
      icon: '🎨',
      creditCost: 8,
      enabled: true,
      usageCount: 0,
      lastUsed: null,
      inputConfig: {
        imageSlots: 2,
        optionSlots: 3,
        promptSlot: 1
      },
      features: ['颜色选择', '材质调整', '光泽控制']
    }
  ]

  useEffect(() => {
    loadToolsData()
    loadStats()
  }, [])

  // 加载工具数据 - 使用硬编码数据
  const loadToolsData = async () => {
    try {
      setLoading(true)
      // 使用硬编码的工具列表
      setTools(hardcodedTools)
    } catch (error) {
      console.error('加载工具数据失败:', error)
      message.error('加载工具数据失败')
    } finally {
      setLoading(false)
    }
  }

  // 加载统计数据
  const loadStats = async () => {
    try {
      // 模拟统计数据
      setStats({
        totalUsage: 1250,
        totalCredits: 8600,
        activeTools: hardcodedTools.filter(tool => tool.enabled).length,
        totalTools: hardcodedTools.length
      })
    } catch (error) {
      console.error('加载统计数据失败:', error)
    }
  }

  // 加载工具使用统计
  const loadToolUsageStats = async () => {
    try {
      setLoading(true)
      const response = await aiStatsApi.getToolUsageStats(30)
      if (response.success) {
        setToolUsageStats(response.data)
      } else {
        throw new Error(response.error || '获取统计数据失败')
      }
    } catch (error) {
      console.error('加载工具使用统计失败:', error)
      message.error('加载工具使用统计失败: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  // 切换工具状态
  const handleToggleStatus = async (toolId, enabled) => {
    try {
      // 更新本地状态
      setTools(prev => prev.map(tool => 
        tool.id === toolId ? { ...tool, enabled } : tool
      ))
      
      // 更新统计数据
      setStats(prev => ({
        ...prev,
        activeTools: enabled 
          ? prev.activeTools + 1 
          : prev.activeTools - 1
      }))
      
      message.success(`${enabled ? '启用' : '禁用'}成功`)
    } catch (error) {
      console.error('状态切换失败:', error)
      message.error('状态切换失败')
    }
  }

  // 打开配置模态框
  const handleOpenConfig = (tool) => {
    setCurrentTool(tool)
    form.setFieldsValue({
      name: tool.name,
      description: tool.description,
      credits: tool.creditCost
    })
    setConfigModalVisible(true)
  }

  // 保存配置
  const handleSaveConfig = async () => {
    try {
      const values = await form.validateFields()
      
      // 更新本地工具配置
      setTools(prev => prev.map(tool => 
        tool.id === currentTool.id 
          ? { 
              ...tool, 
              name: values.name,
              description: values.description,
              creditCost: values.credits
            } 
          : tool
      ))
      
      message.success('配置保存成功')
      setConfigModalVisible(false)
      setCurrentTool(null)
    } catch (error) {
      console.error('配置保存失败:', error)
      message.error('配置保存失败')
    }
  }

  // 预览工具详情
  const handlePreview = (tool) => {
    setCurrentTool(tool)
    setPreviewModalVisible(true)
  }

  // 打开统计详情
  const handleOpenStats = async () => {
    await loadToolUsageStats()
    setStatsModalVisible(true)
  }

  // 批量启用/禁用
  const handleBatchToggle = (enabled) => {
    Modal.confirm({
      title: `确定要${enabled ? '启用' : '禁用'}所有工具吗？`,
      content: `这将${enabled ? '启用' : '禁用'}所有AI工具功能`,
      onOk: () => {
        setTools(prev => prev.map(tool => ({ ...tool, enabled })))
        setStats(prev => ({ 
          ...prev, 
          activeTools: enabled ? hardcodedTools.length : 0 
        }))
        message.success(`批量${enabled ? '启用' : '禁用'}成功`)
      }
    })
  }

  // 重置所有配置
  const handleResetAll = () => {
    Modal.confirm({
      title: '确定要重置所有配置吗？',
      content: '这将恢复所有工具的默认设置',
      onOk: () => {
        setTools(hardcodedTools)
        message.success('配置重置成功')
      }
    })
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1>AI工具管理</h1>
        <p style={{ color: '#666', marginBottom: '16px' }}>
          管理AI生成功能的开关状态和配置参数
        </p>
        
        {/* 统计卡片 */}
        <Row gutter={16} style={{ marginBottom: '24px' }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="总使用次数"
                value={stats.totalUsage}
                prefix={<UserOutlined />}
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="总积分消耗"
                value={stats.totalCredits}
                prefix={<DollarOutlined />}
                valueStyle={{ color: '#cf1322' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="启用工具数"
                value={stats.activeTools}
                prefix={<CheckCircleOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="工具总数"
                value={stats.totalTools}
                prefix={<RobotOutlined />}
              />
            </Card>
          </Col>
        </Row>

        {/* 操作按钮 */}
        <Space style={{ marginBottom: '24px' }}>
          <Button 
            type="primary" 
            icon={<ThunderboltOutlined />}
            onClick={() => handleBatchToggle(true)}
          >
            批量启用
          </Button>
          <Button 
            icon={<CloseCircleOutlined />}
            onClick={() => handleBatchToggle(false)}
          >
            批量禁用
          </Button>
          <Button 
            icon={<ReloadOutlined />}
            onClick={handleResetAll}
          >
            重置配置
          </Button>
          <Button 
            icon={<BarChartOutlined />}
            onClick={handleOpenStats}
          >
            查看统计
          </Button>
        </Space>

        {/* 工具表格 */}
        <Card>
          <Table
            loading={loading}
            dataSource={tools}
            rowKey="id"
            pagination={false}
            scroll={{ x: 'max-content' }}
            rowSelection={{
              selectedRowKeys,
              onChange: setSelectedRowKeys,
              selections: [
                Table.SELECTION_ALL,
                Table.SELECTION_INVERT,
                Table.SELECTION_NONE,
              ],
            }}
            columns={[
              {
                title: '工具名称',
                dataIndex: 'name',
                key: 'name',
                fixed: 'left',
                width: 150,
                render: (text, record) => (
                  <Space>
                    <span style={{ fontSize: '18px' }}>{record.icon}</span>
                    <span>{text}</span>
                  </Space>
                )
              },
              {
                title: '描述',
                dataIndex: 'description',
                key: 'description',
                width: 200
              },
              {
                title: '类别',
                dataIndex: 'category',
                key: 'category',
                width: 120,
                render: (category) => {
                  const categoryMap = {
                    'model': { color: 'blue', text: '模特' },
                    'tryon': { color: 'green', text: '试衣' },
                    'accessory': { color: 'purple', text: '配件' },
                    'modeling': { color: 'orange', text: '建模' },
                    'product': { color: 'cyan', text: '商品' },
                    'scene': { color: 'gold', text: '场景' }
                  }
                  const config = categoryMap[category] || { color: 'default', text: category }
                  return <Tag color={config.color}>{config.text}</Tag>
                }
              },
              {
                title: '积分消耗',
                dataIndex: 'creditCost',
                key: 'creditCost',
                width: 120,
                sorter: (a, b) => a.creditCost - b.creditCost,
                render: (cost) => (
                  <Tag icon={<DollarOutlined />} color="red">
                    {cost}
                  </Tag>
                )
              },
              {
                title: '状态',
                dataIndex: 'enabled',
                key: 'enabled',
                width: 120,
                filters: [
                  { text: '启用', value: true },
                  { text: '禁用', value: false }
                ],
                onFilter: (value, record) => record.enabled === value,
                render: (enabled, record) => (
                  <Switch
                    checked={enabled}
                    onChange={(checked) => handleToggleStatus(record.id, checked)}
                    checkedChildren="启用"
                    unCheckedChildren="禁用"
                  />
                )
              },
              {
                title: '操作',
                key: 'action',
                fixed: 'right',
                width: 200,
                render: (_, record) => (
                  <Space size="middle">
                    <Tooltip title="配置">
                      <Button
                        type="text"
                        icon={<SettingOutlined />}
                        onClick={() => handleOpenConfig(record)}
                      />
                    </Tooltip>
                    <Tooltip title="预览">
                      <Button
                        type="text"
                        icon={<EyeOutlined />}
                        onClick={() => handlePreview(record)}
                      />
                    </Tooltip>
                    <Popconfirm
                      title={`确定要${record.enabled ? '禁用' : '启用'}此工具吗？`}
                      onConfirm={() => handleToggleStatus(record.id, !record.enabled)}
                      okText="确定"
                      cancelText="取消"
                    >
                      <Button
                        type="text"
                        danger={!record.enabled}
                        icon={record.enabled ? <CloseCircleOutlined /> : <PlayCircleOutlined />}
                      >
                        {record.enabled ? '禁用' : '启用'}
                      </Button>
                    </Popconfirm>
                  </Space>
                )
              }
            ]}
          />
        </Card>

        {/* 配置模态框 */}
        <Modal
          title="工具配置"
          visible={configModalVisible}
          onOk={handleSaveConfig}
          onCancel={() => {
            setConfigModalVisible(false)
            setCurrentTool(null)
          }}
          okText="保存"
          cancelText="取消"
        >
          <Form form={form} layout="vertical">
            <Form.Item
              name="name"
              label="工具名称"
              rules={[{ required: true, message: '请输入工具名称' }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="description"
              label="描述"
              rules={[{ required: true, message: '请输入描述' }]}
            >
              <TextArea rows={3} />
            </Form.Item>
            <Form.Item
              name="credits"
              label="积分消耗"
              rules={[{ required: true, message: '请输入积分消耗' }]}
            >
              <InputNumber min={1} max={50} style={{ width: '100%' }} />
            </Form.Item>
          </Form>
        </Modal>

        {/* 预览抽屉 */}
        <Drawer
          title="工具详情预览"
          placement="right"
          onClose={() => {
            setPreviewModalVisible(false)
            setCurrentTool(null)
          }}
          visible={previewModalVisible}
          width={600}
        >
          {currentTool && (
            <div>
              <Descriptions title="基本信息" column={1} bordered>
                <Descriptions.Item label="工具名称">
                  <Space>
                    <span style={{ fontSize: '24px' }}>{currentTool.icon}</span>
                    <span>{currentTool.name}</span>
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="描述">{currentTool.description}</Descriptions.Item>
                <Descriptions.Item label="类别">
                  <Tag color="blue">{currentTool.category}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="积分消耗">
                  <Tag icon={<DollarOutlined />} color="red">
                    {currentTool.creditCost}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="状态">
                  <Badge 
                    status={currentTool.enabled ? 'success' : 'error'} 
                    text={currentTool.enabled ? '启用' : '禁用'} 
                  />
                </Descriptions.Item>
              </Descriptions>

              <Divider />

              <Descriptions title="输入配置" column={1} bordered>
                <Descriptions.Item label="图片上传窗口">
                  {currentTool.inputConfig.imageSlots} 个
                </Descriptions.Item>
                <Descriptions.Item label="可选项窗口">
                  {currentTool.inputConfig.optionSlots} 个
                </Descriptions.Item>
                <Descriptions.Item label="提示词窗口">
                  {currentTool.inputConfig.promptSlot > 0 ? '1 个' : '无'}
                </Descriptions.Item>
              </Descriptions>

              <Divider />

              <div>
                <Title level={4}>功能特性</Title>
                <Space wrap>
                  {currentTool.features?.map((feature, index) => (
                    <Tag key={index} color="processing">{feature}</Tag>
                  ))}
                </Space>
              </div>
            </div>
          )}
        </Drawer>

        {/* 统计模态框 */}
        <Modal
          title="工具使用统计"
          visible={statsModalVisible}
          onCancel={() => setStatsModalVisible(false)}
          footer={null}
          width={800}
        >
          <Spin spinning={loading}>
            {toolUsageStats.length > 0 ? (
              <>
                <Row gutter={16} style={{ marginBottom: '24px' }}>
                  <Col span={12}>
                    <Card title="使用次数排行">
                      {toolUsageStats.map((stat, index) => {
                        const tool = hardcodedTools.find(t => t.id === stat._id)
                        return (
                          <div key={stat._id} style={{ marginBottom: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                              <span>{tool?.name || stat._id}</span>
                              <span>{stat.total} 次</span>
                            </div>
                            <Progress percent={Math.round((stat.total / Math.max(...toolUsageStats.map(s => s.total))) * 100)} />
                          </div>
                        )
                      })}
                    </Card>
                  </Col>
                  <Col span={12}>
                    <Card title="积分消耗排行">
                      {toolUsageStats.map((stat, index) => {
                        const tool = hardcodedTools.find(t => t.id === stat._id)
                        return (
                          <div key={stat._id} style={{ marginBottom: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                              <span>{tool?.name || stat._id}</span>
                              <span>{stat.credits} 积分</span>
                            </div>
                            <Progress percent={Math.round((stat.credits / Math.max(...toolUsageStats.map(s => s.credits))) * 100)} status="exception" />
                          </div>
                        )
                      })}
                    </Card>
                  </Col>
                </Row>
                <Alert
                  message="统计说明"
                  description="以上数据基于最近30天的使用情况统计，反映了各AI工具的受欢迎程度和积分消耗情况。"
                  type="info"
                  showIcon
                />
              </>
            ) : (
              <Empty description="暂无统计数据" />
            )}
          </Spin>
        </Modal>
      </div>
    </div>
  )
}

export default AIModelToolsPage