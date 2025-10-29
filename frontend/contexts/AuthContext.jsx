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
    // 确保用户数据包含所有必要字段
    const normalizedUser = {
      ...userData,
      credits: userData.credits || userData.credits_balance || 0,
      credits_balance: userData.credits_balance || userData.credits || 0,
      membershipType: userData.membershipType || userData.role || 'user'
    }
    
    setUser(normalizedUser)
    localStorage.setItem('naodong_user', JSON.stringify(normalizedUser))
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('naodong_user')
  }

  const updateCredits = (newCredits) => {
    if (user) {
      const updatedUser = { 
        ...user, 
        credits: newCredits,
        credits_balance: newCredits // 同时更新两个字段以确保一致性
      }
      setUser(updatedUser)
      localStorage.setItem('naodong_user', JSON.stringify(updatedUser))
    }
  }

  const updateUserInfo = (userInfo) => {
    if (user) {
      // 确保用户数据包含所有必要字段
      const normalizedUserInfo = {
        ...userInfo,
        credits: userInfo.credits || userInfo.credits_balance || user.credits || user.credits_balance || 0,
        credits_balance: userInfo.credits_balance || userInfo.credits || user.credits_balance || user.credits || 0,
        membershipType: userInfo.membershipType || userInfo.role || user.membershipType || user.role || 'user'
      }
      
      const updatedUser = { ...user, ...normalizedUserInfo }
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