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
import { aiModelToolsAPI } from '../services/api'

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

  // 9个AI模特功能的配置
  const aiModelTools = [
    {
      id: 'ai-model',
      name: 'AI模特生成',
      description: '基于商品图片生成专业模特展示图',
      icon: '👤',
      category: 'model',
      defaultEnabled: true,
      defaultCredits: 10,
      features: ['商品图片输入', '模特风格选择', '背景场景设置']
    },
    {
      id: 'try-on-clothes',
      name: '同版型试衣',
      description: '在保持服装版型的基础上更换模特',
      icon: '👔',
      category: 'tryon',
      defaultEnabled: true,
      defaultCredits: 8,
      features: ['服装图片', '模特替换', '版型保持']
    },
    {
      id: 'accessory-tryon',
      name: '配件试戴',
      description: '为模特添加眼镜、帽子等配件效果',
      icon: '👓',
      category: 'accessory',
      defaultEnabled: true,
      defaultCredits: 6,
      features: ['配件图片', '佩戴位置', '尺寸调整']
    },
    {
      id: 'pose-transform',
      name: '姿态变换',
      description: '改变模特的姿势和动作',
      icon: '🤸',
      category: 'pose',
      defaultEnabled: true,
      defaultCredits: 12,
      features: ['姿态选择', '动作调整', '自然度控制']
    },
    {
      id: 'model-video',
      name: '模特视频生成',
      description: '生成模特展示商品的短视频',
      icon: '🎬',
      category: 'video',
      defaultEnabled: false,
      defaultCredits: 25,
      features: ['视频时长', '动作序列', '背景音乐']
    },
    {
      id: 'shoes-tryon',
      name: '鞋靴试穿',
      description: '为模特试穿不同款式的鞋靴',
      icon: '👠',
      category: 'shoes',
      defaultEnabled: true,
      defaultCredits: 7,
      features: ['鞋靴图片', '脚部匹配', '角度调整']
    },
    {
      id: 'scene-change',
      name: '场景更换',
      description: '更换模特所在的背景场景',
      icon: '🏞️',
      category: 'scene',
      defaultEnabled: true,
      defaultCredits: 9,
      features: ['场景选择', '光线调整', '氛围设置']
    },
    {
      id: 'product-recolor',
      name: '商品换色',
      description: '改变商品的颜色和材质效果',
      icon: '🎨',
      category: 'color',
      defaultEnabled: true,
      defaultCredits: 5,
      features: ['颜色选择', '材质调整', '光泽控制']
    },
    {
      id: 'background-remove',
      name: '抠图去底',
      description: '自动抠除背景，生成透明底图',
      icon: '✂️',
      category: 'edit',
      defaultEnabled: true,
      defaultCredits: 3,
      features: ['智能识别', '边缘优化', '透明处理']
    }
  ]

  useEffect(() => {
    loadToolsData()
    loadStats()
  }, [])

  // 加载工具数据
  const loadToolsData = async () => {
    try {
      setLoading(true)
      // 调用后端API获取AI模特工具数据
      const response = await aiModelToolsAPI.getAIModelTools()
      if (response.success) {
        setTools(response.data)
      } else {
        message.error(response.message || '加载工具数据失败')
      }
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
      // 调用后端API获取统计数据
      const response = await aiModelToolsAPI.getAIModelToolsStats()
      if (response.success) {
        setStats(response.data)
      } else {
        console.error('加载统计数据失败:', response.message)
      }
    } catch (error) {
      console.error('加载统计数据失败:', error)
    }
  }

  // 切换工具状态
  const handleToggleStatus = async (toolId, enabled) => {
    try {
      // 调用后端API切换工具状态
      const response = await aiModelToolsAPI.toggleAIModelTool(toolId, enabled)
      if (response.success) {
        setTools(prev => prev.map(tool => 
          tool.id === toolId ? { ...tool, enabled } : tool
        ))
        message.success(`${enabled ? '启用' : '禁用'}成功`)
        
        // 重新加载统计数据
        loadStats()
      } else {
        message.error(response.message || '状态切换失败')
      }
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
      credits: tool.credits,
      maxResolution: tool.config?.maxResolution || '1024x1024',
      quality: tool.config?.quality || 'high',
      timeout: tool.config?.timeout || 30,
      retryCount: tool.config?.retryCount || 3
    })
    setConfigModalVisible(true)
  }

  // 保存配置
  const handleSaveConfig = async () => {
    try {
      const values = await form.validateFields()
      
      // 调用后端API保存配置
      const response = await aiModelToolsAPI.updateAIModelTool(currentTool.id, {
        name: values.name,
        description: values.description,
        credits: values.credits,
        config: {
          maxResolution: values.maxResolution,
          quality: values.quality,
          timeout: values.timeout,
          retryCount: values.retryCount
        }
      })
      
      if (response.success) {
        setTools(prev => prev.map(tool => 
          tool.id === currentTool.id 
            ? { 
                ...tool, 
                name: values.name,
                description: values.description,
                credits: values.credits,
                config: {
                  maxResolution: values.maxResolution,
                  quality: values.quality,
                  timeout: values.timeout,
                  retryCount: values.retryCount
                }
              } 
            : tool
        ))
        
        message.success('配置保存成功')
        setConfigModalVisible(false)
        setCurrentTool(null)
      } else {
        message.error(response.message || '配置保存失败')
      }
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
      content: `这将${enabled ? '启用' : '禁用'}所有9个AI模特功能`,
      onOk: () => {
        setTools(prev => prev.map(tool => ({ ...tool, enabled })))
        setStats(prev => ({ ...prev, activeTools: enabled ? 9 : 0 }))
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
        loadToolsData()
        message.success('配置重置成功')
      }
    })
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1>AI模特工具管理</h1>
        <p style={{ color: '#666', marginBottom: '16px' }}>
          管理9个AI模特生成功能的开关状态和配置参数
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
                suffix="/ 9"
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
                <span>积分消耗: <strong style={{ color: '#faad14' }}>{tool.credits}</strong></span>
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

          <Form.Item
            name="maxResolution"
            label="最大分辨率"
          >
            <Select>
              <Option value="512x512">512x512</Option>
              <Option value="768x768">768x768</Option>
              <Option value="1024x1024">1024x1024</Option>
              <Option value="1536x1536">1536x1536</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="quality"
            label="生成质量"
          >
            <Select>
              <Option value="low">低质量</Option>
              <Option value="medium">中等质量</Option>
              <Option value="high">高质量</Option>
              <Option value="ultra">超高质量</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="timeout"
            label="超时时间(秒)"
          >
            <Slider min={10} max={120} marks={{ 10: '10s', 30: '30s', 60: '60s', 120: '120s' }} />
          </Form.Item>

          <Form.Item
            name="retryCount"
            label="重试次数"
          >
            <InputNumber min={0} max={5} style={{ width: '100%' }} />
          </Form.Item>
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
              <Descriptions.Item label="积分消耗">{currentTool.credits}</Descriptions.Item>
              <Descriptions.Item label="使用次数">{currentTool.usageCount}</Descriptions.Item>
              <Descriptions.Item label="最后使用">
                {currentTool.lastUsed?.toLocaleDateString()}
              </Descriptions.Item>
              <Descriptions.Item label="最大分辨率">
                {currentTool.config?.maxResolution}
              </Descriptions.Item>
              <Descriptions.Item label="生成质量">
                {currentTool.config?.quality}
              </Descriptions.Item>
              <Descriptions.Item label="超时时间">
                {currentTool.config?.timeout}秒
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