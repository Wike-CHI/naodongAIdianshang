# API 契约总览

本文档梳理现有服务的接口约定，覆盖 Node 后端 (`backend/server.js`) 暴露的 REST API 以及 FastAPI 中间层 (`ai_service/main.py`) 的桥接接口。所有内容以 2025-10-30 代码库为准，如有接口或字段调整请同步更新。

## 基础约定

- **域名/端口**
  - 用户 & 管理端 REST API：`http://localhost:8080`
  - FastAPI 中间层：`http://localhost:9001`
- **统一响应结构**
  ```json
  {
    "success": true,
    "data": { ... },
    "message": "可选提示",
    "error": "失败时返回的错误信息"
  }
  ```
- **认证**
  - 采用 Bearer JWT，登录接口返回 `token`，后续请求在 `Authorization` Header 中附带 `Bearer <token>`。
  - 标记为“公开”或“可选认证”的接口在 `Authorization` 缺失时亦可访问。
- **数据格式**
  - 默认使用 `application/json`，文件上传场景使用 `multipart/form-data`。
  - 时间统一为 ISO8601 字符串；金额/积分使用 `number`。

---

## 1. 认证 (`/api/auth`)

| 方法 | 路径 | 说明 | 备注 |
| --- | --- | --- | --- |
| `POST` | `/register` | 用户注册 | 请求体验证见 `validation.schemas.userRegister`。 |
| `POST` | `/login` | 手机号/邮箱 + 密码登录 | 返回 `{ token, user }`。 |
| `POST` | `/admin-login` | 管理员登录 | 同样返回 `{ token, admin }`。 |
| `GET` | `/me` | 拉取当前用户信息 | 需登录。 |
| `POST` | `/refresh` | 刷新令牌 | 返回新的 `token`。 |
| `POST` | `/change-password` | 修改密码 | 需登录。 |
| `POST` | `/forgot-password` | 请求密码重置邮件 | 公开接口。 |
| `POST` | `/reset-password` | 根据 token 重置密码 | 公开接口。 |
| `POST` | `/verify-email` | 验证邮箱 | 公开接口。 |
| `POST` | `/resend-verification` | 重新发送验证邮件 | 需登录。 |
| `POST` | `/logout` | 登出 | `optionalAuth`，无 token 也不会报错。 |

**登录响应示例**
```json
{
  "success": true,
  "data": {
    "token": "JWT",
    "user": {
      "id": "6540...",
      "username": "脑洞商家",
      "email": "test@example.com",
      "phone": "13800000000",
      "avatar": "https://...",
      "credits": 860,
      "credits_balance": 860,
      "membershipType": "vip",
      "loginMethod": "phone",
      "createdAt": "2025-10-29T02:13:00.000Z"
    }
  }
}
```

---

## 2. AI 生成 (`/api/ai`)

### `POST /api/ai/generate/:toolKey`

- **认证**：必需。
- **Content-Type**：`multipart/form-data`。
- **字段**：
  - `prompt` (`string`，可空) —— 用户补充提示词。
  - `options` (`string`，JSON) —— 由前端统一构建，基础字段：`resolution`(`0.5k/1080p/2k`)、`quantity`(1-4)、`mode`(`fast/ultra`)；可附带工具自定义键如 `scene_description`。
  - `metadata` (`string`，JSON) —— `{ toolId, hasMain, hasReference, faceSwap, ... }`。
  - `images` (`File[]`) —— 上传图片列表：第 1 张视为 `base_model`，第 2 张视为 `face_reference`，其余为 `reference_*`。

**成功响应**
```json
{
  "success": true,
  "data": {
    "generationId": "6541...",
    "images": [
      {
        "index": 0,
        "mime_type": "image/png",
        "data": "<base64>",
        "data_url": "data:image/png;base64,...",
        "public_url": "/generated/ai-model-1730284983.png",
        "file_name": "ai-model-1730284983.png"
      }
    ],
    "text_outputs": [],
    "timing_ms": 3480,
    "tool": { "id": "ai-model", "name": "AI模特生成", "creditCost": 15 },
    "credits_used": 15
  }
}
```

### 其他接口

