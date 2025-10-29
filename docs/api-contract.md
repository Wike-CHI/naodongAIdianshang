# 接口契约说明

本文档汇总了当前前台、后台（Admin）与后端服务之间已经对齐的接口行为、数据结构和约定，方便前后端、后台运营协作与对齐。

## 约定

- **基础域名**：`http://localhost:8080`
- **统一前缀**：所有接口均以 `/api` 开头，例如 `/api/referral/user/:userId`
- **响应格式**：
  ```json
  {
    "success": true,
    "message": "可选描述信息",
    "data": { ... } // 当 success=false 时可省略或为空
  }
  ```
- 时间字段使用 ISO8601 字符串，例如 `2025-10-29T02:13:00.000Z`
- 金额、积分等数值统一使用 `number` 类型（单位为积分或人民币元）

## 1. 认证 / 用户信息

### POST `/api/auth/login`
| 请求体字段 | 类型 | 说明 |
| --- | --- | --- |
| phone \| email | string | 手机号或邮箱（二选一） |
| password | string | 明文密码（测试环境使用内存用户，真实环境需加密传输） |

**成功响应**
```json
{
  "success": true,
  "data": {
    "token": "JWT",
    "user": {
      "id": "user-1001",
      "username": "脑洞商家",
      "email": "test@example.com",
      "phone": "13800138000",
      "avatar": "https://...",
      "credits": 860,
      "credits_balance": 860,
      "membershipType": "vip",
      "loginMethod": "phone",
      "referralCode": "ND2024",
      "createdAt": "ISO8601"
    }
  }
}
```

### GET `/api/auth/me`
`Authorization: Bearer <token>`  
返回当前用户信息结构同上（`data.user`）。

## 2. 工具与订阅

### GET `/api/tools`
返回 AI 工具列表数组：
```json
{
  "success": true,
  "data": [
    {
      "id": "ai-model",
      "name": "AI模特生成",
      "description": "上传服装图，生成真实模特展示效果",
      "category": "model",
      "icon": "🧍",
      "creditCost": 15
    },
    ...
  ]
}
```

### GET `/api/subscription/plans`
每个套餐包含以下字段：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | string | 套餐唯一标识 |
| name | string | 套餐名称 |
| price | number | 当前价格 |
| originalPrice | number | 原价 |
| duration | string | 计费周期（`monthly` 等） |
| credits | number | 每周期可获得积分 |
| features | string[] | 套餐权益（前端展示优先使用 `features`，若后端仅返回 `benefits` 会自动回退） |
| benefits | string[] | 与 `features` 内容一致，保留做兼容 |
| popular | boolean | 是否标记为推荐套餐 |
| type | string | 套餐类型标识 |

## 3. 推广（Referral）接口

### 数据结构
`referralDetails` 列表中每一项（用于前端推广记录与后台统计）：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | string | 推广记录 ID |
| referredUsername | string | 被推荐用户昵称 |
| rewardCredits | number | 可获得/已获得的奖励积分 |
| status | `"pending" \| "completed"` | 推广流程状态 |
| registrationStatus | `"in_progress" \| "completed"` | 注册进度（供显示使用） |
| createdAt | string | 推广创建时间 |
| firstPurchaseAt | string \| null | 首次付费时间（如暂不可用则为 null） |

### GET `/api/referral/user/:userId`
返回指定用户推广概览：
```json
{
  "success": true,
  "data": {
    "referralCode": "ND2024",
    "isActive": true,
    "totalReferrals": 18,
    "successfulReferrals": 12,
    "conversionRate": 66.7,
    "totalEarnings": 960
  }
}
```

### GET `/api/referral/stats/:userId`
与 `/user` 接口相同，但附带完整 `referralDetails`、`creditHistory` 等扩展数据。

### GET `/api/referral/list/:userId`
`data` 为推广记录数组，字段同上表。

### GET `/api/referral/credits/:userId`
返回积分流水数组：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | string | 流水ID |
| type | `"referral_reward" \| "consumption" \| "recharge"` | 流水类型 |
| amount | number | 正数表示收入，负数表示支出 |
| description | string | 描述 |
| createdAt | string | 发生时间 |

### POST `/api/referral/relationship`
| 字段 | 类型 | 说明 |
| --- | --- | --- |
| refereeId | string | 被推荐用户 ID |
| referralCode | string | 推广码 |

成功返回 `data` 为新建的推广记录（结构同 `referralDetails` 单项）。

### POST `/api/referral/code/generate`
`{ userId: string }` ➜ 返回 `{ referralCode: string }`

### POST `/api/referral/code/validate`
`{ code: string }` ➜ 返回 `{ valid: boolean, referrer?: { id, name } }`

## 4. 积分接口

### GET `/api/credits/balance`
需要用户凭证，返回：
```json
{ "success": true, "data": { "credits": 860 } }
```

### GET `/api/credits/history`
需要用户凭证，返回当前用户的积分流水（同 `/api/referral/credits/:userId`）。

### POST `/api/credits/purchase`
`{ credits: number, bonus?: number }`  
增加积分并追加到积分流水。

## 5. 管理端（Admin）逻辑说明

- 管理端登录、概览等 API 尚未由后端提供真实实现，当前前端通过聚合用户端接口并使用本地缓存模拟：
  - 概览数据 `adminApi.getOverview()` 依赖 `/api/referral/stats/:userId`、`/api/referral/credits/:userId` 等接口，并做本地统计
  - 推广关系列表 `adminApi.getAllRelationships()` 直接读取 `/api/referral/list/:userId`
  - 删除/更新推广关系为前端本地状态操作，不会持久化到后端
  - 管理端系统配置 `adminSystemConfigApi` 存储在 `localStorage`，用于界面演示

> **后续计划**：当后端开放 `/api/admin/...` 实际接口后，可直接替换当前聚合逻辑，实现真正的运营后台能力。

## 6. 兼容性提示

- `frontend/pages/ReferralManagement.jsx` 现在兼容 `referredUsername` 字段，如未来后端升级为嵌套对象可在前端保留回退逻辑
- 订阅套餐渲染优先使用 `plan.features`，无数据时自动回退 `plan.benefits`
- 管理端的统计/删除操作现阶段不会影响真实数据，运营侧需知悉

---

如需扩展新的接口或字段，请同步更新本文件，确保前后端、后台协作一致。
