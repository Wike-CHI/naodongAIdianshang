import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Card, Statistic, Row, Col, Divider, Typography, Button, message, Spin, Avatar, List, Tag, Alert } from 'antd';
import { 
  UserOutlined, 
  WalletOutlined, 
  CrownOutlined, 
  HistoryOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  ArrowLeftOutlined,
  EditOutlined
} from '@ant-design/icons';
import creditService from '../services/creditService';
import aiStatsService from '../services/aiStatsService';
import UserEditForm from '../components/UserEditForm';

const { Title, Text } = Typography;

// 工具中文名称映射
const getToolChineseName = (toolId) => {
  const toolNames = {
    'ai-model': 'AI模特生成',
    'try-on-clothes': '同版型试衣',
    'glasses-tryon': '配件试戴',
    'shoe-tryon': '鞋靴试穿',
    'scene-change': '场景更换',
    'color-change': '商品换色'
  };
  return toolNames[toolId] || toolId;
};

const Profile = () => {
  const { user, updateUserInfo } = useAuth();
  const navigate = useNavigate();
  const [creditHistory, setCreditHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [stats, setStats] = useState({
    totalGenerations: 0,
    totalCreditsUsed: 0,
    favoriteTool: ''
  });

  useEffect(() => {
    console.log('👤 初始化个人资料页面');
    fetchProfileData();
  }, [user]);

  const fetchProfileData = async () => {
    try {
      console.log('📥 获取个人资料数据');
      setLoading(true);
      setError(null);
      
      // 获取积分历史
      console.log('📜 获取积分历史');
      const historyResponse = await creditService.getHistory();
      if (historyResponse?.success) {
        const records = historyResponse.data?.records || [];
        setCreditHistory(records);
        console.log('✅ 获取积分历史成功:', records.length, '条记录');
      } else {
        throw new Error(historyResponse?.message || '获取积分历史失败');
      }

      // 获取AI使用统计
      console.log('📊 获取AI使用统计');
      try {
        const aiStatsResponse = await aiStatsService.getPersonalStats();
        console.log('📊 AI使用统计响应:', aiStatsResponse);
        if (aiStatsResponse?.success) {
          const { totalGenerations, totalCreditsUsed, mostUsedTool } = aiStatsResponse.data || {};
          setStats({
            totalGenerations: totalGenerations || 0,
            totalCreditsUsed: totalCreditsUsed || 0,
            favoriteTool: mostUsedTool || ''
          });
          console.log('✅ 获取AI使用统计成功:', aiStatsResponse.data);
        } else {
          console.log('ℹ️ AI使用统计接口返回空或失败:', aiStatsResponse);
          // 如果AI统计获取失败，使用默认值
          setStats({
            totalGenerations: 0,
            totalCreditsUsed: 0,
            favoriteTool: ''
          });
        }
      } catch (aiStatsError) {
        console.error('❌ 获取AI使用统计失败:', aiStatsError);
        // 如果AI统计获取失败，使用默认值
        setStats({
          totalGenerations: 0,
          totalCreditsUsed: 0,
          favoriteTool: ''
        });
      }
    } catch (error) {
      console.error('❌ 获取个人资料数据失败:', error);
      setError(error.message || '获取数据失败');
      message.error(error.message || '获取数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 获取会员类型显示名称
  const getMembershipTypeName = (membershipType) => {
    switch (membershipType) {
      case 'vip': return 'VIP会员';
      case 'premium': return '高级会员';
      default: return '普通用户';
    }
  };

  // 获取会员类型描述
  const getMembershipDescription = (membershipType) => {
    switch (membershipType) {
      case 'vip': return '享受所有功能和优先服务';
      case 'premium': return '享受高级功能和更快处理速度';
      default: return '基础功能';
    }
  };

  // 获取积分类型显示名称
  const getCreditTypeDisplayName = (type) => {
    const typeMap = {
      'earn': '获得',
      'consumption': '消费',
      'recharge': '充值',
      'bonus': '奖励',
      'penalty': '扣除',
      'subscription': '订阅',
      'referral_reward': '推广奖励'
    };
    return typeMap[type] || type;
  };

  // 获取积分类型标签颜色
  const getCreditTypeColor = (type) => {
    const colorMap = {
      'earn': 'green',
      'consumption': 'red',
      'recharge': 'blue',
      'bonus': 'green',
      'penalty': 'red',
      'subscription': 'purple',
      'referral_reward': 'green'
    };
    return colorMap[type] || 'default';
  };

  // 处理编辑成功
  const handleEditSuccess = (updatedUser) => {
    console.log('✅ 用户信息更新成功:', updatedUser);
    message.success('个人信息更新成功');
    // 刷新页面数据
    fetchProfileData();
  };

  if (!user) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <p>加载中...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* 返回按钮 */}
      <div style={{ marginBottom: '24px' }}>
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate('/')}
          style={{ marginBottom: '16px' }}
        >
          返回 AI 工具
        </Button>
        <Title level={2} style={{ margin: 0 }}>个人中心</Title>
      </div>

      {error && (
        <Alert 
          message="错误" 
          description={error} 
          type="error" 
          showIcon 
          style={{ marginBottom: '24px' }}
        />
      )}
      
      <Card
        title="个人信息"
        extra={
          <Button 
            type="primary" 
            icon={<EditOutlined />}
            onClick={() => setEditModalVisible(true)}
          >
            编辑资料
          </Button>
        }
      >
        <Row gutter={24}>
          <Col span={8}>
            <Avatar size={80} icon={<UserOutlined />} src={user.avatar_url} />
          </Col>
          <Col span={16}>
            <Title level={3}>{user.username}</Title>
            <Text type="secondary">用户ID: {user.id || user._id}</Text>
            <br />
            {user.email && (
              <>
                <Text type="secondary">邮箱: {user.email}</Text>
                <br />
              </>
            )}
            {user.phone && (
              <>
                <Text type="secondary">手机: {user.phone}</Text>
                <br />
              </>
            )}
            {user.wechat_id && (
              <>
                <Text type="secondary">微信: {user.wechat_id}</Text>
                <br />
              </>
            )}
            {user.business_type && (
              <Text type="secondary">经营类型: {user.business_type}</Text>
            )}
          </Col>
        </Row>
        
        <Divider />
        
        <Row gutter={16}>
          <Col span={8}>
            <Statistic
              title="剩余积分"
              value={user.credits_balance !== undefined ? user.credits_balance : user.credits}
              prefix={<WalletOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="会员等级"
              value={getMembershipTypeName(user.membershipType || user.role)}
              prefix={<CrownOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="注册时间"
              value={user.created_at ? new Date(user.created_at).toLocaleDateString() : '未知'}
              prefix={<CalendarOutlined />}
            />
          </Col>
        </Row>
        
        <Divider />
        
        <Title level={4}>会员权益</Title>
        <Text>{getMembershipDescription(user.membershipType || user.role)}</Text>
        
        {user.membershipType === 'vip' && (
          <div style={{ marginTop: '10px' }}>
            <Text type="success">✓ 无限制生成次数</Text><br />
            <Text type="success">✓ 优先处理队列</Text><br />
            <Text type="success">✓ 专属客服支持</Text>
          </div>
        )}
      </Card>
      
      <div style={{ marginTop: '24px' }}>
        <Card title="使用统计">
          <Row gutter={16}>
            <Col span={8}>
              <Statistic
                title="总生成次数"
                value={stats.totalGenerations}
                prefix={<HistoryOutlined />}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="累计消耗积分"
                value={stats.totalCreditsUsed}
                prefix={<WalletOutlined />}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="最常用工具"
                value={getToolChineseName(stats.favoriteTool) || '暂无'}
                prefix={<ClockCircleOutlined />}
              />
            </Col>
          </Row>
        </Card>
      </div>
      
      <div style={{ marginTop: '24px' }}>
        <Card 
          title="积分记录" 
          extra={
            <Button type="link" onClick={fetchProfileData}>
              刷新
            </Button>
          }
        >
          {loading ? (
            <div style={{ textAlign: 'center' }}>
              <Spin />
            </div>
          ) : creditHistory.length > 0 ? (
            <List
              itemLayout="horizontal"
              dataSource={creditHistory}
              renderItem={(record) => (
                <List.Item>
                  <List.Item.Meta
                    title={
                      <div>
                        <Tag color={getCreditTypeColor(record.type)}>
                          {getCreditTypeDisplayName(record.type)}
                        </Tag>
                        {' '}{record.description}
                      </div>
                    }
                    description={
                      <div>
                        <Text type="secondary">
                          {new Date(record.created_at).toLocaleString()}
                        </Text>
                        <br />
                        <Text strong>
                          积分变动: 
                          <Text 
                            type={record.amount > 0 ? 'success' : 'danger'}
                          >
                            {' '}{record.amount > 0 ? '+' : ''}{record.amount}
                          </Text>
                          {' '}（余额: {record.balance_after}）
                        </Text>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          ) : (
            <Text type="secondary">暂无积分记录</Text>
          )}
        </Card>
      </div>

      {/* 编辑用户信息弹窗 */}
      <UserEditForm
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        onSuccess={handleEditSuccess}
        user={user}
      />
    </div>
  );
};

export default Profile;