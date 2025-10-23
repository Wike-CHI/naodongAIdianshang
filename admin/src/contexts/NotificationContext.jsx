import React, { createContext, useContext } from 'react'
import { notification } from 'antd'

const NotificationContext = createContext()

export const useNotification = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider')
  }
  return context
}

export const NotificationProvider = ({ children }) => {
  const [api, contextHolder] = notification.useNotification()

  const showSuccess = (message, description) => {
    api.success({
      message,
      description,
      placement: 'topRight',
      duration: 3
    })
  }

  const showError = (message, description) => {
    api.error({
      message,
      description,
      placement: 'topRight',
      duration: 4
    })
  }

  const showWarning = (message, description) => {
    api.warning({
      message,
      description,
      placement: 'topRight',
      duration: 3
    })
  }

  const showInfo = (message, description) => {
    api.info({
      message,
      description,
      placement: 'topRight',
      duration: 3
    })
  }

  const value = {
    showSuccess,
    showError,
    showWarning,
    showInfo
  }

  return (
    <NotificationContext.Provider value={value}>
      {contextHolder}
      {children}
    </NotificationContext.Provider>
  )
}