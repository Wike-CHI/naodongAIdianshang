# Naodong AI 自动化测试套件

这个目录包含了用于自动化测试脑洞AI网站和管理后台的测试脚本。

## 目录结构

```
tests/
├── config.js              # 测试配置文件
├── index.js               # 主测试入口
├── frontend-tests.js      # 前端基础测试
├── admin-tests.js         # 管理后台基础测试
├── backend-tests.js       # 后端API测试
├── frontend-detailed-tests.js  # 前端详细测试
├── admin-detailed-tests.js     # 管理后台详细测试
├── test-reporter.js       # 测试报告生成器
├── run-tests.js           # 测试运行脚本
├── test-suite.js          # 测试套件管理
├── package.json           # 测试依赖配置
└── README.md              # 本文件
```

## 安装依赖

在运行测试之前，需要安装必要的依赖：

```bash
cd tests
npm install
```

## 运行测试

### 运行所有测试

```bash
npm test
# 或者
npm run test:all
```

### 运行特定测试

```bash
# 运行前端测试
npm run test:frontend

# 运行管理后台测试
npm run test:admin

# 运行后端API测试
npm run test:backend

# 运行前端详细测试
npm run test:frontend-detailed

# 运行管理后台详细测试
npm run test:admin-detailed
```

## 测试配置

测试配置在 `config.js` 文件中定义，包括：

- 前端、管理后台和后端的URL
- 测试用户凭证
- 浏览器设置
- 测试超时设置

## 测试内容

### 前端测试 (frontend-tests.js)

- 首页加载测试
- 登录/注册页面导航
- AI工具页面功能
- 导航元素检查
- 表单元素验证

### 管理后台测试 (admin-tests.js)

- 管理员登录功能
- 仪表板页面加载
- 用户管理页面
- AI工具管理页面
- 订阅管理页面
- 积分管理页面

### 后端API测试 (backend-tests.js)

- 健康检查端点
- 认证相关端点
- 用户管理端点
- AI工具端点
- 订阅相关端点
- 积分相关端点

### 详细测试

详细测试包含更深入的功能验证和用户交互测试。

## 注意事项

1. 确保在运行测试之前，前端、管理后台和后端服务都在运行
2. 测试配置中的URL需要根据实际部署环境进行调整
3. 某些测试可能需要有效的用户凭证
4. 浏览器测试在无头模式下运行更快，但设置为可见模式便于调试