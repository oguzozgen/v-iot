import { Modal, Form, Input, Button, Space, Select, Radio, message } from "antd";
import { PlusOutlined } from '@ant-design/icons';
import { useAxiosContext } from "../../context/axios-context";
import { useState, useEffect } from "react";

export const DeviceCreateEditComp = ({
    editingRecord,
    onSuccess,
    onEditRequest
}) => {
    const { patchData, postData } = useAxiosContext();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);

    // Handle editing record from parent
    useEffect(() => {
        if (editingRecord) {
            setIsModalVisible(true);
            form.setFieldsValue({
                name: editingRecord.name,
                deviceModel: editingRecord.deviceModel,
                platform: editingRecord.platform || 'JS',
                availableFrameworkVersions: editingRecord.availableFrameworkVersions || []
            });
        }
    }, [editingRecord, form]);

    // Handle add new device
    const handleAdd = () => {
        form.resetFields();
        setIsModalVisible(true);
    };

    // Handle form submission
    const handleSubmit = async (values) => {
        setLoading(true);
        try {
            // Convert framework versions string to array if needed
            const submitData = {
                ...values,
                availableFrameworkVersions: values.availableFrameworkVersions || []
            };

            if (editingRecord) {
                // Update existing record
                const response = await patchData(`/devices/${editingRecord._id}`, submitData);
                if (response.data) {
                    message.success('Device updated successfully');
                    onSuccess();
                }
            } else {
                // Create new record
                const response = await postData('/devices', submitData);
                if (response.data) {
                    message.success('Device created successfully');
                    onSuccess();
                }
            }
            handleCancel();
        } catch (error) {
            message.error('Failed to save device');
            console.error('Error saving device:', error);
        } finally {
            setLoading(false);
        }
    };

    // Handle modal cancel
    const handleCancel = () => {
        form.resetFields();
        setIsModalVisible(false);
        if (onEditRequest) {
            onEditRequest(null); // Clear editing record in parent
        }
    };

    return (
        <>
            <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAdd}
            >
                Add New Device
            </Button>

            <Modal
                title={editingRecord ? 'Edit Device' : 'Add New Device'}
                open={isModalVisible}
                onCancel={handleCancel}
                footer={null}
                width={600}
                destroyOnClose
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                    initialValues={{
                        platform: 'JS',
                        availableFrameworkVersions: []
                    }}
                >
                    <Form.Item
                        label="Device Name"
                        name="name"
                        rules={[
                            { required: true, message: 'Please enter the device name!' },
                            { min: 2, message: 'Device name must be at least 2 characters long!' },
                            { max: 100, message: 'Device name must not exceed 100 characters!' }
                        ]}
                    >
                        <Input placeholder="Enter device name" />
                    </Form.Item>

                    <Form.Item
                        label="Device Model"
                        name="deviceModel"
                        rules={[
                            { required: true, message: 'Please enter the device model!' },
                            { min: 2, message: 'Device model must be at least 2 characters long!' },
                            { max: 50, message: 'Device model must not exceed 50 characters!' }
                        ]}
                    >
                        <Input placeholder="Enter device model" />
                    </Form.Item>

                    <Form.Item
                        label="Platform"
                        name="platform"
                        rules={[
                            { required: true, message: 'Please select a platform!' }
                        ]}
                        initialValue={'JS'}
                    >
                        <Radio.Group defaultValue="JS">
                            <Radio value="JS">JavaScript</Radio>
                            <Radio disabled value="PY">Python</Radio>
                        </Radio.Group>
                    </Form.Item>

                    <Form.Item
                        label="Available Framework Versions"
                        name="availableFrameworkVersions"
                        help="Enter framework versions that this device supports"
                    >
                        <Select
                            mode="tags"
                            placeholder="Add framework versions (e.g., 1.0.0, 2.0.0)"
                            style={{ width: '100%' }}
                            tokenSeparators={[',', ' ']}
                        />
                    </Form.Item>

                    <Form.Item>
                        <Space>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={loading}
                            >
                                {editingRecord ? 'Update Device' : 'Create Device'}
                            </Button>
                            <Button onClick={handleCancel}>
                                Cancel
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        </>
    );
};
