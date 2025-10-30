import React from 'react';
import { Outlet } from 'react-router-dom';
import { Layout, Button, message } from 'antd';
import { 
  LogoutOutlined
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import './MainLayout.css';

const { Header, Content } = Layout;

const MainLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      message.success('登出成功');
      navigate('/login');
    } catch (error) {
      console.error('登出失败:', error);
      message.error('登出失败');
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Layout>
        <Header className="site-layout-header">
          <div className="header-content">
            <div className="user-info">
              {user && (
                <>
                  <span>欢迎, {user.username}</span>
                  <Button 
                    type="text" 
                    icon={<LogoutOutlined />} 
                    onClick={handleLogout}
                    style={{ color: 'white' }}
                  >
                    登出
                  </Button>
                </>
              )}
            </div>
          </div>
        </Header>
        <Content style={{ margin: '24px 16px 0' }}>
          <div className="site-layout-background" style={{ padding: 24, minHeight: 360 }}>
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;