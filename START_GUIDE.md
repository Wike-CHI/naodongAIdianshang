# 脑洞AI项目启动指南

## 📋 项目概述

脑洞AI是一个完整的AI电商平台，包含用户端网站、管理后台和后端API服务。项目采用前后端分离架构，提供AI模特、商品图处理、用户推广系统等功能。

### 🏗️ 项目架构

```
脑洞AI项目
├── 主网站 (用户端)          - React + Vite + Ant Design
├── 管理后台 (admin/)       - React + Vite + Ant Design  
└── 后端服务 (backend/)     - Node.js + Express + JWT
```

## 🔧 环境要求

### 必需环境
- **Node.js**: v16.0.0 或更高版本
- **npm**: v7.0.0 或更高版本 (或使用 pnpm)
- **现代浏览器**: Chrome, Firefox, Safari, Edge

### 推荐工具
- **VS Code**: 代码编辑器
- **Postman**: API测试工具
- **Git**: 版本控制
- **React DevTools**: React开发调试工具 - [安装链接](https://reactjs.org/link/react-devtools)

## 🚀 快速启动

### 1. 安装依赖

```bash
# 进入项目根目录
cd naodongAIdianshang

# 安装主网站依赖
npm install

# 安装管理后台依赖
cd admin
npm install
cd ..

# 安装后端依赖
cd backend
npm install
cd ..
```

### 2. 启动服务

**需要同时启动三个服务，建议开启三个终端窗口：**

#### 终端1: 启动后端服务器
```bash
cd backend
npm run dev
```
✅ 后端服务将运行在: `http://localhost:8080`

#### 终端2: 启动主网站
```bash
# 在项目根目录
npm run dev
```
✅ 主网站将运行在: `http://localhost:5173`

#### 终端3: 启动管理后台
```bash
cd admin
npm run dev
```
✅ 管理后台将运行在: `http://localhost:5175` (代码中 `admin/package.json` 与 `admin/vite.config.js` 默认使用 5175；历史文档中曾出现 5174，实际以代码配置为准)

## 🌐 端口配置

| 服务 | 端口 | 访问地址 | 说明 |
|------|------|----------|------|
| 后端API | 8080 | http://localhost:8080 | 提供API服务 |
| 主网站 | 5173 | http://localhost:5173 | 用户访问的主站 |
| 管理后台 | 5175 | http://localhost:5175 | 管理员后台系统（代码默认 5175） |

## 🔐 登录凭据

### 管理后台登录
- **访问地址**: http://localhost:5174 (或 5175)
- **用户名**: `admin`
- **密码**: `admin123`

### 主网站登录
- **手机验证码**: `123456` (模拟验证码)
- **微信登录**: 支持微信授权登录

## 📝 启动脚本说明

### 主网站 (根目录)
```json
{
  "dev": "vite",                    // 开发模式启动
  "build": "vite build",            // 构建生产版本
  "preview": "vite preview"         // 预览构建结果
}
```

### 管理后台 (admin/)
```json
{
   "dev": "vite --port 5175",        // 指定端口启动（代码默认 5175）
  "build": "vite build",            // 构建生产版本
  "preview": "vite preview"         // 预览构建结果
}
```

### 后端服务 (backend/)
```json
{
  "start": "node server.js",        // 生产模式启动
  "dev": "nodemon server.js"        // 开发模式启动(自动重启)
}
```

## 🔧 开发调试

### React Developer Tools
为了更好的开发体验，强烈建议安装 React Developer Tools 浏览器扩展：

- **Chrome**: [安装 React DevTools](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi)
- **Firefox**: [安装 React DevTools](https://addons.mozilla.org/en-US/firefox/addon/react-devtools/)
- **Edge**: [安装 React DevTools](https://microsoftedge.microsoft.com/addons/detail/react-developer-tools/gpphkfbcpidddadnkolkpfckpihlkkil)

安装后，在开发者工具中会出现 `Components` 和 `Profiler` 标签页，可以：
- 检查 React 组件树和 props/state
- 调试组件渲染性能
- 查看 Hook 状态变化

### 浏览器开发者工具
1. 按 `F12` 打开开发者工具
2. 查看 `Console` 标签页的错误信息
3. 查看 `Network` 标签页的网络请求
4. 查看 `Application` 标签页的本地存储

### 常用调试命令
```bash
# 检查端口占用
netstat -ano | findstr :8080
netstat -ano | findstr :5173
netstat -ano | findstr :5174

# 清除npm缓存
npm cache clean --force

# 重新安装依赖
rm -rf node_modules package-lock.json
npm install
```

## ❗ 常见问题

### 1. 端口被占用
**问题**: `Error: listen EADDRINUSE: address already in use :::5173`

**解决方案**:
```bash
# 查找占用端口的进程
netstat -ano | findstr :5173

# 结束进程 (替换PID为实际进程ID)
taskkill /PID <PID> /F

# 或者修改端口
vite --port 5174
```

### 2. 依赖安装失败
**问题**: `npm ERR! peer dep missing`

**解决方案**:
```bash
# 清除缓存
npm cache clean --force

# 删除node_modules重新安装
rm -rf node_modules package-lock.json
npm install

# 或使用yarn/pnpm
yarn install
# 或
pnpm install
```

### 3. 管理后台无法登录
**问题**: 登录后闪回登录页面

**解决方案**:
1. 确保后端服务正在运行 (http://localhost:8080)
2. 清除浏览器缓存 (`Ctrl + Shift + R`)
3. 检查网络请求是否正常
4. 确认使用正确的登录凭据: `admin/admin123`

### 4. API请求失败
**问题**: `net::ERR_CONNECTION_REFUSED`

**解决方案**:
1. 确认后端服务已启动
2. 检查API地址配置
3. 确认CORS设置正确
4. 查看后端控制台错误信息

### 5. 前端页面空白
**问题**: 页面加载后显示空白

**解决方案**:
1. 检查浏览器控制台错误
2. 确认所有依赖已正确安装
3. 尝试硬刷新页面 (`Ctrl + Shift + R`)
4. 检查路由配置是否正确

## 🔄 重启服务

如果遇到问题，可以按以下顺序重启服务：

1. **停止所有服务** (`Ctrl + C` 在各个终端)
2. **重启后端服务**
   ```bash
   cd backend
   npm run dev
   ```
3. **重启主网站**
   ```bash
   npm run dev
   ```
4. **重启管理后台**
   ```bash
   cd admin
   npm run dev
   ```

## 📚 项目结构

```
naodongAIdianshang/
├── frontend/                    # 主网站源码
│   ├── components/         # React组件
│   ├── pages/             # 页面组件
│   ├── contexts/          # React Context
│   └── services/          # API服务
├── admin/                 # 管理后台
│   ├── frontend/
│   │   ├── components/    # 后台组件
│   │   ├── pages/         # 后台页面
│   │   ├── contexts/      # 认证上下文
│   │   └── services/      # 后台API
│   └── package.json
├── backend/               # 后端服务
│   ├── server.js          # 服务器入口
│   ├── routes/            # 路由定义
│   ├── controllers/       # 控制器
│   └── package.json
└── docs/                  # 项目文档
```

## 🎯 下一步

启动成功后，你可以：

1. **访问主网站**: http://localhost:5173
   - 体验AI模特功能
   - 测试用户注册登录
   - 查看商品展示

2. **访问管理后台**: http://localhost:5174
   - 使用 `admin/admin123` 登录
   - 管理用户和推广系统
   - 查看系统统计数据

2. **访问管理后台**: http://localhost:5175
- 使用 `admin/admin123` 登录
- 管理用户和推广系统
- 查看系统统计数据

3. **API测试**: http://localhost:8080
   - 使用Postman测试API接口
   - 查看API文档和响应

## 📞 技术支持

如果遇到其他问题，请：
1. 检查控制台错误信息
2. 查看网络请求状态
3. 确认所有服务正常运行
4. 参考项目文档和代码注释

---

**祝你使用愉快！** 🎉