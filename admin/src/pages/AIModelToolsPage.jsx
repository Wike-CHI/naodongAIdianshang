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
  Slider
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
  ApiOutlined
} from '@ant-design/icons'

const { Title, Text, Paragraph } = Typography
const { TextArea } = Input
const { Option } = Select

const AIModelToolsPage = () => {
  const [loading, setLoading] = useState(false)
  const [tools, setTools] = useState([])
  const [stats, setStats] = useState({})
  const [selectedRowKeys, setSelectedRowKeys] = useState([])
  const [configModalVisible, setConfigModalVisible] = useState(false)
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false)
  const [previewModalVisible, setPreviewModalVisible] = useState(false)
  const [currentTool, setCurrentTool] = useState(null)
  const [form] = Form.useForm()

  // 统一的通用选项配置
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
      // 工具特定的第三个选项
      thirdOption: {
        id: 'model-features',
        label: '模特特征',
        type: 'select',
        options: [
          { value: 'asian-female', label: '亚洲女性' },
          { value: 'european-female', label: '欧美女性' },
          { value: 'asian-male', label: '亚洲男性' },
          { value: 'child', label: '儿童' }
        ],
        default: 'asian-female'
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
      thirdOption: {
        id: 'fit-level',
        label: '版型适配',
        type: 'slider',
        min: 0,
        max: 100,
        default: 80,
        unit: '%'
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
      thirdOption: {
        id: 'accessory-type',
        label: '配件类型',
        type: 'select',
        options: [
          { value: 'glasses', label: '眼镜' },
          { value: 'hat', label: '帽子' },
          { value: 'earring', label: '耳环' },
          { value: 'necklace', label: '项链' }
        ],
        default: 'glasses'
      },
      features: ['配件图片', '佩戴位置', '尺寸调整']
    },
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
      thirdOption: {
        id: 'target-pose',
        label: '目标姿态',
        type: 'select',
        options: [
          { value: 'standing', label: '站立姿态' },
          { value: 'walking', label: '行走姿态' },
          { value: 'sitting', label: '坐姿' },
          { value: 'running', label: '跑步姿态' },
          { value: 'dancing', label: '舞蹈姿态' }
        ],
        default: 'standing'
      },
      features: ['姿态选择', '动作调整', '自然度控制']
    },
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
      thirdOption: {
        id: 'shoe-type',
        label: '鞋靴类型',
        type: 'select',
        options: [
          { value: 'sneakers', label: '运动鞋' },
          { value: 'heels', label: '高跟鞋' },
          { value: 'boots', label: '靴子' },
          { value: 'sandals', label: '凉鞋' },
          { value: 'slippers', label: '拖鞋' }
        ],
        default: 'sneakers'
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
      thirdOption: {
        id: 'scene-type',
        label: '场景类型',
        type: 'select',
        options: [
          { value: 'outdoor', label: '户外场景' },
          { value: 'indoor', label: '室内场景' },
          { value: 'studio', label: '影棚场景' },
          { value: 'seasonal', label: '季节场景' },
          { value: 'festival', label: '节日场景' }
        ],
        default: 'studio'
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
      thirdOption: {
        id: 'color-palette',
        label: '色彩方案',
        type: 'select',
        options: [
          { value: 'spring', label: '春季色系' },
          { value: 'summer', label: '夏季色系' },
          { value: 'autumn', label: '秋季色系' },
          { value: 'winter', label: '冬季色系' },
          { value: 'custom', label: '自定义色系' }
        ],
        default: 'spring'
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
          <Col span={8}>
            <Card>
              <Statistic
                title="总使用次数"
                value={stats.totalUsage}
                prefix={<UserOutlined />}
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic
                title="总积分消耗"
                value={stats.totalCredits}
                prefix={<DollarOutlined />}
                valueStyle={{ color: '#cf1322' }}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic
                title="启用工具数"
                value={stats.activeTools}
                suffix={`/ ${stats.totalTools}`}
                prefix={<ApiOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
        </Row>

        {/* 批量操作 */}
        <Card style={{ marginBottom: '24px' }}>
          <Space>
            <Button 
              type="primary" 
              onClick={() => handleBatchToggle(true)}
            >
              批量启用
            </Button>
            <Button 
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
              icon={<SaveOutlined />}
              onClick={() => message.success('配置已保存')}
            >
              保存所有配置
            </Button>
          </Space>
        </Card>
      </div>

      {/* 工具列表 */}
      <Row gutter={[16, 16]}>
        {tools.map(tool => (
          <Col xs={24} sm={12} lg={8} key={tool.id}>
            <Card
              hoverable
              style={{ 
                height: '100%',
                border: tool.enabled ? '2px solid #52c41a' : '1px solid #d9d9d9'
              }}
              styles={{ body: { padding: '16px' } }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div style={{ fontSize: '24px', marginRight: '12px' }}>
                  {tool.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: '4px'
                  }}>
                    <h4 style={{ margin: 0, fontSize: '16px' }}>{tool.name}</h4>
                    <Switch
                      checked={tool.enabled}
                      onChange={(checked) => handleToggleStatus(tool.id, checked)}
                      size="small"
                    />
                  </div>
                  <p style={{ 
                    margin: 0, 
                    fontSize: '12px', 
                    color: '#666',
                    lineHeight: '1.4'
                  }}>
                    {tool.description}
                  </p>
                </div>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <Space size="small" wrap>
                  {tool.features.map(feature => (
                    <Tag key={feature} size="small">{feature}</Tag>
                  ))}
                </Space>
              </div>

              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '12px',
                fontSize: '12px',
                color: '#666'
              }}>
                <span>积分消耗: <strong style={{ color: '#faad14' }}>{tool.creditCost}</strong></span>
                <span>使用次数: <strong>{tool.usageCount}</strong></span>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <Button 
                  size="small" 
                  icon={<EyeOutlined />}
                  onClick={() => handlePreview(tool)}
                  style={{ flex: 1 }}
                >
                  详情
                </Button>
                <Button 
                  size="small" 
                  icon={<SettingOutlined />}
                  onClick={() => handleOpenConfig(tool)}
                  style={{ flex: 1 }}
                >
                  配置
                </Button>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* 配置模态框 */}
      <Modal
        title={`配置 - ${currentTool?.name}`}
        open={configModalVisible}
        onOk={handleSaveConfig}
        onCancel={() => {
          setConfigModalVisible(false)
          setCurrentTool(null)
        }}
        width={600}
        okText="保存配置"
        cancelText="取消"
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item
            name="name"
            label="工具名称"
            rules={[{ required: true, message: '请输入工具名称' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="description"
            label="工具描述"
            rules={[{ required: true, message: '请输入工具描述' }]}
          >
            <TextArea rows={2} />
          </Form.Item>

          <Form.Item
            name="credits"
            label="积分消耗"
            rules={[{ required: true, message: '请设置积分消耗' }]}
          >
            <InputNumber min={1} max={100} style={{ width: '100%' }} />
          </Form.Item>

          {/* 显示统一的输入配置信息 */}
          <Alert
            message="统一界面配置"
            description={
              <div>
                <p>每个工具都遵循统一的界面布局：</p>
                <ul style={{ margin: 0, paddingLeft: '20px' }}>
                  <li>2个图片上传窗口</li>
                  <li>3个可选项窗口（分辨率、生成数量、生成模式）</li>
                  <li>1个提示词窗口</li>
                </ul>
              </div>
            }
            type="info"
            showIcon
            style={{ marginBottom: '16px' }}
          />
        </Form>
      </Modal>

      {/* 预览模态框 */}
      <Modal
        title={`工具详情 - ${currentTool?.name}`}
        open={previewModalVisible}
        onCancel={() => {
          setPreviewModalVisible(false)
          setCurrentTool(null)
        }}
        footer={null}
        width={700}
      >
        {currentTool && (
          <div>
            <Alert
              message={`状态: ${currentTool.enabled ? '已启用' : '已禁用'}`}
              type={currentTool.enabled ? 'success' : 'warning'}
              style={{ marginBottom: '16px' }}
            />
            
            <Descriptions column={2} bordered>
              <Descriptions.Item label="工具ID">{currentTool.id}</Descriptions.Item>
              <Descriptions.Item label="类别">{currentTool.category}</Descriptions.Item>
              <Descriptions.Item label="积分消耗">{currentTool.creditCost}</Descriptions.Item>
              <Descriptions.Item label="使用次数">{currentTool.usageCount}</Descriptions.Item>
              <Descriptions.Item label="最后使用">
                {currentTool.lastUsed ? new Date(currentTool.lastUsed).toLocaleDateString() : '从未使用'}
              </Descriptions.Item>
            </Descriptions>

            <Divider>统一界面配置</Divider>
            <Descriptions column={1} bordered>
              <Descriptions.Item label="图片上传窗口数量">2</Descriptions.Item>
              <Descriptions.Item label="可选项窗口数量">3</Descriptions.Item>
              <Descriptions.Item label="提示词窗口数量">1</Descriptions.Item>
            </Descriptions>

            <Divider>工具特定选项</Divider>
            <Descriptions column={1} bordered>
              <Descriptions.Item label={currentTool.thirdOption?.label}>
                {currentTool.thirdOption?.type === 'select' 
                  ? currentTool.thirdOption?.options.map(opt => opt.label).join(', ')
                  : `${currentTool.thirdOption?.min || 0} - ${currentTool.thirdOption?.max || 100}`}
              </Descriptions.Item>
            </Descriptions>

            <Divider>功能特性</Divider>
            <Space size="small" wrap>
              {currentTool.features?.map(feature => (
                <Tag key={feature} color="blue">{feature}</Tag>
              ))}
            </Space>

            <Divider>工具描述</Divider>
            <p>{currentTool.description}</p>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default AIModelToolsPage