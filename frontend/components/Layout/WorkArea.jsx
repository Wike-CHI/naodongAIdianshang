import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Card, Typography, Button, Select, Input, Space, Alert, message } from 'antd'
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import { useTool } from '../../contexts/ToolContext' // 改为 useTool
import { useAuth } from '../../contexts/AuthContext'

const { Title, Text, Paragraph } = Typography
const { TextArea } = Input

const MAX_FILE_SIZE = 10 * 1024 * 1024

// 场景预设
const SCENE_PRESETS = [
  {
    value: 'studio-white',
    label: '高级摄影棚白底',
    prompt: '高级无影商业摄影棚白色背景，柔光箱补光，地面干净反光 '
  },
  {
    value: 'studio-gradient',
    label: '渐变炫彩摄影棚',
    prompt: '高级电商渐变摄影棚背景，冷暖渐层灯光，镜面质感地面'
  },
  {
    value: 'lifestyle-livingroom',
    label: '现代客厅场景',
    prompt: '现代简约客厅背景，柔和自然光，家具摆放协调 '
  },
  {
    value: 'street-fashion',
    label: '街拍时尚',
    prompt: '黄金时段城市街景背景，柔焦光斑，潮流街拍氛围'
  },
  {
    value: 'outdoor-garden',
    label: '花园自然光',
    prompt: '户外花园背景，绿色植被和柔和散射自然光，清新氛围'
  },
  {
    value: 'premium-ecommerce',
    label: '高级电商布景',
    prompt: '高级电商布景背景，纯色立体背景板和柔光灯，适合服饰拍摄'
  }
]

// 颜色预设
const COLOR_PRESETS = [
  {
    value: 'classic-black',
    label: '经典黑',
    prompt: '纯黑色，轻微哑光质感，保持细节高光'
  },
  {
    value: 'pure-white',
    label: '纯净白',
    prompt: '纯白色，高亮度电商质感，保留产品阴影与纹理 '
  },
  {
    value: 'ecommerce-red',
    label: '爆款红',
    prompt: '电商爆款红，饱和度高，保持材质反光细节'
  },
  {
    value: 'soft-beige',
    label: '奶油米白',
    prompt: '温柔米白色，低饱和奶油调，保留材质纹理 '
  },
  {
    value: 'iced-blue',
    label: '冰川蓝',
    prompt: '清爽冰川蓝，轻微金属光泽，凸显线条 '
  },
  {
    value: 'emerald-green',
    label: '翡翠绿',
    prompt: '高级翡翠绿，丝绒质感，保持高光层次 '
  }
]

// 工具工作流配置
const TOOL_WORKFLOWS = {
  'ai-model': {
    mainLabel: '模特主图',
    mainPlaceholder: '上传需要换脸的模特照片',
    referenceLabel: '人物参考图',
    referencePlaceholder: '上传人物面部参考图',
    requireReference: true,
    helper: '系统将自动应用专业模特换脸提示词，无需填写额外描述。',
    requiresPrompt: false,
    buildPrompt: () => undefined,
    buildMetadata: ({ promptSource }) => ({ promptSource })
  },
  'try-on-clothes': {
    mainLabel: '人物模特图',
    mainPlaceholder: '上传需要试衣的人物照片',
    referenceLabel: '服装商品图',
    referencePlaceholder: '上传要试穿的服装照片',
    requireReference: true,
    helper: '系统会智能融合服装与人物，默认使用内置提示词。',
    requiresPrompt: false,
    buildPrompt: () => undefined,
    buildMetadata: ({ promptSource }) => ({ promptSource })
  },
  'glasses-tryon': {
    mainLabel: '人脸照片',
    mainPlaceholder: '上传需要试戴的脸部照片',
    referenceLabel: '配件照片',
    referencePlaceholder: '上传眼镜或配件照片',
    requireReference: true,
    helper: '默认使用眼镜试戴专用提示词，确保佩戴自然真实。',
    requiresPrompt: false,
    buildPrompt: () => undefined,
    buildMetadata: ({ promptSource }) => ({ promptSource })
  },
  'shoe-tryon': {
    mainLabel: '人物全身图',
    mainPlaceholder: '上传需要试鞋的模特照片',
    referenceLabel: '鞋靴商品图',
    referencePlaceholder: '上传鞋靴商品照片',
    requireReference: true,
    helper: '将使用默认鞋靴试穿提示词，可直接点击生成。',
    requiresPrompt: false,
    buildPrompt: () => undefined,
    buildMetadata: ({ promptSource }) => ({ promptSource })
  },
  'scene-change': {
    mainLabel: '商品 / 人物主图',
    mainPlaceholder: '上传需要替换场景的主图',
    requireReference: false,
    helper: '可自由输入提示词，或直接选择常用电商背景。若两者都提供，将优先结合。',
    requiresPrompt: true,
    buildPrompt: ({ prompt, scenePreset }) => {
      const manual = prompt?.trim()
      if (manual && scenePreset) {
        return `${manual}，背景环境为${scenePreset.prompt}`
      }
      if (manual) {
        return manual
      }
      if (scenePreset) {
        return `将主体置于${scenePreset.prompt}，保持商业光影、高清写实风格`
      }
      return ''
    },
    buildMetadata: ({ promptSource, scenePreset }) => ({
      promptSource,
      scenePreset: scenePreset?.value,
      scenePresetLabel: scenePreset?.label
    })
  },
  'color-change': {
    mainLabel: '商品 / 人物主图',
    mainPlaceholder: '上传需要换色的主图',
    requireReference: false,
    helper: '选择常用商品颜色或输入自定义描述。两者皆填时，将在生成指令中结合。',
    requiresPrompt: true,
    buildPrompt: ({ prompt, colorPreset }) => {
      const manual = prompt?.trim()
      const colorText = colorPreset?.prompt
      if (manual && colorText) {
        return `${manual}，目标颜色为${colorText}`
      }
      if (manual) {
        return manual
      }
      if (colorText) {
        return `将商品整体颜色调整为${colorText}，保留原有材质质感与高光细节`
      }
      return ''
    },
    buildMetadata: ({ promptSource, colorPreset }) => ({
      promptSource,
      colorPreset: colorPreset?.value,
      colorPresetLabel: colorPreset?.label
    })
  }
}

