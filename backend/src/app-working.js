const express = require('express')
const cors = require('cors')
const morgan = require('morgan')
const helmet = require('helmet')

const app = express()
const PORT = process.env.PORT || 8080

// 中间件
app.use(helmet())
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true
}))
app.use(morgan('combined'))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// 基础路由
app.get('/', (req, res) => {
  res.json({ message: '脑洞AI后端服务运行中', version: '1.0.0' })
})

// API路由
app.use('/api', (req, res, next) => {
  console.log(`API请求: ${req.method} ${req.path}`)
  next()
})

// 管理员认证路由
app.post('/api/admin/auth/login', (req, res) => {
  const { username, password } = req.body
  
  // TODO: 实现真实的用户认证逻辑，连接数据库验证用户
  if (username === 'admin' && password === 'admin123') {
    // TODO: 生成真实的JWT token而不是mock token
    res.json({
      success: true,
      token: 'jwt-token-placeholder', // 需要替换为真实的JWT token
      user: {
        id: 1,
        username: 'admin',
        role: 'admin'
      }
    })
  } else {
    res.status(401).json({
      success: false,
      message: '用户名或密码错误'
    })
  }
})

// 管理员token验证路由
app.get('/api/admin/auth/verify', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '')
  
  // TODO: 实现真实的JWT token验证逻辑
  if (token === 'jwt-token-placeholder') {
    res.json({
      success: true,
      user: {
        id: 1,
        username: 'admin',
        role: 'admin'
      }
    })
  } else {
    res.status(401).json({
      success: false,
      message: 'Token无效'
    })
  }
})

// 管理员工具列表路由
app.get('/api/admin/tools', (req, res) => {
  // TODO: 从数据库获取真实的工具列表
  res.json({
    success: true,
    data: [] // 暂时返回空数据，等待数据库集成
  })
})

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ message: '服务器内部错误' })
})

// 404处理
app.use((req, res) => {
  res.status(404).json({ message: '接口不存在' })
})

app.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`)
  console.log(`访问地址: http://localhost:${PORT}`)
})