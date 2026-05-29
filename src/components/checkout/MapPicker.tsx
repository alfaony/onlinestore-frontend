// src/components/checkout/MapPicker.tsx
'use client'
import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix leaflet default icon di Next.js
const icon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
})

// Center map when lat/lng change
function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
    const map = useMap()
    useEffect(() => { map.setView([lat, lng], map.getZoom()) }, [lat, lng])
    return null
}

// Drag marker handler
function DraggableMarker({ lat, lng, onMove }: {
    lat: number; lng: number; onMove: (lat: number, lng: number) => void
}) {
    useMapEvents({
        click(e) { onMove(e.latlng.lat, e.latlng.lng) }
    })
    return (
        <Marker
            position={[lat, lng]}
            icon={icon}
            draggable
            eventHandlers={{
                dragend: e => {
                    const { lat: lt, lng: lg } = e.target.getLatLng()
                    onMove(lt, lg)
                }
            }}
        />
    )
}

interface Props { lat: number; lng: number; onMove: (lat: number, lng: number) => void }

export default function MapPicker({ lat, lng, onMove }: Props) {
    return (
        <MapContainer
            center={[lat, lng]}
            zoom={16}
            style={{ height: 220, width: '100%' }}
            scrollWheelZoom={false}>
            <TileLayer
                attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <RecenterMap lat={lat} lng={lng} />
            <DraggableMarker lat={lat} lng={lng} onMove={onMove} />
        </MapContainer>
    )
}