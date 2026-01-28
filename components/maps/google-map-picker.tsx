"use client"

import { GoogleMap, MarkerF, useJsApiLoader } from "@react-google-maps/api"

interface MapPickerProps {
  value: { lat: number; lng: number } | null
  onChange: (value: { lat: number; lng: number }) => void
  height?: string
  center?: { lat: number; lng: number }
  zoom?: number
}

const defaultCenter = { lat: 8.9806, lng: 38.7578 }

export function GoogleMapPicker({ value, onChange, height = "360px", center, zoom = 13 }: MapPickerProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ""
  const allowedHosts = (process.env.NEXT_PUBLIC_GOOGLE_MAPS_ALLOWED_HOSTS ?? "")
    .split(",")
    .map((host) => host.trim())
    .filter(Boolean)
  const currentHost = typeof window !== "undefined" ? window.location.hostname : ""
  const isHostAllowed = allowedHosts.length === 0 || allowedHosts.includes(currentHost)
  const isLikelyKey = apiKey.startsWith("AIza") && apiKey.length > 30
  const { isLoaded } = useJsApiLoader({ googleMapsApiKey: apiKey })

  if (!apiKey || !isLikelyKey) {
    return (
      <div className="flex h-full min-h-[240px] items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
        Invalid or missing Google Maps API key
      </div>
    )
  }

  if (!isHostAllowed) {
    return (
      <div className="flex h-full min-h-[240px] items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
        Google Maps is disabled for this domain
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

  const mapCenter = value ?? center ?? defaultCenter

  return (
    <div style={{ height }} className="w-full overflow-hidden rounded-lg border">
      <GoogleMap
        mapContainerStyle={{ width: "100%", height: "100%" }}
        center={mapCenter}
        zoom={zoom}
        onClick={(event) => {
          if (!event.latLng) return
          onChange({ lat: event.latLng.lat(), lng: event.latLng.lng() })
        }}
      >
        {value && (
          <MarkerF
            position={value}
            draggable
            onDragEnd={(event) => {
              if (!event.latLng) return
              onChange({ lat: event.latLng.lat(), lng: event.latLng.lng() })
            }}
          />
        )}
      </GoogleMap>
    </div>
  )
}
