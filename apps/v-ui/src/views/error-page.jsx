import React from 'react';
import { Card, Button, Typography, Space } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Paragraph } = Typography;

const ErrorPage = () => {
  //const publicUrl = import.meta.env.VITE_PUBLIC_URL;
  const navigate = useNavigate();

  const goHome = () => {
    navigate(`/`, { replace: true });
  };

  return (
    <Space
      direction="vertical"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        textAlign: 'center',
      }}
    >
      <Card
        bordered={false}
        style={{
          maxWidth: 600,
          width: '100%',
          padding: '40px',
          textAlign: 'center',
        }}
      >
        <ExclamationCircleOutlined style={{ fontSize: '64px', color: '#ff4d4f' }} />
        <Title level={2} style={{ marginTop: '20px' }}>
          Oops! Something Went Wrong.
        </Title>
        <Paragraph>
          Sorry, but you don't have access to this page. Please check your permissions or contact the admin.
        </Paragraph>
        <Space size="large">
          <Button type="primary" onClick={goHome}>Go Home</Button>
        </Space>
      </Card>
    </Space>
  );
};

export default ErrorPage;