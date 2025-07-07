import { Card, Table, Button, Space, message, Popconfirm } from "antd"
import { useAxiosContext } from "../../context/axios-context";
import { useState, useEffect, useCallback } from "react";
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { VehicleRegistriesComp } from "../../components/VehicleRegistriesComp/VehicleRegistriesComp";

export const VehicleRegistries = () => {
    const { getData, deleteData } = useAxiosContext();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);

    // Fetch data from API
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const response = await getData('/vehicle-registries');
            if (response.data) {
                setData(response.data);
            }
        } catch {
            message.error('Failed to fetch vehicle registries');
        } finally {
            setLoading(false);
        }
    }, [getData]);

    // Load data on component mount
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Handle success callback from modal
    const handleModalSuccess = () => {
        fetchData();
        setEditingRecord(null);
    };

    // Handle edit request
    const handleEditRequest = (record) => {
        setEditingRecord(record);
    };

    // Handle delete
    const handleDelete = async (id) => {
        try {
            const response = await deleteData(`/vehicle-registries/${id}`);
            if (response.data !== undefined) {
                message.success('Vehicle registry deleted successfully');
                fetchData();
            }
        } catch {
            message.error('Failed to delete vehicle registry');
        }
    };

    // Handle edit
    const handleEdit = (record) => {
        setEditingRecord(record);
    };

    // Table columns
    const columns = [
        {
            title: 'VIN',
            dataIndex: 'vin',
            key: 'vin',
            render: (vin) => vin ? vin.toString() : 'N/A'
        },
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: 'Vehicle Model',
            dataIndex: 'vehicleModel',
            key: 'vehicleModel',
        },
        {
            title: 'Device Name',
            dataIndex: ['device', 'name'],
            key: 'deviceName',
            render: (name) => name || 'N/A'
        },
        {
            title: 'Device Model',
            dataIndex: ['device', 'model'],
            key: 'deviceModel',
            render: (model) => model || 'N/A'
        },
        {
            title: 'Firmware Version',
            dataIndex: ['device', 'firmwareVersion'],
            key: 'firmwareVersion',
            render: (version) => version || 'N/A'
        },
        {
            title: 'MQTT Status',
            key: 'isMqttCredentialsSet',
            render: (_, record) => (
                <span style={{ 
                    color: record.isMqttCredentialsSet ? '#52c41a' : '#f5222d',
                    fontWeight: 'bold'
                }}>
                    {record.isMqttCredentialsSet ? '✓ Configured' : '✗ Not Configured'}
                </span>
            )
        },
        {
            title: 'Updated At',
            dataIndex: 'updatedAt',
            key: 'updatedAt',
            render: (date) => new Date(date).toLocaleDateString()
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Space size="middle">
                    <Button 
                        type="primary" 
                        icon={<EditOutlined />} 
                        size="small"
                        onClick={() => handleEdit(record)}
                    >
                        Edit
                    </Button>
                    <Popconfirm
                        title="Are you sure you want to delete this vehicle registry?"
                        onConfirm={() => handleDelete(record._id)}
                        okText="Yes"
                        cancelText="No"
                    >
                        <Button 
                            type="primary" 
                            danger 
                            icon={<DeleteOutlined />} 
                            size="small"
                        >
                            Delete
                        </Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <>
            <Card 
                title="Vehicle Registries" 
                extra={
                    <VehicleRegistriesComp
                        editingRecord={editingRecord}
                        onSuccess={handleModalSuccess}
                        onEditRequest={handleEditRequest}
                    />
                }
            >
                <Table
                    columns={columns}
                    dataSource={data}
                    loading={loading}
                    rowKey="_id"
                    pagination={{
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total, range) =>
                            `${range[0]}-${range[1]} of ${total} items`,
                    }}
                />
            </Card>
        </>
    );
};