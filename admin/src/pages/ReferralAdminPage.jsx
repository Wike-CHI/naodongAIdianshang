import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Button,
  Space,
  Tag,
  DatePicker,
  Select,
  Input,
  Modal,
  Form,
  InputNumber,
  message,
  Tabs,
  Divider,
  Progress
} from 'antd';
import {
  UserAddOutlined,
  DollarOutlined,
  PercentageOutlined,
  TrophyOutlined,
  SettingOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  ExportOutlined
} from '@ant-design/icons';
import { adminApi, adminSystemConfigApi } from '../services/referralApi';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { Search } = Input;
// const { TabPane } = Tabs; // 已弃用，改用items属性

const ReferralAdminPage = () => {
  const [loading, setLoading] = useState(false);
  const [overview, setOverview] = useState({});
  const [relationships, setRelationships] = useState([]);
  const [systemConfig, setSystemConfig] = useState({});
  const [configModalVisible, setConfigModalVisible] = useState(false);
  const [filters, setFilters] = useState({
    dateRange: null,
    status: 'all',
    search: ''
  });
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0
  });
  const [form] = Form.useForm();

  // 加载推广概览数据
  const loadOverview = async () => {
    try {
      const result = await adminApi.getOverview();
      if (result.success) {
        setOverview(result.data);
      } else {
        message.error(result.error || '获取概览数据失败');
      }
    } catch (error) {
      console.error('加载概览数据失败:', error);
      message.error('加载概览数据失败');
    }
  };

  // 加载推广关系列表
  const loadRelationships = async () => {
    try {
      setLoading(true);
      const result = await adminApi.getAllRelationships(
        pagination.current,
        pagination.pageSize
      );
      if (result.success) {
        // 确保数据是数组类型
        setRelationships(Array.isArray(result.data.relationships) ? result.data.relationships : []);
        setPagination(prev => ({
          ...prev,
          total: result.data.total
        }));
      } else {
        message.error(result.error || '获取推广关系失败');
        setRelationships([]); // 设置为空数组
      }
    } catch (error) {
      console.error('加载推广关系失败:', error);
      message.error('加载推广关系失败');
      setRelationships([]); // 设置为空数组
    } finally {
      setLoading(false);
    }
  };

  // 加载系统配置
  const loadSystemConfig = async () => {
    try {
      const result = await adminSystemConfigApi.getConfig();
      if (result.success) {
        setSystemConfig(result.data);
        form.setFieldsValue(result.data);
      } else {
        message.error(result.error || '获取系统配置失败');
      }
    } catch (error) {
      console.error('加载系统配置失败:', error);
      message.error('加载系统配置失败');
    }
  };

  // 重置配置
  const handleResetConfig = async () => {
    try {
      setLoading(true);
      const result = await adminSystemConfigApi.resetConfig();
      if (result.success) {
        message.success('配置重置成功');
        loadSystemConfig();
      } else {
        message.error(result.error || '配置重置失败');
      }
    } catch (error) {
      message.error('配置重置失败');
    } finally {
      setLoading(false);
    }
  };

  // 保存系统配置
  const handleConfigSave = async (values) => {
    try {
      setLoading(true);
      const promises = Object.entries(values).map(([key, value]) =>
        adminSystemConfigApi.updateConfig(key, value)
      );
      
      await Promise.all(promises);
      message.success('系统配置保存成功');
      setConfigModalVisible(false);
      loadSystemConfig();
    } catch (error) {
      console.error('保存系统配置失败:', error);
      message.error('保存系统配置失败');
    } finally {
      setLoading(false);
    }
  };

  // 处理表格分页变化
  const handleTableChange = (pagination) => {
    setPagination(pagination);
  };

  // 导出数据
  const handleExport = () => {
    // 简化的导出功能，实际项目中可以生成CSV或Excel文件
    const data = relationships.map(rel => ({
      推广时间: new Date(rel.created_at).toLocaleString('zh-CN'),
      推广者: rel.referrer_name,
      被推广者: rel.referee_name,
      推广码: rel.referral_code,
      状态: rel.status === 'completed' ? '已完成' : '进行中',
      首次购买时间: rel.first_purchase_at ? new Date(rel.first_purchase_at).toLocaleString('zh-CN') : '未购买'
    }));
    
    const csvContent = [
      Object.keys(data[0]).join(','),
      ...data.map(row => Object.values(row).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `推广数据_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    message.success('数据导出成功');
  };

  useEffect(() => {
    loadOverview();
    loadSystemConfig();
  }, []);

  useEffect(() => {
    loadRelationships();
  }, [pagination.current, pagination.pageSize]);

  // 推广关系表格列定义
  const columns = [
    {
      title: '推广时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (text) => new Date(text).toLocaleString('zh-CN'),
      width: 150
    },
    {
      title: '推广者',
      dataIndex: 'referrer_name',
      key: 'referrer_name',
      width: 120
    },
    {
      title: '被推广者',
      dataIndex: 'referee_name',
      key: 'referee_name',
      width: 120
    },
    {
      title: '推广码',
      dataIndex: 'referral_code',
      key: 'referral_code',
      width: 120,
      render: (text) => <code>{text}</code>
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => (
        <Tag color={status === 'completed' ? 'success' : 'processing'}>
          {status === 'completed' ? '已完成' : '进行中'}
        </Tag>
      )
    },
    {
      title: '首次购买时间',
      dataIndex: 'first_purchase_at',
      key: 'first_purchase_at',
      width: 150,
      render: (text) => text ? new Date(text).toLocaleString('zh-CN') : '未购买'
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => {
              // 编辑推广关系的逻辑
              message.info('编辑功能开发中');
            }}
          >
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => {
              // 删除推广关系的逻辑
              Modal.confirm({
                title: '确认删除',
                content: '确定要删除这条推广关系吗？',
                onOk: () => {
                  message.info('删除功能开发中');
                }
              });
            }}
          >
            删除
          </Button>
        </Space>
      )
    }
  ];

  const tabItems = [
    {
      key: 'overview',
      label: '数据概览',
      children: (
        <>
          {/* 统计卡片 */}
          <Row gutter={16} style={{ marginBottom: '24px' }}>
            <Col xs={12} sm={6}>
              <Card>
                <Statistic
                  title="总用户数"
                  value={overview.totalUsers || 0}
                  prefix={<UserAddOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card>
                <Statistic
                  title="推广关系总数"
                  value={overview.totalRelationships || 0}
                  prefix={<TrophyOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card>
                <Statistic
                  title="转化率"
                  value={overview.conversionRate || 0}
                  suffix="%"
                  prefix={<PercentageOutlined />}
                  valueStyle={{ color: '#faad14' }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card>
                <Statistic
                  title="总积分发放"
                  value={overview.totalPointsIssued || 0}
                  prefix={<DollarOutlined />}
                  valueStyle={{ color: '#f5222d' }}
                />
              </Card>
            </Col>
          </Row>

          {/* 最近7天数据 */}
          <Card title="最近7天数据" style={{ marginBottom: '24px' }}>
            <Row gutter={16}>
              <Col xs={12} sm={6}>
                <Statistic
                  title="新增推广关系"
                  value={overview.recentRelationships || 0}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Col>
              <Col xs={12} sm={6}>
                <Statistic
                  title="新增积分发放"
                  value={overview.recentPoints || 0}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Col>
              <Col xs={12} sm={6}>
                <Progress
                  type="circle"
                  percent={Math.min((overview.recentRelationships || 0) / 100 * 100, 100)}
                  format={() => `${overview.recentRelationships || 0}`}
                  size={80}
                />
                <div style={{ textAlign: 'center', marginTop: '8px' }}>
                  <span style={{ fontSize: '12px', color: '#666' }}>推广活跃度</span>
                </div>
              </Col>
              <Col xs={12} sm={6}>
                <Progress
                  type="circle"
                  percent={parseFloat(overview.conversionRate || 0)}
                  format={(percent) => `${percent}%`}
                  size={80}
                />
                <div style={{ textAlign: 'center', marginTop: '8px' }}>
                  <span style={{ fontSize: '12px', color: '#666' }}>转化率</span>
                </div>
              </Col>
            </Row>
          </Card>
        </>
      )
    },
    {
      key: 'relationships',
      label: '推广关系管理',
      children: (
        <Card
          title="推广关系列表"
          extra={
            <Space>
              <Search
                placeholder="搜索用户名或推广码"
                allowClear
                style={{ width: 200 }}
                onSearch={(value) => {
                  setFilters(prev => ({ ...prev, search: value }));
                }}
              />
              <RangePicker
                placeholder={['开始日期', '结束日期']}
                onChange={(dates) => {
                  setFilters(prev => ({ ...prev, dateRange: dates }));
                }}
              />
              <Select
                value={filters.status}
                onChange={(value) => {
                  setFilters(prev => ({ ...prev, status: value }));
                }}
                style={{ width: 120 }}
              >
                <Option value="all">全部状态</Option>
                <Option value="active">进行中</Option>
                <Option value="completed">已完成</Option>
              </Select>
              <Button
                type="primary"
                icon={<ExportOutlined />}
                onClick={handleExport}
              >
                导出数据
              </Button>
            </Space>
          }
        >
          <Table
            columns={columns}
            dataSource={relationships}
            rowKey="id"
            loading={loading}
            pagination={{
              ...pagination,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条记录`
            }}
            onChange={handleTableChange}
          />
        </Card>
      )
    },
    {
      key: 'config',
      label: '系统配置',
      children: (
        <Card
          title="推广系统配置"
          extra={
            <Button
              type="primary"
              icon={<SettingOutlined />}
              onClick={() => setConfigModalVisible(true)}
            >
              修改配置
            </Button>
          }
        >
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={6}>
              <Card size="small">
                <Statistic
                  title="推广积分比例"
                  value={systemConfig.referral_points_rate * 100 || 0}
                  suffix="%"
                  precision={1}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card size="small">
                <Statistic
                  title="最小充值金额"
                  value={systemConfig.min_purchase_amount || 0}
                  suffix="元"
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card size="small">
                <Statistic
                  title="推广码长度"
                  value={systemConfig.referral_code_length || 0}
                  suffix="位"
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card size="small">
                <Statistic
                  title="最大推广层级"
                  value={systemConfig.max_referral_levels || 0}
                  suffix="级"
                />
              </Card>
            </Col>
          </Row>

          <Divider />

          <div>
            <h4>配置说明</h4>
            <ul style={{ color: '#666', fontSize: '14px' }}>
              <li>推广积分比例：被推广用户充值时，推广者获得的积分比例</li>
              <li>最小充值金额：触发推广奖励的最小充值金额</li>
              <li>推广码长度：自动生成推广码的字符长度</li>
              <li>最大推广层级：支持的推广层级深度</li>
            </ul>
          </div>
        </Card>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Tabs defaultActiveKey="overview" items={tabItems} />

      {/* 配置修改弹窗 */}
      <Modal
        title="修改系统配置"
        open={configModalVisible}
        onCancel={() => setConfigModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleConfigSave}
        >
          <Form.Item
            name="referral_points_rate"
            label="推广积分比例"
            rules={[{ required: true, message: '请输入推广积分比例' }]}
          >
            <InputNumber
              min={0}
              max={1}
              step={0.01}
              precision={2}
              formatter={value => `${(value * 100).toFixed(1)}%`}
              parser={value => value.replace('%', '') / 100}
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            name="min_purchase_amount"
            label="最小充值金额（元）"
            rules={[{ required: true, message: '请输入最小充值金额' }]}
          >
            <InputNumber
              min={1}
              max={1000}
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            name="referral_code_length"
            label="推广码长度"
            rules={[{ required: true, message: '请输入推广码长度' }]}
          >
            <InputNumber
              min={6}
              max={20}
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            name="max_referral_levels"
            label="最大推广层级"
            rules={[{ required: true, message: '请输入最大推广层级' }]}
          >
            <InputNumber
              min={1}
              max={10}
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                保存配置
              </Button>
              <Button onClick={() => setConfigModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ReferralAdminPage;