// 默认工作流
const DEFAULT_WORKFLOW = {
  mainLabel: '主图',
  mainPlaceholder: '上传主图',
  requireReference: false,
  requiresPrompt: false,
  buildPrompt: () => undefined,
  buildMetadata: ({ promptSource }) => ({ promptSource })
}

const WorkArea = () => {
  const { selectedTool, generateImage, isGenerating } = useTool() // 改为 useTool
  const { user, isAuthenticated } = useAuth()

  const [mainImage, setMainImage] = useState(null)
  const [referenceImage, setReferenceImage] = useState(null)
  const [scenePreset, setScenePreset] = useState(null)
  const [colorPreset, setColorPreset] = useState(null)
  const [customPrompt, setCustomPrompt] = useState('')

  const mainImageRef = useRef(null)
  const referenceImageRef = useRef(null)
  const mainInputRef = useRef(null)
  const referenceInputRef = useRef(null)

  const mainInputId = useMemo(() => `main-upload-${Math.random().toString(36).slice(2)}`, [])
  const referenceInputId = useMemo(() => `reference-upload-${Math.random().toString(36).slice(2)}`, [])

  const workflow = useMemo(() => {
    if (!selectedTool) {
      return DEFAULT_WORKFLOW
    }
    return TOOL_WORKFLOWS[selectedTool.id] || DEFAULT_WORKFLOW
  }, [selectedTool])

  useEffect(() => {
    cleanupPreview(mainImageRef.current)
    cleanupPreview(referenceImageRef.current)
    setMainImage(null)
    setReferenceImage(null)
    setScenePreset(null)
    setColorPreset(null)
    setCustomPrompt('')
    if (mainInputRef.current) {
      mainInputRef.current.value = ''
    }
    if (referenceInputRef.current) {
      referenceInputRef.current.value = ''
    }
  }, [selectedTool?.id])

  useEffect(() => {
    return () => {
      cleanupPreview(mainImageRef.current)
      cleanupPreview(referenceImageRef.current)
    }
  }, [])

  const handleFileChange = (event, type) => {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file) {
      return
    }

    if (!file.type.startsWith('image/')) {
      message.error('仅支持上传图片文件')
      return
    }

    if (file.size > MAX_FILE_SIZE) {
      message.error('图片大小不能超过 10MB')
      return
    }

    const preview = URL.createObjectURL(file)
    const payload = { file, preview, name: file.name }

    if (type === 'main') {
      cleanupPreview(mainImageRef.current)
      mainImageRef.current = payload
      setMainImage(payload)
    } else {
      cleanupPreview(referenceImageRef.current)
      referenceImageRef.current = payload
      setReferenceImage(payload)
    }
  }

  const handleClear = (type) => {
    if (type === 'main') {
      cleanupPreview(mainImageRef.current)
      mainImageRef.current = null
      setMainImage(null)
      if (mainInputRef.current) {
        mainInputRef.current.value = ''
      }
    } else {
      cleanupPreview(referenceImageRef.current)
      referenceImageRef.current = null
      setReferenceImage(null)
      if (referenceInputRef.current) {
        referenceInputRef.current.value = ''
      }
    }
  }

  const handleGenerate = async () => {
    if (!selectedTool) {
      message.error('请选择一个AI工具')
      return
    }

    if (!isAuthenticated) {
      message.warning('请先登录后再使用生成功能')
      return
    }

    if ((user?.credits ?? 0) < selectedTool.creditCost) {
      message.error('积分不足，请先充值或升级套餐')
      return
    }

    if (!mainImageRef.current?.file) {
      message.error(`请先上传${workflow.mainLabel}`)
      return
    }

    if (workflow.requireReference && !referenceImageRef.current?.file) {
      message.error(`请先上传${workflow.referenceLabel}`)
      return
    }

    const promptSource = determinePromptSource({
      workflow,
      customPrompt,
      scenePreset,
      colorPreset
    })

    const finalPrompt = workflow.buildPrompt({
      prompt: customPrompt,
      scenePreset,
      colorPreset
    })

    if (workflow.requiresPrompt && !finalPrompt) {
      message.error('请填写提示词或选择预设后再尝试生成')
      return
    }

    const metadata = workflow.buildMetadata({
      promptSource,
      scenePreset,
      colorPreset
    })

    try {
      await generateImage({
        mainImage: mainImageRef.current,
        referenceImage: workflow.requireReference ? referenceImageRef.current : undefined,
        prompt: finalPrompt,
        metadata,
        options: {
          resolution: '1080p',
          quantity: 1,
          mode: 'fast'
        }
      })
    } catch (error) {
      // 错误提示已在 generateImage 内部处理
    }
  }

  if (!selectedTool) {
    return (
      <div
        style={{
          width: 400,
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRight: '1px solid #f0f0f0',
          background: 'white'
        }}
      >
        <Text type="secondary">请选择一个AI工具开始使用</Text>
      </div>
    )
  }

  const showSceneControls = selectedTool.id === 'scene-change'
  const showColorControls = selectedTool.id === 'color-change'

  return (
    <div
      style={{
        width: 400,
        height: '100vh',
        borderRight: '1px solid #e9eff7',
        background: '#f6f8fb'
      }}
    >
      <Card
        bordered={false}
        style={{
          height: '100%',
          borderRadius: 0,
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
          background: 'rgba(255,255,255,0.9)',
          backdropFilter: 'blur(6px)'
        }}
      >
        <div>
          <Title level={4} style={{ marginBottom: 4, color: '#0f1e4d' }}>
            {selectedTool.name}
          </Title>
          {selectedTool.description && (
            <Text type="secondary" style={{ fontSize: 13 }}>
              {selectedTool.description}
            </Text>
          )}
        </div>

        <Space direction="vertical" size={24} style={{ flex: 1, overflowY: 'auto' }}>
          <section>
            <Title level={5} style={{ marginBottom: 12 }}>
              图片上传
            </Title>
            <Space direction="vertical" size={18} style={{ width: '100%' }}>
              <UploadSlot
                label={workflow.mainLabel}
                placeholder={workflow.mainPlaceholder}
                image={mainImage}
                inputId={mainInputId}
                inputRef={mainInputRef}
                onFileChange={(event) => handleFileChange(event, 'main')}
                onClear={() => handleClear('main')}
              />

              {workflow.requireReference && (
                <UploadSlot
                  label={workflow.referenceLabel}
                  placeholder={workflow.referencePlaceholder}
                  image={referenceImage}
                  inputId={referenceInputId}
                  inputRef={referenceInputRef}
                  onFileChange={(event) => handleFileChange(event, 'reference')}
                  onClear={() => handleClear('reference')}
                />
              )}
            </Space>
          </section>

          {workflow.helper && (
            <Alert
              type="info"
              showIcon
              message="提示"
              description={workflow.helper}
            />
          )}

          {showSceneControls && (
            <section>
              <Title level={5} style={{ marginBottom: 12 }}>
                场景设定
              </Title>
              <Space direction="vertical" size={12} style={{ width: '100%' }}>
                <Select
                  allowClear
                  placeholder="选择常用电商背景"
                  options={SCENE_PRESETS}
                  value={scenePreset?.value}
                  onChange={(value) => {
                    const preset = SCENE_PRESETS.find((item) => item.value === value)
                    setScenePreset(preset || null)
                  }}
                />
                <TextArea
                  rows={4}
                  placeholder="可选：输入自定义提示词，描述目标场景与氛围"
                  value={customPrompt}
                  onChange={(event) => setCustomPrompt(event.target.value)}
                  allowClear
                />
              </Space>
            </section>
          )}

          {showColorControls && (
            <section>
              <Title level={5} style={{ marginBottom: 12 }}>
                颜色设定
              </Title>
              <Space direction="vertical" size={12} style={{ width: '100%' }}>
                <Select
                  allowClear
                  placeholder="选择常用电商商品颜色"
                  options={COLOR_PRESETS}
                  value={colorPreset?.value}
                  onChange={(value) => {
                    const preset = COLOR_PRESETS.find((item) => item.value === value)
                    setColorPreset(preset || null)
                  }}
                />
                <TextArea
                  rows={4}
                  placeholder="可选：输入自定义提示词，描述换色要求与细节"
                  value={customPrompt}
                  onChange={(event) => setCustomPrompt(event.target.value)}
                  allowClear
                />
              </Space>
            </section>
          )}

          {!showSceneControls && !showColorControls && workflow.requiresPrompt && (
            <section>
              <Title level={5} style={{ marginBottom: 12 }}>
                自定义提示词
              </Title>
              <TextArea
                rows={4}
                placeholder="输入生成描述"
                value={customPrompt}
                onChange={(event) => setCustomPrompt(event.target.value)}
                allowClear
              />
            </section>
          )}
        </Space>

        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Button
            type="primary"
            size="large"
            block
            icon={isGenerating ? null : <PlusOutlined />}
            loading={isGenerating}
            onClick={handleGenerate}
            style={{
              height: 48,
              fontSize: 16,
              background: 'linear-gradient(130deg, #3366ff 0%, #5f7bff 50%, #8c9dff 100%)',
              border: 'none'
            }}
          >
            {isGenerating ? '生成中…' : `开始生成 (${selectedTool.creditCost} 积分)`}
          </Button>

          {!isAuthenticated && (
            <Alert
              type="warning"
              showIcon
              message="登录后可保存生成记录"
            />
          )}
        </div>
      </Card>
    </div>
  )
}

