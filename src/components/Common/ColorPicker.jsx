import React, { useState } from 'react'
import { ColorPicker as AntColorPicker } from 'antd'

const ColorPicker = ({ value, onChange, placeholder }) => {
  const [color, setColor] = useState(value || '#1890ff')

  const handleColorChange = (colorValue) => {
    const hexColor = colorValue.toHexString()
    setColor(hexColor)
    if (onChange) {
      onChange(hexColor)
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <AntColorPicker
        value={color}
        onChange={handleColorChange}
        showText
        format="hex"
        size="large"
        style={{ width: '120px' }}
      />
      <span style={{ 
        fontSize: '14px', 
        color: '#666',
        fontFamily: 'monospace',
        minWidth: '80px'
      }}>
        {color}
      </span>
    </div>
  )
}

export default ColorPicker