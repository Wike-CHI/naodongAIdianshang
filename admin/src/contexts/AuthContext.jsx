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

  useEffect(() => {
    if (token) {
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
    } else {
      setLoading(false)
    }
  }, [token])

  const login = async (credentials) => {
    try {
      setLoading(true)
      const response = await authService.login(credentials)
      const { token: newToken, user: userData } = response
      
      localStorage.setItem('admin_token', newToken)
      setToken(newToken)
      setUser(userData)
      
      message.success('登录成功')
      return { success: true }
    } catch (error) {
      message.error(error.message || '登录失败')
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
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
    isAuthenticated: !!user
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}