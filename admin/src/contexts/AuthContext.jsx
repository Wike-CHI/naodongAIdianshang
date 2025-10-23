import React, { createContext, useContext, useState, useEffect } from 'react'
import { message } from 'antd'
import { authService } from '../services/authService'

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
  const [token, setToken] = useState(localStorage.getItem('admin_token'))
  const [isLoggingIn, setIsLoggingIn] = useState(false) // 添加登录状态标记

  useEffect(() => {
    // 只在非登录过程中验证token
    if (token && !isLoggingIn) {
      // 验证token有效性
      authService.verifyToken(token)
        .then(userData => {
          setUser(userData)
        })
        .catch(() => {
          localStorage.removeItem('admin_token')
          setToken(null)
        })
        .finally(() => {
          setLoading(false)
        })
    } else if (!token) {
      setLoading(false)
    }
  }, [token, isLoggingIn])

  const login = async (credentials) => {
    try {
      setLoading(true)
      setIsLoggingIn(true) // 标记开始登录
      
      const response = await authService.login(credentials)
      const { token: newToken, user: userData } = response
      
      localStorage.setItem('admin_token', newToken)
      setToken(newToken)
      setUser(userData)
      
      message.success('登录成功')
      
      // 延迟清除登录状态，确保状态稳定
      setTimeout(() => {
        setIsLoggingIn(false)
        setLoading(false)
      }, 200)
      
      return { success: true }
    } catch (error) {
      message.error(error.message || '登录失败')
      return { success: false, error: error.message }
    } finally {
      // 确保登录状态被清除
      setTimeout(() => {
        setIsLoggingIn(false)
        setLoading(false)
      }, 100)
    }
  }

  const logout = () => {
    localStorage.removeItem('admin_token')
    setToken(null)
    setUser(null)
    message.success('已退出登录')
  }

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    isAuthenticated: !!user && !!token
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}