import React, { useState, useEffect } from 'react'
import { 
  Card, 
  Row, 
  Col, 
  Statistic, 
  Button, 
  Input, 
  QRCode, 
  Table, 
  DatePicker, 
  Select, 
  Space,
  message,
  Modal,
  Tooltip,
  Tag
} from 'antd';
import { 
  ShareAltOutlined, 
  CopyOutlined, 
  QrcodeOutlined,
  UserAddOutlined,
  DollarOutlined,
  PercentageOutlined,
  TrophyOutlined
} from '@ant-design/icons';
import { referralApi } from '../services/referralApi';
import { useAuth } from '../contexts/AuthContext';

const { RangePicker } = DatePicker;
const { Option } = Select;

const ReferralManagement = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [referralData, setReferralData] = useState({
    referralCode: '',
    isActive: false
  });
  const [stats, setStats] = useState({
    totalReferrals: 0,
    successfulReferrals: 0,
    conversionRate: 0,
    totalEarnings: 0,
    referralDetails: []
  });
  const [referralList, setReferralList] = useState([]);
  const [filters, setFilters] = useState({
    dateRange: null,
    status: 'all'
  });

  // 获取推广链接
  const getReferralLink = () => {
    if (!referralData.referralCode) return '';
    return `${window.location.origin}?ref=${referralData.referralCode}`;
  };

  // 复制到剪贴板
  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text).then(() => {
      message.success(`${type}已复制到剪贴板`);
    }).catch(() => {
      message.error('复制失败');
    });
  };

  // 加载用户推广数据
  const loadReferralData = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const result = await referralApi.getUserReferralData(user.id);
      if (result.success) {
        setReferralData(result.data);
      } else {
        message.error(result.error || '获取推广数据失败');
      }
    } catch (error) {
      console.error('加载推广数据失败:', error);
      message.error('加载推广数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 加载推广统计
  const loadReferralStats = async () => {
    if (!user?.id) return;
    
    try {
      const result = await referralApi.getReferralStats(user.id, filters);
      if (result.success) {
        setStats(result.data);
      } else {
        message.error(result.error || '获取推广统计失败');
      }
    } catch (error) {
      console.error('加载推广统计失败:', error);
      message.error('加载推广统计失败');
    }
  };

  // 加载推广列表
  const loadReferralList = async () => {
    if (!user?.id) return;
    
    try {
      const result = await referralApi.getReferralList(user.id, filters);
      if (result.success) {
        // 确保数据是数组类型
        setReferralList(Array.isArray(result.data) ? result.data : []);
      } else {
        message.error(result.error || '获取推广列表失败');
        setReferralList([]); // 设置为空数组
      }
    } catch (error) {
      console.error('加载推广列表失败:', error);
      message.error('加载推广列表失败');
      setReferralList([]); // 设置为空数组
    }
  };

  // 处理筛选条件变化
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // 重置筛选条件
  const resetFilters = () => {
    setFilters({
      dateRange: null,
      status: 'all'
    });
  };

  useEffect(() => {
    loadReferralData();
  }, [user?.id]);

  useEffect(() => {
    loadReferralStats();
    loadReferralList();
  }, [user?.id, filters]);

  // 推广记录表格列定义
  const columns = [
    {
      title: '推广时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (text) => new Date(text).toLocaleString('zh-CN')
    },
    {
      title: '被推广用户',
      dataIndex: ['referredUser', 'username'],
      key: 'referredUser',
      render: (text, record) => (
        <Space>
          <span>{text}</span>
          <Tag color={record.referredUser.membershipType === 'premium' ? 'gold' : 'default'}>
            {record.referredUser.membershipType === 'premium' ? '会员' : '普通'}
          </Tag>
        </Space>
      )
    },
    {
      title: '注册状态',
      dataIndex: 'registrationStatus',
      key: 'registrationStatus',
      render: (status) => (
        <Tag color={status === 'completed' ? 'success' : 'processing'}>
          {status === 'completed' ? '已完成' : '进行中'}
        </Tag>
      )
    },
    {
      title: '奖励积分',
      dataIndex: 'rewardCredits',
      key: 'rewardCredits',
      render: (credits, record) => (
        <span style={{ 
          color: record.registrationStatus === 'completed' ? '#52c41a' : '#999' 
        }}>
          +{credits}
        </span>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'completed' ? 'success' : 'warning'}>
          {status === 'completed' ? '已完成' : '待完成'}
        </Tag>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <h1 style={{ marginBottom: '24px' }}>推广管理</h1>
      
      {/* 推广工具卡片 */}
      <Card title="推广工具" style={{ marginBottom: '24px' }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <div style={{ marginBottom: '16px' }}>
              <h4>我的推广码</h4>
              <Space.Compact>
                <Input
                  style={{ width: 'calc(100% - 80px)' }}
                  value={referralData.referralCode}
                  readOnly
                  placeholder="加载中..."
                />
                <Tooltip title="复制推广码">
                  <Button 
                    icon={<CopyOutlined />}
                    onClick={() => copyToClipboard(referralData.referralCode, '推广码')}
                    disabled={!referralData.referralCode}
                  />
                </Tooltip>
              </Space.Compact>
            </div>
          </Col>
          
          <Col xs={24} md={8}>
            <div style={{ marginBottom: '16px' }}>
              <h4>推广链接</h4>
              <Space.Compact>
                <Input
                  style={{ width: 'calc(100% - 80px)' }}
                  value={getReferralLink()}
                  readOnly
                  placeholder="加载中..."
                />
                <Tooltip title="复制推广链接">
                  <Button 
                    icon={<ShareAltOutlined />}
                    onClick={() => copyToClipboard(getReferralLink(), '推广链接')}
                    disabled={!referralData.referralCode}
                  />
                </Tooltip>
              </Space.Compact>
            </div>
          </Col>
          
          <Col xs={24} md={8}>
            <div style={{ marginBottom: '16px' }}>
              <h4>二维码推广</h4>
              <Button 
                type="primary" 
                icon={<QrcodeOutlined />}
                onClick={() => setQrModalVisible(true)}
                disabled={!referralData.referralCode}
                block
              >
                生成二维码
              </Button>
            </div>
          </Col>
        </Row>
      </Card>

      {/* 推广统计卡片 */}
      <Card title="推广统计" style={{ marginBottom: '24px' }}>
        <Row gutter={16}>
          <Col xs={12} sm={6}>
            <Statistic
              title="总推广人数"
              value={stats.totalReferrals}
              prefix={<UserAddOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic
              title="成功注册"
              value={stats.successfulReferrals}
              prefix={<TrophyOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic
              title="转化率"
              value={stats.conversionRate}
              precision={1}
              suffix="%"
              prefix={<PercentageOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic
              title="总收益"
              value={stats.totalEarnings}
              prefix={<DollarOutlined />}
              suffix="积分"
              valueStyle={{ color: '#f5222d' }}
            />
          </Col>
        </Row>
      </Card>

      {/* 推广记录卡片 */}
      <Card 
        title="推广记录" 
        extra={
          <Space>
            <RangePicker
              value={filters.dateRange}
              onChange={(dates) => handleFilterChange('dateRange', dates)}
              placeholder={['开始日期', '结束日期']}
            />
            <Select
              value={filters.status}
              onChange={(value) => handleFilterChange('status', value)}
              style={{ width: 120 }}
            >
              <Option value="all">全部状态</Option>
              <Option value="active">进行中</Option>
              <Option value="completed">已完成</Option>
            </Select>
            <Button onClick={resetFilters}>重置</Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={referralList}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`
          }}
        />
      </Card>

      {/* 二维码弹窗 */}
      <Modal
        title="推广二维码"
        open={qrModalVisible}
        onCancel={() => setQrModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setQrModalVisible(false)}>
            关闭
          </Button>
        ]}
        centered
      >
        <div style={{ textAlign: 'center', padding: '20px' }}>
          {referralData.referralCode && (
            <>
              <QRCode 
                value={getReferralLink()} 
                size={200}
                style={{ marginBottom: '16px' }}
              />
              <p style={{ color: '#666', fontSize: '14px' }}>
                扫描二维码或分享链接邀请好友注册
              </p>
              <p style={{ color: '#999', fontSize: '12px' }}>
                {getReferralLink()}
              </p>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default ReferralManagement;