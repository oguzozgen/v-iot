import React, { useEffect, useState, useRef } from 'react';
import { Button, message, Steps, Card, Table, Row, Col, Divider, Alert, Flex, Tag, Space, Descriptions, Timeline, Typography, Popconfirm, Popover } from 'antd';
import { DeviceCreateEditComp } from '../../components/DeviceCreateEditComp/DeviceCreateEditComp.jsx';
import { VehicleRegistriesComp } from '../../components/VehicleRegistriesComp/VehicleRegistriesComp';
import { TaskCreateEditComp } from '../../components/TaskCreateEditComp/TaskCreateEditComp';
import { useAxiosContext } from '../../context/axios-context';
import { useSocketContext } from '../../context/socket-context/useSocketContext';
import { CheckCircleOutlined, CloseCircleOutlined, CompassOutlined, PlayCircleOutlined, SyncOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

export const Home = () => {
    const { getData, postData, patchData } = useAxiosContext();
    const navigate = useNavigate();
    const { socket, connected, joinVehicleRoom, leaveVehicleRoom, subscribedVin } = useSocketContext();
    const [current, setCurrent] = useState(0);
    const next = () => {
        setCurrent(current + 1);
    };
    const prev = () => {
        setCurrent(current - 1);
    };

    let styleStepsCard = {
        minHeight: "60vh"
    };

    const [devicesList, setDevicesList] = useState([]);
    const [loadingDevicesList, setLoadingDevicesList] = useState(false);
    const [vehiclesList, setVehiclesList] = useState([]);
    const [loadingVehiclesList, setLoadingVehiclesList] = useState(false);
    const [tasksList, setTasksList] = useState([]);
    const [loadingTasksList, setLoadingTasksList] = useState(false);

    const [selectedVehicle, setSelectedVehicle] = useState(null);
    const [selectedTask, setSelectedTask] = useState(null);
    const [isSelectedVehicleUp, setIsSelectedVehicleUp] = useState(false);
    const [previousVehicleVin, setPreviousVehicleVin] = useState(null);

    const [loadingCheckMission, setLoadingCheckMission] = useState(false);
    const [isMissionAlreadyCreated, setIsMissionAlreadyCreated] = useState(false);


    // eslint-disable-next-line no-unused-vars
    const [loadingCreateMission, setLoadingCreateMission] = useState(false);
    const [createdMissionResponse, setCreatedMissionResponse] = useState(null);
    const [isCheckMissionClicked, setIsCheckMissionClicked] = useState(false);

    const [createMissionCode, setCreateMissionCode] = useState("");
    const [loadingStartVehicle, setLoadingStartVehicle] = useState(false);

    const [deviceDemandsTaken, setDeviceDemandsTaken] = useState(false);

    // eslint-disable-next-line no-unused-vars
    const [deviceDemandsResponded, setDeviceDemandsResponded] = useState(false);
    const [deviceDemandsData, setDeviceDemandsData] = useState(null);

    // Use useRef instead of useState for timeout reference
    const heartbeatTimeoutRef = useRef(null);

    const getDevices = async () => {
        setLoadingDevicesList(true);
        try {
            const response = await getData('/devices');
            if (response.data) {
                setDevicesList(response.data);
            }
        } catch {
            message.error('Failed to fetch devices');
        } finally {
            setLoadingDevicesList(false);
        }
    };

    const getVehicles = async () => {
        setLoadingVehiclesList(true);
        try {
            const response = await getData('/vehicle-registries');
            if (response.data) {
                setVehiclesList(response.data);
            }
            if (response.data.length > 0) {
                setSelectedVehicle(response.data[0]);
                console.log('Selected Vehicle:', response.data[0]);
            }
        } catch {
            message.error('Failed to fetch vehicles');
        } finally {
            setLoadingVehiclesList(false);
        }
    };

    const getTasks = async () => {
        setLoadingTasksList(true);
        try {
            const response = await getData('/tasks');
            if (response.data) {
                setTasksList(response.data);
            }
            if (response.data.length > 0) {
                setSelectedTask(response.data[0]);
                console.log('Selected Task:', response.data[0]);
            }
        } catch {
            message.error('Failed to fetch tasks');
        } finally {
            setLoadingTasksList(false);
        }
    };

    useEffect(() => {
        getDevices();
        getVehicles();
        getTasks();
    }, []);

    // Vehicle selection and room subscription management
    useEffect(() => {
        if (!socket || !connected) return;

        const handleVehicleSelection = () => {
            if (selectedVehicle && selectedVehicle.vin) {
                const newVin = selectedVehicle.vin.toString();

                // If we already have a previous vehicle, leave its room first
                if (previousVehicleVin && previousVehicleVin !== newVin) {
                    console.log(`🚗 Leaving previous vehicle room: ${previousVehicleVin}`);
                    leaveVehicleRoom(previousVehicleVin);
                }

                // Join new vehicle room if it's different from current subscription
                if (subscribedVin !== newVin) {
                    console.log(`🚗 Joining new vehicle room: ${newVin}`);
                    joinVehicleRoom(newVin);
                    setPreviousVehicleVin(newVin);
                }
            }
        };

        handleVehicleSelection();
    }, [selectedVehicle, socket, connected, subscribedVin, previousVehicleVin, joinVehicleRoom, leaveVehicleRoom]);

    // Listen for vehicle heartbeat events
    useEffect(() => {
        if (!socket || !connected || !subscribedVin) return;

        const handleHeartbeat = (data) => {
            console.log(`💓 Received heartbeat for VIN: ${data.vin || 'unknown'}`);

            // Check if this heartbeat is for the currently selected vehicle
            if (selectedVehicle && selectedVehicle.vin &&
                (data.vin === selectedVehicle.vin.toString() || data.vin === selectedVehicle.vin)) {
                console.log(`💓 Heartbeat matches selected vehicle VIN`);

                // Set to true only if it's currently false (first heartbeat or after timeout)
                if (!isSelectedVehicleUp) {
                    setIsSelectedVehicleUp(true);
                    console.log(`✅ Vehicle ${data.vin} is now marked as UP`);
                }

                // Clear existing timeout if any
                if (heartbeatTimeoutRef.current) {
                    clearTimeout(heartbeatTimeoutRef.current);
                    heartbeatTimeoutRef.current = null;
                }

                // Set new timeout to mark vehicle as offline after 30 seconds
                heartbeatTimeoutRef.current = setTimeout(() => {
                    console.log(`⏰ No heartbeat received for 30 seconds, marking vehicle ${data.vin} as DOWN`);
                    setIsSelectedVehicleUp(false);
                    heartbeatTimeoutRef.current = null;
                }, 10000);
            }
        };


        // Listen for VIN-specific heartbeat events
        const heartbeatEvent = `vehicle_${subscribedVin}_heartbeat-status`;
        socket.on(heartbeatEvent, handleHeartbeat);


        // Also listen for generic heartbeat events
        socket.on('heartbeat-status', handleHeartbeat);

        console.log(`🔊 Set up heartbeat listeners for VIN: ${subscribedVin}`);

        return () => {
            socket.off(heartbeatEvent, handleHeartbeat);
            socket.off('heartbeat-status', handleHeartbeat);

            // Clear timeout on cleanup
            if (heartbeatTimeoutRef.current) {
                clearTimeout(heartbeatTimeoutRef.current);
                heartbeatTimeoutRef.current = null;
            }

            console.log(`🔇 Removed heartbeat listeners for VIN: ${subscribedVin}`);
        };
    }, [socket, connected, subscribedVin, selectedVehicle, isSelectedVehicleUp]); // Remove heartbeatTimeoutRef from dependencies


    useEffect(() => {
        if (!socket || !connected || !subscribedVin) return;

        const deviceDemandsEvent = `vehicle_${subscribedVin}_device-demands`;
        const handleDeviceDemands = (data) => {
            console.log("aaaaaaaa")
            setDeviceDemandsTaken(true);
            setDeviceDemandsData(data);
        };

        socket.on(deviceDemandsEvent, handleDeviceDemands);

        return () => {
            socket.off(deviceDemandsEvent, handleDeviceDemands);
        };
    }, [socket, connected, subscribedVin]);

    // Reset vehicle status when vehicle changes
    useEffect(() => {
        if (selectedVehicle) {
            setIsSelectedVehicleUp(false);

            // Clear existing timeout when vehicle changes
            if (heartbeatTimeoutRef.current) {
                clearTimeout(heartbeatTimeoutRef.current);
                heartbeatTimeoutRef.current = null;
            }

            console.log(`🔄 Reset vehicle status for new selection: ${selectedVehicle.name}`);
        }
    }, [selectedVehicle]); // Remove heartbeatTimeoutRef from dependencies

    // Cleanup timeout on component unmount
    useEffect(() => {
        return () => {
            if (heartbeatTimeoutRef.current) {
                clearTimeout(heartbeatTimeoutRef.current);
                heartbeatTimeoutRef.current = null;
            }
        };
    }, []); // Empty dependency array

    const columnsDevices = [
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
        }
    ];


    // Table columns
    const columnsVehicleRegistries = [
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
            title: 'Username MQTT',
            dataIndex: ['mqttCredentials', 'username'],
            key: 'mqttCredentialsUsername',
            render: (name) => { return <Typography.Text copyable>{name || 'N/A'}</Typography.Text> }
        },
        {
            title: 'Password MQTT(demo-only)',
            dataIndex: ['mqttCredentials', 'password'],
            key: 'mqttCredentialsPassword',
            render: (name) => { return <Typography.Text copyable>{name || 'N/A'}</Typography.Text> }
        },
    ];

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

    const formatCoordinates = (geoPoint) => {
        if (!geoPoint || !geoPoint.coordinates) return 'N/A';
        const [lng, lat, alt] = geoPoint.coordinates;
        return `${lat.toFixed(6)}, ${lng.toFixed(6)}${alt ? `, ${alt}m` : ''}`;
    };

    // Table columns
    const columnsTasks = [
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
    ];

    const rowSelectionVehicles = {
        onChange: (selectedRowKeys, selectedRows) => {
            console.log(`selectedRowKeys: ${selectedRowKeys}`, 'selectedRows: ', selectedRows);
            const newVehicle = selectedRows[0] || null;

            // Store previous vehicle VIN before changing
            if (selectedVehicle && selectedVehicle.vin) {
                setPreviousVehicleVin(selectedVehicle.vin.toString());
            }

            setSelectedVehicle(newVehicle);
            console.log('Selected Vehicle changed to:', newVehicle);
        },
        getCheckboxProps: record => ({
            name: record.name,
        }),
        defaultSelectedRowKeys: vehiclesList.length > 0 ? [vehiclesList[0]._id] : [],
    };

    const rowSelectionTasks = {
        onChange: (selectedRowKeys, selectedRows) => {
            console.log(`selectedRowKeys: ${selectedRowKeys}`, 'selectedRows: ', selectedRows);
            setSelectedTask(selectedRows[0] || null);
        },
        getCheckboxProps: record => ({
            name: record.name,
        }),
        defaultSelectedRowKeys: tasksList.length > 0 ? [tasksList[0]._id] : [],
    };

    const handleCreateNewVehiclePm2Process = async (vin) => {
        vin = vin || selectedVehicle?.vin;
        if (!vin) {
            message.error('Please select a vehicle first.');
            return;
        }

        try {
            setLoadingStartVehicle(true);
            message.loading('Starting vehicle process...', 0);

            const response = await postData('/pm2-device-management/devices/by-vin', {
                vin: vin.toString(),
                debug: true  // Enable debug mode for better logging
            });

            message.destroy(); // Clear loading message

            if (response.err) {
                message.error(`Failed to start vehicle: ${response.err}`);
                return;
            }

            if (response.data.isExisting) {
                message.info(`Vehicle ${vin} is already running (PID: ${response.data.pid})`);
            } else {
                message.success(`Vehicle ${vin} started successfully (PID: ${response.data.pid})`);
            }

            console.log('Vehicle process response:', response.data);
            setTimeout(() => {
                setLoadingStartVehicle(false);
                // You can add your actual start logic here if needed
            }, 5000);

        } catch (error) {
            message.destroy(); // Clear loading message
            message.error(`Error starting vehicle: ${error.message}`);
            console.error('Error starting vehicle process:', error);
        }
    }

    const handleCheckMission = async () => {
        setLoadingCheckMission(true);
        setIsCheckMissionClicked(true)
        try {
            let missionCode = selectedVehicle?.vin + '|' + selectedTask?.taskGeneratedCode + '|' + new Date().toISOString().split('T')[0];
            const response = await getData('/mission-duty/by-mission-code/' + missionCode);
            if (response.data) {
                setIsMissionAlreadyCreated(response.data.length > 0);
            } else {
                setIsMissionAlreadyCreated(false);
            }
        } catch {
            message.error('Failed to fetch check mission');
        } finally {
            setLoadingCheckMission(false);
        }
    };


    const handleCreateMission = async () => {
        setLoadingCreateMission(true);
        try {
            let missionCode = selectedVehicle?.vin + '|' + selectedTask?.taskGeneratedCode + '|' + new Date().toISOString().split('T')[0];
            setCreateMissionCode(missionCode)
            let payload = {
                missionCode,
                vin: selectedVehicle?.vin,
                taskGeneratedCode: selectedTask?.taskGeneratedCode,
                taskDispatched: {
                    taskGeneratedCode: selectedTask?.taskGeneratedCode,
                    name: selectedTask?.name,
                    startLocation: selectedTask?.startLocation,
                    destinationLocation: selectedTask?.destinationLocation,
                    taskType: selectedTask?.taskType,
                    taskStatus: selectedTask?.taskStatus,
                    taskAchievements: selectedTask?.taskAchievements || [],
                    taskRouteLineString: selectedTask?.taskRouteLineString,
                },
                status: 'created',
                dispatched: false,
                dispatchedAt: null,
            };
            const response = await postData('/mission-duty', payload);
            console.log('Mission Code:', response.data);
            if (response.data) {
                setCreatedMissionResponse(response.data);
            } else {
                setCreatedMissionResponse(null);
            }
            await handleCheckMission();
        } catch {
            message.error('Failed to fetch mission creation');
        } finally {
            setLoadingCreateMission(false);
        }
    };

    const confirmAssignMission = async () => {
        setDeviceDemandsResponded(true);
        let missionCode;
        if (!createMissionCode) {
            missionCode = selectedVehicle?.vin + '|' + selectedTask?.taskGeneratedCode + '|' + new Date().toISOString().split('T')[0];
            setCreateMissionCode(missionCode)
        }
        let sendMissionToVehicle = await postData(`/rabbitmq-mqtt/vehicles/send-mission-to-device`, {
            vin: selectedVehicle?.vin,
            missionCode: createMissionCode || missionCode,
        });
        console.log('sendMissionToVehicle Response:', sendMissionToVehicle);
        navigate("/watch-towers?vin=" + selectedVehicle?.vin + "&missionCode=" + (createMissionCode || missionCode));
    }

    const handleRestartDevice = async () => {
        const vinToFind = selectedVehicle?.vin;
        if (!vinToFind) {
            console.error('No VIN selected.');
            return;
        }

        try {
            // Get PM2 device list
            const response = await getData('/pm2-device-management/devices');
            const processes = response.data?.processes || [];

            // Find processName where VIN is included in the processName (split by "-")
            const found = processes.find(proc => {
                const parts = proc.name.split('-');
                // Example: v-device-686ae1eb469d0e1215bd4ee5-0-0
                return parts.includes(vinToFind);
            });

            if (!found) {
                console.error(`No running process found for VIN: ${vinToFind}`);
                return;
            }

            // Restart the process
            const restartResp = await patchData(`/pm2-device-management/devices/${found.name}/restart`);
            if (restartResp.data) {
                console.log(`Device process restart: ${found.name}`);
            } else {
                console.error('Failed to restart device process.');
            }
        } catch (err) {
            console.error('Error restart device process.');
            console.error(err);
        }
    };


    const steps = [
        {
            title: 'Assets - Devices & Vehicles',
            content: <>
                <Row gutter={[16, 16]} style={{ minHeight: '60vh' }}>
                    <Col span={24}>
                        {devicesList.length === 0 ?
                            <Card>
                                <Alert
                                    message="Please create a device first"
                                    description={<>
                                        <DeviceCreateEditComp
                                            editingRecord={null}
                                            onSuccess={getDevices}
                                            onEditRequest={() => { }}
                                        />
                                    </>}
                                    type="info"
                                    showIcon
                                />
                            </Card>
                            :
                            <Card
                                extra={
                                    <DeviceCreateEditComp
                                        editingRecord={null}
                                        onSuccess={getDevices}
                                        onEditRequest={() => { }}
                                    />
                                }
                            >
                                <Table
                                    columns={columnsDevices}
                                    dataSource={devicesList}
                                    loading={loadingDevicesList}
                                    rowKey="_id"
                                    scroll={{ x: 500 }}
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
                        }
                    </Col>
                    <Divider />
                    {devicesList.length > 0 ?


                        < Col span={24}>
                            {vehiclesList.length === 0 ?
                                <Card>
                                    <Alert
                                        message="Please create a vehicle registry"
                                        description={<>
                                            <VehicleRegistriesComp
                                                editingRecord={null}
                                                onSuccess={getVehicles}
                                                onEditRequest={() => { }}
                                            />
                                        </>}
                                        type="info"
                                        showIcon
                                    />
                                </Card>
                                :
                                <Card
                                    extra={
                                        <VehicleRegistriesComp
                                            editingRecord={null}
                                            onSuccess={getVehicles}
                                            onEditRequest={() => { }}
                                        />
                                    }
                                >
                                    <Table
                                        key={`vehicles-table-key`}
                                        columns={columnsVehicleRegistries}
                                        dataSource={vehiclesList}
                                        loading={loadingVehiclesList}
                                        rowKey="_id"
                                        scroll={{ x: 500 }}
                                        pagination={{
                                            showSizeChanger: true,
                                            showQuickJumper: true,
                                            showTotal: (total, range) =>
                                                `${range[0]}-${range[1]} of ${total} items`,
                                            pageSizeOptions: ['10', '20', '50', '100'],
                                            defaultPageSize: 10,
                                        }}
                                        rowSelection={Object.assign({ type: "radio" }, rowSelectionVehicles)}
                                    />
                                </Card>
                            }
                        </Col>
                        :
                        <></>
                    }
                </Row>
            </>
        },
        {
            title: 'Task',
            content: <>
                <Row gutter={[16, 16]} style={{ minHeight: '60vh' }}>
                    <Col span={24}>
                        {tasksList.length === 0 ?
                            <Card>
                                <Alert
                                    message="Please create a task first"
                                    description={<>
                                        <TaskCreateEditComp
                                            editingRecord={null}
                                            onSuccess={getTasks}
                                            onEditRequest={() => { }}
                                        />
                                    </>}
                                    type="info"
                                    showIcon
                                />
                            </Card>
                            :
                            <Card
                                extra={
                                    <TaskCreateEditComp
                                        editingRecord={null}
                                        onSuccess={getTasks}
                                        onEditRequest={() => { }}
                                    />
                                }
                            >
                                <Table
                                    key={`tasks-table-key`}
                                    columns={columnsTasks}
                                    dataSource={tasksList}
                                    loading={loadingTasksList}
                                    rowKey="_id"
                                    scroll={{ x: 500 }}
                                    pagination={{
                                        showSizeChanger: true,
                                        showQuickJumper: true,
                                        showTotal: (total, range) =>
                                            `${range[0]}-${range[1]} of ${total} items`,
                                        pageSizeOptions: ['10', '20', '50', '100'],
                                        defaultPageSize: 10,
                                    }}
                                    rowSelection={Object.assign({ type: "radio" }, rowSelectionTasks)}
                                />
                            </Card>
                        }
                    </Col>
                </Row>
            </>
        },
        {
            title: 'Mission/Duty',
            content: <>
                <Card style={styleStepsCard} title="Mission/Duty">
                    <Timeline

                        mode='alternate'
                        items={[
                            {
                                color: 'green',
                                children: `Vehicle selected: ${selectedVehicle ? selectedVehicle.name : 'None'}`,
                            },
                            {
                                color: 'green',
                                children: `Task selected: ${selectedTask ? selectedTask.name : 'None'}`,
                            },
                            {
                                color: 'warning',
                                children: (
                                    <>

                                        <Button onClick={handleCheckMission} loading={loadingCheckMission}>Check Existing Mission {isCheckMissionClicked ? isMissionAlreadyCreated + "" : ""}</Button>

                                        {!isMissionAlreadyCreated && isCheckMissionClicked && !createdMissionResponse &&
                                            <Button onClick={handleCreateMission} style={{ marginLeft: '10px' }} type="primary">Create Mission</Button>
                                        }


                                    </>
                                ),
                            },
                            {
                                color: 'red',
                                disabled: !isMissionAlreadyCreated,
                                children: (
                                    <>
                                        {
                                            isSelectedVehicleUp ?
                                                <>
                                                    <p>Vehicle is already up and running. 💓</p>
                                                    <Popover
                                                        title="Restart Device"
                                                        content={
                                                            <>
                                                                <p>When the device starts and no mission is assigned, it automatically requests a mission assignment from the front-end.</p>
                                                                <p>If delayed, please restart device(for demo.)</p>
                                                            </>
                                                        }>
                                                        <Button icon={<SyncOutlined />} type="primary" onClick={handleRestartDevice}>Restart the Device</Button>
                                                    </Popover>

                                                </>
                                                :
                                                <Button
                                                    disabled={!isMissionAlreadyCreated}
                                                    style={{ width: "250px" }}
                                                    type="primary"
                                                    icon={<PlayCircleOutlined />}
                                                    loading={loadingStartVehicle}
                                                    onClick={() => {
                                                        handleCreateNewVehiclePm2Process(selectedVehicle?.vin);
                                                    }}
                                                >
                                                    Start Vehicle
                                                </Button>
                                        }
                                        {selectedVehicle && subscribedVin && (
                                            <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
                                                <p>📡 Subscribed to VIN: {subscribedVin}</p>
                                                <p>🔍 Selected Vehicle: {selectedVehicle.name} (VIN: {selectedVehicle.vin})</p>
                                            </div>
                                        )}
                                    </>
                                ),
                            },
                            {
                                color: "green",
                                children: (
                                    <>
                                        {isSelectedVehicleUp ?
                                            <>
                                                <Typography.Text strong>Device Assignment Request Taken</Typography.Text>
                                                <br />
                                                <Popconfirm
                                                    title={"Assign/Dispatch to VIN: " + deviceDemandsData?.vin + "?"}
                                                    description="Assign/Dispatch Mission to Vehicle?"
                                                    onConfirm={confirmAssignMission}

                                                    okText="Yes"
                                                    cancelText="No"
                                                >
                                                    <Button type='primary' icon={deviceDemandsTaken && isSelectedVehicleUp ? <CheckCircleOutlined /> : <CloseCircleOutlined />}>Load Mission Run {deviceDemandsTaken && isSelectedVehicleUp ? "- Device to front-end mqtt received" : "- WAITING DEVICE MQTT REQUEST"}</Button>
                                                </Popconfirm>
                                            </> : <></>}
                                        {deviceDemandsTaken && isSelectedVehicleUp ?
                                            <p>MQTT device request received, ready to load.</p>
                                            :
                                            <p>Waiting for Device Assignment Request...</p>
                                        }

                                        <p>Assignment button need to populate.(demo request - device need to ask front-end)</p>
                                        <p>If it won't appear after vehicle start, please restart vehicle from device management</p>
                                    </>
                                ),
                            },
                            {
                                color: 'gray',
                                children: (
                                    <>
                                        <p>Load Task and Run</p>
                                    </>
                                ),
                            },
                            {
                                color: 'gray',
                                children: (
                                    <>
                                        <p>Done, go to Watch Tower for live</p>
                                    </>
                                ),
                            },
                        ]}
                    />
                </Card>
            </>
        },
    ];

    const items = steps.map(item => ({ key: item.title, title: item.title }));
    const contentStyle = {
        lineHeight: '260px',
        textAlign: 'center',
        marginTop: 16,
    };

    return (
        <>
            <Card>
                <div>
                    <Steps current={current} items={items} />
                    <div style={contentStyle}>{steps[current].content}</div>
                </div>
                <Flex justifyContent="space-between" alignItems="center" style={{ marginTop: 24, width: '100%', justifyContent: 'space-between' }}>

                    <Button disabled={current <= 0} style={{ margin: '0 8px' }} onClick={() => prev()}>
                        Previous
                    </Button>
                    <Button disabled={current >= steps.length - 1} type="primary" onClick={() => next()}>
                        Next
                    </Button>

                </Flex>
            </Card>
        </>
    );
};