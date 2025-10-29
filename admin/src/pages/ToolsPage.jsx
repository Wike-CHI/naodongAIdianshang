import React, { useState, useEffect } from 'react'
import { Table, Card, Button, Space, Tag, Modal, Form, Input, InputNumber, Select, Switch, message, Popconfirm, Tooltip, Upload } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, SettingOutlined, ApiOutlined, UploadOutlined } from '@ant-design/icons'
import { toolsAPI, fileAPI } from '../services/api'

const { Option } = Select
const { TextArea } = Input

const ToolsPage = () => {
  const [tools, setTools] = useState([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [selectedRowKeys, setSelectedRowKeys] = useState([])
  const [searchText, setSearchText] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  })
  const [modalVisible, setModalVisible] = useState(false)
  const [editingTool, setEditingTool] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    api_endpoint: '',
    credits_per_use: 1,
    sort_order: 0,
    enabled: true,
    icon: '',
    supported_resolutions: [],
    default_prompt: '',
    negative_prompt: '',
    max_file_size: 10,
    supported_formats: [],
    advanced_config: '{}'
  })
  const [form] = Form.useForm()

  // 处理图片上传
  const handleImageUpload = async (file) => {
    try {
      setUploading(true);
      const result = await fileAPI.uploadImage(file);
      
      if (result.success && result.data && result.data.files && result.data.files.length > 0) {
        const uploadedFile = result.data.files[0];
        setFormData(prev => ({
          ...prev,
          icon: uploadedFile.url || uploadedFile.file_path
        }));
        message.success('图片上传成功');
      } else {
        throw new Error('上传响应格式错误');
      }
    } catch (error) {
      console.error('图片上传失败:', error);
      message.error(error.message || '图片上传失败');
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    loadTools()
  }, [pagination.current, pagination.pageSize, searchText, categoryFilter, statusFilter])

  // 加载AI工具数据
  const loadTools = async () => {
    try {
      setLoading(true)
      const params = {
        page: pagination.current,
        limit: pagination.pageSize,
        search: searchText,
        category: categoryFilter,
        status: statusFilter
      }

      const result = await toolsAPI.getTools(params)
      
      if (result.success) {
        setTools(result.data.tools || [])
        setPagination(prev => ({
          ...prev,
          total: result.data.total || 0
        }))
      } else {
        message.error(result.message || '获取工具列表失败')
      }
    } catch (error) {
      console.error('加载工具列表失败:', error)
      message.error('加载工具列表失败')
    } finally {
      setLoading(false)
    }
  }

  // 搜索工具
  const handleSearch = (value) => {
    setSearchText(value)
    setPagination(prev => ({ ...prev, current: 1 }))
  }

  // 筛选变化
  const handleFilterChange = (type, value) => {
    if (type === 'category') {
      setCategoryFilter(value)
    } else if (type === 'status') {
      setStatusFilter(value)
    }
    setPagination(prev => ({ ...prev, current: 1 }))
  }

  // 添加新工具
  const handleAdd = () => {
    setEditingTool(null)
    form.resetFields()
    setModalVisible(true)
  }

  // 编辑工具
  const handleEdit = (tool) => {
    setEditingTool(tool)
    form.setFieldsValue({
      name: tool.name,
      description: tool.description,
      category: tool.category,
      apiUrl: tool.apiUrl,
      creditCost: tool.creditCost,
      enabled: tool.enabled,
      sortOrder: tool.sortOrder,
      parameters: tool.parameters ? JSON.stringify(tool.parameters, null, 2) : ''
    })
    setModalVisible(true)
  }

  // 保存工具（新增或编辑）
  const handleSave = async () => {
    try {
      const values = await form.validateFields()
      
      // 处理参数配置JSON
      if (values.parameters) {
        try {
          JSON.parse(values.parameters)
        } catch (error) {
          message.error('参数配置格式不正确，请输入有效的JSON格式')
          return
        }
      }

      if (editingTool) {
        // 编辑模式
        const result = await toolsAPI.updateTool(editingTool._id, values)
        if (result.success) {
          message.success('工具更新成功')
          setModalVisible(false)
          setEditingTool(null)
          form.resetFields()
          loadTools()
        } else {
          message.error(result.message || '更新工具失败')
        }
      } else {
        // 新增模式
        const result = await toolsAPI.createTool(values)
        if (result.success) {
          message.success('工具创建成功')
          setModalVisible(false)
          form.resetFields()
          loadTools()
        } else {
          message.error(result.message || '创建工具失败')
        }
      }
    } catch (error) {
      console.error('保存工具失败:', error)
      message.error('保存工具失败')
    }
  }

  // 删除工具
  const handleDelete = async (toolId) => {
    try {
      const result = await toolsAPI.deleteTool(toolId)
      if (result.success) {
        message.success('工具删除成功')
        loadTools()
      } else {
        message.error(result.message || '删除工具失败')
      }
    } catch (error) {
      console.error('删除工具失败:', error)
      message.error('删除工具失败')
    }
  }

  // 批量删除工具
  const handleBatchDelete = async () => {
    try {
      const result = await toolsAPI.batchUpdateTools({
        action: 'delete',
        toolIds: selectedRowKeys
      })
      if (result.success) {
        message.success(`成功删除 ${selectedRowKeys.length} 个工具`)
        setSelectedRowKeys([])
        loadTools()
      } else {
        message.error(result.message || '批量删除失败')
      }
    } catch (error) {
      console.error('批量删除失败:', error)
      message.error('批量删除失败')
    }
  }

  // 切换工具状态
  const handleToggleStatus = async (toolId, enabled) => {
    try {
      const result = await toolsAPI.toggleToolStatus(toolId, enabled)
      if (result.success) {
        message.success(`工具已${enabled ? '启用' : '禁用'}`)
        loadTools()
      } else {
        message.error(result.message || '状态切换失败')
      }
    } catch (error) {
      console.error('状态切换失败:', error)
      message.error('状态切换失败')
    }
  }

  // 表格列定义
  const columns = [
    {
      title: '工具信息',
      key: 'toolInfo',
      width: 250,
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>{record.name}</div>
          <div style={{ fontSize: '12px', color: '#8c8c8c', lineHeight: '1.4' }}>
            {record.description}
          </div>
        </div>
      )
    },
    {
      title: '类别',
      dataIndex: 'category',
      key: 'category',
      width: 120,
      render: (category) => {
        const categoryConfig = {
          image: { color: 'blue', text: '图像处理' },
          text: { color: 'green', text: '文本生成' },
          video: { color: 'purple', text: '视频处理' },
          audio: { color: 'orange', text: '音频处理' }
        }
        const config = categoryConfig[category] || { color: 'default', text: category }
        return <Tag color={config.color}>{config.text}</Tag>
      }
    },
    {
      title: 'API地址',
      dataIndex: 'apiUrl',
      key: 'apiUrl',
      width: 200,
      render: (url) => (
        <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
          {url ? url.substring(0, 50) + (url.length > 50 ? '...' : '') : '未设置'}
        </div>
      )
    },
    {
      title: '积分消耗',
      dataIndex: 'creditCost',
      key: 'creditCost',
      width: 100,
      render: (cost) => (
        <span style={{ color: '#faad14', fontWeight: 600 }}>
          {cost || 0}
        </span>
      )
    },
    {
      title: '使用次数',
      dataIndex: 'usageCount',
      key: 'usageCount',
      width: 100,
      render: (count) => count?.toLocaleString() || 0
    },
    {
      title: '排序',
      dataIndex: 'sortOrder',
      key: 'sortOrder',
      width: 80,
      render: (order) => order || 0
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      key: 'enabled',
      width: 100,
      render: (enabled, record) => (
        <Switch
          checked={enabled}
          onChange={(checked) => handleToggleStatus(record._id, checked)}
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
          <Tooltip key="view" title="查看详情">
            <Button type="text" size="small" icon={<EyeOutlined />} />
          </Tooltip>
          <Tooltip key="edit" title="编辑">
            <Button 
              type="text" 
              size="small" 
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Popconfirm
            key="delete"
            title="确定要删除这个工具吗？"
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
    onChange: setSelectedRowKeys
  }

  return (
    <div>
      <Card>
        {/* 搜索和筛选区域 */}
        <div style={{ marginBottom: 16 }}>
          <Space wrap>
            <Input.Search
              placeholder="搜索工具名称或描述"
              allowClear
              style={{ width: 300 }}
              onSearch={handleSearch}
            />
            <Select
              placeholder="类别筛选"
              allowClear
              style={{ width: 120 }}
              onChange={(value) => handleFilterChange('category', value)}
            >
              <Option key="image" value="image">图像处理</Option>
              <Option key="text" value="text">文本生成</Option>
              <Option key="video" value="video">视频处理</Option>
              <Option key="audio" value="audio">音频处理</Option>
            </Select>
            <Select
              placeholder="状态筛选"
              allowClear
              style={{ width: 120 }}
              onChange={(value) => handleFilterChange('status', value)}
            >
              <Option key="enabled" value="enabled">已启用</Option>
              <Option key="disabled" value="disabled">已禁用</Option>
            </Select>
          </Space>
        </div>

        {/* 操作按钮区域 */}
        <div style={{ marginBottom: 16 }}>
          <Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              添加工具
            </Button>
            {selectedRowKeys.length > 0 && (
              <Popconfirm
                title={`确定要删除选中的 ${selectedRowKeys.length} 个工具吗？`}
                onConfirm={handleBatchDelete}
                okText="确定"
                cancelText="取消"
              >
                <Button danger icon={<DeleteOutlined />}>
                  批量删除 ({selectedRowKeys.length})
                </Button>
              </Popconfirm>
            )}
          </Space>
        </div>

        {/* 工具列表表格 */}
        <Table
          rowSelection={rowSelection}
          columns={columns}
          dataSource={tools}
          loading={loading}
          rowKey={(record) => record._id || record.id || Math.random().toString(36)}
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

      {/* 添加/编辑工具模态框 */}
      <Modal
        title={editingTool ? '编辑工具' : '添加工具'}
        open={modalVisible}
        onOk={handleSave}
        onCancel={() => {
          setModalVisible(false)
          setEditingTool(null)
          form.resetFields()
        }}
        width={800}
        okText="保存"
        cancelText="取消"
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            enabled: true,
            creditCost: 1,
            sortOrder: 0
          }}
        >
          <Form.Item
            name="name"
            label="工具名称"
            rules={[{ required: true, message: '请输入工具名称' }]}
          >
            <Input placeholder="请输入工具名称" />
          </Form.Item>

          <Form.Item
            name="description"
            label="工具描述"
            rules={[{ required: true, message: '请输入工具描述' }]}
          >
            <TextArea rows={3} placeholder="请输入工具描述" />
          </Form.Item>

          <Form.Item
            name="category"
            label="工具类别"
            rules={[{ required: true, message: '请选择工具类别' }]}
          >
            <Select placeholder="请选择工具类别">
              <Option key="image" value="image">图像处理</Option>
              <Option key="text" value="text">文本生成</Option>
              <Option key="video" value="video">视频处理</Option>
              <Option key="audio" value="audio">音频处理</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="apiUrl"
            label="API地址"
            rules={[{ required: true, message: '请输入API地址' }]}
          >
            <Input placeholder="请输入API地址" />
          </Form.Item>

          <Form.Item
            name="creditCost"
            label="积分消耗"
            rules={[{ required: true, message: '请输入积分消耗' }]}
          >
            <InputNumber min={0} placeholder="请输入积分消耗" style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="sortOrder"
            label="排序权重"
          >
            <InputNumber min={0} placeholder="数值越大排序越靠前" style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="enabled"
            label="启用状态"
            valuePropName="checked"
          >
            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
          </Form.Item>

          <Form.Item
            name="parameters"
            label="参数配置"
          >
            <Card title="工具参数设置" size="small">
              <Form.Item
                name={['parameters', 'supportImageUpload']}
                label="支持图片上传"
                valuePropName="checked"
              >
                <Switch checkedChildren="是" unCheckedChildren="否" />
              </Form.Item>

              <Form.Item
                name={['parameters', 'defaultPrompt']}
                label="默认提示词"
              >
                <TextArea
                  rows={3}
                  placeholder="请输入默认提示词模板"
                />
              </Form.Item>

              <Form.Item
                name={['parameters', 'supportedResolutions']}
                label="支持的分辨率"
              >
                <Select
                  mode="multiple"
                  placeholder="选择支持的分辨率"
                  options={[
                    { key: '512x512', label: '512x512', value: '512x512' },
                    { key: '768x768', label: '768x768', value: '768x768' },
                    { key: '1024x1024', label: '1024x1024', value: '1024x1024' },
                    { key: '1280x720', label: '1280x720', value: '1280x720' },
                    { key: '1920x1080', label: '1920x1080', value: '1920x1080' },
                    { key: '512x768', label: '512x768', value: '512x768' },
                    { key: '768x512', label: '768x512', value: '768x512' }
                  ]}
                />
              </Form.Item>

              <Form.Item
                name={['parameters', 'defaultResolution']}
                label="默认分辨率"
              >
                <Select placeholder="选择默认分辨率">
                  <Option key="512x512" value="512x512">512x512</Option>
                  <Option key="768x768" value="768x768">768x768</Option>
                  <Option key="1024x1024" value="1024x1024">1024x1024</Option>
                  <Option key="1280x720" value="1280x720">1280x720</Option>
                  <Option key="1920x1080" value="1920x1080">1920x1080</Option>
                </Select>
              </Form.Item>

              <Form.Item
                name={['parameters', 'maxImageSize']}
                label="最大图片大小(MB)"
              >
                <InputNumber
                  min={1}
                  max={50}
                  placeholder="最大图片大小"
                  style={{ width: '100%' }}
                />
              </Form.Item>

              <Form.Item
                name={['parameters', 'supportedFormats']}
                label="支持的图片格式"
              >
                <Select
                  mode="multiple"
                  placeholder="选择支持的图片格式"
                  options={[
                    { key: 'jpeg', label: 'JPEG', value: 'jpeg' },
                    { key: 'png', label: 'PNG', value: 'png' },
                    { key: 'webp', label: 'WEBP', value: 'webp' },
                    { key: 'gif', label: 'GIF', value: 'gif' }
                  ]}
                />
              </Form.Item>

              <Form.Item
                name={['parameters', 'processingTime']}
                label="预计处理时间(秒)"
              >
                <InputNumber
                  min={1}
                  max={300}
                  placeholder="预计处理时间"
                  style={{ width: '100%' }}
                />
              </Form.Item>

              <Form.Item
                name={['parameters', 'customFields']}
                label="自定义参数"
              >
                <TextArea
                  rows={4}
                  placeholder="请输入JSON格式的自定义参数配置，例如：&#123;&quot;style&quot;: [&quot;realistic&quot;, &quot;cartoon&quot;], &quot;quality&quot;: &quot;high&quot;&#125;"
                />
              </Form.Item>
            </Card>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default ToolsPage