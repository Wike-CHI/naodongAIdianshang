import React from 'react'
import { Input } from 'antd'

const { TextArea } = Input

const PromptInput = ({ value, onChange, placeholder }) => {
  return (
    <TextArea
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      placeholder={placeholder || '输入描述词...'}
      rows={4}
      showCount
      maxLength={500}
      style={{ resize: 'none' }}
    />
  )
}

export default PromptInput