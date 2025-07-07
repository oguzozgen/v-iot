import 'leaflet/dist/leaflet.css';
import { Button, Card, Col, Flex, Row } from "antd"
import { MapContainer, Polyline, TileLayer } from 'react-leaflet'
import { useCallback, useEffect, useState } from 'react';
import { DraggableMarkerComp } from '../DraggableMarkerComp';
import { useAxiosContext } from '../../context/axios-context';

const defaultCenter = {
    lat: 51.505,
    lng: -0.09,
}

export const MapInteractiveComp = ({
    center = defaultCenter,
    zoom = 13,
    onStartLocationChange,
    onDestinationLocationChange,
    onPolylineRouteChange,
    style = { height: '60vh', width: '100wh', margin: 0, padding: 0 }
}) => {
    const [startLocation, setStartLocation] = useState(center);
    const [destinationLocation, setDestinationLocation] = useState({
        lat: center.lat + 0.005,
        lng: center.lng + 0.005
    });
    const [polylineRoute, setPolylineRoute] = useState([]);
    const { getData } = useAxiosContext();

    // Add altitude state variables
    const [startAltitude, setStartAltitude] = useState(null);
    const [destinationAltitude, setDestinationAltitude] = useState(null);

    // Update handleStartLocationChange to capture altitude
    const handleStartLocationChange = useCallback((position) => {
        setStartLocation(position);
        if (position.alt !== undefined) {
            setStartAltitude(position.alt);
        }
        if (onStartLocationChange) {
            onStartLocationChange(position);
        }
    }, [onStartLocationChange]);

    // Update handleDestinationLocationChange to capture altitude
    const handleDestinationLocationChange = useCallback((position) => {
        setDestinationLocation(position);
        if (position.alt !== undefined) {
            setDestinationAltitude(position.alt);
        }
        if (onDestinationLocationChange) {
            onDestinationLocationChange(position);
        }
    }, [onDestinationLocationChange]);

    const handleDirectionsRequest = useCallback(async () => {
        const start = `${startLocation.lng},${startLocation.lat}`;
        const end = `${destinationLocation.lng},${destinationLocation.lat}`;
        const profile = 'driving-car';
        const url = `/directions?start=${start}&end=${end}&profile=${profile}`;
        try {
            const data = await getData(url);
            let dataField = data.data;
            if (dataField.features && dataField.features[0] && dataField.features[0].geometry) {
                const route = dataField.features[0].geometry.coordinates;
                // Generate base altitude and create gradual variations
                const baseAltitude = Math.floor(Math.random() * 10) + 8; // 8-18 meters base

                setPolylineRoute(route.map((coord) => {
                    // Small variation per coordinate (-2 to +2 meters from base)
                    const altitudeVariation = (Math.random() - 0.5) * 4;
                    const altitude = baseAltitude + altitudeVariation;
                    return [coord[1], coord[0], Math.max(3, Math.min(25, altitude))]; // Clamp between 3-25m
                }));

                if (onPolylineRouteChange) {
                    onPolylineRouteChange(route.map((coord) => {
                        const altitudeVariation = (Math.random() - 0.5) * 4; // ±2 meters variation
                        const altitude = baseAltitude + altitudeVariation;
                        return [coord[1], coord[0], Math.max(3, Math.min(25, altitude))];
                    }));
                }
            }
        } catch (error) {
            console.error('Error fetching directions:', error);
        }
    }, [startLocation, destinationLocation, onPolylineRouteChange, getData]);

    useEffect(() => {
        console.log("Polyline route updated:", polylineRoute);
    }, [polylineRoute]);

    const limeOptions = { color: 'lime' };

    return (
        <>
            <Row gutter={[16, 16]} style={{ margin: "2rem" }}>
                <Col span={24}>
                    <Card>
                        <Flex justify="space-evenly" align="center" direction="column" gap={"medium"}>
                            <div>
                                <strong>Start Location:</strong> {startLocation.lat?.toFixed(6)}, {startLocation.lng?.toFixed(6)}
                                {startAltitude !== null && <span style={{ color: '#1890ff', marginLeft: '10px' }}>Alt: {startAltitude?.toFixed(1)}m</span>}
                            </div>
                            <div>
                                <strong>Destination Location:</strong> {destinationLocation.lat?.toFixed(6)}, {destinationLocation.lng?.toFixed(6)}
                                {destinationAltitude !== null && <span style={{ color: '#52c41a', marginLeft: '10px' }}>Alt: {destinationAltitude?.toFixed(1)}m</span>}
                            </div>
                            <Button type="primary" onClick={handleDirectionsRequest}>
                                Get Directions
                            </Button>
                        </Flex>
                    </Card>
                </Col>
                <Col span={24}>
                    <Card>
                        <MapContainer
                            center={center}
                            zoom={zoom}
                            scrollWheelZoom={false}
                            style={style}
                        >
                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                            <DraggableMarkerComp
                                key="start-location-marker-key"
                                label="Start Location"
                                initialPosition={startLocation}
                                onPositionChange={handleStartLocationChange}
                            />
                            <DraggableMarkerComp
                                key="destination-location-marker-key"
                                label="Destination Location"
                                initialPosition={destinationLocation}
                                onPositionChange={handleDestinationLocationChange}
                                iconColor="green"
                            />
                            <Polyline
                                pathOptions={limeOptions}
                                positions={polylineRoute}
                                weight={15}
                            />

                        </MapContainer>
                    </Card>
                </Col>
            </Row>
        </>
    );
};

export default MapInteractiveComp;
