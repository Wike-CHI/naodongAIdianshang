import React, { createContext, useContext, useState, useEffect } from 'react'
import { message } from 'antd'
import authService from '../services/authService'
import { authAPI } from '../services/api'

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
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // 检查本地存储的认证信息
  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('admin_token')
      const userData = localStorage.getItem('admin_user')
      
      if (token && userData) {
        // 验证token是否有效
        try {
          const result = await authAPI.getCurrentUser();
          if (result.success) {
            setUser(result.data.user);
            setIsAuthenticated(true);
            // 更新本地存储的用户数据
            localStorage.setItem('admin_user', JSON.stringify(result.data.user));
          } else {
            // Token无效，清除本地存储
            clearAuthData();
          }
        } catch (error) {
          // Token无效，清除本地存储
          clearAuthData();
        }
      }
    } catch (error) {
      console.error('验证认证状态失败:', error)
      clearAuthData()
    } finally {
      setLoading(false)
    }
  }

  const login = async (credentials) => {
    try {
      setLoading(true)
      const result = await authService.login(credentials)
      
      if (result.success) {
        const { token, user: userData } = result.data
        
        // 保存认证信息到本地存储
        localStorage.setItem('admin_token', token)
        localStorage.setItem('admin_user', JSON.stringify(userData))
        
        setUser(userData)
        setIsAuthenticated(true)
        message.success('登录成功')
        
        return { success: true }
      } else {
        message.error(result.message || '登录失败')
        return { success: false, message: result.message }
      }
    } catch (error) {
      console.error('登录失败:', error)
      const errorMessage = error.message || '登录失败，请稍后重试'
      message.error(errorMessage)
      return { success: false, message: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      await authService.logout()
    } catch (error) {
      console.error('登出失败:', error)
    } finally {
      clearAuthData()
      message.success('已退出登录')
    }
  }

  const clearAuthData = () => {
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_user')
    setUser(null)
    setIsAuthenticated(false)
  }

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    checkAuthStatus
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}