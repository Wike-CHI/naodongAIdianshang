import React, { useState } from 'react'
import { Card, Typography, Form, Button, message } from 'antd'
import { ThunderboltOutlined } from '@ant-design/icons'
import { useToolContext } from '../../contexts/ToolContext'
import { useAuth } from '../../contexts/AuthContext'
import ImageUpload from '../Common/ImageUpload'
import PromptInput from '../Common/PromptInput'

const { Title, Text } = Typography

const WorkArea = () => {
  const { selectedTool, generateImage, isGenerating } = useToolContext()
  const { user, isAuthenticated, updateCredits } = useAuth()
  const [form] = Form.useForm()
  const [formData, setFormData] = useState({})

  const handleFormChange = (changedValues, allValues) => {
    setFormData(allValues)
  }

  const handleGenerate = async () => {
    if (!isAuthenticated) {
      message.warning('请先登录后再使用生成功能')
      return
    }

    if (user.credits < selectedTool.creditCost) {
      message.error('积分不足，请充值后再试')
      return
    }

    try {
      await form.validateFields()
      const result = await generateImage(formData)
      
      // 扣除积分
      const newCredits = user.credits - selectedTool.creditCost
      updateCredits(newCredits)
      
      message.success('生成成功！')
    } catch (error) {
      if (error.errorFields) {
        message.error('请填写必填项')
      } else {
        message.error('生成失败，请重试')
      }
    }
  }

  if (!selectedTool) {
    return (
      <div className="work-area" style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: '40px'
      }}>
        <Text type="secondary">请选择一个AI工具开始使用</Text>
      </div>
    )
  }

  return (
    <div className="work-area">
      {/* 工具标题栏 */}
      <div style={{ 
        padding: '20px 24px', 
        borderBottom: '1px solid #f0f0f0',
        background: 'white'
      }}>
        <Title level={4} style={{ margin: 0, color: '#1890ff' }}>
          {selectedTool.name}
        </Title>
        {/* 隐藏工具描述 */}
        {selectedTool.description && selectedTool.description.trim() && (
          <Text type="secondary" style={{ fontSize: '13px' }}>
            {selectedTool.description}
          </Text>
        )}
      </div>

      {/* 参数配置区域 */}
      <div style={{ 
        flex: 1, 
        padding: '24px',
        background: 'white',
        overflow: 'auto'
      }}>
        <Form
          form={form}
          layout="vertical"
          onValuesChange={handleFormChange}
          autoComplete="off"
        >
          {/* 主图片上传 - 必填 */}
          <Form.Item
            name="mainImage"
            label="主图片上传"
            rules={[{ required: true, message: '请上传主图片' }]}
          >
            <ImageUpload 
              placeholder="请上传主图片" 
              multiple={false}
              maxCount={1}
            />
          </Form.Item>

          {/* 参考图片上传 - 必填 */}
          <Form.Item
            name="referenceImage"
            label="参考图片上传"
            rules={[{ required: true, message: '请上传参考图片' }]}
          >
            <ImageUpload 
              placeholder="请上传参考图片" 
              multiple={false}
              maxCount={1}
            />
          </Form.Item>

          {/* 正向提示词 - 必填 */}
          <Form.Item
            name="positivePrompt"
            label="正向提示词"
            rules={[{ required: true, message: '请输入正向提示词' }]}
          >
            <PromptInput placeholder="请输入正向提示词，描述您想要生成的内容" />
          </Form.Item>

          {/* 负向提示词 - 可选 */}
          <Form.Item
            name="negativePrompt"
            label="负向提示词"
          >
            <PromptInput placeholder="请输入负向提示词，描述您不想要的内容（可选）" />
          </Form.Item>

          <Form.Item style={{ marginTop: '32px', marginBottom: 0 }}>
            <Button
              type="primary"
              size="large"
              icon={<ThunderboltOutlined />}
              loading={isGenerating}
              onClick={handleGenerate}
              block
              style={{ height: '48px', fontSize: '16px' }}
            >
              {isGenerating ? '生成中...' : `开始生成 (${selectedTool.creditCost} 积分)`}
            </Button>
          </Form.Item>
        </Form>

        {!isAuthenticated && (
          <div style={{ 
            marginTop: '16px', 
            padding: '12px', 
            background: '#fff7e6', 
            border: '1px solid #ffd591',
            borderRadius: '6px',
            textAlign: 'center'
          }}>
            <Text type="warning">请先登录后使用生成功能</Text>
          </div>
        )}
      </div>
    </div>
  )
}

export default WorkArea