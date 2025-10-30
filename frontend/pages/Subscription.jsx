import React, { useState, useEffect } from 'react'
import { Layout, Card, Row, Col, Button, Typography, List, Tag, Space, Modal, message } from 'antd'
import { CrownOutlined, CheckOutlined, StarOutlined, WalletOutlined } from '@ant-design/icons'
import { useAuth } from '../contexts/AuthContext'
import Header from '../components/Layout/Header'
import axios from 'axios'
import { API_ENDPOINTS } from '../config/api'
import logger from '../utils/logger'

const { Content } = Layout
const { Title, Text } = Typography

const Subscription = () => {
  const { user, updateUserInfo, updateCredits } = useAuth()
  const [loading, setLoading] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [subscriptionPlans, setSubscriptionPlans] = useState([])

  // 获取订阅套餐数据
  useEffect(() => {
    const fetchSubscriptionPlans = async () => {
      try {
        const response = await axios.get(API_ENDPOINTS.SUBSCRIPTION.PLANS)
        if (response.data.success) {
          setSubscriptionPlans(response.data.data.plans || response.data.data)
        } else {
          // 如果API失败，使用默认套餐
          setSubscriptionPlans([
            {
              id: 1,
              name: '基础版',
              price: 0,
              credits: 100,
              features: ['每日100次生成', '基础模板', '标准客服'],
              popular: false,
              type: 'free'
            },
            {
              id: 2,
              name: '专业版',
              price: 29,
              credits: 1000,
              features: ['每日1000次生成', '高级模板', '优先客服', '无广告'],
              popular: true,
              type: 'pro'
            },
            {
              id: 3,
              name: '企业版',
              price: 99,
              credits: 5000,
              features: ['每日5000次生成', '全部模板', '专属客服', '定制功能'],
              popular: false,
              type: 'enterprise'
            }
          ])
        }
      } catch (error) {
        console.error('获取订阅套餐失败:', error)
        // 使用默认套餐
        setSubscriptionPlans([
          {
            id: 1,
            name: '基础版',
            price: 0,
            credits: 100,
            features: ['每日100次生成', '基础模板', '标准客服'],
            popular: false,
            type: 'free'
          },
          {
            id: 2,
            name: '专业版',
            price: 29,
            credits: 1000,
            features: ['每日1000次生成', '高级模板', '优先客服', '无广告'],
            popular: true,
            type: 'pro'
          },
          {
            id: 3,
            name: '企业版',
            price: 99,
            credits: 5000,
            features: ['每日5000次生成', '全部模板', '专属客服', '定制功能'],
            popular: false,
            type: 'enterprise'
          }
        ])
      }
    }

    fetchSubscriptionPlans()
  }, [])

  const handleSubscribe = async (plan) => {
    if (!user) {
      message.warning('请先登录')
      return
    }

    setSelectedPlan(plan)
    setLoading(true)

    try {
      // 调用真实API创建订阅
      const token = localStorage.getItem('token')
      const response = await axios.post(API_ENDPOINTS.SUBSCRIPTION.SUBSCRIBE, {
        plan_id: plan._id || plan.id,
        payment_method: 'alipay', // 默认支付方式
        transaction_id: `txn_${Date.now()}`, // 模拟交易ID
        auto_renew: true
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.data.success) {
        message.success(`成功订阅${plan.name}年度会员！`)
        
        // 直接使用后端返回的更新后的用户信息
        if (response.data.data.user) {
          // 确保用户对象包含所有必要的字段
          const updatedUser = {
            ...user,
            ...response.data.data.user,
            credits: response.data.data.user.credits_balance || response.data.data.user.credits || user.credits
          };
          updateUserInfo(updatedUser);
        } else {
          // 如果后端没有返回用户信息，则获取更新后的用户信息
          try {
            const userResponse = await axios.get(API_ENDPOINTS.AUTH.CURRENT_USER, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            })
            
            if (userResponse.data.success) {
              // 确保用户对象包含所有必要的字段
              const updatedUser = {
                ...user,
                ...userResponse.data.data.user,
                credits: userResponse.data.data.user.credits_balance || userResponse.data.data.user.credits || user.credits
              };
              updateUserInfo(updatedUser);
            }
          } catch (error) {
            console.error('获取更新后的用户信息失败:', error)
          }
        }
      } else {
        message.error(response.data.message || '订阅失败')
      }
    } catch (error) {
      console.error('订阅失败:', error)
      // 检查是否有响应数据
      if (error.response && error.response.data) {
        message.error(error.response.data.message || '订阅失败')
      } else {
        message.error('订阅失败，请重试')
      }
    } finally {
      setLoading(false)
      setSelectedPlan(null)
    }
  }

  const creditPackages = [
    { credits: 100, price: 10, bonus: 0 },
    { credits: 300, price: 25, bonus: 50 },
    { credits: 500, price: 40, bonus: 100 },
    { credits: 1000, price: 70, bonus: 300 }
  ]

  // 年度会员专属积分包
  const yearlyMemberCreditPackages = [
    { credits: 12000, price: 999, bonus: 2400, label: '年度会员专享' }, // 12个月积分+额外2400积分
    { credits: 6000, price: 599, bonus: 1200, label: '年度会员专享' },  // 6个月积分+额外1200积分
    { credits: 3000, price: 399, bonus: 600, label: '年度会员专享' }    // 3个月积分+额外600积分
  ]

  const handleBuyCredits = async (pkg) => {
    if (!user) {
      message.warning('请先登录')
      return
    }

    setLoading(true)
    try {
      // 模拟支付过程
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      const totalCredits = pkg.credits + pkg.bonus
      updateCredits(user.credits + totalCredits)
      message.success(`成功充值${totalCredits}积分！`)
      
    } catch (error) {
      message.error('充值失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout className="app-layout">
      <Header />
      <Content style={{ padding: '24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {/* 会员套餐 */}
          <div style={{ marginBottom: '48px' }}>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <Title level={2}>
                <CrownOutlined style={{ color: '#faad14', marginRight: '8px' }} />
                会员套餐
              </Title>
              <Text type="secondary">升级VIP，享受更多特权</Text>
            </div>

            <Row gutter={[24, 24]} justify="center">
              {subscriptionPlans.map((plan) => (
                <Col key={plan._id || plan.id} xs={24} sm={12} lg={8}>
                  <Card
                    className={plan.popular ? 'popular-plan' : ''}
                    style={{ 
                      position: 'relative',
                      border: plan.popular ? '2px solid #1890ff' : '1px solid #d9d9d9'
                    }}
                  >
                    {plan.popular && (
                      <div style={{
                        position: 'absolute',
                        top: '-10px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: '#1890ff',
                        color: 'white',
                        padding: '4px 16px',
                        borderRadius: '12px',
                        fontSize: '12px'
                      }}>
                        <StarOutlined /> 推荐
                      </div>
                    )}

                    <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                      <Title level={4}>{plan.name}</Title>
                      {plan.is_yearly ? (
                        <div>
                          <div style={{ marginBottom: '8px' }}>
                            <Text delete type="secondary" style={{ fontSize: '14px' }}>
                              ¥{plan.original_price || plan.price * 12}
                            </Text>
                          </div>
                          <div style={{ marginBottom: '8px' }}>
                            <span style={{ fontSize: '32px', fontWeight: 'bold', color: '#1890ff' }}>
                              ¥{plan.yearly_price || plan.price}
                            </span>
                            <Text type="secondary">/年</Text>
                          </div>
                          {plan.original_price && plan.yearly_price && (
                            <Tag color="red">
                              立省 ¥{plan.original_price - plan.yearly_price}
                            </Tag>
                          )}
                          <Tag color="gold">年度会员</Tag>
                        </div>
                      ) : (
                        <div>
                          <div style={{ marginBottom: '8px' }}>
                            <Text delete type="secondary" style={{ fontSize: '14px' }}>
                              ¥{plan.originalPrice}
                            </Text>
                          </div>
                          <div style={{ marginBottom: '8px' }}>
                            <span style={{ fontSize: '32px', fontWeight: 'bold', color: '#1890ff' }}>
                              ¥{plan.price}
                            </span>
                            <Text type="secondary">/{plan.duration || '月'}</Text>
                          </div>
                          {plan.originalPrice && (
                            <Tag color="red">
                              立省 ¥{plan.originalPrice - plan.price}
                            </Tag>
                          )}
                        </div>
                      )}
                    </div>

                    <List
                      size="small"
                      dataSource={plan.benefits || plan.features || []}
                      renderItem={(benefit) => (
                        <List.Item>
                          <Space>
                            <CheckOutlined style={{ color: '#52c41a' }} />
                            <Text>{benefit}</Text>
                          </Space>
                        </List.Item>
                      )}
                      style={{ marginBottom: '24px' }}
                    />

                    <Button
                      type={plan.popular ? 'primary' : 'default'}
                      size="large"
                      block
                      loading={loading && selectedPlan?._id === plan._id}
                      onClick={() => handleSubscribe(plan)}
                      disabled={user?.membershipType === 'vip'}
                    >
                      {user?.membershipType === 'vip' ? '已是VIP会员' : plan.is_yearly ? '立即订阅年度会员' : '立即订阅'}
                    </Button>
                  </Card>
                </Col>
              ))}
            </Row>
          </div>

          {/* 积分充值 */}
          <div>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <Title level={2}>
                <WalletOutlined style={{ color: '#52c41a', marginRight: '8px' }} />
                积分充值
              </Title>
              <Text type="secondary">购买积分，畅享AI生成服务</Text>
            </div>

            <Row gutter={[16, 16]} justify="center">
              {creditPackages.map((pkg, index) => (
                <Col key={index} xs={12} sm={8} lg={6}>
                  <Card 
                    size="small"
                    style={{ textAlign: 'center' }}
                    hoverable
                  >
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a' }}>
                        {pkg.credits}
                      </div>
                      <Text type="secondary">积分</Text>
                      {pkg.bonus > 0 && (
                        <div>
                          <Tag color="orange" size="small">
                            +{pkg.bonus} 赠送
                          </Tag>
                        </div>
                      )}
                    </div>
                    
                    <div style={{ marginBottom: '16px' }}>
                      <Text style={{ fontSize: '18px', fontWeight: 'bold' }}>
                        ¥{pkg.price}
                      </Text>
                    </div>

                    <Button
                      type="primary"
                      size="small"
                      block
                      loading={loading}
                      onClick={() => handleBuyCredits(pkg)}
                    >
                      立即充值
                    </Button>
                  </Card>
                </Col>
              ))}
            </Row>

            {/* 年度会员专属积分包 */}
            {user?.membershipType === 'vip' && (
              <div style={{ marginTop: '32px' }}>
                <Title level={4} style={{ textAlign: 'center', marginBottom: '24px' }}>
                  <CrownOutlined style={{ color: '#faad14', marginRight: '8px' }} />
                  年度会员专享积分包
                </Title>
                <Row gutter={[16, 16]} justify="center">
                  {yearlyMemberCreditPackages.map((pkg, index) => (
                    <Col key={`yearly-${index}`} xs={12} sm={8} lg={6}>
                      <Card 
                        size="small"
                        style={{ textAlign: 'center', border: '2px solid #faad14' }}
                        hoverable
                      >
                        <div style={{ marginBottom: '12px' }}>
                          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a' }}>
                            {pkg.credits}
                          </div>
                          <Text type="secondary">积分</Text>
                          {pkg.bonus > 0 && (
                            <div>
                              <Tag color="orange" size="small">
                                +{pkg.bonus} 赠送
                              </Tag>
                            </div>
                          )}
                          {pkg.label && (
                            <div>
                              <Tag color="gold" size="small">
                                {pkg.label}
                              </Tag>
                            </div>
                          )}
                        </div>
                        
                        <div style={{ marginBottom: '16px' }}>
                          <Text style={{ fontSize: '18px', fontWeight: 'bold' }}>
                            ¥{pkg.price}
                          </Text>
                        </div>

                        <Button
                          type="primary"
                          size="small"
                          block
                          loading={loading}
                          onClick={() => handleBuyCredits(pkg)}
                        >
                          立即充值
                        </Button>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </div>
            )}
          </div>

          {/* 说明信息 */}
          <Card style={{ marginTop: '32px', background: '#fafafa' }}>
            <Title level={5}>购买说明</Title>
            <List size="small">
              <List.Item>• 积分永久有效，不会过期</List.Item>
              <List.Item>• VIP会员享受生成费用折扣优惠</List.Item>
              <List.Item>• 支持支付宝、微信支付</List.Item>
              <List.Item>• 如有问题，请联系客服</List.Item>
            </List>
          </Card>
        </div>
      </Content>
    </Layout>
  )
}

export default Subscription