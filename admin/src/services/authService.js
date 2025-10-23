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
      if (response.success && response.data) {
        return response.data // 返回 data 对象，包含 token 和 user
      } else {
        throw new Error(response.message || '登录失败')
      }
    } catch (error) {
      throw new Error(error.message || '登录失败')
    }
  },

  // 验证token
  verifyToken: async (token) => {
    try {
      const response = await apiClient.post('/admin/auth/verify', {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      if (response.success && response.data) {
        return response.data.user
      } else {
        throw new Error('Token无效')
      }
    } catch (error) {
      throw new Error('Token无效')
    }
  },

  // 退出登录
  logout: async () => {
    try {
      await apiClient.post('/admin/auth/logout')
    } catch (error) {
      console.log('Logout error:', error)
    }
  }
}

export default apiClient