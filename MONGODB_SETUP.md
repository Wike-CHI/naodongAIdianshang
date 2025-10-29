# MongoDB 本地数据库设置指南

## 方案一：使用 Docker（推荐）

### 1. 安装 Docker Desktop
- 访问 [Docker Desktop 官网](https://www.docker.com/products/docker-desktop/)
- 下载并安装适合 Windows 的版本
- 启动 Docker Desktop

### 2. 启动 MongoDB 服务
```bash
# 在项目根目录执行
docker-compose up -d mongodb
```

### 3. 验证 MongoDB 运行状态
```bash
# 检查容器状态
docker ps

# 查看 MongoDB 日志
docker logs naodong_ai_mongodb
```

### 4. 初始化数据库结构
```bash
# 安装必要的依赖
cd backend
npm install mongodb bcrypt

# 运行初始化脚本
node scripts/init-mongodb.js
```

### 5. 可选：启动 MongoDB 管理界面
```bash
# 启动 Mongo Express（Web管理界面）
docker-compose up -d mongo-express

# 访问 http://localhost:8081
# 用户名: admin
# 密码: admin123
```

## 方案二：直接安装 MongoDB

### 1. 下载 MongoDB Community Server
- 访问 [MongoDB 官网](https://www.mongodb.com/try/download/community)
- 选择 Windows 版本下载
- 运行安装程序，选择 "Complete" 安装

### 2. 配置 MongoDB 服务
- 安装时选择 "Install MongoDB as a Service"
- 服务名称: MongoDB
- 数据目录: C:\Program Files\MongoDB\Server\6.0\data
- 日志目录: C:\Program Files\MongoDB\Server\6.0\log

### 3. 启动 MongoDB 服务
```bash
# 启动服务
net start MongoDB

# 或使用 MongoDB 命令
mongod --dbpath "C:\Program Files\MongoDB\Server\6.0\data"
```

### 4. 验证安装
```bash
# 连接到 MongoDB
mongo

# 或使用新版本命令
mongosh
```

### 5. 初始化数据库
```bash
# 在项目根目录
cd backend
npm install mongodb bcrypt
node scripts/init-mongodb.js
```

## 连接配置

### 环境变量设置
在 `backend/.env` 文件中添加：

```env
# MongoDB 连接配置
MONGODB_URI=mongodb://localhost:27017/naodong_ai

# 如果使用 Docker 且需要认证
# MONGODB_URI=mongodb://naodong_user:naodong_pass@localhost:27017/naodong_ai

# JWT 密钥
JWT_SECRET=your_jwt_secret_key_here

# 服务器端口（后端服务）
# 推荐：8080 （后端代码 `server.js` 使用 `process.env.PORT || 8080`）
PORT=8080

# 注意：仓库中 3001 常用于本地运行的 nanobanana AI 服务（`NANOBANANA_API_URL`），
# 请不要将 3001 与后端服务端口混淆；如果你在同一台机器运行 nanobanana，
# 请为其保留 3001 或通过环境变量单独配置 `NANOBANANA_API_URL`。
```

## 数据库结构

初始化脚本将创建以下集合：

1. **users** - 用户信息
2. **admin_users** - 管理员用户
3. **ai_tools** - AI工具配置
4. **credit_records** - 积分记录
5. **subscription_plans** - 订阅套餐
6. **subscriptions** - 用户订阅记录
7. **ai_generations** - AI生成记录
8. **upload_files** - 文件上传记录

## 默认账户

### 管理员账户
- 用户名: `admin`
- 密码: `admin123`
- 角色: 超级管理员

## 常用命令

```bash
# 查看所有数据库
show dbs

# 切换到项目数据库
use naodong_ai

# 查看所有集合
show collections

# 查看用户集合
db.users.find()

# 查看管理员用户
db.admin_users.find()

# 查看AI工具
db.ai_tools.find()
```

## 故障排除

### 1. 端口占用问题
```bash
# 检查端口占用
netstat -ano | findstr :27017

# 停止占用进程
taskkill /PID <进程ID> /F
```

### 2. 权限问题
- 确保以管理员身份运行命令提示符
- 检查防火墙设置

### 3. 连接失败
- 确认 MongoDB 服务正在运行
- 检查连接字符串是否正确
- 验证网络连接

## 备份与恢复

### 备份数据库
```bash
mongodump --db naodong_ai --out ./backup
```

### 恢复数据库
```bash
mongorestore --db naodong_ai ./backup/naodong_ai
```