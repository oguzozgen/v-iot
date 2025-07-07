import { Card, Col, Row, Input, Button, Space, message } from "antd";
import { MapContainer, Marker, Polyline, TileLayer, Popup } from 'react-leaflet'
import React, { useState, useEffect, useCallback } from 'react';
import { useSocketContext } from "../../context/socket-context/useSocketContext";
import { useLocation } from "react-router-dom";
import { useAxiosContext } from "../../context/axios-context";
import 'leaflet/dist/leaflet.css';
import * as L from "leaflet";

export const WatchTower = () => {
    const LeafIcon = L.Icon.extend({
        options: {}
    });
    const mapCenter = {
        lat: 51.505,
        lng: -0.09,
    };
    const blueIcon = new LeafIcon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    }),
        greenIcon = new LeafIcon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
        }),
        redIcon = new LeafIcon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
        });

    const { getData, deleteData } = useAxiosContext();
    const socket = useSocketContext().socket;
    const {
        connected,
        connectionAttempts,
        subscribedVin,
        joinVehicleRoom,
        leaveVehicleRoom,
        sendTestMessage,
        getServerStats,
        sendPing,
        reconnect,
        disconnect
    } = useSocketContext();
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const queryVin = searchParams.get('vin');
    const queryMissionCode = searchParams.get('missionCode');

    // State for displaying messages
    const [messages, setMessages] = useState([]);
    const [maxMessages] = useState(50); // Limit displayed messages
    const [vinInput, setVinInput] = useState(queryVin || '');
    const [isJoining, setIsJoining] = useState(false);
    const [isLeaving, setIsLeaving] = useState(false);

    const [missionRecord, setMissionRecord] = useState(null);
    const [taskRouteLineString, setTaskRouteLineString] = useState([]);
    const [taskStartLocation, setTaskStartLocation] = useState(null);
    const [taskDestinationLocation, setTaskDestinationLocation] = useState(null);

    const [vinSocketLocationValue, setVinSocketLocationValue] = useState([mapCenter.lat, mapCenter.lng, 0]);

    const getMissionRecord = async () => {
        if (!queryVin || !queryMissionCode) {
            console.warn('No VIN or mission code provided in query parameters');
            return;
        }
        try {
            let response = await getData(`/mission-duty/by-mission-code/${queryMissionCode}`);
            console.log('>>>>>>>>>>Mission Record Response:', response);
            if (response.data && response.data.length > 0) {
                let responseRecord = response.data[0];
                setMissionRecord(responseRecord);
                if (responseRecord.taskDispatched?.taskRouteLineString?.coordinates) {
                    console.log('Task Route Line String:', responseRecord?.taskDispatched?.taskRouteLineString);
                    setTaskRouteLineString(responseRecord?.taskDispatched?.taskRouteLineString?.coordinates.map(coord => [coord[1], coord[0], coord[2]]));
                }
                if (responseRecord?.taskDispatched?.startLocation) {
                    console.log('Task Start Location:', responseRecord?.taskDispatched?.startLocation.coordinates);
                    let startCoords = responseRecord?.taskDispatched?.startLocation.coordinates;
                    setTaskStartLocation({
                        lat: startCoords[1],
                        lng: startCoords[0],
                        alt: startCoords[2]
                    });

                }
                if (responseRecord?.taskDispatched?.destinationLocation) {
                    console.log('Task Destination Location:', responseRecord?.taskDispatched?.destinationLocation);
                    let destCoords = responseRecord.taskDispatched?.destinationLocation.coordinates;
                    setTaskDestinationLocation({
                        lat: destCoords[1],
                        lng: destCoords[0],
                        alt: destCoords[2]
                    });
                }
            }

        } catch {
            message.error('Failed to fetch tasks');
        }
    };
    useEffect(() => {


        getMissionRecord();
    }, [queryVin, queryMissionCode]);
    // Pre-populate VIN input if there's already a subscribed VIN
    useEffect(() => {
        if (subscribedVin && !vinInput) {
            setVinInput(subscribedVin);
        }
    }, [subscribedVin, vinInput]);

    // Add message to display
    const addMessage = useCallback((type, data) => {
        const newMessage = {
            id: Date.now(),
            type,
            data,
            timestamp: new Date().toLocaleTimeString()
        };
        if (type === 'device-demands') {
            console.log(`📊 Received telemetry data:`, newMessage);
        }

        setMessages(prev => {
            const updated = [newMessage, ...prev];
            return updated.slice(0, maxMessages); // Keep only recent messages
        });
    }, [maxMessages]);

    // Listen for socket events and display them
    useEffect(() => {
        if (!connected || !socket) return;

        // Always listen to connection and server events
        const eventHandlers = {
            'server_stats': (data) => addMessage('SERVER_STATS', data),
            'test_response': (data) => addMessage('TEST_RESPONSE', data),
            'pong': (data) => addMessage('PONG', data),
            'joined_vehicle_room': (data) => addMessage('JOINED_ROOM', data),
            'left_vehicle_room': (data) => addMessage('LEFT_ROOM', data),
        };

        // Only listen to vehicle-specific events when subscribed to a VIN
        if (subscribedVin) {
            console.log(`🔊 Setting up vehicle event listeners for VIN: ${subscribedVin}`);

            // Listen to the actual event names that the server emits to vehicle rooms
            /*eventHandlers['telemetry'] = (data) => {
                console.log(`� Received telemetry for VIN: ${data.vin}, subscribed to: ${subscribedVin}`);
                addMessage('TELEMETRY', data);
            };
            eventHandlers['heartbeat-status'] = (data) => {
                console.log(`� Received heartbeat for VIN: ${data.vin}, subscribed to: ${subscribedVin}`);
                addMessage('HEARTBEAT', data);
            };
            eventHandlers['mission-events'] = (data) => {
                console.log(`🎯 Received mission event for VIN: ${data.vin}, subscribed to: ${subscribedVin}`);
                addMessage('MISSION_EVENT', data);
            };
            eventHandlers['location'] = (data) => {
                console.log(`📍 Received location for VIN: ${data.vin}, subscribed to: ${subscribedVin}`);
                addMessage('LOCATION', data);
            };
            eventHandlers['vehicle_message'] = (data) => {
                console.log(`� Received vehicle_message for VIN: ${data.vin}, subscribed to: ${subscribedVin}`);
                addMessage('VEHICLE_MESSAGE', data);
            };*/

            // Also keep the VIN-specific listeners in case server sends them
            eventHandlers[`vehicle_${subscribedVin}_telemetry`] = (data) => addMessage('VIN_TELEMETRY', data);
            eventHandlers[`vehicle_${subscribedVin}_heartbeat-status`] = (data) => {
                console.log(`xxxxxxxxxx � Received heartbeat for VIN: ${data.vin}, subscribed to: ${subscribedVin}`);
                addMessage('VIN_HEARTBEAT', data)
            };
            eventHandlers[`vehicle_${subscribedVin}_mission-events`] = (data) => addMessage('VIN_MISSION_EVENT', data);
            eventHandlers[`vehicle_${subscribedVin}_location`] = (data) => {
                console.log(`LOCATION UPDATES data`, data);
                addMessage('VIN_LOCATION', data);
                // If data contains coordinates as [lat, lng, alt]
                if (data && data.content && data.content.latitude && data.content.longitude) {
                    console.log(`LOCATION UPDATES`);
                    setVinSocketLocationValue([data.content.latitude, data.content.longitude, data?.content?.altitude || 8]);
                }
            };
        } else {
            console.log(`🔇 No VIN subscribed, vehicle event listeners NOT set up`);
        }

        // Register all event handlers
        Object.entries(eventHandlers).forEach(([event, handler]) => {
            socket.on(event, handler);
        });

        // Cleanup on unmount or when dependencies change
        return () => {
            Object.keys(eventHandlers).forEach(event => {
                socket.off(event);
            });
        };
    }, [connected, subscribedVin, socket, addMessage]);

    const handleJoinVehicle = async () => {
        let vinToJoin = vinInput.trim();
        vinToJoin = vinToJoin || "";
        vinToJoin = vinToJoin.trim();
        if (!vinToJoin) {
            message.error('Please enter a VIN number');
            return;
        }
        setIsJoining(true);
        try {
            await joinVehicleRoom(vinToJoin);
            console.log(`Successfully joined vehicle room for VIN: ${vinToJoin}`);
        } catch (error) {
            message.error('Failed to join vehicle room');
            console.error('Join error:', error);
        } finally {
            setIsJoining(false);
        }
    };

    const handleLeaveVehicle = async () => {
        if (!subscribedVin) {
            message.error('No vehicle room to leave');
            return;
        }

        setIsLeaving(true);
        try {
            await leaveVehicleRoom(subscribedVin);
            message.success(`Successfully left vehicle room for VIN: ${subscribedVin}`);
        } catch (error) {
            message.error('Failed to leave vehicle room');
            console.error('Leave error:', error);
        } finally {
            setIsLeaving(false);
        }
    };

    const clearMessages = () => {
        setMessages([]);
    };

    const getMessageTypeColor = (type) => {
        const colors = {
            'TELEMETRY': '#2196F3',
            'VIN_TELEMETRY': '#4CAF50',
            'HEARTBEAT': '#FF9800',
            'VIN_HEARTBEAT': '#8BC34A',
            'LOCATION': '#9C27B0',
            'VIN_LOCATION': '#E91E63',
            'MISSION_EVENT': '#F44336',
            'VIN_MISSION_EVENT': '#FF5722',
            'VEHICLE_MESSAGE': '#607D8B',
            'SERVER_STATS': '#795548',
            'TEST_RESPONSE': '#009688',
            'PONG': '#CDDC39',
            'JOINED_ROOM': '#4CAF50',
            'LEFT_ROOM': '#FF9800',
        };
        return colors[type] || '#333';
    };
    return (
        <>
            <Card title="Watch Tower" >
                <Row>
                    <Col span={24}>
                        <MapContainer
                            center={mapCenter}
                            zoom={13}
                            scrollWheelZoom={true}
                            style={{ height: '60vh', width: '100wh', margin: 0, padding: 0 }}
                        >
                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />

                            <Marker
                                key="location-update-location-marker-key"
                                position={vinSocketLocationValue}
                                icon={redIcon}
                            >
                                <Popup minWidth={90}>
                                    <div>
                                        <div><strong>{"Vehicle Location"}</strong></div>
                                        <p>{JSON.stringify(vinSocketLocationValue)}</p>
                                    </div>
                                </Popup>
                            </Marker>
                            {taskStartLocation &&
                                <Marker
                                    key="start-location-marker-key"
                                    position={taskStartLocation}
                                    icon={blueIcon}
                                >
                                    <Popup minWidth={90}>
                                        <div>
                                            <div><strong>{"Start Location"}</strong></div>
                                        </div>
                                    </Popup>
                                </Marker>
                            }
                            {
                                taskDestinationLocation &&
                                <Marker
                                    key="destination-location-marker-key"
                                    position={taskDestinationLocation}
                                    icon={greenIcon}
                                >
                                    <Popup minWidth={90}>
                                        <div>
                                            <div><strong>{"Destination Location"}</strong></div>
                                        </div>
                                    </Popup>
                                </Marker>
                            }

                            {taskRouteLineString.length > 0 && (
                                <Polyline
                                    pathOptions={{ color: 'lime' }}
                                    positions={taskRouteLineString}
                                    weight={8}
                                />
                            )}
                        </MapContainer>
                    </Col>
                </Row>
            </Card>
            <Card title="live feed" style={{ marginTop: '20px' }}>
                <div style={{ padding: '20px', border: '1px solid #ccc', margin: '10px' }}>
                    <h3>Socket.IO Connection Status</h3>
                    <p>
                        Status: <span style={{ color: connected ? 'green' : 'red' }}>
                            {connected ? 'Connected' : 'Disconnected'}
                        </span>
                    </p>
                    {!connected && <p>Connection attempts: {connectionAttempts}</p>}
                    {subscribedVin && (
                        <p>
                            Subscribed to VIN: <span style={{ color: 'blue', fontWeight: 'bold' }}>
                                {subscribedVin}
                            </span>
                        </p>
                    )}

                    <div style={{ marginTop: '20px' }}>
                        <h4>Vehicle Room Controls</h4>
                        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                    Enter VIN:
                                </label>
                                <Input
                                    placeholder="Enter vehicle VIN (e.g., 6869763a7eac3a067b29918e)"
                                    value={vinInput}
                                    onChange={(e) => setVinInput(e.target.value)}
                                    style={{ maxWidth: '400px' }}
                                    onPressEnter={handleJoinVehicle}
                                    allowClear
                                />
                            </div>
                            <Space>
                                <Button
                                    type="primary"
                                    onClick={handleJoinVehicle}
                                    disabled={!connected || !vinInput.trim() || isJoining}
                                    loading={isJoining}
                                >
                                    {isJoining ? 'Joining...' : 'Join Vehicle Room'}
                                </Button>
                                <Button
                                    danger
                                    onClick={handleLeaveVehicle}
                                    disabled={!connected || !subscribedVin || isLeaving}
                                    loading={isLeaving}
                                >
                                    {isLeaving ? 'Leaving...' : `Leave Current Room${subscribedVin ? ` (${subscribedVin})` : ''}`}
                                </Button>
                                <Button
                                    type="dashed"
                                    onClick={() => setVinInput('6869763a7eac3a067b29918e')}
                                    disabled={isJoining || isLeaving}
                                >
                                    Use Sample VIN
                                </Button>
                            </Space>
                        </Space>
                    </div>

                    <div style={{ marginTop: '20px' }}>
                        <h4>Test Functions</h4>
                        <Space>
                            <Button onClick={sendTestMessage} disabled={!connected}>
                                Send Test Message
                            </Button>
                            <Button onClick={getServerStats} disabled={!connected}>
                                Get Server Stats
                            </Button>
                            <Button onClick={sendPing} disabled={!connected}>
                                Send Ping
                            </Button>
                        </Space>
                    </div>

                    <div style={{ marginTop: '20px' }}>
                        <h4>Connection Controls</h4>
                        <Space>
                            <Button type="default" onClick={reconnect}>
                                Reconnect
                            </Button>
                            <Button danger onClick={disconnect}>
                                Disconnect
                            </Button>
                        </Space>
                    </div>

                    {/* Messages Display Section */}
                    <div style={{ marginTop: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h4>Incoming Messages ({messages.length})</h4>
                            <Button
                                size="small"
                                onClick={clearMessages}
                            >
                                Clear Messages
                            </Button>
                        </div>

                        <div style={{
                            maxHeight: '400px',
                            overflowY: 'auto',
                            border: '1px solid #ddd',
                            padding: '10px',
                            backgroundColor: '#f9f9f9'
                        }}>
                            {messages.length === 0 ? (
                                <p style={{ color: '#666', fontStyle: 'italic' }}>No messages received yet...</p>
                            ) : (
                                messages.map((msg) => (
                                    <div key={msg.id} style={{
                                        marginBottom: '10px',
                                        padding: '8px',
                                        backgroundColor: 'white',
                                        border: '1px solid #eee',
                                        borderRadius: '4px'
                                    }}>
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            marginBottom: '5px'
                                        }}>
                                            <span style={{
                                                color: getMessageTypeColor(msg.type),
                                                fontWeight: 'bold',
                                                fontSize: '12px'
                                            }}>
                                                {msg.type}
                                            </span>
                                            <span style={{ fontSize: '11px', color: '#666' }}>
                                                {msg.timestamp}
                                            </span>
                                        </div>
                                        <pre style={{
                                            margin: 0,
                                            fontSize: '11px',
                                            whiteSpace: 'pre-wrap',
                                            wordBreak: 'break-word'
                                        }}>
                                            {JSON.stringify(msg.data, null, 2)}
                                        </pre>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div style={{ marginTop: '20px', fontSize: '12px', color: '#666' }}>
                        <p>📝 Messages are displayed above in real-time</p>
                        <p>💡 Also check the browser console for detailed logs</p>
                    </div>
                </div>
            </Card>
        </>
    );
};