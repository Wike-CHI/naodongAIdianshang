import React, { useState, useEffect } from 'react'
import { Modal, Card, Row, Col, Button, Typography, List, Tag, Space, message, Spin, Alert } from 'antd'
import { CrownOutlined, CheckOutlined, StarOutlined, WalletOutlined, InfoCircleOutlined } from '@ant-design/icons'
import { useAuth } from '../../contexts/AuthContext'
import axios from 'axios'
import { API_ENDPOINTS } from '../../config/api'
import logger from '../../utils/logger'
import subscriptionService from '../../services/subscriptionService'
import creditService from '../../services/creditService'

const { Title, Text } = Typography

const SubscriptionModal = ({ visible, onClose }) => {
  const { user, updateCredits, updateUserInfo } = useAuth()
  const [loading, setLoading] = useState(false)
  const [packagesLoading, setPackagesLoading] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [subscriptionPlans, setSubscriptionPlans] = useState([])
  const [creditPackages, setCreditPackages] = useState([])
  const [isYearlyMember, setIsYearlyMember] = useState(false)

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

  // 获取积分套餐数据
  useEffect(() => {
    const fetchCreditPackages = async () => {
      if (!visible || !user) return;
      
      setPackagesLoading(true)
      try {
        // 修正URL路径，使用正确的API端点
        const response = await axios.get(`${API_ENDPOINTS.CREDITS.PACKAGES}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })
        
        if (response.data.success) {
          const { packages = [], isYearlyMember = false } = response.data.data || {}
          setCreditPackages(packages)
          setIsYearlyMember(isYearlyMember)
        } else {
          setCreditPackages([])
          setIsYearlyMember(Boolean(user?.membershipType === 'vip'))
        }
      } catch (error) {
        console.error('获取积分套餐失败:', error)
        setCreditPackages([])
        setIsYearlyMember(Boolean(user?.membershipType === 'vip'))
      } finally {
        setPackagesLoading(false)
      }
    }

    fetchCreditPackages()
  }, [visible, user])

  const handleSubscribe = async (plan) => {
    if (!user) {
      message.warning('请先登录')
      return
    }

    setSelectedPlan(plan)
    setLoading(true)

    try {
      // 调用真实的API创建订阅
      const subscriptionData = {
        plan_id: plan._id,
        payment_method: 'alipay', // 默认支付方式，实际应由用户选择
        transaction_id: `txn_${Date.now()}`, // 生成交易ID，实际应由支付系统返回
        auto_renew: true
      }
      
      const response = await subscriptionService.createSubscription(subscriptionData)
      
      if (response.success) {
        message.success(`成功订阅${plan.name}！`)
        
        // 更新用户状态和积分
        if (response.data && response.data.user) {
          // 通过AuthContext更新完整用户信息
          updateUserInfo(response.data.user)
          logger.log('订阅成功，用户信息已更新:', response.data.user)
        }
      } else {
        throw new Error(response.message || '订阅失败')
      }
      
    } catch (error) {
      console.error('订阅失败:', error)
      message.error(error.message || '订阅失败，请重试')
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
      // 调用真实的API购买积分套餐
      const purchaseData = {
        package_id: pkg._id,
        payment_method: 'alipay', // 默认支付方式，实际应由用户选择
        transaction_id: `txn_${Date.now()}` // 生成交易ID，实际应由支付系统返回
      }
      
      const response = await creditService.purchaseCreditPackage(purchaseData)
      
      if (response.success) {
        const totalCredits = response.data.purchased_credits
        updateCredits(response.data.user.credits_balance)
        message.success(`成功充值${totalCredits}积分！`)
      } else {
        throw new Error(response.message || '充值失败')
      }
      
    } catch (error) {
      console.error('充值失败:', error)
      message.error(error.message || '充值失败，请重试')
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

        {/* 积分充值 - 仅对年度会员显示 */}
        <div style={{ marginBottom: '48px' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <Title level={3}>
              <WalletOutlined style={{ color: '#52c41a', marginRight: '8px' }} />
              积分充值
            </Title>
            <Text type="secondary">购买积分，畅享AI生成服务</Text>
          </div>

          {!isYearlyMember && (
            <Alert
              type="info"
              showIcon
              icon={<InfoCircleOutlined />}
              message="提示"
              description="积分套餐为年度会员专享购买权限，您可以先升级年度会员再进行充值。"
              style={{ marginBottom: '24px' }}
            />
          )}

          {packagesLoading ? (
            <div style={{ textAlign: 'center', padding: '24px' }}>
              <Spin />
              <p>加载积分套餐中...</p>
            </div>
          ) : creditPackages.length > 0 ? (
            <Row gutter={[16, 16]} justify="center">
              {creditPackages.map((pkg) => (
                <Col key={pkg._id} xs={12} sm={8} lg={6}>
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
                      {pkg.bonus_credits > 0 && (
                        <div>
                          <Tag color="orange" size="small">
                            +{pkg.bonus_credits} 赠送
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
                      disabled={!isYearlyMember}
                      onClick={() => handleBuyCredits(pkg)}
                    >
                      {isYearlyMember ? '立即充值' : '年度会员专享'}
                    </Button>
                  </Card>
                </Col>
              ))}
            </Row>
          ) : (
            <div style={{ textAlign: 'center', padding: '24px' }}>
              <p>暂无可用的积分套餐</p>
            </div>
          )}
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