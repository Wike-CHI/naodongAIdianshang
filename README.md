# 脑洞AI电商项目

## 项目概述

脑洞AI电商是一个基于AI技术的电商平台，提供多种AI图像生成工具，包括AI模特生成、虚拟试衣、场景更换等功能。项目采用前后端分离架构，前端使用React + Ant Design，后端使用Node.js + Express，数据存储使用MongoDB。

## 技术栈

- **前端**: React 18, Ant Design 5, Vite
- **管理后台**: React 18, Ant Design 5, Vite
- **后端**: Node.js, Express, Mongoose
- **数据库**: MongoDB
- **AI服务**: OpenAI SDK (调用gemini-2.5-flash-image模型)
- **部署**: 支持本地开发和生产环境部署

## 快速开始

### 环境要求

- Node.js 16+
- MongoDB 4.4+
- npm 8+

### 安装依赖

```bash
npm install
npm install --prefix backend
npm install --prefix admin
```

### 启动服务

使用以下命令并行启动三个服务：

```bash
npm run dev:all
```

该命令通过 `concurrently` 同时运行：

- 用户前端（Vite，默认端口 5173，若被占用会自动切换）
- Node 后端（Express，端口 8080）
- 管理后台（Vite，端口 8082）

或者可以单独启动各个服务：

```bash
# 启动前端
npm run dev:frontend

# 启动后端
npm run dev:backend

# 启动管理后台
npm run dev:admin
```

### 访问地址

- **用户前端**: http://localhost:3001/ (若3001端口被占用，会自动切换到其他端口)
- **管理后台**: http://localhost:8082/
- **后端API**: http://localhost:8080/

### 环境配置

请确保在 `.env` 文件中配置以下必要环境变量：

- `AIHUBMIX_API_KEY`: AI服务API密钥
- `OPENAI_API_KEY`: OpenAI API密钥（用于AI生图服务）
- `MONGODB_URI`: MongoDB连接字符串

AI生图服务已从Python FastAPI服务迁移至Node.js实现，使用OpenAI SDK调用gemini-2.5-flash-image模型。

### 构建生产版本

```bash
npm run build
```

## 主要功能模块

### 1. 用户系统
- 微信扫码登录（模拟）
- 手机号验证码登录
- 账号密码登录
- 用户状态持久化

### 2. AI工具支持
- AI模特生成
- 同版型试衣
- 配件试戴（眼镜试戴）
- 鞋靴试穿
- 场景更换
- 商品换色

### 3. 会员与积分系统
- 积分充值系统
- VIP会员特权
- 年度会员套餐
- 生成历史记录
- 使用统计分析

### 4. 管理后台
- 用户管理
- AI工具配置
- 会员套餐管理
- 积分记录查看
- 生成统计分析

## 项目结构

```
.
├── frontend/          # 用户前端
├── admin/             # 管理后台
├── backend/           # 后端服务
├── tests/             # 测试文件
└── docs/              # 文档
```

## 开发说明

- 严格按照原型图设计UI界面
- 保持简洁明了的设计风格
- 响应式布局适配多端设备
- 组件化开发，便于维护扩展

## 部署说明

1. 配置生产环境变量
2. 构建前端和管理后台
3. 启动后端服务
4. 配置Nginx反向代理（可选）

## 后续计划

- [ ] 完善支付系统集成
- [ ] 添加更多AI工具
- [ ] 优化性能和用户体验
- [ ] 增强移动端适配