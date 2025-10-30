import React, { createContext, useContext, useState, useEffect } from 'react'
import authService from '../services/authService'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authLoading, setAuthLoading] = useState(false)
  const [authError, setAuthError] = useState(null)

  useEffect(() => {
    console.log('🔄 初始化认证上下文')
    initAuth()
  }, [])

  const initAuth = async () => {
    try {
      console.log('🔍 检查本地认证状态')
      // 优先使用本地 token 去获取最新用户（可以保证 token 生效）
      const token = localStorage.getItem('token')

      if (token) {
        console.log('🔑 发现本地token，尝试获取用户信息')
        try {
          const resp = await authService.getCurrentUser()
          if (resp && resp.success) {
            const userObj = resp.data.user
            // 确保用户对象使用统一的积分字段
            const normalizedUser = normalizeUserObject(userObj)
            setUser(normalizedUser)
            localStorage.setItem('naodong_user', JSON.stringify(normalizedUser))
            console.log('✅ 用户认证成功:', normalizedUser)
          } else {
            console.warn('⚠️ 获取用户信息失败:', resp?.message)
            clearAuthData()
          }
        } catch (err) {
          console.warn('⚠️ 通过 token 获取当前用户失败，清除认证数据')
          clearAuthData()
        }
      } else {
        console.log('ℹ️ 未发现本地token，检查本地用户数据')
        // 回退：尝试读取保存的用户数据（兼容旧版）
        const savedUser = localStorage.getItem('naodong_user')
        if (savedUser && savedUser !== 'undefined') {
          try {
            const userObj = JSON.parse(savedUser)
            // 确保用户对象使用统一的积分字段
            const normalizedUser = normalizeUserObject(userObj)
            setUser(normalizedUser)
            console.log('✅ 从本地存储恢复用户数据:', normalizedUser)
          } catch (error) {
            console.error('❌ 解析本地用户数据失败:', error)
            localStorage.removeItem('naodong_user')
          }
        }
      }
    } catch (error) {
      console.error('❌ 初始化认证失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 清除认证数据
  const clearAuthData = () => {
    console.log('🧹 清除认证数据')
    setUser(null)
    localStorage.removeItem('naodong_user')
    localStorage.removeItem('token')
  }

  // 标准化用户对象，确保积分字段一致性
  const normalizeUserObject = (userObj) => {
    if (!userObj) return null;
    
    const normalized = {
      ...userObj,
      // 确保积分字段一致性
      credits: userObj.credits_balance !== undefined ? userObj.credits_balance : 
               userObj.credits !== undefined ? userObj.credits : 0,
      credits_balance: userObj.credits_balance !== undefined ? userObj.credits_balance : 
                       userObj.credits !== undefined ? userObj.credits : 0
    };
    
    console.log('🔧 标准化用户对象:', { original: userObj, normalized })
    return normalized;
  }

  // 用户注册
  const register = async (userData) => {
    try {
      setAuthLoading(true)
      setAuthError(null)
      console.log('📝 开始注册用户:', userData)
      
      const response = await authService.register(userData)
      
      if (response.success) {
        const { user, token } = response.data
        const normalizedUser = normalizeUserObject(user)
        
        // 设置认证状态
        setUser(normalizedUser)
        localStorage.setItem('token', token)
        localStorage.setItem('naodong_user', JSON.stringify(normalizedUser))
        
        console.log('✅ 用户注册成功:', { user: normalizedUser, token })
        return { success: true, user: normalizedUser }
      } else {
        throw new Error(response.message || '注册失败')
      }
    } catch (error) {
      console.error('❌ 用户注册失败:', error)
      setAuthError(error.message || '注册失败')
      return { success: false, error: error.message || '注册失败' }
    } finally {
      setAuthLoading(false)
    }
  }

  // 用户登录
  const login = async (credentials) => {
    try {
      setAuthLoading(true)
      setAuthError(null)
      console.log('🔐 开始用户登录:', credentials)
      
      const response = await authService.login(credentials)
      
      if (response.success) {
        const { user, token } = response.data
        const normalizedUser = normalizeUserObject(user)
        
        // 设置认证状态
        setUser(normalizedUser)
        localStorage.setItem('token', token)
        localStorage.setItem('naodong_user', JSON.stringify(normalizedUser))
        
        console.log('✅ 用户登录成功:', { user: normalizedUser, token })
        return { success: true, user: normalizedUser }
      } else {
        throw new Error(response.message || '登录失败')
      }
    } catch (error) {
      console.error('❌ 用户登录失败:', error)
      setAuthError(error.response?.data?.message || error.message || '登录失败')
      return { success: false, error: error.response?.data?.message || error.message || '登录失败' }
    } finally {
      setAuthLoading(false)
    }
  }

  // 微信登录
  const wechatLogin = async () => {
    try {
      setAuthLoading(true)
      setAuthError(null)
      console.log('📱 开始微信登录')
      
      const response = await authService.wechatLogin()
      
      if (response.success) {
        const { user, token } = response.data
        const normalizedUser = normalizeUserObject(user)
        
        // 设置认证状态
        setUser(normalizedUser)
        localStorage.setItem('token', token)
        localStorage.setItem('naodong_user', JSON.stringify(normalizedUser))
        
        console.log('✅ 微信登录成功:', { user: normalizedUser, token })
        return { success: true, user: normalizedUser }
      } else {
        throw new Error(response.message || '微信登录失败')
      }
    } catch (error) {
      console.error('❌ 微信登录失败:', error)
      setAuthError(error.message || '微信登录失败')
      return { success: false, error: error.message || '微信登录失败' }
    } finally {
      setAuthLoading(false)
    }
  }

  // 用户登出
  const logout = async () => {
    try {
      console.log('🚪 开始用户登出')
      await authService.logout()
    } catch (error) {
      console.error('⚠️ 登出请求失败（但仍清除本地数据）:', error)
    } finally {
      // 无论如何都清除本地认证数据
      clearAuthData()
      console.log('✅ 用户已登出')
    }
  }

  // 更新积分
  const updateCredits = (newCredits) => {
    if (user) {
      const updatedUser = { 
        ...user, 
        credits: newCredits,
        credits_balance: newCredits // 同时更新credits_balance字段以保持一致性
      }
      setUser(updatedUser)
      localStorage.setItem('naodong_user', JSON.stringify(updatedUser))
      console.log('💳 积分已更新:', newCredits)
    }
  }

  // 更新完整用户信息
  const updateUserInfo = (userInfo) => {
    // 合并并持久化用户信息，确保积分字段一致性
    const updatedUser = normalizeUserObject({ 
      ...(user || {}), 
      ...userInfo
    });
    setUser(updatedUser);
    localStorage.setItem('naodong_user', JSON.stringify(updatedUser));
    console.log('👤 用户信息已更新:', updatedUser);
  }

  const value = {
    user,
    login,
    logout,
    register,
    wechatLogin,
    updateCredits,
    updateUserInfo,
    loading,
    authLoading,
    authError,
    isAuthenticated: !!user,
    clearAuthError: () => setAuthError(null)
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}