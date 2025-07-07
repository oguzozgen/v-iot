import React, { useEffect } from 'react';
import { Card, Col, Row, Typography, Space } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import useClerkAuth from '../hooks/useClerkAuth';
const { Title, Text } = Typography;

const AccessDeniedPage = () => {
    const auth = useClerkAuth();
    const navigate = useNavigate();
    const handleGoHome = () => {
        navigate('/', { replace: true });
    };


    //const [hasTriedSignin, setHasTriedSignin] = useState(false);

    useEffect(() => {
        if (auth.isAuthenticated) {
            handleGoHome();
        }
    }, [auth.isAuthenticated, navigate]);
    return (
        <Row
            justify="center"
            align="middle"
            style={{ height: '100vh', background: '#f0f2f5' }}
        >
            <Col span={12}>
                <Card
                    bordered={false}
                    style={{
                        textAlign: 'center',
                        padding: '40px',
                        borderRadius: '8px',
                        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                        backgroundColor: '#fff',
                    }}
                >
                    <LockOutlined style={{ fontSize: '48px', color: '#ff4d4f' }} />
                    <Title level={2} style={{ marginTop: '16px' }}>
                        Access Denied
                    </Title>
                    <Text type="secondary">
                        You do not have permission to view this page.
                    </Text>
                    <div style={{ marginTop: '24px' }}>
                        <Space>
                            <button
                                onClick={handleGoHome}
                                style={{
                                    padding: '10px 20px',
                                    border: 'none',
                                    backgroundColor: '#1890ff',
                                    color: '#fff',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                }}
                            >
                                Go Home
                            </button>
                        </Space>
                    </div>
                </Card>
            </Col>
        </Row>
    );
};

export default AccessDeniedPage;