# NanoBanana API - AI图片生成中心

一个支持多模型的AI图片生成API服务，基于Node.js构建。

## 🌟 核心功能

- **多模型支持**: 集成OpenRouter和ModelScope平台的多种AI图像生成模型
- **统一API接口**: 提供一致的RESTful API接口
- **模块化架构**: 服务层抽离，便于维护和扩展
- **环境配置**: 支持环境变量配置，安全可靠
- **CORS支持**: 支持跨域访问，便于前端集成
- **健康检查**: 提供服务状态监控接口

## 🚀 快速开始

### 环境要求

- Node.js 18.0+
- npm 或 yarn

### 安装依赖

```bash
npm install
```

### 环境配置

1. 复制环境变量示例文件：
```bash
cp .env.example .env
```

2. 编辑 `.env` 文件，配置API密钥：
```env
PORT=3001
OPENROUTER_API_KEY=your_openrouter_api_key_here
MODELSCOPE_API_KEY=your_modelscope_api_key_here
NODE_ENV=development
```

### 启动服务

```bash
# 开发模式（自动重启）
npm run dev

# 生产模式
npm start
```

服务启动后，访问 http://localhost:3001/health 检查服务状态。

## 📚 API文档

详细的API接口文档请参考 [API_CONTRACT.md](./API_CONTRACT.md)

### 主要接口

- `GET /health` - 健康检查
- `GET /api/key-status` - OpenRouter API密钥状态
- `GET /api/modelscope-key-status` - ModelScope API密钥状态
- `POST /generate` - 图片生成接口

### 快速示例

```bash
# 使用Nano Banana模型生成图片
curl -X POST http://localhost:3001/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "一只可爱的小猫咪",
    "model": "nanobanana"
  }'

# 使用ModelScope模型生成图片
curl -X POST http://localhost:3001/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "美丽的风景画",
    "model": "qwen-vl-plus",
    "negative_prompt": "模糊，低质量"
  }'
```

## 🏗️ 项目结构

```
nanobanana/
├── services/                 # 服务层
│   ├── openRouterService.js  # OpenRouter API服务
│   └── modelScopeService.js  # ModelScope API服务
├── static/                   # 静态文件（前端界面）
├── server.js                 # 主服务器文件
├── package.json              # 项目配置
├── .env.example              # 环境变量示例
├── API_CONTRACT.md           # API接口契约文档
└── README.md                 # 项目说明
```

## 🔧 支持的模型

### OpenRouter模型
- **nanobanana**: 基于 `google/gemini-2.5-flash-image-preview`

### ModelScope模型
- 支持ModelScope平台的各种图像生成模型
- 包括Qwen-Image、Flux等主流模型

## 🛠️ 开发说明

### 服务层架构

项目采用模块化架构，将不同的API服务抽离到独立的服务类中：

- `OpenRouterService`: 处理OpenRouter API调用
- `ModelScopeService`: 处理ModelScope API调用

### 添加新模型

1. 在对应的服务类中添加新模型支持
2. 更新 `server.js` 中的路由逻辑
3. 更新API文档

### 环境变量

| 变量名 | 描述 | 默认值 |
|--------|------|--------|
| PORT | 服务端口 | 3001 |
| OPENROUTER_API_KEY | OpenRouter API密钥 | - |
| MODELSCOPE_API_KEY | ModelScope API密钥 | - |
| NODE_ENV | 运行环境 | development |

## 🔍 故障排除

### 常见问题

1. **API密钥无效**
   - 检查 `.env` 文件中的API密钥是否正确
   - 访问 `/api/key-status` 检查密钥状态

2. **端口占用**
   - 修改 `.env` 文件中的 `PORT` 配置
   - 或使用 `PORT=3002 npm start` 临时指定端口

3. **模型调用失败**
   - 检查网络连接
   - 确认API密钥有足够的配额
   - 查看控制台错误日志

### 日志调试

服务会在控制台输出详细的调试信息，包括：
- API请求和响应
- 错误信息
- 任务状态

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交Issue和Pull Request来改进项目。

## 📞 支持

如有问题，请查看：
1. [API接口文档](./API_CONTRACT.md)
2. 控制台错误日志
3. 提交Issue到项目仓库
