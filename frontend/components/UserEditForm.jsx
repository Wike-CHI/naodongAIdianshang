import React, { useState, useEffect } from 'react';
import { 
  Modal, 
  Form, 
  Input, 
  Upload, 
  Button, 
  message, 
  Avatar, 
  Space,
  Spin,
  Select,
  Alert,
  Descriptions,
  Tag
} from 'antd';
import { 
  UserOutlined, 
  UploadOutlined, 
  SaveOutlined,
  CloseOutlined,
  WechatOutlined,
  PhoneOutlined,
  MailOutlined,
  ShopOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import userService from '../services/userService';
import { useAuth } from '../contexts/AuthContext';

const { Option } = Select;

const UserEditForm = ({ open, onCancel, onSuccess, user }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [previewAvatar, setPreviewAvatar] = useState(null);
  const [updatePermission, setUpdatePermission] = useState(null);
  const [permissionLoading, setPermissionLoading] = useState(false);
  const { updateUserInfo } = useAuth();

  useEffect(() => {
    if (open && user) {
      // 初始化表单数据
      form.setFieldsValue({
        username: user.username,
        email: user.email,
        phone: user.phone,
        wechat_id: user.wechat_id,
        business_type: user.business_type || '个人'
      });
      setPreviewAvatar(user.avatar_url);
      
      // 检查修改权限
      checkUpdatePermission();
    }
  }, [open, user, form]);

  // 检查修改权限
  const checkUpdatePermission = async () => {
    try {
      setPermissionLoading(true);
      const response = await userService.checkProfileUpdatePermission(user.id || user._id);
      if (response.success) {
        setUpdatePermission(response.data);
      }
    } catch (error) {
      console.error('检查修改权限失败:', error);
      message.error('检查修改权限失败');
    } finally {
      setPermissionLoading(false);
    }
  };

  // 处理头像上传
  const handleAvatarChange = (info) => {
    if (info.file.status === 'uploading') {
      setAvatarLoading(true);
      return;
    }
    
    if (info.file.status === 'done') {
      setAvatarLoading(false);
      const response = info.file.response;
      if (response && response.success) {
        setPreviewAvatar(response.data.avatar_url);
        message.success('头像上传成功');
      } else {
        message.error('头像上传失败');
      }
    }
    
    if (info.file.status === 'error') {
      setAvatarLoading(false);
      message.error('头像上传失败');
    }
  };

  // 自定义头像上传
  const customUpload = async ({ file, onSuccess, onError }) => {
    try {
      setAvatarLoading(true);
      const response = await userService.uploadAvatar(user.id || user._id, file);
      if (response.success) {
        onSuccess(response);
        setPreviewAvatar(response.data.avatar_url);
        message.success('头像上传成功');
      } else {
        onError(new Error(response.message || '上传失败'));
      }
    } catch (error) {
      console.error('头像上传失败:', error);
      onError(error);
      message.error(error.message || '头像上传失败');
    } finally {
      setAvatarLoading(false);
    }
  };

  // 提交表单
  const handleSubmit = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();
      
      console.log('📝 提交用户信息更新:', values);
      
      // 构建更新数据
      const updateData = {
        username: values.username,
        email: values.email,
        phone: values.phone,
        wechat_id: values.wechat_id,
        business_type: values.business_type
      };

      // 如果头像有变化，添加头像URL
      if (previewAvatar !== user.avatar_url) {
        updateData.avatar_url = previewAvatar;
      }

      // 调用更新API
      const response = await userService.updateUser(user.id || user._id, updateData);
      
      if (response.success) {
        message.success('用户信息更新成功');
        
        // 更新认证上下文中的用户信息
        updateUserInfo(response.data.user);
        
        // 调用成功回调
        if (onSuccess) {
          onSuccess(response.data.user);
        }
        
        // 关闭弹窗
        onCancel();
      } else {
        message.error(response.message || '更新失败');
      }
    } catch (error) {
      console.error('❌ 更新用户信息失败:', error);
      message.error(error.message || '更新失败');
    } finally {
      setLoading(false);
    }
  };

  // 重置表单
  const handleReset = () => {
    form.resetFields();
    setPreviewAvatar(user?.avatar_url);
  };

  // 经营类型选项
  const businessTypeOptions = [
    '个人',
    '个体工商户', 
    '企业',
    '事业单位',
    '政府机关',
    '其他'
  ];

  return (
    <Modal
      title="编辑个人信息"
      open={open}
      onCancel={onCancel}
      width={700}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          <CloseOutlined /> 取消
        </Button>,
        <Button key="reset" onClick={handleReset}>
          重置
        </Button>,
        <Button 
          key="submit" 
          type="primary" 
          loading={loading}
          onClick={handleSubmit}
          disabled={updatePermission && !updatePermission.canUpdate}
        >
          <SaveOutlined /> 保存
        </Button>
      ]}
    >
      {/* 修改权限提示 */}
      {permissionLoading ? (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <Spin /> 检查修改权限中...
        </div>
      ) : updatePermission && !updatePermission.canUpdate ? (
        <Alert
          message="修改限制"
          description={
            <div>
              <p>{updatePermission.message}</p>
              {updatePermission.lastUpdated && (
                <p>上次修改时间: {new Date(updatePermission.lastUpdated).toLocaleString()}</p>
              )}
              {updatePermission.nextUpdateAvailable && (
                <p>下次可修改时间: {new Date(updatePermission.nextUpdateAvailable).toLocaleString()}</p>
              )}
            </div>
          }
          type="warning"
          showIcon
          style={{ marginBottom: '20px' }}
        />
      ) : updatePermission && updatePermission.canUpdate ? (
        <Alert
          message="可以修改"
          description={updatePermission.message}
          type="success"
          showIcon
          style={{ marginBottom: '20px' }}
        />
      ) : null}

      {/* 修改历史 */}
      {updatePermission && updatePermission.updateHistory && updatePermission.updateHistory.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <Descriptions title="最近修改记录" size="small" column={1}>
            {updatePermission.updateHistory.slice(-3).map((record, index) => (
              <Descriptions.Item 
                key={index}
                label={
                  <span>
                    <ClockCircleOutlined style={{ marginRight: '4px' }} />
                    {new Date(record.updated_at).toLocaleString()}
                  </span>
                }
              >
                <Tag color="blue">{record.field}</Tag>
                {record.old_value || '空'} → {record.new_value || '空'}
              </Descriptions.Item>
            ))}
          </Descriptions>
        </div>
      )}

      <Form
        form={form}
        layout="vertical"
        initialValues={{
          username: user?.username,
          email: user?.email,
          phone: user?.phone,
          wechat_id: user?.wechat_id,
          business_type: user?.business_type || '个人'
        }}
      >
        {/* 头像上传 */}
        <Form.Item label="头像">
          <Space direction="vertical" align="center">
            <Avatar 
              size={80} 
              src={previewAvatar} 
              icon={<UserOutlined />}
            />
            <Upload
              name="avatar"
              showUploadList={false}
              customRequest={customUpload}
              beforeUpload={(file) => {
                const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
                if (!isJpgOrPng) {
                  message.error('只能上传 JPG/PNG 格式的图片!');
                  return false;
                }
                const isLt2M = file.size / 1024 / 1024 < 2;
                if (!isLt2M) {
                  message.error('图片大小不能超过 2MB!');
                  return false;
                }
                return true;
              }}
            >
              <Button 
                icon={<UploadOutlined />} 
                loading={avatarLoading}
                size="small"
              >
                {avatarLoading ? '上传中...' : '更换头像'}
              </Button>
            </Upload>
          </Space>
        </Form.Item>

        {/* 用户名 */}
        <Form.Item
          label="用户名"
          name="username"
          rules={[
            { required: true, message: '请输入用户名' },
            { min: 2, message: '用户名至少需要2个字符' },
            { max: 50, message: '用户名不能超过50个字符' }
          ]}
        >
          <Input 
            placeholder="请输入用户名"
            prefix={<UserOutlined />}
          />
        </Form.Item>

        {/* 邮箱 */}
        <Form.Item
          label={
            <span>
              <MailOutlined style={{ marginRight: '4px' }} />
              邮箱
              {updatePermission && !updatePermission.canUpdate && (
                <Tag color="orange" size="small" style={{ marginLeft: '8px' }}>30天限制</Tag>
              )}
            </span>
          }
          name="email"
          rules={[
            { type: 'email', message: '请输入有效的邮箱地址' }
          ]}
        >
          <Input 
            placeholder="请输入邮箱地址"
            type="email"
            disabled={updatePermission && !updatePermission.canUpdate}
          />
        </Form.Item>

        {/* 手机号 */}
        <Form.Item
          label={
            <span>
              <PhoneOutlined style={{ marginRight: '4px' }} />
              手机号
              {updatePermission && !updatePermission.canUpdate && (
                <Tag color="orange" size="small" style={{ marginLeft: '8px' }}>30天限制</Tag>
              )}
            </span>
          }
          name="phone"
          rules={[
            { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号码' }
          ]}
        >
          <Input 
            placeholder="请输入手机号码"
            type="tel"
            disabled={updatePermission && !updatePermission.canUpdate}
          />
        </Form.Item>

        {/* 微信号 */}
        <Form.Item
          label={
            <span>
              <WechatOutlined style={{ marginRight: '4px' }} />
              微信号
              {updatePermission && !updatePermission.canUpdate && (
                <Tag color="orange" size="small" style={{ marginLeft: '8px' }}>30天限制</Tag>
              )}
            </span>
          }
          name="wechat_id"
          rules={[
            { max: 50, message: '微信号不能超过50个字符' }
          ]}
        >
          <Input 
            placeholder="请输入微信号"
            disabled={updatePermission && !updatePermission.canUpdate}
          />
        </Form.Item>

        {/* 经营类型 */}
        <Form.Item
          label={
            <span>
              <ShopOutlined style={{ marginRight: '4px' }} />
              经营类型
              {updatePermission && !updatePermission.canUpdate && (
                <Tag color="orange" size="small" style={{ marginLeft: '8px' }}>30天限制</Tag>
              )}
            </span>
          }
          name="business_type"
        >
          <Select 
            placeholder="请选择经营类型"
            disabled={updatePermission && !updatePermission.canUpdate}
          >
            {businessTypeOptions.map(type => (
              <Option key={type} value={type}>{type}</Option>
            ))}
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default UserEditForm;