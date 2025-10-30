import React, { useState } from 'react'
import { Card, Typography, Form, Button, message, Select, Slider, Radio, Space } from 'antd'
import { ThunderboltOutlined } from '@ant-design/icons'
import { useToolContext } from '../../contexts/ToolContext'
import { useAuth } from '../../contexts/AuthContext'
import ImageUpload from '../Common/ImageUpload'
import PromptInput from '../Common/PromptInput'

const { Title, Text } = Typography
const { Option } = Select

const WorkArea = () => {
  const { selectedTool, generateImage, isGenerating, commonOptions } = useToolContext()
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
      
      // 准备参数
      const params = {
        prompt: formData.positivePrompt,
        mainImage: formData.mainImage,
        referenceImage: formData.referenceImage,
        options: {
          resolution: formData.resolution,
          quantity: formData.quantity,
          mode: formData.mode
        }
      }
      
      // 调用真实的生成功能
      await generateImage(params)
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

          {/* 统一的选项配置 */}
          {/* 分辨率选项 */}
          <Form.Item
            name="resolution"
            label={commonOptions.resolution.label}
            initialValue={commonOptions.resolution.default}
          >
            <Select>
              {commonOptions.resolution.options.map(option => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </Form.Item>

          {/* 生成数量选项 */}
          <Form.Item
            name="quantity"
            label={commonOptions.quantity.label}
            initialValue={commonOptions.quantity.default}
          >
            <Slider
              min={commonOptions.quantity.min}
              max={commonOptions.quantity.max}
              marks={{
                [commonOptions.quantity.min]: commonOptions.quantity.min,
                [commonOptions.quantity.max]: commonOptions.quantity.max
              }}
            />
          </Form.Item>

          {/* 生成模式选项 */}
          <Form.Item
            name="mode"
            label={commonOptions.mode.label}
            initialValue={commonOptions.mode.default}
          >
            <Radio.Group>
              <Space direction="vertical">
                {commonOptions.mode.options.map(option => (
                  <Radio key={option.value} value={option.value}>
                    {option.label}
                  </Radio>
                ))}
              </Space>
            </Radio.Group>
          </Form.Item>

          {/* 正向提示词 - 必填 */}
          <Form.Item
            name="positivePrompt"
            label="正向提示词"
            rules={[{ required: true, message: '请输入正向提示词' }]}
          >
            <PromptInput placeholder="请输入正向提示词，描述您想要生成的内容" />
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
            borderRadius: '4px' 
          }}>
            <Text type="warning">登录后可使用生成功能并保存生成历史</Text>
          </div>
        )}
      </div>
    </div>
  )
}

export default WorkArea