# NanoBanana API 接口契约文档

## 概述

NanoBanana API 是一个AI图片生成服务，支持多种模型（OpenRouter的Nano Banana模型和ModelScope的各种图像生成模型）。本文档定义了所有API接口的契约规范。

## 基础信息

- **基础URL**: `http://localhost:3001`
- **内容类型**: `application/json`
- **认证方式**: 环境变量配置API密钥

## API 接口列表

### 1. 健康检查接口

**接口路径**: `GET /health`

**描述**: 检查服务器运行状态

**请求参数**: 无

**响应格式**:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**状态码**: 
- `200`: 服务正常运行

---

### 2. OpenRouter API密钥状态检查

**接口路径**: `GET /api/key-status`

**描述**: 检查OpenRouter API密钥是否有效

**请求参数**: 无

**响应格式**:
```json
{
  "valid": true
}
```

或

```json
{
  "valid": false,
  "error": "API key not configured"
}
```

**状态码**: 
- `200`: 检查完成（无论密钥是否有效）

---

### 3. ModelScope API密钥状态检查

**接口路径**: `GET /api/modelscope-key-status`

**描述**: 检查ModelScope API密钥是否有效

**请求参数**: 无

**响应格式**:
```json
{
  "valid": true
}
```

或

```json
{
  "valid": false,
  "error": "ModelScope API key not configured"
}
```

**状态码**: 
- `200`: 检查完成（无论密钥是否有效）

---

### 4. 图片生成接口

**接口路径**: `POST /generate`

**描述**: 生成AI图片的主要接口，支持多种模型

#### 请求参数

**Content-Type**: `application/json`

**请求体结构**:
```json
{
  "prompt": "string (必填)",
  "model": "string (可选，默认: 'nanobanana')",
  "images": ["string"] (可选，图片URL数组，仅nanobanana模型支持),
  "negative_prompt": "string (可选，负面提示词)",
  "size": "string (可选，默认: '1024x1024')",
  "n": "number (可选，生成图片数量，默认: 1)",
  "timeout": "number (可选，超时时间秒数，默认: 120)"
}
```

**参数说明**:
- `prompt`: 图片生成的提示词（必填）
- `model`: 使用的模型名称
  - `'nanobanana'`: 使用OpenRouter的Nano Banana模型
  - 其他值: 使用ModelScope对应的模型
- `images`: 参考图片URL数组（仅nanobanana模型支持）
- `negative_prompt`: 负面提示词（ModelScope模型支持）
- `size`: 图片尺寸（ModelScope模型支持）
- `n`: 生成图片数量（ModelScope模型支持）
- `timeout`: 超时时间，单位秒

#### 响应格式

**成功响应 (nanobanana模型)**:
```json
{
  "type": "image",
  "content": "data:image/jpeg;base64,..." 或 "https://..."
}
```

**成功响应 (ModelScope模型)**:
```json
{
  "imageUrl": "https://..."
}
```

**错误响应**:
```json
{
  "error": "错误描述",
  "statusCode": 400
}
```

#### 状态码
- `200`: 生成成功
- `400`: 请求参数错误
- `500`: 服务器内部错误或API密钥未配置

#### 错误情况
- 缺少必填参数 `prompt`
- API密钥未配置或无效
- 模型调用失败
- 网络超时

## 环境变量配置

服务需要以下环境变量：

```env
PORT=3001
OPENROUTER_API_KEY=your_openrouter_api_key
MODELSCOPE_API_KEY=your_modelscope_api_key
NODE_ENV=development
```

## 支持的模型

### OpenRouter模型
- **nanobanana**: 使用 `google/gemini-2.5-flash-image-preview` 模型

### ModelScope模型
- 支持ModelScope平台的各种图像生成模型
- 具体模型列表请参考ModelScope官方文档

## 使用示例

### 使用Nano Banana模型生成图片

```bash
curl -X POST http://localhost:3001/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "一只可爱的小猫咪",
    "model": "nanobanana"
  }'
```

### 使用ModelScope模型生成图片

```bash
curl -X POST http://localhost:3001/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "美丽的风景画",
    "model": "qwen-vl-plus",
    "negative_prompt": "模糊，低质量",
    "size": "1024x1024"
  }'
```

### 检查API密钥状态

```bash
curl http://localhost:3001/api/key-status
curl http://localhost:3001/api/modelscope-key-status
```

## 错误处理

所有错误响应都遵循统一格式：

```json
{
  "error": "具体错误描述",
  "statusCode": 错误状态码
}
```

常见错误码：
- `400`: 请求参数错误
- `401`: 认证失败
- `500`: 服务器内部错误
- `503`: 服务不可用

## 版本信息

- **API版本**: v1.0.0
- **最后更新**: 2024年1月
- **兼容性**: Node.js 18+

## 注意事项

1. 所有接口都支持CORS，允许跨域访问
2. 请求体大小限制为50MB
3. 图片生成可能需要较长时间，建议设置合适的超时时间
4. API密钥需要在环境变量中配置，不支持在请求中传递
5. 服务默认运行在3001端口，可通过PORT环境变量修改