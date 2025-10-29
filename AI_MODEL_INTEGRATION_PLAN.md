# AI模特生成功能集成方案

## 📋 概述

本文档详细规划如何将nanobanana生图接口集成到脑洞AI平台中，实现9个专业的AI模特生成功能。

## 🎯 功能列表

### 1. AI模特生成
- **功能描述**: 上传服装图，生成真实模特展示效果
- **输入**: 服装图片 + 模特参考图（可选）
- **输出**: 穿着该服装的模特图片
- **技术实现**: 使用nanobanana的图像合成能力
- **提示词模板**: "Professional model wearing {clothing_description}, studio lighting, fashion photography, high quality"

### 2. 同版型试衣
- **功能描述**: 让模特自动试穿相似版型的服装
- **输入**: 原始模特图 + 新服装图
- **输出**: 模特穿着新服装的图片
- **技术实现**: 图像替换 + 风格迁移
- **提示词模板**: "Model trying on {new_clothing}, same pose and lighting as reference image, realistic fit"

### 3. 配件试戴
- **功能描述**: 生成眼镜、帽饰等配件试戴效果图
- **输入**: 人物头像 + 配件图片
- **输出**: 佩戴配件的效果图
- **技术实现**: 精确的面部识别 + 配件合成
- **提示词模板**: "Person wearing {accessory_type}, natural lighting, realistic placement, high detail"

### 4. 姿态变换
- **功能描述**: 智能调整模特姿态，匹配不同商品角度
- **输入**: 原始模特图 + 目标姿态描述
- **输出**: 新姿态的模特图
- **技术实现**: 姿态估计 + 图像生成
- **提示词模板**: "Model in {pose_description}, maintaining clothing and appearance, professional photography"

### 5. 模特视频生成
- **功能描述**: 将静态图片转换为动态走秀视频
- **输入**: 模特静态图
- **输出**: 短视频（需要特殊处理）
- **技术实现**: 序列图像生成 + 视频合成
- **提示词模板**: "Fashion model walking sequence, smooth movement, professional runway"

### 6. 鞋靴试穿
- **功能描述**: 自动合成鞋靴穿着效果图
- **输入**: 脚部图片 + 鞋靴图片
- **输出**: 穿着效果图
- **技术实现**: 脚部识别 + 鞋靴合成
- **提示词模板**: "Feet wearing {shoe_type}, realistic fit and lighting, detailed texture"

### 7. 场景更换
- **功能描述**: 快速替换电商宣传背景，增强氛围感
- **输入**: 产品图 + 场景描述
- **输出**: 新场景下的产品图
- **技术实现**: 背景替换 + 环境光照调整
- **提示词模板**: "Product in {scene_description}, professional lighting, commercial photography"

### 8. 商品换色
- **功能描述**: 智能更换商品颜色，保持材质纹理
- **输入**: 原始商品图 + 目标颜色
- **输出**: 换色后的商品图
- **技术实现**: 颜色迁移 + 纹理保持
- **提示词模板**: "Product in {target_color}, maintaining original texture and lighting, high quality"

### 9. 抠图去底
- **功能描述**: 智能抠图，生成透明背景的商品图
- **输入**: 原始商品图
- **输出**: 透明背景的PNG图片
- **技术实现**: 语义分割 + 边缘优化
- **提示词模板**: "Clean product cutout, transparent background, sharp edges, professional quality"

## 🏗️ 技术架构

### 统一接口设计

```javascript
// AI功能统一调用接口
const aiGenerateService = {
  async generateImage(toolId, params) {
    const config = getToolConfig(toolId);
    const prompt = buildPrompt(toolId, params);
    
    return await nanobananaAPI.generate({
      prompt,
      model: config.preferredModel,
      images: params.referenceImages,
      ...config.defaultParams
    });
  }
};
```

### 工具配置映射

```javascript
const toolConfigs = {
  'ai-model': {
    preferredModel: 'nanobanana',
    requiresReference: true,
    maxImages: 2,
    promptTemplate: 'Professional model wearing {clothing_description}...'
  },
  'try-on-clothes': {
    preferredModel: 'nanobanana', 
    requiresReference: true,
    maxImages: 2,
    promptTemplate: 'Model trying on {new_clothing}...'
  },
  // ... 其他工具配置
};
```

## 🎨 UI组件设计

### 统一工作区组件

```jsx
const AIToolWorkspace = ({ toolId }) => {
  return (
    <div className="ai-tool-workspace">
      {/* 图片上传区域 */}
      <div className="upload-section">
        <ImageUpload 
          label="主图片" 
          accept="image/*"
          onChange={handleMainImageUpload}
        />
        <ImageUpload 
          label="参考图片" 
          accept="image/*"
          optional
          onChange={handleReferenceImageUpload}
        />
      </div>
      
      {/* 选项配置区域 */}
      <div className="options-section">
        <ToolOption1 toolId={toolId} />
        <ToolOption2 toolId={toolId} />
        <ToolOption3 toolId={toolId} />
      </div>
      
      {/* 提示词输入 */}
      <div className="prompt-section">
        <TextArea 
          placeholder="输入详细描述..."
          value={prompt}
          onChange={setPrompt}
        />
      </div>
      
      {/* 生成按钮 */}
      <Button 
        type="primary" 
        onClick={handleGenerate}
        loading={generating}
      >
        开始生成
      </Button>
    </div>
  );
};
```

