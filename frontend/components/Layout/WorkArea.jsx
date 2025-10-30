import React, { useState } from 'react'
import { Card, Typography, Form, Button, message, Select, Slider, Radio, Space, Row, Col, Divider, Input } from 'antd'
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
      
      // 准备参数 - 提示词现在是可选的
      const params = {
        mainImage: formData.mainImage,
        referenceImage: formData.referenceImage,
        options: {
          resolution: formData.resolution,
          quantity: formData.quantity,
          mode: formData.mode
        }
      }
      
      // 根据工具类型添加特定参数
      switch (selectedTool.id) {
        case 'ai-model':
          if (formData.productType) params.productType = formData.productType;
          if (formData.style) params.style = formData.style;
          break;
        case 'try-on-clothes':
          if (formData.fabricType) params.fabricType = formData.fabricType;
          if (formData.clothingStyle) params.clothingStyle = formData.clothingStyle;
          break;
        case 'glasses-tryon':
          if (formData.accessoryCategory) params.accessoryCategory = formData.accessoryCategory;
          break;
        case 'pose-variation':
          if (formData.poseType) params.poseType = formData.poseType;
          break;
        case 'shoe-tryon':
          if (formData.shoeType) params.shoeType = formData.shoeType;
          break;
        case 'scene-change':
          if (formData.sceneType) params.sceneType = formData.sceneType;
          break;
        case 'color-change':
          if (formData.targetColorName) params.targetColorName = formData.targetColorName;
          break;
      }
      
      // 只有在用户提供提示词时才添加
      if (formData.positivePrompt && formData.positivePrompt.trim().length > 0) {
        params.prompt = formData.positivePrompt
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

  // 根据工具类型渲染特定选项
  const renderToolSpecificOptions = () => {
    switch (selectedTool.id) {
      case 'ai-model':
        return (
          <>
            <Form.Item
              name="productType"
              label="产品类型"
            >
              <Select placeholder="选择产品类型">
                <Option value="连衣裙">连衣裙</Option>
                <Option value="衬衫">衬衫</Option>
                <Option value="外套">外套</Option>
                <Option value="裤子">裤子</Option>
                <Option value="其他">其他</Option>
              </Select>
            </Form.Item>
            <Form.Item
              name="style"
              label="风格"
            >
              <Select placeholder="选择风格">
                <Option value="商务">商务</Option>
                <Option value="休闲">休闲</Option>
                <Option value="运动">运动</Option>
                <Option value="时尚">时尚</Option>
                <Option value="简约">简约</Option>
              </Select>
            </Form.Item>
          </>
        );
        
      case 'try-on-clothes':
        return (
          <>
            <Form.Item
              name="fabricType"
              label="面料类型"
            >
              <Select placeholder="选择面料类型">
                <Option value="棉质">棉质</Option>
                <Option value="丝绸">丝绸</Option>
                <Option value="羊毛">羊毛</Option>
                <Option value="化纤">化纤</Option>
                <Option value="混纺">混纺</Option>
              </Select>
            </Form.Item>
            <Form.Item
              name="clothingStyle"
              label="服装款式"
            >
              <Select placeholder="选择服装款式">
                <Option value="修身">修身</Option>
                <Option value="宽松">宽松</Option>
                <Option value="直筒">直筒</Option>
                <Option value="A字型">A字型</Option>
                <Option value="其他">其他</Option>
              </Select>
            </Form.Item>
          </>
        );
        
      case 'glasses-tryon':
        return (
          <Form.Item
            name="accessoryCategory"
            label="配件类别"
          >
            <Select placeholder="选择配件类别">
              <Option value="眼镜">眼镜</Option>
              <Option value="帽子">帽子</Option>
              <Option value="耳环">耳环</Option>
              <Option value="项链">项链</Option>
              <Option value="手表">手表</Option>
            </Select>
          </Form.Item>
        );
        
      case 'pose-variation':
        return (
          <Form.Item
            name="poseType"
            label="姿态类型"
          >
            <Select placeholder="选择姿态类型">
              <Option value="站立">站立</Option>
              <Option value="坐姿">坐姿</Option>
              <Option value="行走">行走</Option>
              <Option value="运动">运动</Option>
              <Option value="其他">其他</Option>
            </Select>
          </Form.Item>
        );
        
      case 'shoe-tryon':
        return (
          <Form.Item
            name="shoeType"
            label="鞋类"
          >
            <Select placeholder="选择鞋类">
              <Option value="运动鞋">运动鞋</Option>
              <Option value="高跟鞋">高跟鞋</Option>
              <Option value="休闲鞋">休闲鞋</Option>
              <Option value="靴子">靴子</Option>
              <Option value="凉鞋">凉鞋</Option>
            </Select>
          </Form.Item>
        );
        
      case 'scene-change':
        return (
          <Form.Item
            name="sceneType"
            label="场景类型"
          >
            <Select placeholder="选择场景类型">
              <Option value="室内">室内</Option>
              <Option value="户外">户外</Option>
              <Option value="街拍">街拍</Option>
              <Option value=" studio">studio</Option>
              <Option value="自然风光">自然风光</Option>
            </Select>
          </Form.Item>
        );
        
      case 'color-change':
        return (
          <Form.Item
            name="targetColorName"
            label="目标颜色"
          >
            <Input placeholder="输入目标颜色，如：红色、蓝色等" />
          </Form.Item>
        );
        
      default:
        return null;
    }
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
          {/* 图片上传区域 - 垂直布局 */}
          <div style={{ marginBottom: '32px' }}>
            <Title level={5} style={{ marginBottom: '16px' }}>图片上传</Title>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
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
            </div>
          </div>

          <Divider style={{ margin: '8px 0 24px 0' }} />

          {/* 可选项区 - 垂直布局 */}
          <div style={{ marginBottom: '32px' }}>
            <Title level={5} style={{ marginBottom: '16px' }}>可选项</Title>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
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
              
              {/* 工具特定选项 */}
              {renderToolSpecificOptions()}
            </div>
          </div>

          <Divider style={{ margin: '8px 0 24px 0' }} />

          {/* 提示词区域 - 现在是可选的 */}
          <div style={{ marginBottom: '32px' }}>
            <Form.Item
              name="positivePrompt"
              label="提示词（可选）"
            >
              <PromptInput placeholder="请输入提示词，描述您想要生成的内容（可选）" />
            </Form.Item>
          </div>

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