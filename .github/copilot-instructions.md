## 快速上手（供 AI 编码代理）

以下说明针对本仓库 —— 一个前后端分离的 AI 电商平台（主站 + 管理后台 + Node/Express 后端）。目标是把可发现的约定、端口、启动命令和关键集成点汇总，让 AI 代理能尽快做出安全、正确的改动。

### 一句话架构概览
- 前端 主站：`/` (Vite + React)，入口在仓库根（port 默认 5173）
- 前端 管理后台：`/admin` (Vite + React)，独立 package（port 默认 5175，历史 docs 提到 5174）
- 后端 API：`/backend` (Express)，监听 env `PORT` 或默认 8080；路由以 `/api/*` 前缀挂载
- AI 集成点：`backend/services/nanobananaIntegration.js` 与 `backend/routes/aiGeneration.js` / `backend/routes/aiTools.js`

### 启动 / 调试 命令（可复制到终端）
- 启动后端（开发）：
  - cd backend && npm install
  - npm run dev    # 使用 nodemon，server.js
- 启动主网站（根目录）：
  - npm install
  - npm run dev    # Vite -> 默认 5173
- 启动管理后台：
  - cd admin && npm install
  - npm run dev    # package.json 指定 5175

注意：仓库文档（START_GUIDE.md / README.md）有少量端口说明不一致（见下节“已发现的不一致”）。在做变更前请以实际 `package.json` / `vite.config.js` / `server.js` 为准。

### 关键环境变量与约定
- 后端：`PORT`（默认 8080）、`MONGODB_URI`、`JWT_SECRET`、`USE_MEMORY_DB`（'true' 则跳过 Mongo 连接，server 使用内存数据）
- 前端：`VITE_API_BASE_URL`（默认 `http://localhost:8080`，前端通过 `frontend/config/api.js` 使用）
- AI 服务：`NANOBANANA_API_URL`（`backend/services/nanobananaIntegration.js` 使用，默认 `http://localhost:3001`）

示例：健康检查
- 后端健康检查：GET http://localhost:8080/api/health
- nanobanana 健康：GET ${NANOBANANA_API_URL}/api/health

### 路由与 API 约定（重要文件）
- 后端路由在 `backend/server.js` 挂载：
  - `/api/auth` -> `backend/routes/auth`
  - `/api/ai` -> `backend/routes/aiGeneration`
  - `/api/admin/ai-tools` -> `backend/routes/aiTools`
  - 其它：`/api/subscriptions`, `/api/credits`, `/api/admin/users` 等
- 前端 API 封装：`frontend/config/api.js` 使用 `VITE_API_BASE_URL` 构建 `API_ENDPOINTS`，修改 API 路径请同步到这里。

示例请求（生成工具）：
- POST ${VITE_API_BASE_URL}/api/tools/generate    # multipart/form-data，字段：mainImage, referenceImage, toolId, prompt

### 常见模式与项目约定（对 AI 代理有帮助）
- 可选认证：路由中常见 `optionalAuth` / `authenticateToken`，注意在修改接口时不要破坏认证中间件链
- 内存 mock：若 DB 不可用或 `USE_MEMORY_DB`，server 会使用 `memoryUsers` / `memoryTools` 等全局对象，适合本地快速调试。修改这部分用于测试时，优先用 feature flag 或额外开关。
- AI 接口封装：`backend/services/nanobananaIntegration.js` 封装了工具映射（toolConfigs）、提示词模板、超时与错误处理；修改生成逻辑时请优先在该 service 中做扩展而非直接改路由。

### 已发现并应注意的不一致（请核对）
- 文档 `START_GUIDE.md` 中提到：后端运行端口 `8080`（一致），但 `MONGODB_SETUP.md` 的 env 示例里 `PORT=3001` —— 3001 在仓库中更像是 nanobanana 或其他服务的默认端口。结论：确认 `PORT` 用于后端；nanobanana 默认为 3001（见 `nanobananaIntegration.js`）。
- 管理后台端口：`START_GUIDE.md` 提到 5174/5175 自动切换，但 `admin/package.json` 的 `dev` 脚本与 `admin/vite.config.js` 默认使用 5175。若需固定端口，用 package.json 或 vite.config.js 为准。

### 编辑/扩展提示（对自动补丁生成特别重要）
- 新增后端路由：在 `backend/routes/` 添加路由文件并在 `backend/server.js` 中挂载对应前缀（遵循现有 `/api/*` 规则）。
- 增加前端 API：在 `frontend/config/api.js` 添加到 `API_ENDPOINTS` 并在对应 service 中引用（例：`services/aiModelService.js`）。
- 更改端口/基准 URL：同时更新 `vite.config.js`（或 admin 的对应配置）、前端 `VITE_API_BASE_URL` 环境与后端 `PORT`，并在 README/START_GUIDE.md 做同步说明。

### 安全与误区提醒
- 切勿把实际的 JWT_SECRET、数据库密码或外部 API key 提交到仓库。若需要环境示例，请在 `.env.example` 中给出占位符。
- 在修改 AI 服务（nanobanana）的超时/重试策略时，请保留原有错误处理分支（ECONNREFUSED / ECONNABORTED），以避免隐藏可用性问题。

---
如果你希望我把这些内容合并成更短或更长的版本、或把某些部分展开成“检查清单（checklist）”形式告诉人类开发者，请告诉我你偏好的长度与格式。根据你的反馈我会更新该文件。
