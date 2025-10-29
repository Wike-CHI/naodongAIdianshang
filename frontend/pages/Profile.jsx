import React, { useState, useEffect } from 'react'
import { Layout, Card, Row, Col, Avatar, Typography, Button, Statistic, List, Tag, Space, Tabs, Table, message, Modal, QRCode, Tooltip, Divider } from 'antd'
import { UserOutlined, WalletOutlined, CrownOutlined, HistoryOutlined, SettingOutlined, ShareAltOutlined, TeamOutlined, GiftOutlined, CopyOutlined, QrcodeOutlined } from '@ant-design/icons'
import { useAuth } from '../contexts/AuthContext'
import { useTool } from '../contexts/ToolContext'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Layout/Header'
import UserInfoForm from '../components/User/UserInfoForm'
import { referralApi } from '../services/referralApi'

const { Content } = Layout
const { Title, Text } = Typography
// const { TabPane } = Tabs // 已弃用，改用items属性

const Profile = () => {
  const { user } = useAuth()
  const { generationHistory } = useTool()
  const navigate = useNavigate()
  const [showUserInfoForm, setShowUserInfoForm] = useState(false)
  const [referralData, setReferralData] = useState(null)
  const [referralStats, setReferralStats] = useState(null)
  const [creditHistory, setCreditHistory] = useState([])
  const [qrModalVisible, setQrModalVisible] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) {
      loadReferralData()
    }
  }, [user])

  // 处理用户未登录的情况
  useEffect(() => {
    if (!user) {
      navigate('/login')
    }
  }, [user, navigate])

  const loadReferralData = async () => {
    try {
      setLoading(true)
      const [data, stats, history] = await Promise.all([
        referralApi.getUserReferralData(user.id),
        referralApi.getReferralStats(user.id),
        referralApi.getCreditHistory(user.id)
      ])
      
      // 确保数据结构正确
      setReferralData(data?.success ? data.data : null)
      
      // 确保 referralStats 包含正确的数据结构
      if (stats?.success && stats.data) {
        setReferralStats({
          ...stats.data,
          referralDetails: Array.isArray(stats.data.referralDetails) ? stats.data.referralDetails : []
        })
      } else {
        setReferralStats({
          totalReferrals: 0,
          successfulReferrals: 0,
          conversionRate: 0,
          totalEarnings: 0,
          referralDetails: []
        })
      }
      
      // 确保 creditHistory 始终是数组
      if (history?.success && Array.isArray(history.data)) {
        setCreditHistory(history.data)
      } else {
        setCreditHistory([])
      }
    } catch (error) {
      console.error('加载推广数据失败:', error)
      // 设置默认值防止错误
      setReferralData(null)
      setReferralStats({
        totalReferrals: 0,
        successfulReferrals: 0,
        conversionRate: 0,
        totalEarnings: 0,
        referralDetails: []
      })
      setCreditHistory([])
    } finally {
      setLoading(false)
    }
  }

  const copyReferralCode = () => {
    if (referralData?.referralCode) {
      navigator.clipboard.writeText(referralData.referralCode)
      message.success('推广码已复制到剪贴板')
    }
  }

  const copyReferralLink = () => {
    if (referralData?.referralCode) {
      const link = `${window.location.origin}?ref=${referralData.referralCode}`
      navigator.clipboard.writeText(link)
      message.success('推广链接已复制到剪贴板')
    }
  }

  if (!user) {
    return null
  }

  const recentGenerations = generationHistory.slice(0, 5)

  // 积分历史表格列定义
  const creditColumns = [
    {
      title: '时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (text) => new Date(text).toLocaleString(),
      width: 150,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type) => {
        const typeMap = {
          'referral_reward': '推广奖励',
          'registration_bonus': '注册奖励',
          'consumption': '消费扣除',
          'recharge': '充值获得'
        }
        const colorMap = {
          'referral_reward': 'green',
          'registration_bonus': 'blue',
          'consumption': 'red',
          'recharge': 'orange'
        }
        return <Tag color={colorMap[type]}>{typeMap[type] || type}</Tag>
      },
      width: 100,
    },
    {
      title: '积分变动',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => (
        <span style={{ color: amount > 0 ? '#52c41a' : '#ff4d4f' }}>
          {amount > 0 ? '+' : ''}{amount}
        </span>
      ),
      width: 100,
    },
    {
      title: '说明',
      dataIndex: 'description',
      key: 'description',
    },
  ]

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
                        value={user.credits || user.credits_balance || 0}
                        prefix={<WalletOutlined />}
                        valueStyle={{ color: '#52c41a' }}
                      />
                    </Col>
                    <Col span={12}>
                      <Statistic
                        title="会员状态"
                        value={user.membershipType === 'vip' ? 'VIP' : (user.role === 'premium' ? '高级' : '普通')}
                        prefix={<CrownOutlined />}
                        valueStyle={{ 
                          color: user.membershipType === 'vip' || user.role === 'premium' ? '#faad14' : '#666' 
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
                    onClick={() => setShowUserInfoForm(true)}
                  >
                    账号设置
                  </Button>
                </Space>
              </Card>

              {/* 推广数据卡片 */}
              {referralData && (
                <Card 
                  title={
                    <Space>
                      <ShareAltOutlined />
                      推广数据
                    </Space>
                  }
                  style={{ marginTop: '24px' }}
                  loading={loading}
                >
                  <div style={{ marginBottom: '16px' }}>
                    <Text strong>我的推广码</Text>
                    <div style={{ 
                      background: '#f5f5f5', 
                      padding: '8px 12px', 
                      borderRadius: '4px',
                      marginTop: '8px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <Text code style={{ fontSize: '16px', fontWeight: 'bold' }}>
                        {referralData.referralCode}
                      </Text>
                      <Space>
                        <Tooltip title="复制推广码">
                          <Button 
                            type="text" 
                            size="small" 
                            icon={<CopyOutlined />}
                            onClick={copyReferralCode}
                          />
                        </Tooltip>
                        <Tooltip title="生成二维码">
                          <Button 
                            type="text" 
                            size="small" 
                            icon={<QrcodeOutlined />}
                            onClick={() => setQrModalVisible(true)}
                          />
                        </Tooltip>
                      </Space>
                    </div>
                  </div>

                  <Row gutter={16}>
                    <Col span={12}>
                      <Statistic
                        title="推广人数"
                        value={referralStats?.totalReferrals || 0}
                        prefix={<TeamOutlined />}
                        valueStyle={{ color: '#1890ff' }}
                      />
                    </Col>
                    <Col span={12}>
                      <Statistic
                        title="推广收益"
                        value={referralStats?.totalEarnings || 0}
                        prefix={<GiftOutlined />}
                        suffix="积分"
                        valueStyle={{ color: '#52c41a' }}
                      />
                    </Col>
                  </Row>

                  <Divider />

                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Button 
                      block 
                      icon={<CopyOutlined />}
                      onClick={copyReferralLink}
                    >
                      复制推广链接
                    </Button>
                    <Button 
                      block 
                      onClick={() => navigate('/referral')}
                    >
                      推广管理
                    </Button>
                  </Space>
                </Card>
              )}
            </Col>

            {/* 主要内容区域 */}
            <Col xs={24} lg={16}>
              <Tabs 
                defaultActiveKey="stats"
                items={[
                  {
                    key: 'stats',
                    label: '使用统计',
                    children: (
                      <>
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
                      </>
                    )
                  },
                  {
                    key: 'credits',
                    label: '积分明细',
                    children: (
                      <Card title="积分变动记录">
                        <Table
                          columns={creditColumns}
                          dataSource={creditHistory}
                          rowKey="id"
                          pagination={{
                            pageSize: 10,
                            showSizeChanger: false,
                            showQuickJumper: true,
                          }}
                          loading={loading}
                          locale={{
                            emptyText: '暂无积分记录'
                          }}
                        />
                      </Card>
                    )
                  },
                  {
                    key: 'referral',
                    label: '推广明细',
                    children: (
                      <Card title="推广收益明细">
                        <Table
                          columns={[
                            {
                              title: '时间',
                              dataIndex: 'createdAt',
                              key: 'createdAt',
                              render: (text) => new Date(text).toLocaleString(),
                              width: 150,
                            },
                            {
                              title: '被推广用户',
                              dataIndex: 'referredUsername',
                              key: 'referredUsername',
                              render: (text) => text || '匿名用户',
                            },
                            {
                              title: '奖励积分',
                              dataIndex: 'rewardCredits',
                              key: 'rewardCredits',
                              render: (credits) => (
                                <span style={{ color: '#52c41a' }}>+{credits}</span>
                              ),
                              width: 100,
                            },
                            {
                              title: '状态',
                              dataIndex: 'status',
                              key: 'status',
                              render: (status) => (
                                <Tag color={status === 'completed' ? 'green' : 'orange'}>
                                  {status === 'completed' ? '已发放' : '待发放'}
                                </Tag>
                              ),
                              width: 100,
                            },
                          ]}
                          dataSource={referralStats?.referralDetails || []}
                          rowKey="id"
                          pagination={{
                            pageSize: 10,
                            showSizeChanger: false,
                          }}
                          loading={loading}
                          locale={{
                            emptyText: '暂无推广记录'
                          }}
                        />
                      </Card>
                    )
                  }
                ]}
              />
            </Col>
          </Row>
        </div>
      </Content>

      {/* 用户信息编辑表单 */}
      <UserInfoForm 
        visible={showUserInfoForm}
        onCancel={() => setShowUserInfoForm(false)}
      />

      {/* 二维码弹窗 */}
      <Modal
        title="推广二维码"
        open={qrModalVisible}
        onCancel={() => setQrModalVisible(false)}
        footer={[
          <Button key="copy" onClick={copyReferralLink}>
            复制链接
          </Button>,
          <Button key="close" type="primary" onClick={() => setQrModalVisible(false)}>
            关闭
          </Button>
        ]}
        width={400}
      >
        <div style={{ textAlign: 'center', padding: '20px' }}>
          {referralData?.referralCode && (
            <QRCode 
              value={`${window.location.origin}?ref=${referralData.referralCode}`}
              size={200}
            />
          )}
          <div style={{ marginTop: '16px' }}>
            <Text type="secondary">扫描二维码或分享链接邀请好友注册</Text>
          </div>
        </div>
      </Modal>
    </Layout>
  )
}

export default Profile