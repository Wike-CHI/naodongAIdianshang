import React from 'react';
import { Result, Button, Typography } from 'antd';
import { FrownOutlined } from '@ant-design/icons';

const { Paragraph, Text } = Typography;

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // 更新 state 使下一次渲染可以显示降级 UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // 将错误日志记录到控制台
    console.error('🚨 错误边界捕获到错误:', error, errorInfo);
    
    // 也可以将错误日志上报给服务器
    // logErrorToService(error, errorInfo);
    
    // 更新 state 以显示降级 UI
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  handleRetry = () => {
    // 重置错误状态
    this.setState({ hasError: false, error: null, errorInfo: null });
    
    // 如果提供了重试回调，则调用它
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  render() {
    if (this.state.hasError) {
      // 你可以渲染任何自定义的降级 UI
      return (
        <div style={{ padding: '24px', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Result
            icon={<FrownOutlined />}
            title="糟糕，出现了一些问题"
            subTitle={
              <div>
                <Paragraph>
                  <Text type="danger">错误信息: {this.state.error?.message}</Text>
                </Paragraph>
                {process.env.NODE_ENV === 'development' && (
                  <Paragraph>
                    <Text code>
                      {this.state.errorInfo?.componentStack}
                    </Text>
                  </Paragraph>
                )}
              </div>
            }
            extra={[
              <Button type="primary" key="retry" onClick={this.handleRetry}>
                重试
              </Button>,
              <Button 
                key="console" 
                onClick={() => console.log('错误详情:', this.state.error, this.state.errorInfo)}
              >
                查看控制台日志
              </Button>
            ]}
          />
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;