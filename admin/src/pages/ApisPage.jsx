import React, { useState, useEffect } from 'react'
import { Table, Button, Space, Tag, Modal, Form, Input, Select, message, Tabs, Card, Switch } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, KeyOutlined, SettingOutlined, EyeInvisibleOutlined, EyeOutlined } from '@ant-design/icons'

const { TextArea } = Input
const { Option } = Select

const ApisPage = () => {
  const [loading, setLoading] = useState(false)
  const [apis, setApis] = useState([])
  const [apiKeys, setApiKeys] = useState([])
  const [modalVisible, setModalVisible] = useState(false)
  const [keyModalVisible, setKeyModalVisible] = useState(false)
  const [editingApi, setEditingApi] = useState(null)
  const [editingKey, setEditingKey] = useState(null)
  const [activeTab, setActiveTab] = useState('apis')
  const [form] = Form.useForm()
  const [keyForm] = Form.useForm()

  // 模拟数据
  useEffect(() => {
    setLoading(true)
    setTimeout(() => {
      setApis([
        {
          id: '1',
          name: 'OpenAI DALL-E',
          description: 'OpenAI图像生成API',
          url: 'https://api.openai.com/v1/images/generations',
          method: 'POST',
          provider: 'OpenAI',
          status: 'active',
          responseTime: 1200,
          successRate: 98.5,
          createdAt: '2024-01-15',
          parameterMapping: {
            prompt: 'prompt',
            size: 'size',
            n: 'n'
          }
        },
        {
          id: '2',
          name: 'Midjourney API',
          description: 'Midjourney图像生成接口',
          url: 'https://api.midjourney.com/v1/imagine',
          method: 'POST',
          provider: 'Midjourney',
          status: 'active',
          responseTime: 2500,
          successRate: 95.2,
          createdAt: '2024-01-12',
          parameterMapping: {
            prompt: 'prompt',
            aspect_ratio: 'aspect'
          }
        },
        {
          id: '3',
          name: 'Stable Diffusion',
          description: 'Stability AI图像生成',
          url: 'https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image',
          method: 'POST',
          provider: 'Stability AI',
          status: 'inactive',
          responseTime: 1800,
          successRate: 92.8,
          createdAt: '2024-01-10',
          parameterMapping: {
            text_prompts: 'prompts',
            cfg_scale: 'cfg_scale',
            steps: 'steps'
          }
        }
      ])

      setApiKeys([
        {
          id: '1',
          name: 'OpenAI API Key',
          provider: 'OpenAI',
          keyType: 'Bearer Token',
          status: 'active',
          lastUsed: '2024-01-20 14:30:25',
          createdAt: '2024-01-15',
          masked: true
        },
        {
          id: '2',
          name: 'Midjourney API Key',
          provider: 'Midjourney',
          keyType: 'API Key',
          status: 'active',
          lastUsed: '2024-01-20 13:15:10',
          createdAt: '2024-01-12',
          masked: true
        }
      ])
      setLoading(false)
    }, 1000)
  }, [])

  // API接口表格列定义
  const apiColumns = [
    {
      title: 'API名称',
      dataIndex: 'name',
      key: 'name',
      width: 150,
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 600 }}>{text}</div>
          <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
            {record.provider}
          </div>
        </div>
      )
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true
    },
    {
      title: '请求方法',
      dataIndex: 'method',
      key: 'method',
      width: 80,
      render: (method) => (
        <Tag color={method === 'POST' ? 'blue' : method === 'GET' ? 'green' : 'orange'}>
          {method}
        </Tag>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status, record) => (
        <div>
          <Tag color={status === 'active' ? 'green' : 'red'}>
            {status === 'active' ? '正常' : '停用'}
          </Tag>
          <div style={{ fontSize: '12px', color: '#8c8c8c', marginTop: 2 }}>
            {record.successRate}%
          </div>
        </div>
      )
    },
    {
      title: '响应时间',
      dataIndex: 'responseTime',
      key: 'responseTime',
      width: 100,
      render: (time) => (
        <span style={{ color: time > 2000 ? '#f5222d' : time > 1000 ? '#faad14' : '#52c41a' }}>
          {time}ms
        </span>
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
      width: 200,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditApi(record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            icon={<SettingOutlined />}
            onClick={() => handleConfigMapping(record)}
          >
            参数映射
          </Button>
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteApi(record)}
          >
            删除
          </Button>
        </Space>
      )
    }
  ]

  // API密钥表格列定义
  const keyColumns = [
    {
      title: '密钥名称',
      dataIndex: 'name',
      key: 'name',
      width: 150,
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 600 }}>{text}</div>
          <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
            {record.provider}
          </div>
        </div>
      )
    },
    {
      title: '密钥类型',
      dataIndex: 'keyType',
      key: 'keyType',
      width: 120,
      render: (type) => <Tag color="blue">{type}</Tag>
    },
    {
      title: '密钥值',
      key: 'keyValue',
      width: 200,
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ fontFamily: 'monospace', marginRight: 8 }}>
            {record.masked ? 'sk-***************************' : 'sk-1234567890abcdef1234567890abcdef'}
          </span>
          <Button
            type="text"
            size="small"
            icon={record.masked ? <EyeOutlined /> : <EyeInvisibleOutlined />}
            onClick={() => toggleKeyVisibility(record.id)}
          />
        </div>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
          {status === 'active' ? '正常' : '停用'}
        </Tag>
      )
    },
    {
      title: '最后使用',
      dataIndex: 'lastUsed',
      key: 'lastUsed',
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
            onClick={() => handleEditKey(record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteKey(record)}
          >
            删除
          </Button>
        </Space>
      )
    }
  ]

  // 处理API编辑
  const handleEditApi = (api) => {
    setEditingApi(api)
    form.setFieldsValue(api)
    setModalVisible(true)
  }

  // 处理API新增
  const handleAddApi = () => {
    setEditingApi(null)
    form.resetFields()
    setModalVisible(true)
  }

  // 处理API删除
  const handleDeleteApi = (api) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除API"${api.name}"吗？`,
      onOk: () => {
        setApis(apis.filter(a => a.id !== api.id))
        message.success('删除成功')
      }
    })
  }

  // 处理参数映射配置
  const handleConfigMapping = (api) => {
    message.info('参数映射配置功能开发中...')
  }

  // 处理密钥编辑
  const handleEditKey = (key) => {
    setEditingKey(key)
    keyForm.setFieldsValue(key)
    setKeyModalVisible(true)
  }

  // 处理密钥新增
  const handleAddKey = () => {
    setEditingKey(null)
    keyForm.resetFields()
    setKeyModalVisible(true)
  }

  // 处理密钥删除
  const handleDeleteKey = (key) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除密钥"${key.name}"吗？`,
      onOk: () => {
        setApiKeys(apiKeys.filter(k => k.id !== key.id))
        message.success('删除成功')
      }
    })
  }

  // 切换密钥可见性
  const toggleKeyVisibility = (keyId) => {
    setApiKeys(apiKeys.map(key => 
      key.id === keyId ? { ...key, masked: !key.masked } : key
    ))
  }

  // 处理API表单提交
  const handleApiSubmit = async (values) => {
    try {
      if (editingApi) {
        setApis(apis.map(api => 
          api.id === editingApi.id ? { ...api, ...values } : api
        ))
        message.success('更新成功')
      } else {
        const newApi = {
          id: Date.now().toString(),
          ...values,
          status: 'active',
          responseTime: 0,
          successRate: 0,
          createdAt: new Date().toISOString().split('T')[0]
        }
        setApis([...apis, newApi])
        message.success('添加成功')
      }
      setModalVisible(false)
      form.resetFields()
    } catch (error) {
      message.error('操作失败')
    }
  }

  // 处理密钥表单提交
  const handleKeySubmit = async (values) => {
    try {
      if (editingKey) {
        setApiKeys(apiKeys.map(key => 
          key.id === editingKey.id ? { ...key, ...values } : key
        ))
        message.success('更新成功')
      } else {
        const newKey = {
          id: Date.now().toString(),
          ...values,
          status: 'active',
          masked: true,
          lastUsed: '-',
          createdAt: new Date().toISOString().split('T')[0]
        }
        setApiKeys([...apiKeys, newKey])
        message.success('添加成功')
      }
      setKeyModalVisible(false)
      keyForm.resetFields()
    } catch (error) {
      message.error('操作失败')
    }
  }

  return (
    <div>
      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab}
        items={[
          {
            key: 'apis',
            label: 'API接口管理',
            children: (
              <>
                <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
                  <Button type="primary" icon={<PlusOutlined />} onClick={handleAddApi}>
                    添加API接口
                  </Button>
                  <Space>
                    <Button>批量测试</Button>
                    <Button>导出配置</Button>
                  </Space>
                </div>

                <Table
                  columns={apiColumns}
                  dataSource={apis}
                  rowKey="id"
                  loading={loading}
                  pagination={{
                    total: apis.length,
                    pageSize: 10,
                    showSizeChanger: true,
                    showTotal: (total) => `共 ${total} 条记录`
                  }}
                />
              </>
            )
          },
          {
            key: 'keys',
            label: '密钥管理',
            children: (
              <>
                <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
                  <Button type="primary" icon={<KeyOutlined />} onClick={handleAddKey}>
                    添加API密钥
                  </Button>
                  <Space>
                    <Button>批量检测</Button>
                    <Button>安全审计</Button>
                  </Space>
                </div>

                <Table
                  columns={keyColumns}
                  dataSource={apiKeys}
                  rowKey="id"
                  loading={loading}
                  pagination={{
                    total: apiKeys.length,
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

      {/* API编辑/新增模态框 */}
      <Modal
        title={editingApi ? '编辑API接口' : '添加API接口'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleApiSubmit}
        >
          <Form.Item
            name="name"
            label="API名称"
            rules={[{ required: true, message: '请输入API名称' }]}
          >
            <Input placeholder="请输入API名称" />
          </Form.Item>
          
          <Form.Item
            name="description"
            label="API描述"
            rules={[{ required: true, message: '请输入API描述' }]}
          >
            <TextArea rows={2} placeholder="请输入API描述" />
          </Form.Item>
          
          <Form.Item
            name="provider"
            label="服务提供商"
            rules={[{ required: true, message: '请输入服务提供商' }]}
          >
            <Input placeholder="如：OpenAI、Midjourney等" />
          </Form.Item>
          
          <Form.Item
            name="url"
            label="API地址"
            rules={[{ required: true, message: '请输入API地址' }]}
          >
            <Input placeholder="请输入完整的API地址" />
          </Form.Item>
          
          <Form.Item
            name="method"
            label="请求方法"
            rules={[{ required: true, message: '请选择请求方法' }]}
          >
            <Select placeholder="请选择请求方法">
              <Option value="GET">GET</Option>
              <Option value="POST">POST</Option>
              <Option value="PUT">PUT</Option>
              <Option value="DELETE">DELETE</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* 密钥编辑/新增模态框 */}
      <Modal
        title={editingKey ? '编辑API密钥' : '添加API密钥'}
        open={keyModalVisible}
        onCancel={() => setKeyModalVisible(false)}
        onOk={() => keyForm.submit()}
        width={500}
      >
        <Form
          form={keyForm}
          layout="vertical"
          onFinish={handleKeySubmit}
        >
          <Form.Item
            name="name"
            label="密钥名称"
            rules={[{ required: true, message: '请输入密钥名称' }]}
          >
            <Input placeholder="请输入密钥名称" />
          </Form.Item>
          
          <Form.Item
            name="provider"
            label="服务提供商"
            rules={[{ required: true, message: '请输入服务提供商' }]}
          >
            <Input placeholder="如：OpenAI、Midjourney等" />
          </Form.Item>
          
          <Form.Item
            name="keyType"
            label="密钥类型"
            rules={[{ required: true, message: '请选择密钥类型' }]}
          >
            <Select placeholder="请选择密钥类型">
              <Option value="API Key">API Key</Option>
              <Option value="Bearer Token">Bearer Token</Option>
              <Option value="OAuth Token">OAuth Token</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="keyValue"
            label="密钥值"
            rules={[{ required: true, message: '请输入密钥值' }]}
          >
            <Input.Password placeholder="请输入密钥值" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default ApisPage