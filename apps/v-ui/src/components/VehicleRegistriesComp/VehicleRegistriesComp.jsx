import { Modal, Form, Input, Button, Space, Select, message } from "antd";
import { PlusOutlined } from '@ant-design/icons';
import { useAxiosContext } from "../../context/axios-context";
import { useState, useEffect } from "react";

export const VehicleRegistriesComp = ({
    editingRecord,
    onSuccess,
    onEditRequest
}) => {
    const { getData, patchData, postData } = useAxiosContext();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [devices, setDevices] = useState([]);
    const [selectedDevice, setSelectedDevice] = useState(null);
    const [availableFirmwareVersions, setAvailableFirmwareVersions] = useState([]);
    const [devicesLoading, setDevicesLoading] = useState(false);

    // Load devices on component mount
    useEffect(() => {
        const loadDevices = async () => {
            setDevicesLoading(true);
            try {
                const response = await getData('/devices');
                if (response.data) {
                    setDevices(response.data);
                }
            } catch {
                message.error('Failed to fetch devices');
            } finally {
                setDevicesLoading(false);
            }
        };

        loadDevices();
    }, [getData]);

    // Handle editing record from parent
    useEffect(() => {
        if (editingRecord) {
            setIsModalVisible(true);

            // Find the device if it exists
            if (editingRecord.device) {
                const device = devices.find(d =>
                    d.name === editingRecord.device.name &&
                    d.deviceModel === editingRecord.device.model
                );
                if (device) {
                    setSelectedDevice(device);
                    setAvailableFirmwareVersions(device.availableFrameworkVersions || []);
                }
            }

            form.setFieldsValue({
                vin: editingRecord.vin ? editingRecord.vin.toString() : '',
                name: editingRecord.name,
                vehicleModel: editingRecord.vehicleModel,
                deviceId: editingRecord.device ? devices.find(d =>
                    d.name === editingRecord.device.name &&
                    d.deviceModel === editingRecord.device.model
                )?._id : undefined,
                device: {
                    name: editingRecord.device?.name,
                    model: editingRecord.device?.model,
                    firmwareVersion: editingRecord.device?.firmwareVersion
                }
            });
        }
    }, [editingRecord, devices, form]);

    // Handle add new vehicle registry
    const handleAdd = () => {
        form.resetFields();
        setSelectedDevice(null);
        setAvailableFirmwareVersions([]);
        setIsModalVisible(true);
    };

    // Handle device selection
    const handleDeviceSelect = (deviceId) => {
        const device = devices.find(d => d._id === deviceId);
        if (device) {
            setSelectedDevice(device);
            setAvailableFirmwareVersions(device.availableFrameworkVersions || []);

            // Update form with device details
            form.setFieldsValue({
                device: {
                    name: device.name,
                    model: device.deviceModel,
                    firmwareVersion: undefined, // Reset firmware version selection,
                    platform: device.platform || 'JS' // Default to JS if not specified
                }
            });
        } else {
            // Clear device selection if no device found
            setSelectedDevice(null);
            setAvailableFirmwareVersions([]);
            form.setFieldsValue({
                device: {
                    name: undefined,
                    model: undefined,
                    firmwareVersion: undefined
                }
            });
        }
    };

    // Handle form submission
    const handleSubmit = async (values) => {
        setLoading(true);
        try {
            // Prepare the payload according to schema
            const payload = {
                name: values.name,
                vehicleModel: values.vehicleModel,
                device: {
                    name: values.device.name,
                    model: values.device.model,
                    firmwareVersion: values.device.firmwareVersion,
                    platform: values.device.platform,
                }
            };

            // Add VIN only for updates (it's auto-generated for new records)
            if (editingRecord) {
                payload.vin = values.vin;
            }

            if (editingRecord) {
                // Update existing record
                const response = await patchData(`/vehicle-registries/${editingRecord._id}`, payload);
                if (response.data) {
                    message.success('Vehicle registry updated successfully');
                    onSuccess();
                }
            } else {
                // Create new record
                const response = await postData('/vehicle-registries', payload);
                if (response.data) {
                    message.success('Vehicle registry created successfully');
                    onSuccess();
                }
            }
            handleCancel();
        } catch (error) {
            console.error('Error saving vehicle registry:', error);
            message.error('Failed to save vehicle registry');
        } finally {
            setLoading(false);
        }
    };

    // Handle modal cancel
    const handleCancel = () => {
        form.resetFields();
        setSelectedDevice(null);
        setAvailableFirmwareVersions([]);
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
                Add New Vehicle Registry
            </Button>

            <Modal
                title={editingRecord ? 'Edit Vehicle Registry' : 'Add Vehicle Registry'}
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
                >
                    {editingRecord && (
                        <Form.Item
                            label="VIN"
                            name="vin"
                        >
                            <Input disabled placeholder="VIN (Auto-generated ObjectId)" />
                        </Form.Item>
                    )}

                    {!editingRecord && (
                        <div style={{ marginBottom: '16px', padding: '8px', backgroundColor: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: '4px' }}>
                            <small style={{ color: '#389e0d' }}>
                                📝 VIN (ObjectId) will be automatically generated when you create the vehicle registry
                            </small>
                        </div>
                    )}

                    <Form.Item
                        label="Name"
                        name="name"
                        rules={[
                            { required: true, message: 'Please enter the vehicle name!' },
                            { min: 2, message: 'Name must be at least 2 characters long!' }
                        ]}
                    >
                        <Input placeholder="Enter vehicle name" />
                    </Form.Item>

                    <Form.Item
                        label="Vehicle Model"
                        name="vehicleModel"
                        rules={[
                            { required: true, message: 'Please enter the vehicle model!' },
                            { min: 2, message: 'Vehicle device must be at least 2 characters long!' }
                        ]}
                    >
                        <Input placeholder="Enter vehicle model identifier" />
                    </Form.Item>

                    <Form.Item
                        label="Device"
                        name="deviceId"
                        rules={[
                            { required: true, message: 'Please select a device!' }
                        ]}
                    >
                        <Select
                            placeholder="Select a device"
                            onChange={handleDeviceSelect}
                            loading={devicesLoading}
                            notFoundContent={devicesLoading ? "Loading devices..." : devices.length === 0 ? "No devices available" : "No matching devices"}
                        >
                            {devicesLoading ? (
                                <Select.Option disabled value="">
                                    Loading devices...
                                </Select.Option>
                            ) : devices.length === 0 ? (
                                <Select.Option disabled value="">
                                    No devices available
                                </Select.Option>
                            ) : (
                                devices.map(device => (
                                    <Select.Option key={device._id} value={device._id}>
                                        {device.name} - {device.deviceModel}
                                    </Select.Option>
                                ))
                            )}
                        </Select>
                    </Form.Item>

                    {selectedDevice && (
                        <>
                            <Form.Item
                                label="Device Name"
                                name={['device', 'name']}
                            >
                                <Input disabled />
                            </Form.Item>

                            <Form.Item
                                label="Device Model"
                                name={['device', 'model']}
                            >
                                <Input disabled />
                            </Form.Item>
                            <Form.Item
                                label="Device Platform"
                                name={['device', 'platform']}
                            >
                                <Input disabled />
                            </Form.Item>

                            <Form.Item
                                label="Firmware Version"
                                name={['device', 'firmwareVersion']}
                                rules={[
                                    { required: true, message: 'Please select a firmware version!' }
                                ]}
                            >
                                <Select
                                    placeholder="Select firmware version"
                                    disabled={availableFirmwareVersions.length === 0}
                                    notFoundContent={availableFirmwareVersions.length === 0 ? "No firmware versions available for this device" : "No matching versions"}
                                >
                                    {availableFirmwareVersions.length === 0 ? (
                                        <Select.Option disabled value="">
                                            No firmware versions available
                                        </Select.Option>
                                    ) : (
                                        availableFirmwareVersions.map(version => (
                                            <Select.Option key={version} value={version}>
                                                {version}
                                            </Select.Option>
                                        ))
                                    )}
                                </Select>
                            </Form.Item>
                        </>
                    )}

                    <Form.Item>
                        <Space>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={loading}
                            >
                                {editingRecord ? 'Update' : 'Create'}
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
