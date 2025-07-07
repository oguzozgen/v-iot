import { Modal, Form, Input, Button, Space, Select, InputNumber, Divider, message, Alert, Card, Typography } from "antd";
import { PlusOutlined, CompassOutlined, EnvironmentOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useAxiosContext } from "../../context/axios-context";
import { useState, useEffect, useCallback } from "react";
import { MapContainer, TileLayer, Polyline } from 'react-leaflet';
import { DraggableMarkerComp } from "../DraggableMarkerComp/DraggableMarkerComp.jsx";
import 'leaflet/dist/leaflet.css';

const { Option } = Select;
const { Text, Title } = Typography;

const defaultCenter = {
    lat: 51.505,
    lng: -0.09,
    alt: 11, // Add default altitude for start location
};

export const TaskCreateEditComp = ({
    editingRecord,
    onSuccess,
    onEditRequest
}) => {
    const { patchData, postData, getData } = useAxiosContext();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [directionsLoading, setDirectionsLoading] = useState(false);
    const [routeData, setRouteData] = useState(null);
    const [hasValidDirections, setHasValidDirections] = useState(false);

    // Map-related state
    const [startLocation, setStartLocation] = useState(defaultCenter);
    const [destinationLocation, setDestinationLocation] = useState({
        lat: defaultCenter.lat + 0.005,
        lng: defaultCenter.lng + 0.005,
        alt: 14 // Add default altitude for destination location
    });
    const [polylineRoute, setPolylineRoute] = useState([]);
    const [mapReady, setMapReady] = useState(false);

    // Handle editing record from parent
    useEffect(() => {
        if (editingRecord) {
            setIsModalVisible(true);

            // Extract coordinates for form
            const startCoords = editingRecord.startLocation?.coordinates || [0, 0, 0];
            const destCoords = editingRecord.destinationLocation?.coordinates || [0, 0, 0];

            // Set map positions
            setStartLocation({
                lat: startCoords[1],
                lng: startCoords[0],
                alt: startCoords[2]
            });
            setDestinationLocation({
                lat: destCoords[1],
                lng: destCoords[0],
                alt: destCoords[2]
            });

            // Use setTimeout to ensure form is mounted before setting values
            setTimeout(() => {
                form.setFieldsValue({
                    taskGeneratedCode: editingRecord.taskGeneratedCode,
                    name: editingRecord.name,
                    startLng: startCoords[0],
                    startLat: startCoords[1],
                    startAlt: startCoords[2],
                    destLng: destCoords[0],
                    destLat: destCoords[1],
                    destAlt: destCoords[2],
                    taskType: editingRecord.taskType,
                    taskStatus: editingRecord.taskStatus,
                    taskAchievements: editingRecord.taskAchievements || []
                });
            }, 100);

            // If editing, assume directions are already valid
            setHasValidDirections(true);
            if (editingRecord.taskRouteLineString?.coordinates) {
                setRouteData(editingRecord.taskRouteLineString.coordinates);
                // Set polyline for map display
                setPolylineRoute(editingRecord.taskRouteLineString.coordinates.map(coord => [coord[1], coord[0]]));
            }
        }
    }, [editingRecord, form]);

    // Handle add new task
    const handleAdd = () => {
        form.resetFields();
        setIsModalVisible(true);
        setMapReady(false); // Reset map ready state
        setHasValidDirections(false);
        setRouteData(null);
        setPolylineRoute([]);
        // Reset map positions with default altitudes
        setStartLocation({ ...defaultCenter, alt: 11 });
        setDestinationLocation({
            lat: defaultCenter.lat + 0.005,
            lng: defaultCenter.lng + 0.005,
            alt: 14
        });
    };

    // Handle start location change from map
    const handleStartLocationChange = useCallback((position) => {
        setStartLocation(position);
        // Only update form if modal is visible (form is mounted)
        if (isModalVisible) {
            try {
                form.setFieldsValue({
                    startLat: position.lat,
                    startLng: position.lng,
                    startAlt: position.alt || 11 // Use 11 as default if no altitude provided
                });
            } catch (error) {
                console.warn('Form not ready yet:', error);
            }
        }
        // Clear directions when location changes
        setHasValidDirections(false);
        setRouteData(null);
        setPolylineRoute([]);
    }, [form, isModalVisible]);

    // Handle destination location change from map
    const handleDestinationLocationChange = useCallback((position) => {
        setDestinationLocation(position);
        // Only update form if modal is visible (form is mounted)
        if (isModalVisible) {
            try {
                form.setFieldsValue({
                    destLat: position.lat,
                    destLng: position.lng,
                    destAlt: position.alt || 14 // Use 14 as default if no altitude provided
                });
            } catch (error) {
                console.warn('Form not ready yet:', error);
            }
        }
        // Clear directions when location changes
        setHasValidDirections(false);
        setRouteData(null);
        setPolylineRoute([]);
    }, [form, isModalVisible]);

    // Handle manual coordinate input changes
    const handleCoordinateChange = () => {
        if (!isModalVisible) return;

        try {
            const values = form.getFieldsValue(['startLat', 'startLng', 'startAlt', 'destLat', 'destLng', 'destAlt']);

            if (values.startLat && values.startLng) {
                setStartLocation({
                    lat: values.startLat,
                    lng: values.startLng,
                    alt: values.startAlt || 0
                });
            }

            if (values.destLat && values.destLng) {
                setDestinationLocation({
                    lat: values.destLat,
                    lng: values.destLng,
                    alt: values.destAlt || 0
                });
            }

            // Clear directions when coordinates change
            setHasValidDirections(false);
            setRouteData(null);
            setPolylineRoute([]);
        } catch (error) {
            console.warn('Form not ready yet:', error);
        }
    };

    // Handle getting directions
    const handleGetDirections = async () => {
        try {
            // Use current map locations instead of form values
            const startLat = startLocation.lat;
            const startLng = startLocation.lng;
            const destLat = destinationLocation.lat;
            const destLng = destinationLocation.lng;

            // Validate that we have valid coordinates
            if (!startLat || !startLng || !destLat || !destLng) {
                message.error('Please set both start and destination locations on the map first');
                return;
            }

            setDirectionsLoading(true);

            const start = `${startLng},${startLat}`;
            const end = `${destLng},${destLat}`;
            const profile = 'driving-car';
            const url = `/directions?start=${start}&end=${end}&profile=${profile}`;

            const response = await getData(url);
            const data = response.data;

            if (data.features && data.features[0] && data.features[0].geometry) {
                const route = data.features[0].geometry.coordinates;

                // Generate base altitude and create gradual variations
                const baseAltitude = Math.floor(Math.random() * 10) + 8; // 8-18 meters base

                const routeWithAltitude = route.map((coord) => {
                    // Small variation per coordinate (-2 to +2 meters from base)
                    const altitudeVariation = (Math.random() - 0.5) * 4;
                    const altitude = baseAltitude + altitudeVariation;
                    return [coord[0], coord[1], Math.max(3, Math.min(25, altitude))]; // Clamp between 3-25m
                });

                setRouteData(routeWithAltitude);
                setHasValidDirections(true);

                // Set polyline for map display
                setPolylineRoute(route.map(coord => [coord[1], coord[0]]));

                // Update hidden form fields with current map coordinates
                if (isModalVisible) {
                    try {
                        form.setFieldsValue({
                            startLat: startLocation.lat,
                            startLng: startLocation.lng,
                            startAlt: startLocation.alt || 11,
                            destLat: destinationLocation.lat,
                            destLng: destinationLocation.lng,
                            destAlt: destinationLocation.alt || 14
                        });
                    } catch (error) {
                        console.warn('Form not ready yet:', error);
                    }
                }

                message.success('Directions fetched successfully!');
            } else {
                message.error('No route found between the specified locations');
            }
        } catch (error) {
            console.error('Error fetching directions:', error);
            message.error('Failed to fetch directions');
        } finally {
            setDirectionsLoading(false);
        }
    };

    // Convert form data to API format
    const formatTaskData = (values) => {
        const startCoords = [
            parseFloat(values.startLng),
            parseFloat(values.startLat),
            parseFloat(values.startAlt || 0)
        ];
        const destCoords = [
            parseFloat(values.destLng),
            parseFloat(values.destLat),
            parseFloat(values.destAlt || 0)
        ];

        // Use fetched route data if available, otherwise create simple line
        const routeCoords = routeData || [startCoords, destCoords];

        return {
            // Remove taskGeneratedCode from payload since it's auto-generated
            name: values.name,
            startLocation: {
                type: 'Point',
                coordinates: startCoords
            },
            destinationLocation: {
                type: 'Point',
                coordinates: destCoords
            },
            taskType: values.taskType,
            taskStatus: values.taskStatus || 'created',
            taskAchievements: values.taskAchievements || [],
            taskRouteLineString: {
                type: 'LineString',
                coordinates: routeCoords
            }
        };
    };

    // Handle form submission
    const handleSubmit = async (values) => {
        setLoading(true);
        try {
            const submitData = formatTaskData(values);

            if (editingRecord) {
                // Update existing record
                const response = await patchData(`/tasks/${editingRecord._id}`, submitData);
                if (response.data) {
                    message.success('Task updated successfully');
                    onSuccess();
                }
            } else {
                // Create new record
                const response = await postData('/tasks', submitData);
                if (response.data) {
                    message.success('Task created successfully');
                    onSuccess();
                }
            }
            handleCancel();
        } catch (error) {
            console.error('Error saving task:', error);
            message.error('Failed to save task');
        } finally {
            setLoading(false);
        }
    };

    // Handle modal cancel
    const handleCancel = () => {
        form.resetFields();
        setIsModalVisible(false);
        setMapReady(false); // Reset map ready state
        setHasValidDirections(false);
        setRouteData(null);
        setPolylineRoute([]);
        if (onEditRequest) {
            onEditRequest(null); // Clear editing record in parent
        }
    };

    const limeOptions = { color: 'lime' };

    // Handle map initialization delay
    useEffect(() => {
        if (isModalVisible && !mapReady) {
            // Delay map rendering to allow container to set proper dimensions
            const timer = setTimeout(() => {
                setMapReady(true);
            }, 300); // 300ms delay should be enough for Modal to render

            return () => clearTimeout(timer);
        } else if (!isModalVisible) {
            setMapReady(false);
        }
    }, [isModalVisible, mapReady]);

    return (
        <>
            <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAdd}
            >
                Add New Task
            </Button>

            <Modal
                title={editingRecord ? 'Edit Task' : 'Add New Task'}
                open={isModalVisible}
                onCancel={handleCancel}
                footer={null}
                width="90%"
                destroyOnClose
                style={{ top: 20 }}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                    initialValues={{
                        taskStatus: 'created',
                        taskAchievements: [],
                        startAlt: 11, // Set default start altitude
                        destAlt: 14   // Set default destination altitude
                    }}
                >
                    <Form.Item
                        hidden={!editingRecord}
                        label="Task Code"
                        name="taskGeneratedCode"
                        disabled
                        rules={[
                            { required: false },
                        ]}
                    >
                        <Input disabled placeholder="Auto Generate" />
                    </Form.Item>

                    <Form.Item
                        label="Task Name"
                        name="name"
                        rules={[
                            { required: true, message: 'Please enter the task name!' },
                            { min: 2, message: 'Task name must be at least 2 characters long!' }
                        ]}
                    >
                        <Input placeholder="Enter task name" />
                    </Form.Item>

                    <Form.Item
                        label="Task Type"
                        name="taskType"
                        rules={[
                            { required: false }
                        ]}
                    >
                        <Select placeholder="Select task type">
                            <Option value="delivery">Delivery</Option>
                            <Option value="pickup">Pickup</Option>
                            <Option value="maintenance">Maintenance</Option>
                            <Option value="inspection">Inspection</Option>
                            <Option value="transport">Transport</Option>
                        </Select>
                    </Form.Item>

                    <Form.Item
                        hidden={!editingRecord}
                        label="Task Status"
                        name="taskStatus"
                        rules={[
                            { required: true, message: 'Please select task status!' }
                        ]}
                    >
                        <Select placeholder="Select task status" defaultValue="created">
                            {editingRecord ? (
                                // Show all options when editing
                                <>
                                    <Option value="created">Created</Option>
                                    <Option value="active">Active</Option>
                                    <Option value="in_progress">In Progress</Option>
                                    <Option value="completed">Completed</Option>
                                    <Option value="cancelled">Cancelled</Option>
                                    <Option value="failed">Failed</Option>
                                </>
                            ) : (
                                // Show only "created" option when creating new task
                                <Option value="created">Created</Option>
                            )}
                        </Select>
                    </Form.Item>
                    <Form.Item
                        hidden={!editingRecord}
                        label="Task Achievements"
                        name="taskAchievements"
                        help="Add achievements or milestones for this task"
                    >
                        <Select
                            mode="tags"
                            placeholder="Add achievements (e.g., checkpoint1, milestone1)"
                            style={{ width: '100%' }}
                            tokenSeparators={[',', ' ']}
                        />
                    </Form.Item>

                    {/* Location Selection Section */}
                    <Card
                        size="small"
                        style={{ marginBottom: 16, backgroundColor: '#f0f9ff' }}
                        title={
                            <Space>
                                <EnvironmentOutlined />
                                <span>Location Selection</span>
                            </Space>
                        }
                    >
                        <div style={{ marginBottom: 16 }}>
                            <Space direction="vertical" style={{ width: '100%' }}>
                                <div>
                                    <strong>Start Location:</strong> {startLocation.lat?.toFixed(6)}, {startLocation.lng?.toFixed(6)}
                                    {startLocation.alt !== undefined && startLocation.alt !== 0 && (
                                        <span style={{ color: '#1890ff', marginLeft: '10px' }}>Alt: {startLocation.alt?.toFixed(1)}m</span>
                                    )}
                                </div>
                                <div>
                                    <strong>Destination Location:</strong> {destinationLocation.lat?.toFixed(6)}, {destinationLocation.lng?.toFixed(6)}
                                    {destinationLocation.alt !== undefined && destinationLocation.alt !== 0 && (
                                        <span style={{ color: '#52c41a', marginLeft: '10px' }}>Alt: {destinationLocation.alt?.toFixed(1)}m</span>
                                    )}
                                </div>
                            </Space>
                        </div>
                        {mapReady ? (
                            <MapContainer
                                center={startLocation}
                                zoom={13}
                                scrollWheelZoom={true}
                                style={{ height: '400px', width: '100%' }}
                                key={`map-${isModalVisible}`} // Force remount when modal opens
                            >
                                <TileLayer
                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                />
                                <DraggableMarkerComp
                                    key="start-location-marker"
                                    label="Start Location"
                                    initialPosition={startLocation}
                                    onPositionChange={handleStartLocationChange}
                                    iconColor="blue"
                                />
                                <DraggableMarkerComp
                                    key="destination-location-marker"
                                    label="Destination Location"
                                    initialPosition={destinationLocation}
                                    onPositionChange={handleDestinationLocationChange}
                                    iconColor="green"
                                />
                                {polylineRoute.length > 0 && (
                                    <Polyline
                                        pathOptions={limeOptions}
                                        positions={polylineRoute}
                                        weight={8}
                                    />
                                )}
                            </MapContainer>
                        ) : (
                            <div style={{ height: '400px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f5f5', border: '1px dashed #d9d9d9' }}>
                                <Text type="secondary">Loading map...</Text>
                            </div>
                        )}
                    </Card>

                    {/* Hidden form fields for coordinates - managed by map */}
                    <Form.Item
                        hidden
                        name="startLat"
                        rules={[{ required: true, message: 'Required!' }]}
                        style={{ flex: 1, marginRight: 8 }}
                    >
                        <InputNumber
                            placeholder="Latitude"
                            style={{ width: '100%' }}
                            step={0.000001}
                            precision={6}
                            onChange={handleCoordinateChange}
                        />
                    </Form.Item>
                    <Form.Item
                        hidden
                        name="startLng"
                        rules={[{ required: true, message: 'Required!' }]}
                        style={{ flex: 1, marginRight: 8 }}
                    >
                        <InputNumber
                            placeholder="Longitude"
                            style={{ width: '100%' }}
                            step={0.000001}
                            precision={6}
                            onChange={handleCoordinateChange}
                        />
                    </Form.Item>
                    <Form.Item
                        hidden
                        name="startAlt"
                        style={{ flex: 1 }}
                    >
                        <InputNumber
                            placeholder="Altitude (m)"
                            style={{ width: '100%' }}
                            step={1}
                            onChange={handleCoordinateChange}
                        />
                    </Form.Item>
                    <Form.Item
                        hidden
                        name="destLat"
                        rules={[{ required: true, message: 'Required!' }]}
                        style={{ flex: 1, marginRight: 8 }}
                    >
                        <InputNumber
                            placeholder="Latitude"
                            style={{ width: '100%' }}
                            step={0.000001}
                            precision={6}
                            onChange={handleCoordinateChange}
                        />
                    </Form.Item>
                    <Form.Item
                        hidden
                        name="destLng"
                        rules={[{ required: true, message: 'Required!' }]}
                        style={{ flex: 1, marginRight: 8 }}
                    >
                        <InputNumber
                            placeholder="Longitude"
                            style={{ width: '100%' }}
                            step={0.000001}
                            precision={6}
                            onChange={handleCoordinateChange}
                        />
                    </Form.Item>
                    <Form.Item
                        hidden
                        name="destAlt"
                        style={{ flex: 1 }}
                    >
                        <InputNumber
                            placeholder="Altitude (m)"
                            style={{ width: '100%' }}
                            step={1}
                            onChange={handleCoordinateChange}
                        />
                    </Form.Item>

                    {/* Get Directions Section */}
                    <Card
                        size="small"
                        style={{ marginBottom: 16, backgroundColor: '#f9f9f9' }}
                        title={
                            <Space>
                                <CompassOutlined />
                                <span>Route Planning</span>
                            </Space>
                        }
                    >
                        <Space direction="vertical" style={{ width: '100%' }}>




                            {hasValidDirections ? (
                                <Alert
                                    message="Route Successfully Fetched"
                                    description={`Route contains ${routeData?.length || 0} waypoints`}
                                    type="success"
                                    showIcon
                                    icon={<CheckCircleOutlined />}
                                />
                            ) : <Alert
                                message="Route directions are required for task creation"
                                description="Please fetch the route between start and destination locations before creating the task."
                                type="info"
                                showIcon
                            />
                            }
                        </Space>
                    </Card>



                    <Form.Item>
                        <Space>
                            {hasValidDirections ?
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    loading={loading}
                                    disabled={!editingRecord && !hasValidDirections}
                                >
                                    {editingRecord ? 'Update Task' : 'Create Task'}
                                </Button>
                                :
                                <Button
                                    type="primary"
                                    icon={<CompassOutlined />}
                                    onClick={handleGetDirections}
                                    loading={directionsLoading}
                                >
                                    Get Directions
                                </Button>

                            }


                            <Button onClick={handleCancel}>
                                Cancel
                            </Button>
                        </Space>
                        {!editingRecord && !hasValidDirections && (
                            <div style={{ marginTop: 8 }}>
                                <Text type="secondary" style={{ fontSize: '12px' }}>
                                    * Please fetch directions before creating the task
                                </Text>
                            </div>
                        )}
                    </Form.Item>
                </Form>
            </Modal>
        </>
    );
};