const UploadSlot = ({
  label,
  placeholder,
  image,
  inputId,
  inputRef,
  onFileChange,
  onClear
}) => {
  return (
    <div>
      <Paragraph style={{ marginBottom: 8, color: '#0f1e4d', fontWeight: 500 }}>
        {label}
      </Paragraph>
      <label
        htmlFor={inputId}
        style={{
          display: 'block',
          width: '100%',
          height: 220,
          border: '1px dashed #c5d1f5',
          borderRadius: 16,
          cursor: 'pointer',
          background: image ? '#ffffff' : 'rgba(249, 251, 255, 0.8)',
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        {image ? (
          <img
            src={image.preview}
            alt="预览"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <Space
            direction="vertical"
            align="center"
            style={{
              width: '100%',
              height: '100%',
              justifyContent: 'center'
            }}
          >
            <PlusOutlined style={{ fontSize: 24, color: '#3a5df5' }} />
            <Text style={{ color: '#3a5df5', fontWeight: 500 }}>{placeholder}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              支持 JPG / PNG / WEBP，最大 10MB
            </Text>
          </Space>
        )}
      </label>
      <input
        id={inputId}
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={onFileChange}
      />
      {image && (
        <Button
          type="text"
          icon={<DeleteOutlined />}
          onClick={onClear}
          style={{ marginTop: 8, padding: 0 }}
        >
          移除图片
        </Button>
      )}
    </div>
  )
}

const cleanupPreview = (image) => {
  if (image?.preview) {
    URL.revokeObjectURL(image.preview)
  }
}

const determinePromptSource = ({ workflow, customPrompt, scenePreset, colorPreset }) => {
  if (customPrompt.trim()) {
    return 'manual'
  }

  if (workflow.requireReference) {
    return 'builtin'
  }

  if (scenePreset || colorPreset) {
    return 'preset'
  }

  return workflow.requiresPrompt ? 'manual' : 'builtin'
}

export default WorkArea