### 动态选项组件

每个工具的3个选项窗口根据工具类型动态显示：

```javascript
const toolOptions = {
  'ai-model': [
    { type: 'select', label: '模特类型', options: ['男性', '女性', '儿童'] },
    { type: 'select', label: '拍摄角度', options: ['正面', '侧面', '背面'] },
    { type: 'slider', label: '生成质量', min: 1, max: 10 }
  ],
  'color-change': [
    { type: 'colorPicker', label: '目标颜色' },
    { type: 'select', label: '材质保持', options: ['保持', '增强', '柔化'] },
    { type: 'slider', label: '颜色强度', min: 0.1, max: 1.0 }
  ],
  // ... 其他工具选项
};
```

## 🔌 nanobanana接口集成

### 服务层封装

```javascript
// services/aiModelService.js
class AIModelService {
  constructor() {
    this.nanobananaBaseUrl = process.env.NANOBANANA_API_URL || 'http://localhost:3001';
  }
  
  async generateWithTool(toolId, params) {
    const config = toolConfigs[toolId];
    if (!config) throw new Error(`Unknown tool: ${toolId}`);
    
    const prompt = this.buildPrompt(config.promptTemplate, params);
    
    const response = await fetch(`${this.nanobananaBaseUrl}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        model: config.preferredModel,
        images: params.images,
        ...config.defaultParams
      })
    });
    
    return await response.json();
  }
  
  buildPrompt(template, params) {
    return template.replace(/\{(\w+)\}/g, (match, key) => {
      return params[key] || match;
    });
  }
}
```

### 后端路由扩展

```javascript
// routes/aiGeneration.js
router.post('/generate/:toolId', authenticateToken, async (req, res) => {
  try {
    const { toolId } = req.params;
    const { images, options, prompt } = req.body;
    
    // 验证用户积分
    const tool = await AiTool.findOne({ id: toolId });
    if (req.user.credits < tool.creditCost) {
      return res.status(400).json({ error: '积分不足' });
    }
    
    // 调用AI生成服务
    const result = await aiModelService.generateWithTool(toolId, {
      images,
      options,
      prompt,
      userId: req.user.id
    });
    
    // 扣除积分
    await User.findByIdAndUpdate(req.user.id, {
      $inc: { credits: -tool.creditCost }
    });
    
    // 记录生成历史
    await GenerationHistory.create({
      userId: req.user.id,
      toolId,
      params: { images, options, prompt },
      result,
      creditCost: tool.creditCost
    });
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

## 📱 管理后台功能

### 工具管理界面

```jsx
const AIToolManagement = () => {
  const [tools, setTools] = useState([]);
  
  const toggleToolStatus = async (toolId, enabled) => {
    await fetch(`/api/admin/ai-tools/${toolId}/toggle`, {
      method: 'POST',
      body: JSON.stringify({ enabled })
    });
    // 更新本地状态
  };
  
  return (
    <Table 
      dataSource={tools}
      columns={[
        { title: '工具名称', dataIndex: 'name' },
        { title: '类别', dataIndex: 'category' },
        { title: '积分消耗', dataIndex: 'creditCost' },
        { 
          title: '状态', 
          render: (_, record) => (
            <Switch 
              checked={record.enabled}
              onChange={(checked) => toggleToolStatus(record.id, checked)}
            />
          )
        }
      ]}
    />
  );
};
```

## 🚀 实施步骤

1. **Phase 1**: 创建统一UI组件和基础架构
2. **Phase 2**: 集成nanobanana接口，实现核心生成功能
3. **Phase 3**: 完善各工具的专业化配置和提示词
4. **Phase 4**: 添加管理后台的工具管理功能
5. **Phase 5**: 优化用户体验和性能

## 📊 预期效果

- **统一体验**: 所有AI工具使用相同的UI模式
- **灵活配置**: 管理员可以随时开关和配置工具
- **专业效果**: 针对每个功能优化的提示词和参数
- **可扩展性**: 易于添加新的AI工具和功能

## 🔧 技术要点

1. **提示词工程**: 为每个功能设计专业的提示词模板
2. **图像预处理**: 上传图片的格式转换和尺寸优化
3. **结果后处理**: 生成结果的质量检查和格式统一
4. **缓存策略**: 相同参数的结果缓存，提升响应速度
5. **错误处理**: 完善的错误提示和重试机制