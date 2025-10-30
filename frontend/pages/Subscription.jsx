import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  Card, 
  List, 
  Button, 
  message, 
  Spin, 
  Modal, 
  Typography, 
  Tag, 
  Descriptions,
  Row,
  Col,
  Statistic,
  Divider,
  Alert
} from 'antd';
import { 
  CheckCircleOutlined, 
  CrownOutlined, 
  WalletOutlined,
  ClockCircleOutlined,
  CheckOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import subscriptionService from '../services/subscriptionService';
import creditService from '../services/creditService';
import { validateApiResponse } from '../utils/apiValidator';

const { Title, Text } = Typography;

const Subscription = () => {
  const { user, updateUserInfo } = useAuth();
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmingPlan, setConfirmingPlan] = useState(null);
  const [activeSubscription, setActiveSubscription] = useState(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('🔄 初始化订阅页面');
    fetchSubscriptionData();
  }, []);

  const fetchSubscriptionData = async () => {
    try {
      console.log('📥 获取订阅数据');
      setLoading(true);
      setError(null);
      
      // 获取订阅套餐列表
      const plansResponse = await subscriptionService.getSubscriptionPlans();
      if (plansResponse?.success) {
        const validatedPlans = plansResponse.data?.plans || [];
        setPlans(validatedPlans);
        console.log('✅ 获取订阅套餐列表成功:', validatedPlans.length, '个套餐');
      } else {
        throw new Error(plansResponse?.message || '获取订阅套餐失败');
      }

      // 获取当前用户的订阅信息
      try {
        console.log('👤 获取用户订阅信息');
        const subscriptionResponse = await subscriptionService.getUserSubscription();
        if (subscriptionResponse?.success) {
          const validatedSubscription = validateApiResponse(subscriptionResponse.data, 'subscription');
          setActiveSubscription(validatedSubscription);
          console.log('✅ 获取用户订阅信息成功:', validatedSubscription);
        } else {
          console.log('ℹ️ 用户当前没有活跃订阅');
        }
      } catch (subError) {
        // 如果没有订阅，这是正常的
        console.log('ℹ️ 用户当前没有活跃订阅:', subError.message);
      }
    } catch (error) {
      console.error('❌ 获取订阅数据失败:', error);
      setError(error.message || '获取订阅数据失败');
      message.error(error.message || '获取订阅数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = (plan) => {
    console.log('💳 准备订阅套餐:', plan);
    setConfirmingPlan(plan);
  };

  const confirmSubscription = async () => {
    if (!confirmingPlan) {
      console.warn('⚠️ 未选择订阅套餐');
      return;
    }

    try {
      console.log('💳 开始订阅流程:', confirmingPlan);
      setSubscriptionLoading(true);
      setError(null);
      
      // 模拟支付流程
      const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const subscriptionData = {
        plan_id: confirmingPlan.id,
        payment_method: 'wechat',
        transaction_id: transactionId
      };

      console.log('📤 发送订阅请求:', subscriptionData);
      const response = await subscriptionService.createSubscription(subscriptionData);
      
      if (response?.success) {
        console.log('✅ 订阅成功:', response);
        // 验证API响应
        const validatedData = validateApiResponse(response.data, 'subscription');
        
        // 更新用户信息（积分和会员状态）
        if (validatedData.user) {
          // 确保使用统一的积分字段
          const updatedUser = {
            ...validatedData.user,
            credits: validatedData.user.credits_balance !== undefined ? 
                     validatedData.user.credits_balance : 
                     validatedData.user.credits,
            credits_balance: validatedData.user.credits_balance !== undefined ? 
                             validatedData.user.credits_balance : 
                             validatedData.user.credits
          };
          updateUserInfo(updatedUser);
          console.log('👤 用户信息已更新:', updatedUser);
        }

        // 更新活跃订阅信息
        if (validatedData.subscription) {
          setActiveSubscription(validatedData.subscription);
          console.log('📋 活跃订阅已更新:', validatedData.subscription);
        }

        message.success(response.message || '订阅成功！');
        setConfirmingPlan(null);
        
        // 可以选择跳转到个人资料页面查看更新后的信息
        // navigate('/profile');
      } else {
        throw new Error(response?.message || '订阅失败');
      }
    } catch (error) {
      console.error('❌ 订阅失败:', error);
      setError(error.message || '订阅失败，请重试');
      message.error(error.message || '订阅失败，请重试');
    } finally {
      setSubscriptionLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!activeSubscription) {
      console.warn('⚠️ 没有活跃订阅');
      return;
    }

    try {
      console.log('🚫 开始取消订阅:', activeSubscription.id);
      const response = await subscriptionService.cancelSubscription(activeSubscription.id);
      
      if (response?.success) {
        console.log('✅ 订阅已取消:', response);
        message.success('订阅已取消');
        setActiveSubscription(null);
        // 更新用户信息
        if (response.data?.user) {
          // 确保使用统一的积分字段
          const updatedUser = {
            ...response.data.user,
            credits: response.data.user.credits_balance !== undefined ? 
                     response.data.user.credits_balance : 
                     response.data.user.credits,
            credits_balance: response.data.user.credits_balance !== undefined ? 
                             response.data.user.credits_balance : 
                             response.data.user.credits
          };
          updateUserInfo(updatedUser);
          console.log('👤 用户信息已更新:', updatedUser);
        }
      } else {
        throw new Error(response?.message || '取消订阅失败');
      }
    } catch (error) {
      console.error('❌ 取消订阅失败:', error);
      setError(error.message || '取消订阅失败');
      message.error(error.message || '取消订阅失败');
    }
  };

  const getMembershipLevel = (plan) => {
    if (plan.is_yearly) return '年度会员';
    if (plan.price > 100) return 'VIP会员';
    if (plan.price > 50) return '高级会员';
    return '基础会员';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('zh-CN');
  };

  const formatEndDate = (endDate) => {
    const date = new Date(endDate);
    const now = new Date();
    const diffTime = date - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 0) {
      return `${formatDate(endDate)} (剩余 ${diffDays} 天)`;
    } else {
      return `${formatDate(endDate)} (已过期)`;
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <p>加载中...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>
        <CrownOutlined /> 会员订阅
      </Title>
      
      {error && (
        <Alert 
          message="错误" 
          description={error} 
          type="error" 
          showIcon 
          style={{ marginBottom: '24px' }}
        />
      )}
      
      {activeSubscription ? (
        <Card style={{ marginBottom: '24px' }}>
          <Title level={4}>当前订阅</Title>
          <Descriptions bordered column={1}>
            <Descriptions.Item label="套餐名称">
              {activeSubscription.plan_id?.name || '未知套餐'}
            </Descriptions.Item>
            <Descriptions.Item label="订阅状态">
              <Tag color={activeSubscription.status === 'active' ? 'green' : 'red'}>
                {activeSubscription.status === 'active' ? '活跃' : '已取消'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="开始日期">
              {formatDate(activeSubscription.start_date)}
            </Descriptions.Item>
            <Descriptions.Item label="结束日期">
              {formatEndDate(activeSubscription.end_date)}
            </Descriptions.Item>
            <Descriptions.Item label="已授予积分">
              <WalletOutlined /> {activeSubscription.credits_granted}
            </Descriptions.Item>
            <Descriptions.Item label="已使用积分">
              <WalletOutlined /> {activeSubscription.credits_used}
            </Descriptions.Item>
            <Descriptions.Item label="年度会员">
              {activeSubscription.is_yearly_member ? (
                <Tag icon={<CheckOutlined />} color="green">是</Tag>
              ) : (
                '否'
              )}
            </Descriptions.Item>
          </Descriptions>
          {activeSubscription.status === 'active' && (
            <Button 
              type="primary" 
              danger 
              onClick={handleCancelSubscription}
              style={{ marginTop: '16px' }}
              loading={subscriptionLoading}
            >
              取消订阅
            </Button>
          )}
        </Card>
      ) : (
        <Card style={{ marginBottom: '24px' }}>
          <Text type="secondary">您当前没有活跃的订阅</Text>
        </Card>
      )}

      <Divider />
      
      <Title level={3}>选择会员套餐</Title>
      
      <List
        grid={{ gutter: 16, column: 3 }}
        dataSource={plans}
        renderItem={plan => (
          <List.Item>
            <Card 
              title={
                <div style={{ textAlign: 'center' }}>
                  <h3>{plan.name}</h3>
                  <Text type="secondary">{plan.description}</Text>
                </div>
              }
              bordered
              extra={
                plan.popular ? (
                  <Tag color="red" icon={<CheckCircleOutlined />}>推荐</Tag>
                ) : null
              }
            >
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <Statistic
                  value={plan.is_yearly && plan.yearly_price ? plan.yearly_price : plan.price}
                  prefix="¥"
                  suffix={plan.is_yearly && plan.yearly_price ? "/年" : "/月"}
                  valueStyle={{ fontSize: '24px', color: '#faad14' }}
                />
                {plan.is_yearly && plan.yearly_price && plan.price && (
                  <div>
                    <Text delete type="secondary">¥{plan.price * 12}/年</Text>
                    <br />
                    <Text type="success">
                      节省 ¥{plan.price * 12 - plan.yearly_price}
                    </Text>
                  </div>
                )}
              </div>
              
              <Divider />
              
              <div style={{ marginBottom: '20px' }}>
                <Row gutter={[8, 8]}>
                  <Col span={24}>
                    <Text>
                      <CheckCircleOutlined style={{ color: '#52c41a' }} /> 
                      <strong> {plan.benefits?.monthly_credits || 0} 积分/月</strong>
                    </Text>
                  </Col>
                  <Col span={24}>
                    <Text>
                      <CheckCircleOutlined style={{ color: '#52c41a' }} /> 
                      会员等级: {getMembershipLevel(plan)}
                    </Text>
                  </Col>
                  {plan.benefits?.priority_processing && (
                    <Col span={24}>
                      <Text>
                        <CheckCircleOutlined style={{ color: '#52c41a' }} /> 
                        优先处理
                      </Text>
                    </Col>
                  )}
                  {plan.benefits?.advanced_features && (
                    <Col span={24}>
                      <Text>
                        <CheckCircleOutlined style={{ color: '#52c41a' }} /> 
                        高级功能
                      </Text>
                    </Col>
                  )}
                  {plan.is_yearly && (
                    <Col span={24}>
                      <Text>
                        <CheckCircleOutlined style={{ color: '#52c41a' }} /> 
                        年度会员特权
                      </Text>
                    </Col>
                  )}
                </Row>
              </div>
              
              <Button
                type="primary"
                block
                onClick={() => handleSubscribe(plan)}
                disabled={activeSubscription?.status === 'active' || subscriptionLoading}
                loading={subscriptionLoading && confirmingPlan?.id === plan.id}
              >
                {activeSubscription?.status === 'active' ? '已有订阅' : '立即订阅'}
              </Button>
            </Card>
          </List.Item>
        )}
      />

      <Modal
        title="确认订阅"
        open={!!confirmingPlan}
        onOk={confirmSubscription}
        onCancel={() => {
          console.log('❌ 取消订阅确认');
          setConfirmingPlan(null);
        }}
        confirmLoading={subscriptionLoading}
        okText="确认支付"
        cancelText="取消"
      >
        {confirmingPlan && (
          <div>
            <h3>{confirmingPlan.name}</h3>
            <p>{confirmingPlan.description}</p>
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="价格">
                ¥{confirmingPlan.is_yearly && confirmingPlan.yearly_price ? 
                  confirmingPlan.yearly_price : confirmingPlan.price}
                {confirmingPlan.is_yearly && confirmingPlan.yearly_price ? "/年" : "/月"}
              </Descriptions.Item>
              <Descriptions.Item label="包含积分">
                <WalletOutlined /> {confirmingPlan.benefits?.monthly_credits || 0} 积分/月
              </Descriptions.Item>
              <Descriptions.Item label="会员等级">
                {getMembershipLevel(confirmingPlan)}
              </Descriptions.Item>
              {confirmingPlan.is_yearly && (
                <Descriptions.Item label="年度会员">
                  <Tag icon={<CheckOutlined />} color="green">是</Tag>
                </Descriptions.Item>
              )}
            </Descriptions>
            <div style={{ marginTop: '16px' }}>
              <Text type="secondary">
                * 点击"确认支付"将模拟完成支付流程，实际不会扣除任何费用
              </Text>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Subscription;