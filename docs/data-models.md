# 数据类型总表

本文件汇总当前后端与中间层使用的核心数据类型，主要来源于 `backend/models` 下的 Mongoose Schema 以及 FastAPI 中转服务的入参。字段类型参考 MongoDB / JSON 语义，除非另有说明均为必填。

## 通用约定

- 所有主键字段命名为 `_id` 并使用 MongoDB `ObjectId`。
- 每个集合默认包含 `created_at`、`updated_at`（`Date`，ISO8601）时间戳。
- 未显式标注的对象字段允许存放扩展信息，前端使用时需做好存在性判断。
- FastAPI 与 Node 服务之间的图片数据通过 Base64 + MIME 描述传输。

## User (`users`)

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `email` | `String` | 可选，唯一，存储用户邮箱（小写）。 |
| `phone` | `String` | 可选，唯一，中国大陆手机号。 |
| `username` | `String` | 必填，长度 2~50。 |
| `password_hash` | `String` | 必填，BCrypt 哈希。 |
| `avatar_url` | `String \| null` | 头像地址。 |
| `credits_balance` | `Number` | 当前积分余额，默认 0。 |
| `role` | `String` | 用户等级，`user/premium/vip`。 |
| `is_active` | `Boolean` | 是否启用账号。 |
| `last_login` | `Date \| null` | 最近登录时间。 |
| `email_verified` | `Boolean` | 邮箱是否验证通过。 |
| `verification_token` | `String \| null` | 邮箱验证 token。 |
| `reset_password_token` | `String \| null` | 找回密码 token。 |
| `reset_password_expires` | `Date \| null` | 找回密码 token 失效时间。 |
| `generated_assets` | `GeneratedAsset[]` | 最近生成的图片素材轮换缓存，最多 `USER_ASSET_LIMIT` 条。 |

### GeneratedAsset 元素

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `generation_id` | `ObjectId` | 对应 `AIGeneration` 记录。 |
| `tool_key` | `String` | 使用的工具标识（如 `ai-model`）。 |
| `public_url` | `String` | Node 后端暴露的静态访问路径 `/generated/<file>`。 |
| `file_name` | `String` | 服务器保存的文件名。 |
| `mime_type` | `String` | 图片 MIME 类型。 |
| `width` / `height` | `Number \| null` | 目标分辨率（按选项回写）。 |
| `index` | `Number` | 在一次生成任务中的顺序。 |
| `created_at` | `Date` | 资源写入时间。 |

## AdminUser (`adminusers`)

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `username` | `String` | 唯一管理员账号。 |
| `password_hash` | `String` | BCryt 哈希。 |
| `role` | `String` | `super_admin`、`operation_admin`、`tech_admin`。 |
| `permissions` | `String[]` | 权限列表，支持 `*` 通配。 |
| `is_active` | `Boolean` | 是否冻结账号。 |
| `last_login` | `Date \| null` | 最近一次成功登录。 |
| `login_attempts` | `Number` | 连续登录失败次数。 |
| `locked_until` | `Date \| null` | 若达阈值将锁定 30 分钟。 |

## AiTool (`aitools`)

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `identifier` | `String` | 工具唯一标识（如 `ai-model`）。 |
| `name` | `String` | 工具名称。 |
| `description` | `String` | 描述文案。 |
| `type` | `String` | `image_generation` / `image_editing` / `style_transfer` / … |
| `config` | `Object` | 运行参数限制（最大分辨率、支持格式、批量能力等）。 |
| `credit_cost` | `Number` | 默认积分消耗。 |
| `enabled` | `Boolean` | 是否可用。 |
| `usage_count` | `Number` | 使用次数统计。 |
| `success_rate` | `Number` | 0~100，成功率。 |
| `average_processing_time` | `Number` | 平均处理耗时（秒）。 |
| `tags` | `String[]` | 关键词标签。 |
| `category` | `String` | 展示分类。 |
| `api_endpoint` | `String \| null` | 对外代理地址（预留）。 |
| `model_version` | `String` | 模型版本。 |
| `maintenance_mode` | `Boolean` | 维护模式开关。 |
| `maintenance_message` | `String \| null` | 维护提示语。 |
| `prompt_template` | `String \| null` | （由服务层写入）默认提示词模版。 |

## AIGeneration (`aigenerations`)

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `user_id` | `ObjectId` | 对应用户。 |
| `tool_key` | `String` | 工具标识。 |
| `tool_id` | `ObjectId` | 对应 `AiTool` 文档。 |
| `input_data` | `Mixed` | 入参快照（提示词、选项、上传文件元数据）。 |
| `output_data` | `Mixed` | 生成结果（图片列表、dataURL、文本输出等）。 |
| `status` | `String` | `pending/processing/completed/failed/cancelled`。 |
| `credits_used` | `Number` | 扣除积分。 |
| `total_credits_charged` | `Number` | 累计积分（预留给批量）。 |
| `processing_time` | `Number` | 处理耗时（秒）。 |
| `expires_at` | `Date` | 生成数据过期时间（默认 24h，TTL 清理）。 |
| `error_message` | `String \| null` | 失败原因。 |
| `metadata` | `Object` | 记录 prompt、分辨率、模型等细项。 |

常用索引：`user_id + created_at`、`tool_key`、`status`、`expires_at (TTL)`。

