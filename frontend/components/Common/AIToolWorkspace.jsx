import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Upload, 
  Button, 
  Input, 
  Select, 
  Slider, 
  ColorPicker, 
  Switch,
  Space,
  Divider,
  message,
  Spin
} from 'antd';
import { 
  PlusOutlined, 
  DeleteOutlined, 
  PlayCircleOutlined,
  DownloadOutlined 
} from '@ant-design/icons';
import './AIToolWorkspace.css';

const { TextArea } = Input;
const { Option } = Select;

// AI工具配置
const toolConfigs = {
  'ai-model': {
    name: 'AI模特生成',
    description: '上传服装图，生成真实模特展示效果',
    mainImageLabel: '服装图片',
    referenceImageLabel: '模特参考图',
    options: [
      { 
        key: 'modelType', 
        type: 'select', 
        label: '模特类型', 
        options: [
          { label: '女性模特', value: 'female' },
          { label: '男性模特', value: 'male' },
          { label: '儿童模特', value: 'child' }
        ],
        default: 'female'
      },
      { 
        key: 'angle', 
        type: 'select', 
        label: '拍摄角度', 
        options: [
          { label: '正面', value: 'front' },
          { label: '侧面', value: 'side' },
          { label: '背面', value: 'back' },
          { label: '3/4角度', value: 'three-quarter' }
        ],
        default: 'front'
      },
      { 
        key: 'quality', 
        type: 'slider', 
        label: '生成质量', 
        min: 1, 
        max: 10, 
        default: 8,
        marks: { 1: '快速', 5: '标准', 10: '精细' }
      }
    ],
    promptPlaceholder: '描述服装风格、材质、颜色等细节...',
    creditCost: 15
  },
  'try-on-clothes': {
    name: '同版型试衣',
    description: '让模特自动试穿相似版型的服装',
    mainImageLabel: '原始模特图',
    referenceImageLabel: '新服装图',
    options: [
      { 
        key: 'fitType', 
        type: 'select', 
        label: '合身程度', 
        options: [
          { label: '紧身', value: 'tight' },
          { label: '合身', value: 'fitted' },
          { label: '宽松', value: 'loose' }
        ],
        default: 'fitted'
      },
      { 
        key: 'preservePose', 
        type: 'switch', 
        label: '保持原姿态', 
        default: true
      },
      { 
        key: 'blendStrength', 
        type: 'slider', 
        label: '融合强度', 
        min: 0.1, 
        max: 1.0, 
        step: 0.1,
        default: 0.7,
        marks: { 0.1: '自然', 0.5: '平衡', 1.0: '强烈' }
      }
    ],
    promptPlaceholder: '描述试穿效果要求...',
    creditCost: 12
  },
  'glasses-tryon': {
    name: '配件试戴',
    description: '生成眼镜、帽饰等配件试戴效果图',
    mainImageLabel: '人物头像',
    referenceImageLabel: '配件图片',
    options: [
      { 
        key: 'accessoryType', 
        type: 'select', 
        label: '配件类型', 
        options: [
          { label: '眼镜', value: 'glasses' },
          { label: '帽子', value: 'hat' },
          { label: '耳环', value: 'earrings' },
          { label: '项链', value: 'necklace' }
        ],
        default: 'glasses'
      },
      { 
        key: 'placement', 
        type: 'select', 
        label: '佩戴位置', 
        options: [
          { label: '自动识别', value: 'auto' },
          { label: '精确定位', value: 'precise' }
        ],
        default: 'auto'
      },
      { 
        key: 'lightingMatch', 
        type: 'slider', 
        label: '光照匹配', 
        min: 0, 
        max: 100, 
        default: 80,
        marks: { 0: '原始', 50: '适中', 100: '完全匹配' }
      }
    ],
    promptPlaceholder: '描述配件材质、颜色、风格...',
    creditCost: 10
  },
  'pose-variation': {
    name: '姿态变换',
    description: '智能调整模特姿态，匹配不同商品角度',
    mainImageLabel: '原始模特图',
    referenceImageLabel: '姿态参考图',
    options: [
      { 
        key: 'poseType', 
        type: 'select', 
        label: '目标姿态', 
        options: [
          { label: '站立', value: 'standing' },
          { label: '坐姿', value: 'sitting' },
          { label: '走路', value: 'walking' },
          { label: '自定义', value: 'custom' }
        ],
        default: 'standing'
      },
      { 
        key: 'smoothness', 
        type: 'slider', 
        label: '变换平滑度', 
        min: 1, 
        max: 10, 
        default: 7,
        marks: { 1: '快速', 5: '自然', 10: '精细' }
      },
      { 
        key: 'keepClothing', 
        type: 'switch', 
        label: '保持服装细节', 
        default: true
      }
    ],
    promptPlaceholder: '描述目标姿态和动作要求...',
    creditCost: 9
  },
  'model-video': {
    name: '模特视频生成',
    description: '将静态图片转换为动态走秀视频',
    mainImageLabel: '模特静态图',
    referenceImageLabel: '动作参考图',
    options: [
      { 
        key: 'videoLength', 
        type: 'select', 
        label: '视频时长', 
        options: [
          { label: '3秒', value: '3s' },
          { label: '5秒', value: '5s' },
          { label: '10秒', value: '10s' }
        ],
        default: '5s'
      },
      { 
        key: 'motionType', 
        type: 'select', 
        label: '动作类型', 
        options: [
          { label: '走秀', value: 'runway' },
          { label: '转身', value: 'turn' },
          { label: '展示', value: 'showcase' }
        ],
        default: 'runway'
      },
      { 
        key: 'frameRate', 
        type: 'slider', 
        label: '帧率', 
        min: 15, 
        max: 60, 
        default: 30,
        marks: { 15: '流畅', 30: '标准', 60: '高清' }
      }
    ],
    promptPlaceholder: '描述视频风格和动作要求...',
    creditCost: 25
  },
  'shoe-tryon': {
    name: '鞋靴试穿',
    description: '自动合成鞋靴穿着效果图',
    mainImageLabel: '脚部图片',
    referenceImageLabel: '鞋靴图片',
    options: [
      { 
        key: 'shoeType', 
        type: 'select', 
        label: '鞋靴类型', 
        options: [
          { label: '运动鞋', value: 'sneakers' },
          { label: '高跟鞋', value: 'heels' },
          { label: '靴子', value: 'boots' },
          { label: '凉鞋', value: 'sandals' }
        ],
        default: 'sneakers'
      },
      { 
        key: 'fitAccuracy', 
        type: 'slider', 
        label: '贴合精度', 
        min: 1, 
        max: 10, 
        default: 8,
        marks: { 1: '快速', 5: '标准', 10: '精确' }
      },
      { 
        key: 'shadowEffect', 
        type: 'switch', 
        label: '添加阴影效果', 
        default: true
      }
    ],
    promptPlaceholder: '描述鞋靴材质、颜色、风格...',
    creditCost: 11
  },
  'scene-change': {
    name: '场景更换',
    description: '快速替换电商宣传背景，增强氛围感',
    mainImageLabel: '产品图片',
    referenceImageLabel: '场景参考图',
    options: [
      { 
        key: 'sceneType', 
        type: 'select', 
        label: '场景类型', 
        options: [
          { label: '室内', value: 'indoor' },
          { label: '户外', value: 'outdoor' },
          { label: '工作室', value: 'studio' },
          { label: '自然环境', value: 'nature' }
        ],
        default: 'studio'
      },
      { 
        key: 'lightingStyle', 
        type: 'select', 
        label: '光照风格', 
        options: [
          { label: '自然光', value: 'natural' },
          { label: '专业摄影', value: 'professional' },
          { label: '温暖色调', value: 'warm' },
          { label: '冷色调', value: 'cool' }
        ],
        default: 'professional'
      },
      { 
        key: 'blendIntensity', 
        type: 'slider', 
        label: '融合强度', 
        min: 0.1, 
        max: 1.0, 
        step: 0.1,
        default: 0.8,
        marks: { 0.1: '轻微', 0.5: '适中', 1.0: '完全' }
      }
    ],
    promptPlaceholder: '描述目标场景的氛围和风格...',
    creditCost: 10
  },
  'color-change': {
    name: '商品换色',
    description: '智能更换商品颜色，保持材质纹理',
    mainImageLabel: '原始商品图',
    referenceImageLabel: '颜色参考图',
    options: [
      { 
        key: 'targetColor', 
        type: 'color', 
        label: '目标颜色', 
        default: '#FF6B6B'
      },
      { 
        key: 'preserveTexture', 
        type: 'switch', 
        label: '保持材质纹理', 
        default: true
      },
      { 
        key: 'colorIntensity', 
        type: 'slider', 
        label: '颜色强度', 
        min: 0.1, 
        max: 1.0, 
        step: 0.1,
        default: 0.8,
        marks: { 0.1: '淡雅', 0.5: '自然', 1.0: '鲜艳' }
      }
    ],
    promptPlaceholder: '描述换色要求和材质保持...',
    creditCost: 8
  },
  'background-remove': {
    name: '抠图去底',
    description: '智能抠图，生成透明背景的商品图',
    mainImageLabel: '原始图片',
    referenceImageLabel: '边缘参考图',
    options: [
      { 
        key: 'edgeSmooth', 
        type: 'slider', 
        label: '边缘平滑度', 
        min: 1, 
        max: 10, 
        default: 7,
        marks: { 1: '锐利', 5: '自然', 10: '柔和' }
      },
      { 
        key: 'precision', 
        type: 'select', 
        label: '抠图精度', 
        options: [
          { label: '快速', value: 'fast' },
          { label: '标准', value: 'standard' },
          { label: '精细', value: 'precise' }
        ],
        default: 'standard'
      },
      { 
        key: 'outputFormat', 
        type: 'select', 
        label: '输出格式', 
        options: [
          { label: 'PNG透明', value: 'png' },
          { label: 'JPG白底', value: 'jpg-white' },
          { label: 'JPG黑底', value: 'jpg-black' }
        ],
        default: 'png'
      }
    ],
    promptPlaceholder: '描述抠图要求和细节处理...',
    creditCost: 6
  }
};

