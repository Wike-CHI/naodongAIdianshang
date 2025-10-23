import React, { useState, useEffect } from 'react'
import { Row, Col, Card, Statistic, Button, Space, List, Avatar, Progress, Tag } from 'antd'
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

const Dashboard = () => {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({})

  useEffect(() => {
    // 模拟数据加载
    setTimeout(() => {
      setStats({
        totalUsers: 1248,
        activeUsers: 856,
        totalCredits: 125680,
        todayGeneration: 342
      })
      setLoading(false)
    }, 1000)
  }, [])

  // 模拟图表数据
  const usageData = [
    { name: '周一', 生成次数: 120, 用户数: 80 },
    { name: '周二', 生成次数: 150, 用户数: 95 },
    { name: '周三', 生成次数: 180, 用户数: 110 },
    { name: '周四', 生成次数: 220, 用户数: 140 },
    { name: '周五', 生成次数: 280, 用户数: 180 },
    { name: '周六', 生成次数: 320, 用户数: 200 },
    { name: '周日', 生成次数: 250, 用户数: 160 }
  ]

  const toolUsageData = [
    { name: '模特图裂变', value: 35, color: '#1890ff' },
    { name: '商品图场景更换', value: 25, color: '#52c41a' },
    { name: '商品图换色', value: 20, color: '#faad14' },
    { name: '其他工具', value: 20, color: '#f5222d' }
  ]

  // 最近活动数据
  const recentActivities = [
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
              value={stats.totalUsers}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#3f8600' }}
              suffix={
                <span style={{ fontSize: '14px', color: '#52c41a' }}>
                  <ArrowUpOutlined /> 12%
                </span>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="活跃用户"
              value={stats.activeUsers}
              prefix={<EyeOutlined />}
              valueStyle={{ color: '#1890ff' }}
              suffix={
                <span style={{ fontSize: '14px', color: '#1890ff' }}>
                  <ArrowUpOutlined /> 8%
                </span>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="积分消耗"
              value={stats.totalCredits}
              prefix={<CreditCardOutlined />}
              valueStyle={{ color: '#faad14' }}
              suffix={
                <span style={{ fontSize: '14px', color: '#faad14' }}>
                  <ArrowUpOutlined /> 15%
                </span>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="今日生成"
              value={stats.todayGeneration}
              prefix={<ToolOutlined />}
              valueStyle={{ color: '#f5222d' }}
              suffix={
                <span style={{ fontSize: '14px', color: '#f5222d' }}>
                  <ArrowDownOutlined /> 3%
                </span>
              }
            />
          </Card>
        </Col>
      </Row>

      {/* 图表区域 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={16}>
          <Card title="使用趋势" extra={<Button type="link">查看详情</Button>}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={usageData}>
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
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {toolUsageData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value}%`, '使用占比']} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ marginTop: 16 }}>
              {toolUsageData.map((item, index) => (
                <div key={index} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span>
                    <span style={{ 
                      display: 'inline-block', 
                      width: 12, 
                      height: 12, 
                      backgroundColor: item.color, 
                      marginRight: 8,
                      borderRadius: 2
                    }}></span>
                    {item.name}
                  </span>
                  <span>{item.value}%</span>
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>

      {/* 快捷操作和最近活动 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="快捷操作">
            <Row gutter={[16, 16]}>
              {quickActions.map((action, index) => (
                <Col xs={12} key={index}>
                  <Card
                    hoverable
                    className="action-card"
                    style={{ textAlign: 'center', height: 120 }}
                    onClick={() => window.location.href = action.path}
                  >
                    <div className="icon" style={{ color: action.color, fontSize: 24, marginBottom: 8 }}>
                      {action.icon}
                    </div>
                    <div className="title" style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
                      {action.title}
                    </div>
                    <div className="description" style={{ fontSize: 12, color: '#8c8c8c' }}>
                      {action.description}
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="最近活动" extra={<Button type="link">查看全部</Button>}>
            <List
              itemLayout="horizontal"
              dataSource={recentActivities}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<AvatarWithFallback seed={item.avatarSeed} size={32} />}
                    title={
                      <Space>
                        <span>{item.user}</span>
                        <Tag color="blue" size="small">活跃</Tag>
                      </Space>
                    }
                    description={
                      <div>
                        <div>{item.action}</div>
                        <div style={{ color: '#8c8c8c', fontSize: '12px', marginTop: 4 }}>
                          {item.time}
                        </div>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Dashboard