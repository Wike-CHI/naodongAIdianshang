import React, { useState, useEffect } from 'react'
import { Modal, Card, Row, Col, Button, Typography, List, Tag, Space, message } from 'antd'
import { CrownOutlined, CheckOutlined, StarOutlined, WalletOutlined } from '@ant-design/icons'
import { useAuth } from '../../contexts/AuthContext'
import axios from 'axios'
import { API_ENDPOINTS } from '../../config/api'
import logger from '../../utils/logger'

const { Title, Text } = Typography

// 定义积分套餐的唯一ID
const creditPackages = [
  { id: 'pkg-100', credits: 100, price: 10, bonus: 0 },
  { id: 'pkg-300', credits: 300, price: 25, bonus: 50 },
  { id: 'pkg-500', credits: 500, price: 40, bonus: 100 },
  { id: 'pkg-1000', credits: 1000, price: 70, bonus: 300 }
]

const SubscriptionModal = ({ visible, onClose }) => {
  const { user, updateCredits } = useAuth()
  const [loading, setLoading] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [subscriptionPlans, setSubscriptionPlans] = useState([])

  // 获取订阅套餐数据
  useEffect(() => {
    const fetchSubscriptionPlans = async () => {
      try {
        const response = await axios.get(API_ENDPOINTS.SUBSCRIPTION.PLANS)
        if (response.data.success) {
          // 确保设置的是数组格式的数据
          const plans = response.data.data.plans || response.data.data || []
          setSubscriptionPlans(Array.isArray(plans) ? plans : [])
        } else {
          // 如果API失败，使用默认套餐
          setSubscriptionPlans([
            {
              id: 'free',
              name: '基础版',
              price: 0,
              credits: 100,
              features: ['每日100次生成', '基础模板', '标准客服'],
              popular: false,
              type: 'free'
            },
            {
              id: 'pro',
              name: '专业版',
              price: 29,
              credits: 1000,
              features: ['每日1000次生成', '高级模板', '优先客服', '无广告'],
              popular: true,
              type: 'pro'
            },
            {
              id: 'enterprise',
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
            id: 'free',
            name: '基础版',
            price: 0,
            credits: 100,
            features: ['每日100次生成', '基础模板', '标准客服'],
            popular: false,
            type: 'free'
          },
          {
            id: 'pro',
            name: '专业版',
            price: 29,
            credits: 1000,
            features: ['每日1000次生成', '高级模板', '优先客服', '无广告'],
            popular: true,
            type: 'pro'
          },
          {
            id: 'enterprise',
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

    if (visible) {
      fetchSubscriptionPlans()
    }
  }, [visible])

  const handleSubscribe = async (plan) => {
    if (!user) {
      message.warning('请先登录')
      return
    }

    setSelectedPlan(plan)
    setLoading(true)

    try {
      // 模拟支付过程
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // 模拟支付成功，更新用户状态
      message.success(`成功订阅${plan.name}！`)
      
      // 这里应该调用真实的API更新用户会员状态
      logger.log('订阅成功:', plan)
      
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

  // 获取权益列表
  const getBenefitsList = (plan) => {
    // 如果是features数组（对象数组）
    if (Array.isArray(plan.features) && plan.features.length > 0) {
      return plan.features.map((feature, index) => ({
        key: feature._id || index,
        content: feature.name || feature.description || '未知权益'
      }));
    }
    
    // 如果是benefits对象中的特定字段
    if (plan.benefits) {
      const benefits = [];
      
      // 处理monthly_credits
      if (plan.benefits.monthly_credits) {
        benefits.push({
          key: 'monthly_credits',
          content: `每月${plan.benefits.monthly_credits}积分`
        });
      }
      
      // 处理priority_processing
      if (plan.benefits.priority_processing) {
        benefits.push({
          key: 'priority_processing',
          content: '优先处理'
        });
      }
      
      // 处理advanced_features
      if (plan.benefits.advanced_features) {
        benefits.push({
          key: 'advanced_features',
          content: '高级功能'
        });
      }
      
      // 处理api_access
      if (plan.benefits.api_access) {
        benefits.push({
          key: 'api_access',
          content: 'API访问权限'
        });
      }
      
      // 处理dedicated_support
      if (plan.benefits.dedicated_support) {
        benefits.push({
          key: 'dedicated_support',
          content: '专属客服'
        });
      }
      
      // 处理batch_processing
      if (plan.benefits.batch_processing) {
        benefits.push({
          key: 'batch_processing',
          content: '批量处理'
        });
      }
      
      return benefits;
    }
    
    // 默认返回空数组
    return [];
  };

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
                    <Title level={5}>{plan.name}</Title>
                    <div style={{ marginBottom: '8px' }}>
                      <Text delete type="secondary" style={{ fontSize: '14px' }}>
                        ¥{plan.original_price}
                      </Text>
                    </div>
                    <div style={{ marginBottom: '8px' }}>
                      <span style={{ fontSize: '28px', fontWeight: 'bold', color: '#1890ff' }}>
                        ¥{plan.price}
                      </span>
                      <Text type="secondary">/{plan.billing_cycle === 'yearly' ? '年' : '月'}</Text>
                    </div>
                    <Tag color="red">
                      立省 ¥{plan.original_price - plan.price}
                    </Tag>
                  </div>

                  <List
                    size="small"
                    dataSource={getBenefitsList(plan)}
                    renderItem={(benefit) => (
                      <List.Item key={benefit.key}>
                        <Space>
                          <CheckOutlined style={{ color: '#52c41a' }} />
                          <Text style={{ fontSize: '12px' }}>
                            {benefit.content}
                          </Text>
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
            {creditPackages.map((pkg) => (
              <Col key={pkg.id} xs={12} sm={8} lg={6}>
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
          <List
            size="small"
            dataSource={[
              { key: '1', content: '积分永久有效，不会过期' },
              { key: '2', content: 'VIP会员享受生成费用折扣优惠' },
              { key: '3', content: '支持支付宝、微信支付' },
              { key: '4', content: '如有问题，请联系客服' }
            ]}
            renderItem={(item) => (
              <List.Item key={item.key}>
                <Text>• {item.content}</Text>
              </List.Item>
            )}
          />
        </Card>
      </div>
    </Modal>
  )
}

export default SubscriptionModal