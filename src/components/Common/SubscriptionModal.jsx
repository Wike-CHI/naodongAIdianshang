import React, { useState } from 'react'
import { Modal, Card, Row, Col, Button, Typography, List, Tag, Space, message } from 'antd'
import { CrownOutlined, CheckOutlined, StarOutlined, WalletOutlined } from '@ant-design/icons'
import { useAuth } from '../../contexts/AuthContext'
import { subscriptionsApi } from '../../services/api'

const { Title, Text } = Typography

const SubscriptionModal = ({ visible, onClose }) => {
  const { user, updateCredits } = useAuth()
  const [loading, setLoading] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [subscriptionPlans, setSubscriptionPlans] = useState([])
  const [creditPackages, setCreditPackages] = useState([])

  // 获取订阅套餐和积分套餐
  React.useEffect(() => {
    if (visible) {
      loadSubscriptionPlans()
      loadCreditPackages()
    }
  }, [visible])

  const loadSubscriptionPlans = async () => {
    try {
      const response = await subscriptionsApi.getPlans()
      if (response.success) {
        setSubscriptionPlans(response.data)
      }
    } catch (error) {
      console.error('获取订阅套餐失败:', error)
    }
  }

  const loadCreditPackages = async () => {
    try {
      // 这里应该调用积分套餐API，暂时使用模拟数据
      const mockPackages = [
        { id: 1, credits: 100, price: 10, bonus: 0 },
        { id: 2, credits: 300, price: 25, bonus: 50 },
        { id: 3, credits: 500, price: 40, bonus: 100 },
        { id: 4, credits: 1000, price: 70, bonus: 300 }
      ]
      setCreditPackages(mockPackages)
    } catch (error) {
      console.error('获取积分套餐失败:', error)
    }
  }

  const handleSubscribe = async (plan) => {
    if (!user) {
      message.warning('请先登录')
      return
    }

    setSelectedPlan(plan)
    setLoading(true)

    try {
      const response = await subscriptionsApi.createSubscription(plan.id)
      if (response.success) {
        message.success(`成功订阅${plan.name}！`)
        // 这里可以更新用户状态或刷新页面
        onClose()
      } else {
        message.error(response.message || '订阅失败，请重试')
      }
    } catch (error) {
      message.error('订阅失败，请重试')
    } finally {
      setLoading(false)
      setSelectedPlan(null)
    }
  }

  const handleBuyCredits = async (pkg) => {
    if (!user) {
      message.warning('请先登录')
      return
    }

    setLoading(true)
    try {
      // 这里应该调用积分充值API
      // const response = await creditsApi.createOrder(pkg.id)
      // 暂时使用模拟逻辑
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
    <Modal
      title="会员订阅与积分充值"
      open={visible}
      onCancel={onClose}
      footer={null}
      width={1000}
      style={{ top: 20 }}
      styles={{ body: { maxHeight: '70vh', overflow: 'auto' } }}
    >
      <div>
        {/* 会员套餐 */}
        <div style={{ marginBottom: '48px' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <Title level={3}>
              <CrownOutlined style={{ color: '#faad14', marginRight: '8px' }} />
              会员套餐
            </Title>
            <Text type="secondary">升级VIP，享受更多特权</Text>
          </div>

          <Row gutter={[24, 24]} justify="center">
            {subscriptionPlans.map((plan) => (
              <Col key={plan.id} xs={24} sm={12} lg={8}>
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
                    <Title level={5}>{plan.name}</Title>
                    <div style={{ marginBottom: '8px' }}>
                      <Text delete type="secondary" style={{ fontSize: '14px' }}>
                        ¥{plan.originalPrice}
                      </Text>
                    </div>
                    <div style={{ marginBottom: '8px' }}>
                      <span style={{ fontSize: '28px', fontWeight: 'bold', color: '#1890ff' }}>
                        ¥{plan.price}
                      </span>
                      <Text type="secondary">/{plan.duration}</Text>
                    </div>
                    <Tag color="red">
                      立省 ¥{plan.originalPrice - plan.price}
                    </Tag>
                  </div>

                  <List
                    size="small"
                    dataSource={plan.benefits}
                    renderItem={(benefit) => (
                      <List.Item>
                        <Space>
                          <CheckOutlined style={{ color: '#52c41a' }} />
                          <Text style={{ fontSize: '12px' }}>{benefit}</Text>
                        </Space>
                      </List.Item>
                    )}
                    style={{ marginBottom: '24px' }}
                  />

                  <Button
                    type={plan.popular ? 'primary' : 'default'}
                    size="large"
                    block
                    loading={loading && selectedPlan?.id === plan.id}
                    onClick={() => handleSubscribe(plan)}
                    disabled={user?.membershipType === 'vip'}
                  >
                    {user?.membershipType === 'vip' ? '已是VIP会员' : '立即订阅'}
                  </Button>
                </Card>
              </Col>
            ))}
          </Row>
        </div>

        {/* 积分充值 */}
        <div>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <Title level={3}>
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
    </Modal>
  )
}

export default SubscriptionModal