## CreditRecord (`creditrecords`)

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `user_id` | `ObjectId` | 关联用户。 |
| `type` | `String` | `earn/consumption/recharge/bonus/penalty/subscription/referral_reward`。 |
| `amount` | `Number` | 变动值（正负皆可）。 |
| `balance_before` / `balance_after` | `Number` | 余额变化前后。 |
| `description` | `String` | 文字描述。 |
| `related_transaction_id` | `String \| null` | 业务单号。 |
| `metadata` | `Object` | 关联工具、订阅或管理员操作信息。 |

## SubscriptionPlan (`subscriptionplans`)

核心字段：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `name` / `description` | `String` | 套餐标题、说明。 |
| `price` | `Number` | 标价。 |
| `duration_months` | `Number` | 订阅时长（按月）。 |
| `benefits` | `Object` | 包含 `monthly_credits`、`priority_processing`、`support_level` 等布尔开关或数值。 |
| `features` | `Array<{ name, description, enabled }>` | 展示型权益列表。 |
| `yearly_benefits` | `Object` | 年度会员额外权益（积分、专属特性等）。 |
| `limitations` | `Object` | 日/月调用限制与存储容量。 |
| `active` / `popular` | `Boolean` | 是否上架、是否推荐。 |
| `trial_days` | `Number` | 试用天数。 |
| `discount_percentage` | `Number` | 折扣百分比。 |
| `original_price` | `Number \| null` | 原价。 |
| `currency` | `String` | `CNY/USD/EUR`。 |
| `billing_cycle` | `String` | `monthly/yearly/one_time`。 |
| `auto_renewal` | `Boolean` | 默认是否自动续费。 |
| `cancellation_policy` | `String` | 取消策略文案。 |
| `is_yearly` / `yearly_price` | `Boolean` / `Number` | 年度会员标记与价格。 |

提供多个虚拟属性与静态方法（折扣价、节省金额、热门套餐等）。

## Subscription (`subscriptions`)

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `user_id` | `ObjectId` | 订阅用户。 |
| `plan_id` | `ObjectId` | 对应套餐。 |
| `start_date` / `end_date` | `Date` | 有效期区间。 |
| `status` | `String` | `active/expired/cancelled/suspended/trial`。 |
| `amount_paid` | `Number` | 实付金额。 |
| `currency` | `String` | 币种。 |
| `payment_method` | `String` | `alipay/wechat/stripe/paypal/admin`。 |
| `transaction_id` | `String` | 支付流水号。 |
| `auto_renewal` | `Boolean` | 是否自动续费。 |
| `renewal_date` | `Date \| null` | 最近续费时间。 |
| `cancelled_at` / `cancellation_reason` | `Date \| String` | 取消信息。 |
| `trial_end_date` | `Date \| null` | 试用结束时间。 |
| `credits_granted` | `Number` | 本订阅授予的积分。 |
| `credits_used` | `Number` | 已消耗积分。 |
| `is_yearly_member` | `Boolean` | 是否年度会员订阅。 |
| `yearly_credits_granted` | `Number` | 年度积分总额。 |
| `usage_stats` | `Object` | 生成次数、累计耗时、常用工具等统计。 |
| `metadata` | `Object` | 订单、推广、管理员操作附加信息。 |

## AIGeneration ⇄ FastAPI Payload

FastAPI 服务 `POST /generate/{tool_id}` 期望的请求体结构（JSON）如下：

```json
{
  "user_prompt": "可选，额外提示词",
  "options": {
    "resolution": "1080p",
    "mode": "fast",
    "quantity": 1,
    "...": "工具自定义参数"
  },
  "metadata": {
    "toolId": "ai-model",
    "faceSwap": true,
    "faceReferenceProvided": true,
    "hasMain": true,
    "hasReference": true,
    "origin": "node-backend",
    "userId": "64f...",
    "requestId": "ai-model-1730284983"
  },
  "images": [
    {
      "data": "<Base64>",
      "mime_type": "image/jpeg",
      "role": "base_model",
      "file_name": "model.jpg"
    },
    {
      "data": "<Base64>",
      "mime_type": "image/jpeg",
      "role": "face_reference",
      "file_name": "reference.jpg"
    }
  ]
}
```

响应体封装在统一结构中：

```json
{
  "success": true,
  "tool_id": "ai-model",
  "built_prompt": "系统拼装后的提示词",
  "options": {
    "mode": "fast",
    "quantity": 1,
    "aspect_ratio": "3:4",
    "resolution": { "width": 1920, "height": 2560, "label": "1080P (1920×1080)" }
  },
  "images": [
    { "index": 0, "data": "<Base64>", "mime_type": "image/png", "size_bytes": 812345 }
  ],
  "text_outputs": [],
  "timing_ms": 3540,
  "metadata": {
    "model_id": "gemini-2.5-flash-image",
    "aspect_ratio": "3:4",
    "resolution": { "width": 1920, "height": 2560, "label": "1080P (1920×1080)" },
    "mode": "fast",
    "quantity_request": 1,
    "input_metadata": { "...": "回传原始 metadata" }
  }
}
```

Node 服务会在入库后追加 `public_url`、`file_name` 等字段返回给前端，并落盘保存图片内容。

---

如需新增集合或为现有数据结构扩展字段，请在提交 PR 前同步更新本文件，保持跨团队同步。***
