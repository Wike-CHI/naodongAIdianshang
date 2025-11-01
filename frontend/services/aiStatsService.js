// AI统计服务
import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

// 创建axios实例
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器 - 添加认证token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
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
      // Token过期，清除本地存储
      localStorage.removeItem('token')
      localStorage.removeItem('naodong_user')
    }
    return Promise.reject(error.response?.data || error)
  }
)

const aiStatsService = {
  // 获取用户个人统计信息
  getPersonalStats: async () => {
    try {
      const response = await apiClient.get('/api/ai-stats/personal')
      return response // 直接返回response，因为响应拦截器已经处理了
    } catch (error) {
      console.error('获取个人统计信息失败:', error)
      throw error
    }
  },

  // 获取工具使用统计（管理员）
  getToolUsageStats: async (days = 30) => {
    try {
      const response = await apiClient.get(`/api/ai-stats/tool-usage?days=${days}`)
      return response // 直接返回response，因为响应拦截器已经处理了
    } catch (error) {
      console.error('获取工具使用统计失败:', error)
      throw error
    }
  },

  // 获取用户积分消费统计（管理员）
  getUserCreditStats: async (userId, days = 30) => {
    try {
      const response = await apiClient.get(`/api/ai-stats/user-credits/${userId}?days=${days}`)
      return response // 直接返回response，因为响应拦截器已经处理了
    } catch (error) {
      console.error('获取用户积分消费统计失败:', error)
      throw error
    }
  }
}

export default aiStatsService