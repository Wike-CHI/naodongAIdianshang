import React, { useState, useEffect } from 'react'
import { Card, Table, Button, Space, Tag, Modal, Form, Input, Select, Switch, message, Tabs, Tooltip, Popconfirm, DatePicker } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, KeyOutlined, ApiOutlined, EyeOutlined, CopyOutlined } from '@ant-design/icons'
import { apiManagementAPI } from '../services/api'

const { Option } = Select
const { TextArea } = Input

const ApisPage = () => {
  const [loading, setLoading] = useState(false)
  const [apiEndpoints, setApiEndpoints] = useState([])
  const [apiKeys, setApiKeys] = useState([])
  const [modalVisible, setModalVisible] = useState(false)
  const [keyModalVisible, setKeyModalVisible] = useState(false)
  const [editingApi, setEditingApi] = useState(null)
  const [editingKey, setEditingKey] = useState(null)
  const [form] = Form.useForm()
  const [keyForm] = Form.useForm()

  useEffect(() => {
    loadData()
  }, [])

  // 加载所有数据
  const loadData = async () => {
    try {
      setLoading(true)
      await Promise.all([
        loadApiEndpoints(),
        loadApiKeys()
      ])
    } catch (error) {
      console.error('加载数据失败:', error)
      message.error('加载数据失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  // 加载API接口列表
  const loadApiEndpoints = async () => {
    try {
      const result = await apiManagementAPI.getEndpoints()
      
      if (result.success) {
        setApiEndpoints(result.data || [])
      } else {
        setApiEndpoints([])
      }
    } catch (error) {
      console.error('加载API接口失败:', error)
      setApiEndpoints([])
    }
  }

  // 加载API密钥列表
  const loadApiKeys = async () => {
    try {
      const result = await apiManagementAPI.getKeys()
      
      if (result.success) {
        setApiKeys(result.data || [])
      } else {
        setApiKeys([])
      }
    } catch (error) {
      console.error('加载API密钥失败:', error)
      setApiKeys([])
    }
  }

  // 添加API接口
  const handleAddApi = () => {
    setEditingApi(null)
    form.resetFields()
    setModalVisible(true)
  }

  // 编辑API接口
  const handleEditApi = (api) => {
    setEditingApi(api)
    form.setFieldsValue(api)
    setModalVisible(true)
  }

  // 保存API接口
  const handleSaveApi = async () => {
    try {
      const values = await form.validateFields()
      
      let result
      if (editingApi) {
        result = await apiManagementAPI.updateEndpoint(editingApi._id, values)
      } else {
        result = await apiManagementAPI.createEndpoint(values)
      }
      
      if (result.success) {
        message.success(editingApi ? 'API接口更新成功' : 'API接口创建成功')
        setModalVisible(false)
        setEditingApi(null)
        form.resetFields()
        loadApiEndpoints()
      } else {
        message.error(result.message || '保存API接口失败')
      }
    } catch (error) {
      console.error('保存API接口失败:', error)
      message.error('保存API接口失败，请稍后重试')
    }
  }

  // 删除API接口
  const handleDeleteApi = async (apiId) => {
    try {
      const result = await apiManagementAPI.deleteEndpoint(apiId)
      
      if (result.success) {
        message.success('API接口删除成功')
        loadApiEndpoints()
      } else {
        message.error(result.message || '删除API接口失败')
      }
    } catch (error) {
      console.error('删除API接口失败:', error)
      message.error('删除API接口失败，请稍后重试')
    }
  }

  // 切换API状态
  const handleToggleApiStatus = async (apiId, enabled) => {
    try {
      const result = await apiManagementAPI.updateEndpoint(apiId, { enabled })
      
      if (result.success) {
        message.success(`API接口已${enabled ? '启用' : '禁用'}`)
        loadApiEndpoints()
      } else {
        message.error(result.message || '更新API状态失败')
      }
    } catch (error) {
      console.error('更新API状态失败:', error)
      message.error('更新API状态失败，请稍后重试')
    }
  }

  // 添加API密钥
  const handleAddKey = () => {
    setEditingKey(null)
    keyForm.resetFields()
    setKeyModalVisible(true)
  }

  // 编辑API密钥
  const handleEditKey = (key) => {
    setEditingKey(key)
    keyForm.setFieldsValue(key)
    setKeyModalVisible(true)
  }

  // 保存API密钥
  const handleSaveKey = async () => {
    try {
      const values = await keyForm.validateFields()
      
      let result
      if (editingKey) {
        result = await apiManagementAPI.updateKey(editingKey._id, values)
      } else {
        result = await apiManagementAPI.createKey(values)
      }
      
      if (result.success) {
        message.success(editingKey ? 'API密钥更新成功' : 'API密钥创建成功')
        setKeyModalVisible(false)
        setEditingKey(null)
        keyForm.resetFields()
        loadApiKeys()
      } else {
        message.error(result.message || '保存API密钥失败')
      }
    } catch (error) {
      console.error('保存API密钥失败:', error)
      message.error('保存API密钥失败，请稍后重试')
    }
  }

  // 删除API密钥
  const handleDeleteKey = async (keyId) => {
    try {
      const result = await apiManagementAPI.deleteKey(keyId)
      
      if (result.success) {
        message.success('API密钥删除成功')
        loadApiKeys()
      } else {
        message.error(result.message || '删除API密钥失败')
      }
    } catch (error) {
      console.error('删除API密钥失败:', error)
      message.error('删除API密钥失败，请稍后重试')
    }
  }

  // 复制API密钥
  const handleCopyKey = (key) => {
    navigator.clipboard.writeText(key).then(() => {
      message.success('API密钥已复制到剪贴板')
    }).catch(() => {
      message.error('复制失败，请手动复制')
    })
  }

  // API接口表格列
  const apiColumns = [
    {
      title: 'API信息',
      key: 'apiInfo',
      width: 250,
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>
            <ApiOutlined style={{ marginRight: 8, color: '#1890ff' }} />
            {record.name}
          </div>
          <div style={{ fontSize: '12px', color: '#8c8c8c', lineHeight: '1.4' }}>
            {record.description}
          </div>
        </div>
      )
    },
    {
      title: '请求方法',
      dataIndex: 'method',
      key: 'method',
      width: 100,
      render: (method) => {
        const methodConfig = {
          GET: { color: 'green' },
          POST: { color: 'blue' },
          PUT: { color: 'orange' },
          DELETE: { color: 'red' }
        }
        const config = methodConfig[method] || { color: 'default' }
        return <Tag color={config.color}>{method}</Tag>
      }
    },
    {
      title: 'API路径',
      dataIndex: 'path',
      key: 'path',
      width: 200,
      render: (path) => (
        <code style={{ 
          backgroundColor: '#f5f5f5', 
          padding: '2px 6px', 
          borderRadius: '4px',
          fontSize: '12px'
        }}>
          {path}
        </code>
      )
    },
    {
      title: '版本',
      dataIndex: 'version',
      key: 'version',
      width: 80,
      render: (version) => <Tag color="purple">v{version}</Tag>
    },
    {
      title: '调用次数',
      dataIndex: 'callCount',
      key: 'callCount',
      width: 100,
      render: (count) => count?.toLocaleString() || 0
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      key: 'enabled',
      width: 100,
      render: (enabled, record) => (
        <Switch
          checked={enabled}
          onChange={(checked) => handleToggleApiStatus(record._id, checked)}
          checkedChildren="启用"
          unCheckedChildren="禁用"
        />
      )
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
              onClick={() => handleEditApi(record)}
            />
          </Tooltip>
          <Popconfirm
            title="确定要删除这个API接口吗？"
            onConfirm={() => handleDeleteApi(record._id)}
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

  // API密钥表格列
  const keyColumns = [
    {
      title: '密钥名称',
      dataIndex: 'name',
      key: 'name',
      width: 150
    },
    {
      title: '密钥值',
      dataIndex: 'key',
      key: 'key',
      width: 300,
      render: (key) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <code style={{ 
            backgroundColor: '#f5f5f5', 
            padding: '4px 8px', 
            borderRadius: '4px',
            fontSize: '12px',
            marginRight: 8,
            flex: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {key ? `${key.substring(0, 20)}...` : ''}
          </code>
          <Button 
            type="text" 
            size="small" 
            icon={<CopyOutlined />}
            onClick={() => handleCopyKey(key)}
          />
        </div>
      )
    },
    {
      title: '权限级别',
      dataIndex: 'permission',
      key: 'permission',
      width: 120,
      render: (permission) => {
        const permissionConfig = {
          read: { color: 'green', text: '只读' },
          write: { color: 'orange', text: '读写' },
          admin: { color: 'red', text: '管理员' }
        }
        const config = permissionConfig[permission] || { color: 'default', text: permission }
        return <Tag color={config.color}>{config.text}</Tag>
      }
    },
    {
      title: '使用次数',
      dataIndex: 'usageCount',
      key: 'usageCount',
      width: 100,
      render: (count) => count?.toLocaleString() || 0
    },
    {
      title: '过期时间',
      dataIndex: 'expiresAt',
      key: 'expiresAt',
      width: 120,
      render: (date) => {
        if (!date) return '永不过期'
        const expireDate = new Date(date)
        const now = new Date()
        const isExpired = expireDate < now
        return (
          <span style={{ color: isExpired ? '#ff4d4f' : '#52c41a' }}>
            {expireDate.toLocaleDateString()}
          </span>
        )
      }
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
            onClick={() => handleEditKey(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个API密钥吗？"
            onConfirm={() => handleDeleteKey(record._id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="text" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  return (
    <div>
      <Card>
        <Tabs 
          defaultActiveKey="endpoints"
          items={[
            {
              key: 'endpoints',
              label: 'API接口',
              children: (
                <>
                  <div style={{ marginBottom: 16 }}>
                    <Button type="primary" icon={<PlusOutlined />} onClick={handleAddApi}>
                      添加API接口
                    </Button>
                  </div>
                  <Table
                    columns={apiColumns}
                    dataSource={apiEndpoints}
                    rowKey="_id"
                    loading={loading}
                    pagination={{
                      showSizeChanger: true,
                      showQuickJumper: true,
                      showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
                    }}
                    scroll={{ x: 1200 }}
                  />
                </>
              )
            },
            {
              key: 'keys',
              label: 'API密钥',
              children: (
                <>
                  <div style={{ marginBottom: 16 }}>
                    <Button type="primary" icon={<KeyOutlined />} onClick={handleAddKey}>
                      生成API密钥
                    </Button>
                  </div>
                  <Table
                    columns={keyColumns}
                    dataSource={apiKeys}
                    rowKey="_id"
                    loading={loading}
                    pagination={{
                      showSizeChanger: true,
                      showQuickJumper: true,
                      showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
                    }}
                    scroll={{ x: 1000 }}
                  />
                </>
              )
            }
          ]}
        />
      </Card>

      {/* 添加/编辑API接口模态框 */}
      <Modal
        title={editingApi ? '编辑API接口' : '添加API接口'}
        open={modalVisible}
        onOk={handleSaveApi}
        onCancel={() => {
          setModalVisible(false)
          setEditingApi(null)
          form.resetFields()
        }}
        width={700}
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="接口名称"
            rules={[{ required: true, message: '请输入接口名称' }]}
          >
            <Input placeholder="请输入接口名称" />
          </Form.Item>
          
          <Form.Item
            name="description"
            label="接口描述"
            rules={[{ required: true, message: '请输入接口描述' }]}
          >
            <TextArea rows={3} placeholder="请输入接口描述" />
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
          
          <Form.Item
            name="path"
            label="API路径"
            rules={[{ required: true, message: '请输入API路径' }]}
          >
            <Input placeholder="/api/v1/example" addonBefore="/api" />
          </Form.Item>
          
          <Form.Item
            name="version"
            label="API版本"
            rules={[{ required: true, message: '请输入API版本' }]}
          >
            <Input placeholder="1.0" addonBefore="v" />
          </Form.Item>
          
          <Form.Item name="enabled" label="启用状态" valuePropName="checked">
            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 添加/编辑API密钥模态框 */}
      <Modal
        title={editingKey ? '编辑API密钥' : '生成API密钥'}
        open={keyModalVisible}
        onOk={handleSaveKey}
        onCancel={() => {
          setKeyModalVisible(false)
          setEditingKey(null)
          keyForm.resetFields()
        }}
        width={600}
        destroyOnHidden
      >
        <Form form={keyForm} layout="vertical">
          <Form.Item
            name="name"
            label="密钥名称"
            rules={[{ required: true, message: '请输入密钥名称' }]}
          >
            <Input placeholder="请输入密钥名称" />
          </Form.Item>
          
          <Form.Item
            name="permission"
            label="权限级别"
            rules={[{ required: true, message: '请选择权限级别' }]}
          >
            <Select placeholder="请选择权限级别">
              <Option value="read">只读权限</Option>
              <Option value="write">读写权限</Option>
              <Option value="admin">管理员权限</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="expiresAt"
            label="过期时间"
          >
            <DatePicker 
              style={{ width: '100%' }}
              placeholder="选择过期时间（不选择则永不过期）"
            />
          </Form.Item>
          
          <Form.Item name="enabled" label="启用状态" valuePropName="checked">
            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default ApisPage