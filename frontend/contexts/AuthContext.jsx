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
    if (savedUser && savedUser !== 'undefined') {
      try {
        setUser(JSON.parse(savedUser))
      } catch (error) {
        console.error('解析用户数据失败:', error)
        localStorage.removeItem('naodong_user')
      }
    }
    setLoading(false)
  }, [])

  const login = (userData) => {
    setUser(userData)
    localStorage.setItem('naodong_user', JSON.stringify(userData))
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('naodong_user')
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