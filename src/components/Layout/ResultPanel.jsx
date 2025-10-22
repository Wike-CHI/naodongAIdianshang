import React from 'react'
import { Card, Typography, Button, Space, Empty, Image, Tooltip } from 'antd'
import { DownloadOutlined, RedoOutlined, HeartOutlined } from '@ant-design/icons'
import { useToolContext } from '../../contexts/ToolContext'
import { useAuth } from '../../contexts/AuthContext'

const { Title, Text } = Typography

const ResultPanel = () => {
  const { generationHistory, isGenerating } = useToolContext()
  const { isAuthenticated } = useAuth()

  const handleDownload = (imageUrl, filename) => {
    const link = document.createElement('a')
    link.href = imageUrl
    link.download = filename || `naodong-ai-${Date.now()}.jpg`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleRegenerate = () => {
    // 重新生成逻辑
    console.log('重新生成')
  }

  const handleFavorite = () => {
    // 收藏逻辑
    console.log('收藏')
  }

  return (
    <div className="result-panel">
      <div style={{ 
        padding: '20px 16px', 
        borderBottom: '1px solid #f0f0f0',
        background: 'white'
      }}>
        <Title level={4} style={{ margin: 0 }}>
          生成结果
        </Title>
      </div>
      
      <div style={{ 
        flex: 1, 
        padding: '16px',
        background: 'white',
        overflow: 'auto'
      }}>

      {isGenerating && (
        <Card style={{ marginBottom: '16px' }}>
          <div style={{ 
            textAlign: 'center', 
            padding: '40px 20px',
            color: '#666'
          }}>
            <div className="loading-spinner" style={{ 
              width: '40px', 
              height: '40px', 
              border: '3px solid #f3f3f3',
              borderTop: '3px solid #1890ff',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px'
            }} />
            <Text>AI正在努力生成中...</Text>
          </div>
        </Card>
      )}

      {generationHistory.length === 0 && !isGenerating ? (
        <Empty 
          description="暂无生成结果"
          style={{ marginTop: '60px' }}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {generationHistory.map((result) => (
            <Card key={result.id} size="small">
              <div style={{ marginBottom: '12px' }}>
                <Image
                  src={result.resultImage}
                  alt="生成结果"
                  style={{ 
                    width: '100%', 
                    borderRadius: '6px',
                    maxHeight: '200px',
                    objectFit: 'cover'
                  }}
                  preview={{
                    mask: '预览'
                  }}
                />
              </div>
              
              <div style={{ marginBottom: '12px' }}>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  {new Date(result.createdAt).toLocaleString()}
                </Text>
                <br />
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  消耗 {result.creditsCost} 积分
                </Text>
              </div>

              <Space size="small" style={{ width: '100%', justifyContent: 'space-between' }}>
                <Tooltip title="下载图片">
                  <Button 
                    type="text" 
                    icon={<DownloadOutlined />}
                    size="small"
                    onClick={() => handleDownload(result.resultImage, `result-${result.id}.jpg`)}
                  />
                </Tooltip>
                
                <Tooltip title="重新生成">
                  <Button 
                    type="text" 
                    icon={<RedoOutlined />}
                    size="small"
                    onClick={handleRegenerate}
                  />
                </Tooltip>
                
                <Tooltip title="收藏">
                  <Button 
                    type="text" 
                    icon={<HeartOutlined />}
                    size="small"
                    onClick={handleFavorite}
                  />
                </Tooltip>
              </Space>
            </Card>
          ))}
        </div>
      )}

      {!isAuthenticated && (
        <div style={{ 
          marginTop: '20px',
          padding: '16px',
          background: '#f6ffed',
          border: '1px solid #b7eb8f',
          borderRadius: '6px',
          textAlign: 'center'
        }}>
          <Text style={{ fontSize: '12px', color: '#52c41a' }}>
            登录后可查看生成历史
          </Text>
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      </div>
    </div>
  )
}

export default ResultPanel