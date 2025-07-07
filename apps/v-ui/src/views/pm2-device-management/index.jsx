import { Card, Table, Button, Space, message, Popconfirm, Modal, Form, Input, Select, Badge, Tag, Tooltip, Switch } from "antd"
import { useAxiosContext } from "../../context/axios-context";
import { useState, useEffect, useCallback } from "react";
import { 
    PlayCircleOutlined, 
    PauseCircleOutlined, 
    ReloadOutlined, 
    DeleteOutlined, 
    PlusOutlined,
    EyeOutlined,
    DesktopOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    SyncOutlined
} from '@ant-design/icons';

export const Pm2DeviceManagement = () => {
    const { getData, postData, deleteData, patchData } = useAxiosContext();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
    const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
    const [selectedDevice, setSelectedDevice] = useState(null);
    const [vehicleRegistries, setVehicleRegistries] = useState([]);
    const [createForm] = Form.useForm();

    // Fetch PM2 devices data
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const response = await getData('/pm2-device-management/devices');
            if (response.data) {
                setData(response.data.processes || []);
            }
        } catch {
            message.error('Failed to fetch PM2 devices');
        } finally {
            setLoading(false);
        }
    }, [getData]);

    // Fetch vehicle registries for the create form
    const fetchVehicleRegistries = useCallback(async () => {
        try {
            const response = await getData('/vehicle-registries');
            if (response.data) {
                setVehicleRegistries(response.data);
            }
        } catch {
            message.error('Failed to fetch vehicle registries');
        }
    }, [getData]);

    // Load data on component mount
    useEffect(() => {
        fetchData();
        fetchVehicleRegistries();
    }, [fetchData, fetchVehicleRegistries]);

    // Handle create device
    const handleCreateDevice = async (values) => {
        try {
            const response = await postData('/pm2-device-management/devices', values);
            if (response.data) {
                message.success('Device created successfully');
                setIsCreateModalVisible(false);
                createForm.resetFields();
                fetchData();
            }
        } catch {
            message.error('Failed to create device');
        }
    };

    // Handle stop device
    const handleStopDevice = async (processName) => {
        try {
            const response = await postData('/pm2-device-management/devices/stop', { processName });
            if (response.data) {
                message.success('Device stopped successfully');
                fetchData();
            }
        } catch {
            message.error('Failed to stop device');
        }
    };

    // Handle restart device
    const handleRestartDevice = async (processName) => {
        try {
            const response = await patchData(`/pm2-device-management/devices/${processName}/restart`);
            if (response.data) {
                message.success('Device restarted successfully');
                fetchData();
            }
        } catch {
            message.error('Failed to restart device');
        }
    };

    // Handle delete device
    const handleDeleteDevice = async (processName) => {
        try {
            const response = await deleteData(`/pm2-device-management/devices/${processName}`);
            if (response.data) {
                message.success('Device deleted successfully');
                fetchData();
            }
        } catch {
            message.error('Failed to delete device');
        }
    };

    // Handle view device details
    const handleViewDetails = async (processName) => {
        try {
            const response = await getData(`/pm2-device-management/devices/${processName}`);
            if (response.data) {
                setSelectedDevice(response.data.process);
                setIsDetailModalVisible(true);
            }
        } catch {
            message.error('Failed to fetch device details');
        }
    };

    // Handle vehicle registry selection
    const handleVehicleRegistrySelect = (vehicleId) => {
        const vehicle = vehicleRegistries.find(v => v._id === vehicleId);
        
        if (vehicle) {
            // Set VIN first
            createForm.setFieldsValue({
                vin: vehicle.vin?.toString() || vehicle._id,
            });

            if (vehicle.isMqttCredentialsSet) {
                // Check if credentials are already available in the vehicle data
                if (vehicle.mqttCredentials && vehicle.mqttCredentials.username && vehicle.mqttCredentials.password) {
                    // Use credentials directly from vehicle data
                    createForm.setFieldsValue({
                        username: vehicle.mqttCredentials.username,
                        password: vehicle.mqttCredentials.password,
                        vin: vehicle.vin?.toString() || vehicle._id,
                    });
                    message.success('MQTT credentials auto-filled from vehicle registry');
                } else {
                    // Get MQTT credentials via API call
                    getData(`/vehicle-registries/${vehicleId}/mqtt/credentials`)
                        .then(response => {
                            if (response.data && response.data.credentials) {
                                createForm.setFieldsValue({
                                    username: response.data.credentials.username,
                                    password: response.data.credentials.password,
                                    vin: vehicle.vin?.toString() || vehicle._id,
                                });
                                message.success('MQTT credentials fetched and auto-filled');
                            }
                        })
                        .catch(() => {
                            message.error('Failed to fetch MQTT credentials');
                        });
                }
            } else {
                // Clear username and password fields if no MQTT credentials
                createForm.setFieldsValue({
                    username: '',
                    password: '',
                });
                message.warning('Selected vehicle does not have MQTT credentials configured');
            }
        }
    };

    // Format memory usage
    const formatMemory = (bytes) => {
        if (!bytes) return 'N/A';
        const mb = bytes / (1024 * 1024);
        return `${mb.toFixed(1)} MB`;
    };

    // Format uptime
    const formatUptime = (timestamp) => {
        if (!timestamp) return 'N/A';
        const now = Date.now();
        const uptime = now - timestamp;
        const hours = Math.floor(uptime / (1000 * 60 * 60));
        const minutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${minutes}m`;
    };

    // Get status color and icon
    const getStatusDisplay = (status) => {
        switch (status) {
            case 'online':
                return <Badge status="success" text="Online" />;
            case 'stopped':
                return <Badge status="error" text="Stopped" />;
            case 'errored':
                return <Badge status="error" text="Errored" />;
            case 'stopping':
                return <Badge status="warning" text="Stopping" />;
            case 'launching':
                return <Badge status="processing" text="Launching" />;
            default:
                return <Badge status="default" text={status || 'Unknown'} />;
        }
    };

    // Extract VIN from process name
    const extractVinFromProcessName = (processName) => {
        const match = processName.match(/^v-device-(.+?)-\d+-\d+$/);
        return match ? match[1] : 'N/A';
    };

    // Table columns
    const columns = [
        {
            title: 'Process Name',
            dataIndex: 'name',
            key: 'name',
            render: (name) => (
                <Tooltip title={name}>
                    <Tag color="blue" style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        <DesktopOutlined /> {name}
                    </Tag>
                </Tooltip>
            )
        },
        {
            title: 'VIN',
            key: 'vin',
            render: (_, record) => (
                <Tag color="green">
                    {extractVinFromProcessName(record.name)}
                </Tag>
            )
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status) => getStatusDisplay(status)
        },
        {
            title: 'PID',
            dataIndex: 'pid',
            key: 'pid',
            render: (pid) => pid || 'N/A'
        },
        {
            title: 'CPU %',
            dataIndex: 'cpu',
            key: 'cpu',
            render: (cpu) => cpu ? `${cpu}%` : 'N/A'
        },
        {
            title: 'Memory',
            dataIndex: 'memory',
            key: 'memory',
            render: (memory) => formatMemory(memory)
        },
        {
            title: 'Uptime',
            dataIndex: 'uptime',
            key: 'uptime',
            render: (uptime) => formatUptime(uptime)
        },
        {
            title: 'Restarts',
            dataIndex: 'restarts',
            key: 'restarts',
            render: (restarts) => restarts || 0
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Space size="small">
                    <Tooltip title="View Details">
                        <Button 
                            type="default" 
                            icon={<EyeOutlined />} 
                            size="small"
                            onClick={() => handleViewDetails(record.name)}
                        />
                    </Tooltip>
                    
                    {record.status === 'online' ? (
                        <Tooltip title="Stop">
                            <Button 
                                type="default" 
                                icon={<PauseCircleOutlined />} 
                                size="small"
                                onClick={() => handleStopDevice(record.name)}
                            />
                        </Tooltip>
                    ) : (
                        <Tooltip title="Restart">
                            <Button 
                                type="default" 
                                icon={<PlayCircleOutlined />} 
                                size="small"
                                onClick={() => handleRestartDevice(record.name)}
                            />
                        </Tooltip>
                    )}
                    
                    <Tooltip title="Restart">
                        <Button 
                            type="default" 
                            icon={<ReloadOutlined />} 
                            size="small"
                            onClick={() => handleRestartDevice(record.name)}
                        />
                    </Tooltip>
                    
                    <Popconfirm
                        title="Are you sure you want to delete this device?"
                        onConfirm={() => handleDeleteDevice(record.name)}
                        okText="Yes"
                        cancelText="No"
                    >
                        <Tooltip title="Delete">
                            <Button 
                                type="default" 
                                danger 
                                icon={<DeleteOutlined />} 
                                size="small"
                            />
                        </Tooltip>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <>
            <Card 
                title="PM2 Device Management" 
                extra={
                    <Space>
                        <Button 
                            type="default" 
                            icon={<SyncOutlined />} 
                            onClick={fetchData}
                            loading={loading}
                        >
                            Refresh
                        </Button>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() => setIsCreateModalVisible(true)}
                        >
                            Create Device
                        </Button>
                    </Space>
                }
            >
                <Table
                    columns={columns}
                    dataSource={data}
                    loading={loading}
                    rowKey="name"
                    pagination={{
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total, range) =>
                            `${range[0]}-${range[1]} of ${total} items`,
                    }}
                />
            </Card>

            {/* Create Device Modal */}
            <Modal
                title="Create New Device"
                open={isCreateModalVisible}
                onCancel={() => {
                    setIsCreateModalVisible(false);
                    createForm.resetFields();
                }}
                footer={null}
                width={600}
            >
                <Form
                    form={createForm}
                    layout="vertical"
                    onFinish={handleCreateDevice}
                >
                    <Form.Item
                        label="Vehicle Registry"
                        name="vehicleId"
                        rules={[
                            { required: true, message: 'Please select a vehicle registry!' }
                        ]}
                    >
                        <Select
                            placeholder="Select a vehicle registry"
                            onChange={handleVehicleRegistrySelect}
                            showSearch
                            filterOption={(input, option) =>
                                option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                            }
                        >
                            {vehicleRegistries.map(vehicle => (
                                <Select.Option key={vehicle._id} value={vehicle._id}>
                                    <Space>
                                        <span>{vehicle.name}</span>
                                        <span style={{ color: '#666' }}>({vehicle.vin?.toString() || vehicle._id})</span>
                                        {vehicle.isMqttCredentialsSet ? (
                                            <CheckCircleOutlined style={{ color: '#52c41a' }} />
                                        ) : (
                                            <CloseCircleOutlined style={{ color: '#f5222d' }} />
                                        )}
                                    </Space>
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item
                        label="MQTT Username"
                        name="username"
                        rules={[
                            { required: true, message: 'Please enter MQTT username!' }
                        ]}
                    >
                        <Input placeholder="Enter MQTT username" />
                    </Form.Item>

                    <Form.Item
                        label="MQTT Password"
                        name="password"
                        rules={[
                            { required: true, message: 'Please enter MQTT password!' }
                        ]}
                    >
                        <Input.Password placeholder="Enter MQTT password" />
                    </Form.Item>

                    <Form.Item
                        label="VIN"
                        name="vin"
                        rules={[
                            { required: true, message: 'Please enter VIN!' }
                        ]}
                    >
                        <Input placeholder="Enter Vehicle Identification Number" />
                    </Form.Item>

                    <Form.Item
                        label="Broker URL"
                        name="broker"
                        initialValue="mqtt://localhost:1883"
                    >
                        <Input placeholder="Enter broker URL (default: mqtt://localhost:1883)" />
                    </Form.Item>

                    <Form.Item
                        label="Debug Mode"
                        name="debug"
                        valuePropName="checked"
                    >
                        <Switch checkedChildren="ON" unCheckedChildren="OFF" />
                    </Form.Item>

                    <Form.Item>
                        <Space>
                            <Button
                                type="primary"
                                htmlType="submit"
                            >
                                Create Device
                            </Button>
                            <Button onClick={() => {
                                setIsCreateModalVisible(false);
                                createForm.resetFields();
                            }}>
                                Cancel
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>

            {/* Device Details Modal */}
            <Modal
                title="Device Details"
                open={isDetailModalVisible}
                onCancel={() => {
                    setIsDetailModalVisible(false);
                    setSelectedDevice(null);
                }}
                footer={[
                    <Button key="close" onClick={() => {
                        setIsDetailModalVisible(false);
                        setSelectedDevice(null);
                    }}>
                        Close
                    </Button>
                ]}
                width={600}
            >
                {selectedDevice && (
                    <div style={{ padding: '16px 0' }}>
                        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                            <div>
                                <strong>Process Name:</strong> {selectedDevice.name}
                            </div>
                            <div>
                                <strong>VIN:</strong> {extractVinFromProcessName(selectedDevice.name)}
                            </div>
                            <div>
                                <strong>Status:</strong> {getStatusDisplay(selectedDevice.status)}
                            </div>
                            <div>
                                <strong>PID:</strong> {selectedDevice.pid || 'N/A'}
                            </div>
                            <div>
                                <strong>CPU Usage:</strong> {selectedDevice.cpu ? `${selectedDevice.cpu}%` : 'N/A'}
                            </div>
                            <div>
                                <strong>Memory Usage:</strong> {formatMemory(selectedDevice.memory)}
                            </div>
                            <div>
                                <strong>Uptime:</strong> {formatUptime(selectedDevice.uptime)}
                            </div>
                            <div>
                                <strong>Restarts:</strong> {selectedDevice.restarts || 0}
                            </div>
                        </Space>
                    </div>
                )}
            </Modal>
        </>
    );
};
