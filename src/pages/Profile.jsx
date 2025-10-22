import React from 'react'
import { Layout, Card, Row, Col, Avatar, Typography, Button, Statistic, List, Tag, Space } from 'antd'
import { UserOutlined, WalletOutlined, CrownOutlined, HistoryOutlined, SettingOutlined } from '@ant-design/icons'
import { useAuth } from '../contexts/AuthContext'
import { useTool } from '../contexts/ToolContext'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Layout/Header'

const { Content } = Layout
const { Title, Text } = Typography

const Profile = () => {
  const { user } = useAuth()
  const { generationHistory } = useTool()
  const navigate = useNavigate()

  if (!user) {
    navigate('/login')
    return null
  }

  const recentGenerations = generationHistory.slice(0, 5)

  return (
    <Layout className="app-layout">
      <Header />
      <Content style={{ padding: '24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <Row gutter={[24, 24]}>
            {/* 用户信息卡片 */}
            <Col xs={24} lg={8}>
              <Card>
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                  <Avatar 
                    size={80} 
                    src={user.avatar} 
                    icon={<UserOutlined />}
                    style={{ marginBottom: '16px' }}
                  />
                  <Title level={4} style={{ margin: 0 }}>
                    {user.username}
                  </Title>
                  <Text type="secondary">
                    {user.loginMethod === 'wechat' ? '微信用户' : '注册用户'}
                  </Text>
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Statistic
                        title="剩余积分"
                        value={user.credits}
                        prefix={<WalletOutlined />}
                        valueStyle={{ color: '#52c41a' }}
                      />
                    </Col>
                    <Col span={12}>
                      <Statistic
                        title="会员状态"
                        value={user.membershipType === 'vip' ? 'VIP' : '普通'}
                        prefix={<CrownOutlined />}
                        valueStyle={{ 
                          color: user.membershipType === 'vip' ? '#faad14' : '#666' 
                        }}
                      />
                    </Col>
                  </Row>
                </div>

                <Space direction="vertical" style={{ width: '100%' }}>
                  <Button 
                    type="primary" 
                    block 
                    icon={<WalletOutlined />}
                    onClick={() => navigate('/subscription')}
                  >
                    充值积分
                  </Button>
                  
                  {user.membershipType !== 'vip' && (
                    <Button 
                      block 
                      icon={<CrownOutlined />}
                      onClick={() => navigate('/subscription')}
                    >
                      升级VIP
                    </Button>
                  )}
                  
                  <Button 
                    block 
                    icon={<SettingOutlined />}
                  >
                    账号设置
                  </Button>
                </Space>
              </Card>
            </Col>

            {/* 使用统计 */}
            <Col xs={24} lg={16}>
              <Card title="使用统计" style={{ marginBottom: '24px' }}>
                <Row gutter={16}>
                  <Col xs={12} sm={6}>
                    <Statistic
                      title="总生成次数"
                      value={generationHistory.length}
                      suffix="次"
                    />
                  </Col>
                  <Col xs={12} sm={6}>
                    <Statistic
                      title="今日生成"
                      value={generationHistory.filter(item => 
                        new Date(item.createdAt).toDateString() === new Date().toDateString()
                      ).length}
                      suffix="次"
                    />
                  </Col>
                  <Col xs={12} sm={6}>
                    <Statistic
                      title="累计消耗"
                      value={generationHistory.reduce((sum, item) => sum + item.creditsCost, 0)}
                      suffix="积分"
                    />
                  </Col>
                  <Col xs={12} sm={6}>
                    <Statistic
                      title="平均消耗"
                      value={generationHistory.length > 0 
                        ? Math.round(generationHistory.reduce((sum, item) => sum + item.creditsCost, 0) / generationHistory.length)
                        : 0
                      }
                      suffix="积分/次"
                    />
                  </Col>
                </Row>
              </Card>

              {/* 生成历史 */}
              <Card 
                title={
                  <Space>
                    <HistoryOutlined />
                    最近生成记录
                  </Space>
                }
                extra={
                  <Button type="link" size="small">
                    查看全部
                  </Button>
                }
              >
                {recentGenerations.length > 0 ? (
                  <List
                    dataSource={recentGenerations}
                    renderItem={(item) => (
                      <List.Item
                        actions={[
                          <Button type="link" size="small">查看</Button>,
                          <Button type="link" size="small">下载</Button>
                        ]}
                      >
                        <List.Item.Meta
                          avatar={
                            <img 
                              src={item.resultImage} 
                              alt="生成结果"
                              style={{ 
                                width: '48px', 
                                height: '48px', 
                                objectFit: 'cover',
                                borderRadius: '4px'
                              }}
                            />
                          }
                          title={
                            <Space>
                              <span>工具ID: {item.toolId}</span>
                              <Tag color="blue">{item.creditsCost} 积分</Tag>
                            </Space>
                          }
                          description={
                            <Text type="secondary">
                              {new Date(item.createdAt).toLocaleString()}
                            </Text>
                          }
                        />
                      </List.Item>
                    )}
                  />
                ) : (
                  <div style={{ 
                    textAlign: 'center', 
                    padding: '40px',
                    color: '#666'
                  }}>
                    <HistoryOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
                    <div>暂无生成记录</div>
                    <Button 
                      type="primary" 
                      style={{ marginTop: '16px' }}
                      onClick={() => navigate('/')}
                    >
                      开始使用
                    </Button>
                  </div>
                )}
              </Card>
            </Col>
          </Row>
        </div>
      </Content>
    </Layout>
  )
}

export default Profile