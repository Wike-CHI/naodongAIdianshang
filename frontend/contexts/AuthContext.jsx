import React, { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'
import { API_ENDPOINTS } from '../config/api'

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

  useEffect(() => {
    // 优先使用本地 token 去获取最新用户（可以保证 token 生效）
    const token = localStorage.getItem('token')

    const init = async () => {
      if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
        try {
          const resp = await axios.get(API_ENDPOINTS.AUTH.CURRENT_USER)
          if (resp.data && resp.data.success) {
            const userObj = resp.data.data.user
            setUser(userObj)
            localStorage.setItem('naodong_user', JSON.stringify(userObj))
            setLoading(false)
            return
          }
        } catch (err) {
          console.warn('通过 token 获取当前用户失败，回退到本地缓存用户')
        }
      }

      // 回退：尝试读取保存的用户数据（兼容旧版）
      const savedUser = localStorage.getItem('naodong_user')
      if (savedUser && savedUser !== 'undefined') {
        try {
          setUser(JSON.parse(savedUser))
        } catch (error) {
          console.error('解析用户数据失败:', error)
          localStorage.removeItem('naodong_user')
        }
      }
      setLoading(false)
    }

    init()
  }, [])

  // login 现在同时可接收 token（可选）
  const login = (userData, token) => {
    if (token) {
      localStorage.setItem('token', token)
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    }
    setUser(userData)
    localStorage.setItem('naodong_user', JSON.stringify(userData))
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('naodong_user')
    localStorage.removeItem('token')
    delete axios.defaults.headers.common['Authorization']
  }

  const updateCredits = (newCredits) => {
    if (user) {
      const updatedUser = { ...user, credits: newCredits }
      setUser(updatedUser)
      localStorage.setItem('naodong_user', JSON.stringify(updatedUser))
    }
  }

  const updateUserInfo = (userInfo) => {
    // 合并并持久化用户信息
    const updatedUser = { ...(user || {}), ...userInfo }
    setUser(updatedUser)
    localStorage.setItem('naodong_user', JSON.stringify(updatedUser))
  }

  const value = {
    user,
    login,
    logout,
    updateCredits,
    updateUserInfo,
    loading,
    isAuthenticated: !!user
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}