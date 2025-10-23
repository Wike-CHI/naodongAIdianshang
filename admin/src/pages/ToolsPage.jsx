import React, { useState, useEffect } from 'react'
import { Table, Button, Space, Tag, Switch, Modal, Form, Input, Select, message, Drawer } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, SettingOutlined, CodeOutlined } from '@ant-design/icons'

const { TextArea } = Input
const { Option } = Select

const ToolsPage = () => {
  const [loading, setLoading] = useState(false)
  const [tools, setTools] = useState([])
  const [modalVisible, setModalVisible] = useState(false)
  const [templateDrawerVisible, setTemplateDrawerVisible] = useState(false)
  const [editingTool, setEditingTool] = useState(null)
  const [form] = Form.useForm()
  const [templateForm] = Form.useForm()

  // 模拟数据
  useEffect(() => {
    setLoading(true)
    setTimeout(() => {
      setTools([
        {
          id: '1',
          name: '模特图裂变',
          description: '基于单张模特图生成多种姿势的图片',
          category: '图像生成',
          enabled: true,
          apiUrl: '/api/model-fission',
          creditCost: 10,
          sortOrder: 1,
          createdAt: '2024-01-15',
          usageCount: 1250
        },
        {
          id: '2',
          name: '商品图场景更换',
          description: '将商品图片更换到不同的场景背景中',
          category: '图像编辑',
          enabled: true,
          apiUrl: '/api/scene-change',
          creditCost: 8,
          sortOrder: 2,
          createdAt: '2024-01-10',
          usageCount: 890
        },
        {
          id: '3',
          name: '商品图换色',
          description: '智能更换商品图片的颜色',
          category: '图像编辑',
          enabled: true,
          apiUrl: '/api/color-change',
          creditCost: 5,
          sortOrder: 3,
          createdAt: '2024-01-08',
          usageCount: 650
        }
      ])
      setLoading(false)
    }, 1000)
  }, [])

  // 表格列定义
  const columns = [
    {
      title: '工具名称',
      dataIndex: 'name',
      key: 'name',
      width: 150,
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 600 }}>{text}</div>
          <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
            使用次数: {record.usageCount}
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
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 100,
      render: (category) => (
        <Tag color={category === '图像生成' ? 'blue' : 'green'}>
          {category}
        </Tag>
      )
    },
    {
      title: '积分消耗',
      dataIndex: 'creditCost',
      key: 'creditCost',
      width: 100,
      render: (cost) => <span style={{ color: '#faad14', fontWeight: 600 }}>{cost}</span>
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      key: 'enabled',
      width: 80,
      render: (enabled, record) => (
        <Switch
          checked={enabled}
          onChange={(checked) => handleToggleStatus(record.id, checked)}
          size="small"
        />
      )
    },
    {
      title: '排序',
      dataIndex: 'sortOrder',
      key: 'sortOrder',
      width: 80,
      sorter: (a, b) => a.sortOrder - b.sortOrder
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
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            icon={<CodeOutlined />}
            onClick={() => handleEditTemplate(record)}
          >
            模板
          </Button>
          <Button
            type="link"
            size="small"
            icon={<SettingOutlined />}
            onClick={() => handleApiBinding(record)}
          >
            API
          </Button>
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record)}
          >
            删除
          </Button>
        </Space>
      )
    }
  ]

  // 处理状态切换
  const handleToggleStatus = (id, enabled) => {
    setTools(tools.map(tool => 
      tool.id === id ? { ...tool, enabled } : tool
    ))
    message.success(`工具已${enabled ? '启用' : '禁用'}`)
  }

  // 处理编辑
  const handleEdit = (tool) => {
    setEditingTool(tool)
    form.setFieldsValue(tool)
    setModalVisible(true)
  }

  // 处理新增
  const handleAdd = () => {
    setEditingTool(null)
    form.resetFields()
    setModalVisible(true)
  }

  // 处理删除
  const handleDelete = (tool) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除工具"${tool.name}"吗？此操作不可恢复。`,
      okText: '确认',
      cancelText: '取消',
      onOk: () => {
        setTools(tools.filter(t => t.id !== tool.id))
        message.success('删除成功')
      }
    })
  }

  // 处理模板编辑
  const handleEditTemplate = (tool) => {
    setEditingTool(tool)
    setTemplateDrawerVisible(true)
  }

  // 处理API绑定
  const handleApiBinding = (tool) => {
    message.info('API绑定功能开发中...')
  }

  // 处理表单提交
  const handleSubmit = async (values) => {
    try {
      if (editingTool) {
        // 更新
        setTools(tools.map(tool => 
          tool.id === editingTool.id ? { ...tool, ...values } : tool
        ))
        message.success('更新成功')
      } else {
        // 新增
        const newTool = {
          id: Date.now().toString(),
          ...values,
          enabled: true,
          usageCount: 0,
          createdAt: new Date().toISOString().split('T')[0]
        }
        setTools([...tools, newTool])
        message.success('添加成功')
      }
      setModalVisible(false)
      form.resetFields()
    } catch (error) {
      message.error('操作失败')
    }
  }

  // 处理模板保存
  const handleTemplateSave = async (values) => {
    try {
      // 这里应该调用API保存模板
      console.log('保存模板:', values)
      message.success('模板保存成功')
      setTemplateDrawerVisible(false)
    } catch (error) {
      message.error('保存失败')
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <div>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            添加工具
          </Button>
        </div>
        <Space>
          <Button>批量操作</Button>
          <Button>导出数据</Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={tools}
        rowKey="id"
        loading={loading}
        pagination={{
          total: tools.length,
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条记录`
        }}
      />

      {/* 编辑/新增模态框 */}
      <Modal
        title={editingTool ? '编辑工具' : '添加工具'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
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
            label="工具分类"
            rules={[{ required: true, message: '请选择工具分类' }]}
          >
            <Select placeholder="请选择工具分类">
              <Option value="图像生成">图像生成</Option>
              <Option value="图像编辑">图像编辑</Option>
              <Option value="文本处理">文本处理</Option>
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
            <Input type="number" placeholder="请输入积分消耗" />
          </Form.Item>
          
          <Form.Item
            name="sortOrder"
            label="排序"
            rules={[{ required: true, message: '请输入排序值' }]}
          >
            <Input type="number" placeholder="请输入排序值" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 模板编辑抽屉 */}
      <Drawer
        title="编辑提示词模板"
        placement="right"
        width={600}
        open={templateDrawerVisible}
        onClose={() => setTemplateDrawerVisible(false)}
      >
        <div style={{ marginBottom: 16 }}>
          <h4>工具: {editingTool?.name}</h4>
          <p style={{ color: '#8c8c8c' }}>配置AI生成时使用的提示词模板，支持参数占位符如 {'{参数名}'}</p>
        </div>
        
        <Form 
          form={templateForm} 
          layout="vertical"
          onFinish={handleTemplateSave}
        >
          <Form.Item 
            name="template"
            label="提示词模板"
          >
            <TextArea
              rows={10}
              placeholder="请输入提示词模板，例如：生成一张{style}风格的{subject}图片，要求{requirements}"
              defaultValue="生成一张{style}风格的{subject}图片，背景为{background}，整体色调{color_tone}，画面要求{requirements}"
            />
          </Form.Item>
          
          <Form.Item 
            name="description"
            label="参数说明"
          >
            <TextArea
              rows={5}
              placeholder="请说明各参数的含义和用法"
              defaultValue="{style}: 图片风格，如写实、卡通、油画等&#10;{subject}: 主体对象，如人物、商品等&#10;{background}: 背景描述&#10;{color_tone}: 色调要求&#10;{requirements}: 其他特殊要求"
            />
          </Form.Item>
          
          <Form.Item>
            <Space>
              <Button type="primary" onClick={() => templateForm.submit()}>保存模板</Button>
              <Button>预览效果</Button>
              <Button onClick={() => templateForm.resetFields()}>重置</Button>
            </Space>
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  )
}

export default ToolsPage