import React from 'react'
import { Layout } from 'antd'
import { useTool } from '../../contexts/ToolContext' // 改回使用 useTool
import {
  UserOutlined,
  ShoppingOutlined,
  EyeOutlined,
  SkinOutlined,
  PlayCircleOutlined,
  ScissorOutlined,
  EnvironmentOutlined,
  FormatPainterOutlined,
  BgColorsOutlined
} from '@ant-design/icons'

const { Sider } = Layout

const Sidebar = () => {
  const { tools, selectedTool, setSelectedTool } = useTool() // 改回使用 useTool

  const getToolIcon = (toolId) => {
    const iconMap = {
      'ai-model': <UserOutlined />,
      'try-on-clothes': <ShoppingOutlined />,
      'glasses-tryon': <EyeOutlined />,
      // 隐藏姿态变换功能
      // 'pose-variation': <SkinOutlined />,
      'model-video': <PlayCircleOutlined />,
      'shoe-tryon': <ScissorOutlined />,
      'scene-change': <EnvironmentOutlined />,
      'color-change': <FormatPainterOutlined />,
      'background-removal': <BgColorsOutlined />
    }
    return iconMap[toolId] || <UserOutlined />
  }

  const handleToolSelect = (tool) => {
    setSelectedTool(tool)
  }

  return (
    <Sider 
      width={70} 
      style={{ 
        background: '#f8f9fa',
        borderRight: '1px solid #e8e9ea'
      }}
    >
      <div style={{ 
        padding: '16px 0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        height: '100%'
      }}>
        {tools.map(tool => (
          <div key={tool.id} style={{ marginBottom: '12px' }}>
            <div
              onClick={() => handleToolSelect(tool)}
              style={{
                width: '48px',
                height: '48px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '8px',
                cursor: 'pointer',
                backgroundColor: selectedTool?.id === tool.id ? '#1890ff' : 'transparent',
                color: selectedTool?.id === tool.id ? 'white' : '#666',
                fontSize: '20px',
                transition: 'all 0.2s ease',
                margin: '0 auto'
              }}
              onMouseEnter={(e) => {
                if (selectedTool?.id !== tool.id) {
                  e.target.style.backgroundColor = '#f0f0f0'
                }
              }}
              onMouseLeave={(e) => {
                if (selectedTool?.id !== tool.id) {
                  e.target.style.backgroundColor = 'transparent'
                }
              }}
            >
              {getToolIcon(tool.id)}
            </div>
            <div style={{
              fontSize: '10px',
              color: selectedTool?.id === tool.id ? '#1890ff' : '#666',
              textAlign: 'center',
              marginTop: '4px',
              lineHeight: '12px',
              wordBreak: 'break-all',
              maxWidth: '60px',
              margin: '4px auto 0'
            }}>
              {tool.name}
            </div>
          </div>
        ))}
      </div>
    </Sider>
  )
}

export default Sidebar