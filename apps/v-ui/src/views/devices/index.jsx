import { Card, Table, Button, Space, message, Popconfirm, Tag } from "antd"
import { useAxiosContext } from "../../context/axios-context";
import { useState, useEffect, useCallback } from "react";
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { DeviceCreateEditComp } from "../../components/DeviceCreateEditComp/DeviceCreateEditComp.jsx";

export const Devices = () => {
    const { getData, deleteData } = useAxiosContext();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);

    // Fetch data from API
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const response = await getData('/devices');
            if (response.data) {
                setData(response.data);
            }
        } catch {
            message.error('Failed to fetch devices');
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
            const response = await deleteData(`/devices/${id}`);
            if (response.data !== undefined) {
                message.success('Device deleted successfully');
                fetchData();
            }
        } catch {
            message.error('Failed to delete device');
        }
    };

    // Handle edit
    const handleEdit = (record) => {
        setEditingRecord(record);
    };

    // Table columns
    const columns = [
        {
            title: 'Device ID',
            dataIndex: 'deviceId',
            key: 'deviceId',
            render: (deviceId) => deviceId || 'N/A',
            ellipsis: true,
        },
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            sorter: (a, b) => a.name.localeCompare(b.name),
        },
        {
            title: 'Device Model',
            dataIndex: 'deviceModel',
            key: 'deviceModel',
            sorter: (a, b) => a.deviceModel.localeCompare(b.deviceModel),
        },
        {
            title: 'Platform',
            dataIndex: 'platform',
            key: 'platform',
            render: (platform) => (
                <Tag color={platform === 'JS' ? 'blue' : 'green'}>
                    {platform || 'JS'}
                </Tag>
            ),
            sorter: (a, b) => (a.platform || 'JS').localeCompare(b.platform || 'JS'),
        },
        {
            title: 'Framework Versions',
            dataIndex: 'availableFrameworkVersions',
            key: 'availableFrameworkVersions',
            render: (versions) => (
                <Space wrap>
                    {versions && versions.length > 0 ? (
                        versions.map((version, index) => (
                            <Tag key={index} color="blue">
                                {version}
                            </Tag>
                        ))
                    ) : (
                        <Tag color="gray">No versions</Tag>
                    )}
                </Space>
            ),
        },
        {
            title: 'Created At',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date) => new Date(date).toLocaleDateString(),
            sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
        },
        {
            title: 'Updated At',
            dataIndex: 'updatedAt',
            key: 'updatedAt',
            render: (date) => new Date(date).toLocaleDateString(),
            sorter: (a, b) => new Date(a.updatedAt) - new Date(b.updatedAt),
        },
        {
            title: 'Actions',
            key: 'actions',
            fixed: 'right',
            width: 150,
            render: (_, record) => (
                <Space size="small">
                    <Button
                        type="primary"
                        icon={<EditOutlined />}
                        size="small"
                        onClick={() => handleEdit(record)}
                    >
                        Edit
                    </Button>
                    <Popconfirm
                        title="Are you sure you want to delete this device?"
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
                title="Devices"
                extra={
                    <DeviceCreateEditComp
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
                    scroll={{ x: 1000 }}
                    pagination={{
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total, range) =>
                            `${range[0]}-${range[1]} of ${total} items`,
                        pageSizeOptions: ['10', '20', '50', '100'],
                        defaultPageSize: 10,
                    }}
                />
            </Card>


        </>
    );
};