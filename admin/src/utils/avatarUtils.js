// 头像工具函数
import React from 'react'
import { UserOutlined } from '@ant-design/icons'

// 默认头像SVG - 根据seed生成不同颜色
const generateDefaultAvatar = (seed) => {
  const colors = ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1', '#13c2c2', '#eb2f96', '#fa8c16']
  const colorIndex = seed ? parseInt(seed) % colors.length : 0
  const color = colors[colorIndex]
  
  return `data:image/svg+xml;base64,${btoa(`
<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
  <circle cx="20" cy="20" r="20" fill="${color}"/>
  <circle cx="20" cy="16" r="6" fill="white" opacity="0.8"/>
  <path d="M8 32c0-6.627 5.373-12 12-12s12 5.373 12 12" fill="white" opacity="0.8"/>
</svg>
`)}`
}

const DEFAULT_AVATAR_SVG = generateDefaultAvatar()

// 生成头像URL的函数
export const generateAvatarUrl = (seed, fallback = DEFAULT_AVATAR_SVG) => {
  if (!seed) return fallback
  
  // 根据seed生成不同颜色的默认头像
  return generateDefaultAvatar(seed)
}

// 头像组件，带错误处理
export const AvatarWithFallback = ({ seed, size = 40, style = {}, ...props }) => {
  const handleError = (e) => {
    // 如果头像加载失败，使用默认头像
    e.target.src = generateDefaultAvatar(seed || '0')
  }

  return React.createElement('img', {
    src: generateAvatarUrl(seed),
    alt: 'Avatar',
    style: {
      width: size,
      height: size,
      borderRadius: '50%',
      objectFit: 'cover',
      ...style
    },
    onError: handleError,
    ...props
  })
}

// 获取默认头像
export const getDefaultAvatar = () => DEFAULT_AVATAR_SVG

// 检查URL是否可访问
export const checkAvatarUrl = async (url) => {
  try {
    const response = await fetch(url, { method: 'HEAD' })
    return response.ok
  } catch (error) {
    return false
  }
}