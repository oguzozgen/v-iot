import 'leaflet/dist/leaflet.css';
import * as L from "leaflet";
import { Marker, Popup } from 'react-leaflet'
import { useCallback, useMemo, useRef, useState } from 'react';

const center = {
    lat: 51.505,
    lng: -0.09,
}

export function DraggableMarkerComp({ onPositionChange, initialPosition = center, label = "Marker", iconColor = "blue" }) {
    const LeafIcon = L.Icon.extend({
        options: {}
    });

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
        });
    
    const [icon] = useState(iconColor === "blue" ? blueIcon : greenIcon);
    const [draggable, setDraggable] = useState(true)
    const [position, setPosition] = useState(initialPosition)
    const [altitude, setAltitude] = useState(null)
    const markerRef = useRef(null)

    // Function to fetch elevation data
    const fetchElevation = async (lat, lng) => {
        try {
            // You'd need to replace 'YOUR_API_KEY' with an actual API key
            // Or use a free service like Open-Elevation API
            const response = await fetch(`https://api.open-elevation.com/api/v1/lookup?locations=${lat},${lng}`);
            const data = await response.json();
            return data.results[0].elevation;
        } catch (error) {
            console.error('Error fetching elevation:', error);
            // Fallback to default altitude
            return iconColor === "blue" ? 11 : 14;
        }
    };

    const eventHandlers = useMemo(
        () => ({
            async dragend() {
                const marker = markerRef.current
                if (marker != null) {
                    const newPosition = marker.getLatLng()
                    setPosition(newPosition)
                    
                    // Fetch elevation for the new position
                    const elevation = await fetchElevation(newPosition.lat, newPosition.lng);
                    setAltitude(elevation);
                    
                    // Export the position with altitude through callback
                    if (onPositionChange) {
                        onPositionChange({
                            lat: newPosition.lat,
                            lng: newPosition.lng,
                            alt: elevation
                        });
                    }
                }
            },
        }),
        [onPositionChange],
    )

    const toggleDraggable = useCallback(() => {
        setDraggable((d) => !d)
    }, [])

    return (
        <Marker
            draggable={draggable}
            eventHandlers={eventHandlers}
            position={position}
            ref={markerRef}
            icon={icon}
        >
            <Popup minWidth={90}>
                <div>
                    <div><strong>{label}</strong></div>
                    <div>Lat: {position.lat?.toFixed(6)}</div>
                    <div>Lng: {position.lng?.toFixed(6)}</div>
                    {altitude !== null && <div>Alt: {altitude?.toFixed(1)}m</div>}
                    <span onClick={toggleDraggable} style={{ cursor: 'pointer', color: 'blue', textDecoration: 'underline' }}>
                        {draggable
                            ? 'Marker is draggable'
                            : 'Click here to make marker draggable'}
                    </span>
                </div>
            </Popup>
        </Marker>
    )
}
