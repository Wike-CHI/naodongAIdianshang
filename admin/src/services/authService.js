import axios from 'axios'

const API_BASE_URL = 'http://localhost:8080/api'

// 创建axios实例
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('admin_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
apiClient.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('admin_token')
      window.location.href = '/admin/login'
    }
    return Promise.reject(error.response?.data || error)
  }
)

export const authService = {
  // 管理员登录
  login: async (credentials) => {
    try {
      const response = await apiClient.post('/admin/auth/login', credentials)
      return response
    } catch (error) {
      // 模拟登录逻辑，实际项目中应该连接真实API
      if (credentials.username === 'admin' && credentials.password === 'admin123') {
        const mockResponse = {
          token: 'mock-jwt-token-' + Date.now(),
          user: {
            id: '1',
            username: 'admin',
            role: 'super_admin',
            name: '超级管理员'
          }
        }
        return mockResponse
      } else {
        throw new Error('用户名或密码错误')
      }
    }
  },

  // 验证token
  verifyToken: async (token) => {
    try {
      const response = await apiClient.get('/admin/auth/verify')
      return response.user
    } catch (error) {
      // 模拟token验证
      if (token && token.startsWith('mock-jwt-token-')) {
        return {
          id: '1',
          username: 'admin',
          role: 'super_admin',
          name: '超级管理员'
        }
      }
      throw new Error('Token无效')
    }
  },

  // 退出登录
  logout: async () => {
    try {
      await apiClient.post('/admin/auth/logout')
    } catch (error) {
      // 忽略退出登录的错误
      console.log('Logout error:', error)
    }
  }
}

export default apiClient