| 方法 | 路径 | 说明 | 备注 |
| --- | --- | --- | --- |
| `GET` | `/api/ai/health` | 健康检查 | 公开。 |
| `GET` | `/api/ai/history` | 获取分页历史 | 需登录；支持 `page`、`limit`、`toolId`、`status`、`days` 查询参数。 |
| `GET` | `/api/ai/history/:recordId` | 获取单条记录 | 需登录；管理员可跨用户查看。 |
| `DELETE` | `/api/ai/history/:recordId` | 删除记录 | 需登录；管理员可跨用户删除。 |
| `GET` | `/api/ai/stats` | 获取近 30 天统计 | 需登录；管理员多返回全局数据。 |

返回的历史与统计数据结构均源自 `AIGeneration` 文档，包含状态、积分、最近 10 条记录、工具使用聚合等。

---

## 3. 工具管理

### 3.1 公共工具列表 (`/api/admin/ai-tools` 前缀)

| 方法 | 路径 | 说明 | 权限 |
| --- | --- | --- | --- |
| `GET` | `/api/admin/ai-tools` | 分页查询工具 | 可选登录（`optionalAuth`），分页参数继承 `schemas.pagination`。 |
| `GET` | `/api/admin/ai-tools/:id` | 获取单个工具 | 可选登录。 |
| `POST` | `/api/admin/ai-tools` | 新建工具 | 登录 + 管理员。 |
| `PUT` | `/api/admin/ai-tools/:id` | 更新工具 | 登录 + 管理员。 |
| `DELETE` | `/api/admin/ai-tools/:id` | 删除工具 | 登录 + 管理员。 |
| `POST` | `/api/admin/ai-tools/:id/toggle` | 切换启用状态 | 登录 + 管理员。 |
| `POST` | `/api/admin/ai-tools/batch` | 批量操作（启用/禁用/删除/改分类） | 登录 + 管理员。 |
| `GET` | `/api/admin/ai-tools/meta/types` | 列出工具类型枚举 | 公开。 |
| `GET` | `/api/admin/ai-tools/meta/categories` | 列出分类枚举 | 公开。 |
| `GET` | `/api/admin/ai-tools/meta/stats` | 工具整体统计 | 登录 + 管理员。 |
| `POST` | `/api/admin/ai-tools/:id/test` | 连接性测试 | 登录 + 管理员。 |

- 请求体验证规则参考 `validation.schemas.aiTool` 与 `schemas.batchAIToolUpdate`。
- Node 服务在 AI 生成成功时会调用 `ensureAiToolRecord` 自动写入/更新 `AiTool` 文档，无需前端直接创建即可出现在列表中。

### 3.2 模型测试与预设 (`/api/admin/ai-model-tools`)

该路由主要用于运营配置（模拟数据较多），包含：

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `GET /` | 列出所有预设工具。 |
| `GET /:id` | 获取单个工具（包含参数模板）。 |
| `PUT /:id` | 更新参数模板或维护状态。 |
| `POST /batch-status` | 批量启用/禁用。 |
| `POST /:id/reset` | 恢复默认配置。 |
| `POST /batch-reset` | 批量恢复默认配置。 |
| `GET /stats` | 获取工具使用统计（内存模拟）。 |
| `GET /:id/history` | 查看单个工具的生成记录（内存模拟）。 |
| `POST /:id/test` | 触发一次测试并返回假数据。 |

目前该模块以“本地内存 + Mock”形式存在，未来若落库需同步设计字段。

---

## 4. 订阅 (`/api/subscriptions`)

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `GET` | `/plans` | 获取套餐列表（公开）。 |
| `POST` | `/plans` | 新建套餐（管理员）。 |
| `PUT` | `/plans/:id` | 更新套餐（管理员）。 |
| `DELETE` | `/plans/:id` | 删除套餐（管理员）。 |
| `GET` | `/` | 当前用户订阅列表（需登录）。 |
| `POST` | `/` | 创建订阅（需登录）。 |
| `POST` | `/:id/cancel` | 取消订阅（需登录）。 |
| `POST` | `/:id/renew` | 续费订阅（需登录）。 |
| `GET` | `/meta/stats` | 订阅统计（管理员）。 |
| `GET` | `/meta/expiring` | 即将到期订阅（管理员）。 |
| `POST` | `/batch` | 批量操作订阅（管理员）。 |

