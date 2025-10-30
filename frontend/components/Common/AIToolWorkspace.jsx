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
  Spin,
  Radio
} from 'antd';
import { 
  PlusOutlined, 
  DeleteOutlined, 
  PlayCircleOutlined,
  DownloadOutlined 
} from '@ant-design/icons';
import { useTool } from '../../contexts/ToolContext'; // 引入ToolContext
import './AIToolWorkspace.css';

const { TextArea } = Input;
const { Option } = Select;

// 移除原来的toolConfigs，使用ToolContext中的统一配置

const AIToolWorkspace = ({ toolId, onGenerate, generating = false }) => {
  const { tools, commonOptions } = useTool(); // 使用ToolContext
  const [mainImage, setMainImage] = useState(null);
  const [referenceImage, setReferenceImage] = useState(null);
  const [options, setOptions] = useState({
    resolution: commonOptions.resolution.default,
    quantity: commonOptions.quantity.default,
    mode: commonOptions.mode.default
  });
  const [prompt, setPrompt] = useState('');
  const [results, setResults] = useState([]);

  // 获取当前工具配置
  const config = tools.find(tool => tool.id === toolId) || tools[0];

  useEffect(() => {
    // 初始化选项默认值为统一配置
    setOptions({
      resolution: commonOptions.resolution.default,
      quantity: commonOptions.quantity.default,
      mode: commonOptions.mode.default
    });
    setPrompt('');
    setMainImage(null);
    setReferenceImage(null);
    setResults([]);
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
      const generationResult = await onGenerate(params);
      if (generationResult?.images?.length) {
        const normalizedImages = generationResult.images.map((image, index) => ({
          ...image,
          _localId: `${generationResult.generationId || Date.now()}-${image.index ?? index}-${Date.now()}`
        }));
        setResults((prev) => [...prev, ...normalizedImages]);
      }
      message.success('生成成功！');
      return generationResult;
    } catch (error) {
      message.error('生成失败：' + error.message);
      throw error;
    }
  };

  const renderOption = (optionKey) => {
    const option = commonOptions[optionKey];
    const value = options[optionKey];

    switch (option.type) {
      case 'select':
        return (
          <Select
            value={value}
            onChange={(val) => handleOptionChange(optionKey, val)}
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
            onChange={(val) => handleOptionChange(optionKey, val)}
            marks={option.marks}
          />
        );

      case 'radio':
        return (
          <Radio.Group
            value={value}
            onChange={(e) => handleOptionChange(optionKey, e.target.value)}
          >
            <Space direction="vertical">
              {option.options.map(opt => (
                <Radio key={opt.value} value={opt.value}>
                  {opt.label}
                </Radio>
              ))}
            </Space>
          </Radio.Group>
        );

      default:
        return null;
    }
  };

  // 如果没有找到工具配置，显示默认信息
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
            <h4>主图片</h4>
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
            <h4>参考图片 <span className="optional">(可选)</span></h4>
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

        {/* 统一的选项配置区域 */}
        <div className="options-section">
          <h4>参数配置</h4>
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            {/* 分辨率选项 */}
            <div className="option-item">
              <label className="option-label">{commonOptions.resolution.label}</label>
              {renderOption('resolution')}
            </div>
            
            {/* 生成数量选项 */}
            <div className="option-item">
              <label className="option-label">{commonOptions.quantity.label}</label>
              {renderOption('quantity')}
            </div>
            
            {/* 生成模式选项 */}
            <div className="option-item">
              <label className="option-label">{commonOptions.mode.label}</label>
              {renderOption('mode')}
            </div>
          </Space>
        </div>

        <Divider />

        {/* 提示词输入 */}
        <div className="prompt-section">
          <h4>详细描述</h4>
          <TextArea
            rows={4}
            placeholder="请输入详细的生成要求..."
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
        {results.length > 0 && (
          <>
            <Divider />
            <div className="result-section">
              <h4>生成结果</h4>
              <div className="result-gallery">
                {results.map((image) => {
                  const displaySrc = image.public_url || image.data_url || image.imageUrl || image.content;
                  return (
                    <div className="result-image" key={image._localId}>
                      <img src={displaySrc} alt="Generated" />
                      <div className="result-actions">
                        <Button 
                          icon={<DownloadOutlined />}
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = displaySrc;
                            link.download = `${config.name}_${Date.now()}.png`;
                            link.click();
                          }}
                        >
                          下载
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
};

export default AIToolWorkspace;
