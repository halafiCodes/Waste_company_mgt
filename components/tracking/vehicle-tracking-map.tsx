"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Truck,
  MapPin,
  Navigation,
  Clock,
  Search,
  Filter,
  Maximize2,
  RefreshCw,
  Circle,
  CheckCircle,
  AlertCircle,
} from "lucide-react"

interface Vehicle {
  id: string
  plateNumber: string
  driver: string
  status: "active" | "idle" | "maintenance"
  location: { lat: number; lng: number }
  route: string
  speed: number
  lastUpdate: string
  completedStops: number
  totalStops: number
}

interface VehicleTrackingMapProps {
  vehicles?: Vehicle[]
  selectedVehicle?: string | null
  onVehicleSelect?: (vehicleId: string) => void
  showFilters?: boolean
  height?: string
}

// Mock vehicle data with simulated positions in Addis Ababa
const defaultVehicles: Vehicle[] = [
  {
    id: "V001",
    plateNumber: "AA-12345",
    driver: "Kebede Alemu",
    status: "active",
    location: { lat: 9.0054, lng: 38.7636 },
    route: "Bole Morning Route",
    speed: 25,
    lastUpdate: "2 min ago",
    completedStops: 28,
    totalStops: 45,
  },
  {
    id: "V002",
    plateNumber: "AA-23456",
    driver: "Tadesse Bekele",
    status: "active",
    location: { lat: 9.0154, lng: 38.7536 },
    route: "Kirkos Route A",
    speed: 18,
    lastUpdate: "1 min ago",
    completedStops: 15,
    totalStops: 38,
  },
  {
    id: "V003",
    plateNumber: "AA-34567",
    driver: "Girma Tesfaye",
    status: "idle",
    location: { lat: 9.0254, lng: 38.7836 },
    route: "Yeka Industrial",
    speed: 0,
    lastUpdate: "5 min ago",
    completedStops: 25,
    totalStops: 25,
  },
  {
    id: "V004",
    plateNumber: "AA-45678",
    driver: "Solomon Haile",
    status: "active",
    location: { lat: 8.9954, lng: 38.7436 },
    route: "Arada Route B",
    speed: 32,
    lastUpdate: "30 sec ago",
    completedStops: 12,
    totalStops: 30,
  },
  {
    id: "V005",
    plateNumber: "AA-56789",
    driver: "Abebe Worku",
    status: "maintenance",
    location: { lat: 9.0354, lng: 38.7736 },
    route: "N/A",
    speed: 0,
    lastUpdate: "1 hour ago",
    completedStops: 0,
    totalStops: 0,
  },
]

