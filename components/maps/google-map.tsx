"use client"

import { GoogleMap, MarkerF, PolylineF, useJsApiLoader } from "@react-google-maps/api"

export type MapMarker = {
  id: string | number
  position: { lat: number; lng: number }
  title?: string
  label?: string
}

interface GoogleMapViewProps {
  markers: MapMarker[]
  path?: { lat: number; lng: number }[]
  center?: { lat: number; lng: number }
  zoom?: number
  height?: string
}

const defaultCenter = { lat: 8.9806, lng: 38.7578 }

export function GoogleMapView({ markers, path, center, zoom = 12, height = "360px" }: GoogleMapViewProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ""
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: apiKey,
  })

  if (!apiKey) {
    return (
      <div className="flex h-full min-h-[240px] items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
        Missing NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div className="flex h-full min-h-[240px] items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
        Loading map...
      </div>
    )
  }

  const mapCenter = center ?? markers[0]?.position ?? defaultCenter

  return (
    <div style={{ height }} className="w-full overflow-hidden rounded-lg border">
      <GoogleMap mapContainerStyle={{ width: "100%", height: "100%" }} center={mapCenter} zoom={zoom}>
        {path && path.length > 1 && <PolylineF path={path} options={{ strokeColor: "#16a34a", strokeWeight: 4 }} />}
        {markers.map((marker) => (
          <MarkerF
            key={marker.id}
            position={marker.position}
            title={marker.title}
            label={marker.label}
          />
        ))}
      </GoogleMap>
    </div>
  )
}