const AIToolWorkspace = ({ toolId, onGenerate, generating = false }) => {
  const [mainImage, setMainImage] = useState(null);
  const [referenceImage, setReferenceImage] = useState(null);
  const [options, setOptions] = useState({});
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState(null);

  const config = toolConfigs[toolId];

  useEffect(() => {
    // 初始化选项默认值
    const defaultOptions = {};
    config?.options.forEach(option => {
      defaultOptions[option.key] = option.default;
    });
    setOptions(defaultOptions);
    setPrompt('');
    setMainImage(null);
    setReferenceImage(null);
    setResult(null);
  }, [toolId]);

  const handleImageUpload = (type) => (info) => {
    if (info.file.status === 'done' || info.file.originFileObj) {
      const file = info.file.originFileObj || info.file;
      const reader = new FileReader();
      reader.onload = (e) => {
        if (type === 'main') {
          setMainImage({
            file,
            url: e.target.result,
            name: file.name
          });
        } else {
          setReferenceImage({
            file,
            url: e.target.result,
            name: file.name
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOptionChange = (key, value) => {
    setOptions(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleGenerate = async () => {
    if (!mainImage) {
      message.error('请上传主图片');
      return;
    }

    const params = {
      toolId,
      mainImage,
      referenceImage,
      options,
      prompt
    };

    try {
      const result = await onGenerate(params);
      setResult(result);
      message.success('生成成功！');
    } catch (error) {
      message.error('生成失败：' + error.message);
    }
  };

  const renderOption = (option) => {
    const value = options[option.key];

    switch (option.type) {
      case 'select':
        return (
          <Select
            value={value}
            onChange={(val) => handleOptionChange(option.key, val)}
            style={{ width: '100%' }}
          >
            {option.options.map(opt => (
              <Option key={opt.value} value={opt.value}>
                {opt.label}
              </Option>
            ))}
          </Select>
        );

      case 'slider':
        return (
          <Slider
            min={option.min}
            max={option.max}
            step={option.step || 1}
            value={value}
            onChange={(val) => handleOptionChange(option.key, val)}
            marks={option.marks}
          />
        );

      case 'switch':
        return (
          <Switch
            checked={value}
            onChange={(val) => handleOptionChange(option.key, val)}
          />
        );

      case 'color':
        return (
          <ColorPicker
            value={value}
            onChange={(color) => handleOptionChange(option.key, color.toHexString())}
          />
        );

      default:
        return null;
    }
  };

  if (!config) {
    return <div>工具配置未找到</div>;
  }

  return (
    <div className="ai-tool-workspace">
      <Card title={config.name} className="workspace-card">
        <p className="tool-description">{config.description}</p>
        
        {/* 图片上传区域 */}
        <div className="upload-section">
          <div className="upload-item">
            <h4>{config.mainImageLabel}</h4>
            <Upload
              listType="picture-card"
              showUploadList={false}
              beforeUpload={() => false}
              onChange={handleImageUpload('main')}
              accept="image/*"
            >
              {mainImage ? (
                <img src={mainImage.url} alt="main" style={{ width: '100%' }} />
              ) : (
                <div>
                  <PlusOutlined />
                  <div style={{ marginTop: 8 }}>上传图片</div>
                </div>
              )}
            </Upload>
            {mainImage && (
              <Button 
                size="small" 
                icon={<DeleteOutlined />} 
                onClick={() => setMainImage(null)}
                style={{ marginTop: 8 }}
              >
                删除
              </Button>
            )}
          </div>

          <div className="upload-item">
            <h4>{config.referenceImageLabel} <span className="optional">(可选)</span></h4>
            <Upload
              listType="picture-card"
              showUploadList={false}
              beforeUpload={() => false}
              onChange={handleImageUpload('reference')}
              accept="image/*"
            >
              {referenceImage ? (
                <img src={referenceImage.url} alt="reference" style={{ width: '100%' }} />
              ) : (
                <div>
                  <PlusOutlined />
                  <div style={{ marginTop: 8 }}>上传图片</div>
                </div>
              )}
            </Upload>
            {referenceImage && (
              <Button 
                size="small" 
                icon={<DeleteOutlined />} 
                onClick={() => setReferenceImage(null)}
                style={{ marginTop: 8 }}
              >
                删除
              </Button>
            )}
          </div>
        </div>

        <Divider />

        {/* 选项配置区域 */}
        <div className="options-section">
          <h4>参数配置</h4>
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            {config.options.map(option => (
              <div key={option.key} className="option-item">
                <label className="option-label">{option.label}</label>
                {renderOption(option)}
              </div>
            ))}
          </Space>
        </div>

        <Divider />

        {/* 提示词输入 */}
        <div className="prompt-section">
          <h4>详细描述</h4>
          <TextArea
            rows={4}
            placeholder={config.promptPlaceholder}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
        </div>

        <Divider />

        {/* 生成按钮 */}
        <div className="generate-section">
          <Button
            type="primary"
            size="large"
            icon={<PlayCircleOutlined />}
            onClick={handleGenerate}
            loading={generating}
            disabled={!mainImage}
            block
          >
            开始生成 (消耗 {config.creditCost} 积分)
          </Button>
        </div>

        {/* 结果展示 */}
        {result && (
          <>
            <Divider />
            <div className="result-section">
              <h4>生成结果</h4>
              <div className="result-image">
                <img src={result.imageUrl || result.content} alt="Generated" />
                <div className="result-actions">
                  <Button 
                    icon={<DownloadOutlined />}
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = result.imageUrl || result.content;
                      link.download = `${config.name}_${Date.now()}.png`;
                      link.click();
                    }}
                  >
                    下载
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
};

export default AIToolWorkspace;