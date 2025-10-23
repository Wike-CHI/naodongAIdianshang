import React, { createContext, useContext, useState, useEffect } from 'react'

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
    // 从本地存储加载用户信息
    const savedUser = localStorage.getItem('naodong_user')
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
    setLoading(false)
  }, [])

  const login = (userData) => {
    setUser(userData)
    localStorage.setItem('naodong_user', JSON.stringify(userData))
    // 如果有token，也保存到localStorage
    if (userData.token) {
      localStorage.setItem('token', userData.token)
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('naodong_user')
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('adminToken')
    localStorage.removeItem('admin')
  }

  const updateCredits = (newCredits) => {
    if (user) {
      const updatedUser = { ...user, credits: newCredits }
      setUser(updatedUser)
      localStorage.setItem('naodong_user', JSON.stringify(updatedUser))
    }
  }

  const updateUserInfo = (userInfo) => {
    if (user) {
      const updatedUser = { ...user, ...userInfo }
      setUser(updatedUser)
      localStorage.setItem('naodong_user', JSON.stringify(updatedUser))
    }
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