import React, { useState, useEffect } from 'react'
import { Row, Col, Card, Statistic, Button, Space, List, Avatar, Progress, Tag, message } from 'antd'
import {
  UserOutlined,
  ToolOutlined,
  CreditCardOutlined,
  ApiOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  EyeOutlined,
  SettingOutlined,
  PlusOutlined,
  TeamOutlined
} from '@ant-design/icons'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'
import { AvatarWithFallback } from '../utils/avatarUtils'
import { dashboardAPI } from '../services/api'

const Dashboard = () => {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({})
  const [chartData, setChartData] = useState([])
  const [recentActivities, setRecentActivities] = useState([])

  useEffect(() => {
    loadDashboardData()
  }, [])

  // 加载仪表板数据
  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      // 并行加载所有数据
      const [statsResult, chartResult, activitiesResult] = await Promise.all([
        dashboardAPI.getStats(),
        dashboardAPI.getChartData({ days: 7 }),
        dashboardAPI.getRecentActivities({ limit: 10 })
      ])

      if (statsResult.success) {
        setStats(statsResult.data)
      }

      if (chartResult.success) {
        setChartData(chartResult.data.usage || [])
      }

      if (activitiesResult.success) {
        setRecentActivities(activitiesResult.data || [])
      } else {
        // 设置默认活动数据
        setRecentActivities([
          {
            id: 1,
            user: '用户001',
            action: '使用了模特图裂变工具',
            time: '2分钟前',
            avatarSeed: '1'
          },
          {
            id: 2,
            user: '用户002',
            action: '购买了高级会员',
            time: '5分钟前',
            avatarSeed: '2'
          },
          {
            id: 3,
            user: '用户003',
            action: '使用了商品图场景更换',
            time: '8分钟前',
            avatarSeed: '3'
          },
          {
            id: 4,
            user: '用户004',
            action: '充值了1000积分',
            time: '12分钟前',
            avatarSeed: '4'
          }
        ])
      }

    } catch (error) {
      console.error('加载仪表板数据失败:', error)
      message.error('加载数据失败，请稍后重试')
      
      // 设置默认数据以防API失败
      setStats({
        totalUsers: 0,
        activeUsers: 0,
        totalCredits: 0,
        todayGeneration: 0
      })
      setChartData([])
      setRecentActivities([
        {
          id: 1,
          user: '用户001',
          action: '使用了模特图裂变工具',
          time: '2分钟前',
          avatarSeed: '1'
        },
        {
          id: 2,
          user: '用户002',
          action: '购买了高级会员',
          time: '5分钟前',
          avatarSeed: '2'
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  // 工具使用分布数据
  const toolUsageData = [
    { name: '模特图裂变', value: 35, color: '#1890ff' },
    { name: '商品图场景更换', value: 25, color: '#52c41a' },
    { name: '商品图换色', value: 20, color: '#faad14' },
    { name: '其他工具', value: 20, color: '#f5222d' }
  ]

  // 快捷操作卡片
  const quickActions = [
    {
      title: '添加AI工具',
      description: '配置新的AI生成工具',
      icon: <PlusOutlined />,
      path: '/admin/tools',
      color: '#1890ff'
    },
    {
      title: '用户管理',
      description: '查看和管理用户信息',
      icon: <TeamOutlined />,
      path: '/admin/users',
      color: '#52c41a'
    },
    {
      title: 'API配置',
      description: '管理API接口和密钥',
      icon: <ApiOutlined />,
      path: '/admin/apis',
      color: '#faad14'
    },
    {
      title: '系统设置',
      description: '全局配置和参数设置',
      icon: <SettingOutlined />,
      path: '/admin/settings',
      color: '#f5222d'
    }
  ]

  return (
    <div>
      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="总用户数"
              value={stats.totalUsers || 0}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#3f8600' }}
              suffix={
                <span style={{ fontSize: '14px', color: '#52c41a' }}>
                  <ArrowUpOutlined /> {stats.userGrowthRate || 0}%
                </span>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="活跃用户"
              value={stats.activeUsers || 0}
              prefix={<EyeOutlined />}
              valueStyle={{ color: '#1890ff' }}
              suffix={
                <span style={{ fontSize: '14px', color: '#1890ff' }}>
                  <ArrowUpOutlined /> {stats.activeUserGrowthRate || 0}%
                </span>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="积分消耗"
              value={stats.totalCreditsConsumed || 0}
              prefix={<CreditCardOutlined />}
              valueStyle={{ color: '#faad14' }}
              suffix={
                <span style={{ fontSize: '14px', color: '#faad14' }}>
                  <ArrowUpOutlined /> {stats.creditGrowthRate || 0}%
                </span>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="今日生成"
              value={stats.todayGenerations || 0}
              prefix={<ToolOutlined />}
              valueStyle={{ color: '#f5222d' }}
              suffix={
                <span style={{ fontSize: '14px', color: stats.todayGenerationsChange >= 0 ? '#52c41a' : '#f5222d' }}>
                  {stats.todayGenerationsChange >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />} {Math.abs(stats.todayGenerationsChange || 0)}%
                </span>
              }
            />
          </Card>
        </Col>
      </Row>

      {/* 图表区域 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={16}>
          <Card title="使用趋势" extra={<Button type="link" onClick={loadDashboardData}>刷新数据</Button>}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="生成次数" fill="#1890ff" />
                <Bar dataKey="用户数" fill="#52c41a" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="工具使用分布">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={toolUsageData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {toolUsageData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* 最近活动和快捷操作 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="最近活动" extra={<Button type="link" onClick={loadDashboardData}>查看更多</Button>}>
            <List
              loading={loading}
              dataSource={recentActivities}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<AvatarWithFallback seed={item.userId || item.id} size={32} />}
                    title={item.username || item.user || '未知用户'}
                    description={
                      <div>
                        <div>{item.action || item.description}</div>
                        <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
                          {item.createdAt || item.time}
                        </div>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="快捷操作">
            <Row gutter={[16, 16]}>
              {quickActions.map((action, index) => (
                <Col xs={12} key={index}>
                  <Card
                    size="small"
                    hoverable
                    style={{ textAlign: 'center', cursor: 'pointer' }}
                    onClick={() => window.location.href = action.path}
                  >
                    <div style={{ fontSize: '24px', color: action.color, marginBottom: 8 }}>
                      {action.icon}
                    </div>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>
                      {action.title}
                    </div>
                    <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
                      {action.description}
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Dashboard