请求体验证规则参考 `schemas.subscriptionPlan`、`schemas.createSubscription`、`schemas.renewSubscription`、`schemas.batchSubscriptionUpdate`。

---

## 5. 积分 (`/api/credits`)

| 方法 | 路径 | 说明 | 权限 |
| --- | --- | --- | --- |
| `GET` | `/` | 分页查询积分记录 | 需登录。 |
| `POST` | `/adjust` | 单用户积分增减 | 登录 + 管理员。 |
| `POST` | `/batch-adjust` | 批量积分增减 | 登录 + 管理员。 |
| `GET` | `/stats` | 当前积分统计（含曲线数据） | 需登录。 |
| `GET` | `/type-stats` | 各类型积分占比 | 需登录。 |
| `GET` | `/leaderboard` | 积分排行榜 | 需登录。 |
| `GET` | `/export` | 导出积分记录（CSV/JSON） | 需登录。 |

`creditController` 针对 `CreditRecord` 提供读写与统计能力。管理员调整积分会同步写 `CreditRecord` 并更新 `User.credits_balance`。

---

## 6. 用户 (`/api/admin/users`)

| 方法 | 路径 | 说明 | 权限 |
| --- | --- | --- | --- |
| `GET` | `/` | 分页获取用户列表 | 管理员。 |
| `GET` | `/:id` | 用户详情 | 管理员或本人。 |
| `PUT` | `/:id` | 更新资料 | 管理员或本人。 |
| `DELETE` | `/:id` | 软删除账号 | 管理员。 |
| `GET` | `/:id/credits` | 指定用户积分流水 | 管理员或本人。 |
| `GET` | `/:id/generations` | 指定用户生成历史 | 管理员或本人。 |
| `POST` | `/:id/adjust-credits` | 调整指定用户积分 | 管理员。 |
| `GET` | `/:id/subscription` | 用户订阅信息 | 管理员或本人。 |
| `GET` | `/stats` | 用户整体统计 | 管理员。 |
| `POST` | `/batch` | 批量操作用户（激活/禁用/改角色） | 管理员。 |

`userController` 还会聚合 `CreditRecord`、`Subscription`、`AIGeneration` 提供统计信息与历史数据。

---

## 7. FastAPI 中间层 (`ai_service`)

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `GET` | `/health` | 返回 `{ status: "ok", tools: ["ai-model", ...] }`。 |
| `POST` | `/generate/{tool_id}` | 生成图片（详见 [数据类型总表](./data-models.md#AI%20Generation%20%E2%87%84%20FastAPI%20Payload)）。 |

该服务负责：
1. 根据 `tool_id` + metadata 构建提示词（支持 AI 模特换脸、试衣等模板）。
2. 调用 Gemini 2.5 Flash Image（通过 AiHubMix 网关）。
3. 以流式方式收集 `IMAGE` 与 `TEXT` 响应，回传给 Node 后端。

Node 在得到响应后会：

- 将 Base64 图片写入 `backend/generated/` 并返回 `public_url`。
- 落库 `AIGeneration` / `User.generated_assets` / `CreditRecord` 等表。
- 将结构统一返回给前端，保持双端一致。

---

## 8. 静态资源

- `GET /generated/<file>`：由 Express 托管 `backend/generated` 目录，供前端直接访问生成后的图片。
- 其他静态目录（如上传文件）可按需扩展，使用 `express.static` 暴露。

---

## 9. 依赖脚本与一键启动

在项目根目录执行：

```bash
npm install
npm install --prefix backend
npm install --prefix admin
pip install -r ai_service/requirements.txt
```

随后可使用 `npm run dev:all` 并行启动：

1. 前端（Vite，端口 5173）
2. Node 后端（Express，端口 8080）
3. 管理后台（Vite，端口 8082）
4. FastAPI（Uvicorn，端口 9001）

确保 `.env` 文件中已经配置 `AIHUBMIX_API_KEY`、`AI_SERVICE_BASE_URL`、`USER_ASSET_LIMIT` 等环境项。

---

如需新增或调整接口，请在提交代码的同时同步维护本文档以及 `docs/data-models.md`，保持团队对数据与契约的统一认知。***
