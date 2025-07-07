import { Card, Table, Button, Space, message, Popconfirm, Tag } from "antd"
import { useAxiosContext } from "../../context/axios-context";
import { useState, useEffect, useCallback } from "react";
import { EditOutlined, DeleteOutlined, CompassOutlined } from '@ant-design/icons';
import { TaskCreateEditComp } from "../../components/TaskCreateEditComp/TaskCreateEditComp";

export const Tasks = () => {
    const { getData, deleteData } = useAxiosContext();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);

    // Fetch data from API
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const response = await getData('/tasks');
            if (response.data) {
                setData(response.data);
            }
        } catch {
            message.error('Failed to fetch tasks');
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

    // Format coordinates for display
    const formatCoordinates = (geoPoint) => {
        if (!geoPoint || !geoPoint.coordinates) return 'N/A';
        const [lng, lat, alt] = geoPoint.coordinates;
        return `${lat.toFixed(6)}, ${lng.toFixed(6)}${alt ? `, ${alt}m` : ''}`;
    };

    // Handle delete
    const handleDelete = async (id) => {
        try {
            const response = await deleteData(`/tasks/${id}`);
            if (response.data !== undefined) {
                message.success('Task deleted successfully');
                fetchData();
            }
        } catch {
            message.error('Failed to delete task');
        }
    };

    // Handle edit
    const handleEdit = (record) => {
        setEditingRecord(record);
    };

    // Get status color
    const getStatusColor = (status) => {
        const colors = {
            created: 'blue',
            active: 'green',
            in_progress: 'orange',
            completed: 'success',
            cancelled: 'error',
            failed: 'error'
        };
        return colors[status] || 'default';
    };

    // Get task type color
    const getTaskTypeColor = (type) => {
        const colors = {
            delivery: 'blue',
            pickup: 'green',
            maintenance: 'orange',
            inspection: 'purple',
            transport: 'cyan'
        };
        return colors[type] || 'default';
    };

    // Table columns
    const columns = [
        {
            title: 'Task Code',
            dataIndex: 'taskGeneratedCode',
            key: 'taskGeneratedCode',
            width: 120,
            ellipsis: true,
        },
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            width: 150,
            sorter: (a, b) => a.name.localeCompare(b.name),
        },
        {
            title: 'Type',
            dataIndex: 'taskType',
            key: 'taskType',
            width: 100,
            render: (type) => (
                <Tag color={getTaskTypeColor(type)}>
                    {type.toUpperCase()}
                </Tag>
            ),
            sorter: (a, b) => a.taskType.localeCompare(b.taskType),
        },
        {
            title: 'Status',
            dataIndex: 'taskStatus',
            key: 'taskStatus',
            width: 100,
            render: (status) => (
                <Tag color={getStatusColor(status)}>
                    {status.toUpperCase()}
                </Tag>
            ),
            sorter: (a, b) => a.taskStatus.localeCompare(b.taskStatus),
        },
        {
            title: 'Start Location',
            dataIndex: 'startLocation',
            key: 'startLocation',
            width: 180,
            render: (location) => (
                <Space>
                    <CompassOutlined style={{ color: '#1890ff' }} />
                    {formatCoordinates(location)}
                </Space>
            ),
        },
        {
            title: 'Destination',
            dataIndex: 'destinationLocation',
            key: 'destinationLocation',
            width: 180,
            render: (location) => (
                <Space>
                    <CompassOutlined style={{ color: '#52c41a' }} />
                    {formatCoordinates(location)}
                </Space>
            ),
        },
        {
            title: 'Achievements',
            dataIndex: 'taskAchievements',
            key: 'taskAchievements',
            width: 150,
            render: (achievements) => (
                <Space wrap>
                    {achievements && achievements.length > 0 ? (
                        achievements.map((achievement, index) => (
                            <Tag key={index} color="gold">
                                {achievement}
                            </Tag>
                        ))
                    ) : (
                        <Tag color="gray">No achievements</Tag>
                    )}
                </Space>
            ),
        },
        {
            title: 'Created',
            dataIndex: 'createdAt',
            key: 'createdAt',
            width: 120,
            render: (date) => new Date(date).toLocaleDateString(),
            sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
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
                        title="Are you sure you want to delete this task?"
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
                title="Tasks"
                extra={
                    <TaskCreateEditComp
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
                    scroll={{ x: 1400 }}
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