export function VehicleTrackingMap({
  vehicles = defaultVehicles,
  selectedVehicle = null,
  onVehicleSelect,
  showFilters = true,
  height = "500px",
}: VehicleTrackingMapProps) {
  const [filter, setFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [selected, setSelected] = useState<string | null>(selectedVehicle)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const filteredVehicles = vehicles.filter(v => {
    if (filter !== "all" && v.status !== filter) return false
    if (searchQuery && !v.plateNumber.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !v.driver.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  const handleRefresh = () => {
    setIsRefreshing(true)
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  const handleVehicleClick = (vehicleId: string) => {
    setSelected(vehicleId)
    onVehicleSelect?.(vehicleId)
  }

  const selectedVehicleData = vehicles.find(v => v.id === selected)

  return (
    <div className="space-y-4">
      {showFilters && (
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search vehicles or drivers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[150px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Vehicles</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="idle">Idle</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={handleRefresh}>
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </Button>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Map Section */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Live Fleet Map</CardTitle>
              <Button variant="ghost" size="icon">
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Interactive Map Visualization */}
            <div 
              className="relative rounded-lg bg-gradient-to-br from-muted/50 to-muted overflow-hidden"
              style={{ height }}
            >
              {/* Map Grid Background */}
              <div className="absolute inset-0 opacity-20">
                <svg width="100%" height="100%">
                  <defs>
                    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />
                </svg>
              </div>

              {/* City Label */}
              <div className="absolute left-4 top-4 rounded-md bg-background/90 px-3 py-1.5 text-sm font-medium shadow-sm">
                Addis Ababa, Ethiopia
              </div>

              {/* Zone Labels */}
              <div className="absolute left-[20%] top-[30%] text-xs font-medium text-muted-foreground/60">
                Bole
              </div>
              <div className="absolute left-[60%] top-[25%] text-xs font-medium text-muted-foreground/60">
                Yeka
              </div>
              <div className="absolute left-[40%] top-[60%] text-xs font-medium text-muted-foreground/60">
                Kirkos
              </div>
              <div className="absolute left-[70%] top-[70%] text-xs font-medium text-muted-foreground/60">
                Arada
              </div>

              {/* Vehicle Markers */}
              {filteredVehicles.map((vehicle, index) => {
                // Distribute vehicles across the map
                const positions = [
                  { left: "25%", top: "35%" },
                  { left: "55%", top: "45%" },
                  { left: "70%", top: "30%" },
                  { left: "35%", top: "65%" },
                  { left: "80%", top: "60%" },
                ]
                const pos = positions[index % positions.length]

                return (
                  <button
                    key={vehicle.id}
                    type="button"
                    onClick={() => handleVehicleClick(vehicle.id)}
                    className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-200 ${
                      selected === vehicle.id ? "scale-125 z-10" : "hover:scale-110"
                    }`}
                    style={{ left: pos.left, top: pos.top }}
                  >
                    <div className={`relative flex h-10 w-10 items-center justify-center rounded-full shadow-lg ${
                      vehicle.status === "active" ? "bg-primary" :
                      vehicle.status === "idle" ? "bg-warning" : "bg-muted"
                    } ${selected === vehicle.id ? "ring-4 ring-primary/30" : ""}`}>
                      <Truck className="h-5 w-5 text-white" />
                      {vehicle.status === "active" && (
                        <span className="absolute -right-1 -top-1 flex h-4 w-4">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                          <span className="relative inline-flex h-4 w-4 rounded-full bg-green-500" />
                        </span>
                      )}
                    </div>
                    <div className="mt-1 whitespace-nowrap rounded bg-background/90 px-1.5 py-0.5 text-xs font-medium shadow">
                      {vehicle.plateNumber}
                    </div>
                  </button>
                )
              })}

              {/* Legend */}
              <div className="absolute bottom-4 left-4 flex items-center gap-4 rounded-md bg-background/90 px-3 py-2 text-xs shadow-sm">
                <div className="flex items-center gap-1.5">
                  <Circle className="h-3 w-3 fill-primary text-primary" />
                  <span>Active</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Circle className="h-3 w-3 fill-warning text-warning" />
                  <span>Idle</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Circle className="h-3 w-3 fill-muted text-muted" />
                  <span>Maintenance</span>
                </div>
              </div>

              {/* Scale */}
              <div className="absolute bottom-4 right-4 flex items-center gap-2 rounded-md bg-background/90 px-2 py-1 text-xs shadow-sm">
                <div className="h-0.5 w-12 bg-foreground" />
                <span>1 km</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vehicle List / Details */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">
              {selected ? "Vehicle Details" : "Fleet Overview"}
            </CardTitle>
            <CardDescription>
              {selected ? `Tracking ${selectedVehicleData?.plateNumber}` : `${filteredVehicles.length} vehicles`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {selected && selectedVehicleData ? (
              // Vehicle Details View
              <div className="space-y-4">
                <Button 
                  variant="ghost" 
                  className="mb-2 -ml-2 text-sm"
                  onClick={() => setSelected(null)}
                >
                  &larr; Back to list
                </Button>
                
                <div className="flex items-center gap-3">
                  <div className={`flex h-14 w-14 items-center justify-center rounded-lg ${
                    selectedVehicleData.status === "active" ? "bg-primary/10" :
                    selectedVehicleData.status === "idle" ? "bg-warning/10" : "bg-muted"
                  }`}>
                    <Truck className={`h-7 w-7 ${
                      selectedVehicleData.status === "active" ? "text-primary" :
                      selectedVehicleData.status === "idle" ? "text-warning" : "text-muted-foreground"
                    }`} />
                  </div>
                  <div>
                    <h3 className="font-semibold">{selectedVehicleData.plateNumber}</h3>
                    <p className="text-sm text-muted-foreground">{selectedVehicleData.driver}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Status</span>
                    <Badge variant={
                      selectedVehicleData.status === "active" ? "default" :
                      selectedVehicleData.status === "idle" ? "secondary" : "outline"
                    }>
                      {selectedVehicleData.status}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Current Route</span>
                    <span className="font-medium">{selectedVehicleData.route}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Speed</span>
                    <span className="font-medium">{selectedVehicleData.speed} km/h</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Last Update</span>
                    <span className="font-medium">{selectedVehicleData.lastUpdate}</span>
                  </div>
                </div>

                {selectedVehicleData.totalStops > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Route Progress</span>
                      <span className="font-medium">
                        {selectedVehicleData.completedStops}/{selectedVehicleData.totalStops} stops
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-secondary">
                      <div 
                        className="h-2 rounded-full bg-primary transition-all"
                        style={{ width: `${(selectedVehicleData.completedStops / selectedVehicleData.totalStops) * 100}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="pt-2 grid gap-2">
                  <Button className="w-full">
                    <Navigation className="mr-2 h-4 w-4" />
                    View Full Route
                  </Button>
                  <Button variant="outline" className="w-full bg-transparent">
                    <Clock className="mr-2 h-4 w-4" />
                    View History
                  </Button>
                </div>
              </div>
            ) : (
              // Vehicle List View
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {filteredVehicles.map((vehicle) => (
                  <button
                    key={vehicle.id}
                    type="button"
                    onClick={() => handleVehicleClick(vehicle.id)}
                    className="w-full flex items-center justify-between rounded-lg border p-3 text-left hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                        vehicle.status === "active" ? "bg-primary/10" :
                        vehicle.status === "idle" ? "bg-warning/10" : "bg-muted"
                      }`}>
                        <Truck className={`h-5 w-5 ${
                          vehicle.status === "active" ? "text-primary" :
                          vehicle.status === "idle" ? "text-warning" : "text-muted-foreground"
                        }`} />
                      </div>
                      <div>
                        <p className="font-medium">{vehicle.plateNumber}</p>
                        <p className="text-xs text-muted-foreground">{vehicle.driver}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={
                        vehicle.status === "active" ? "default" :
                        vehicle.status === "idle" ? "secondary" : "outline"
                      } className="mb-1">
                        {vehicle.status}
                      </Badge>
                      <p className="text-xs text-muted-foreground">{vehicle.lastUpdate}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
