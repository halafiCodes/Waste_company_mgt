"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  MapPin,
  Navigation,
  Clock,
  CheckCircle,
  Circle,
  Truck,
  User,
  Phone,
  Play,
  Pause,
  SkipForward,
} from "lucide-react"

interface Stop {
  id: string
  address: string
  resident: string
  status: "completed" | "current" | "pending"
  time?: string
  wasteType?: string
}

interface RouteVisualizationProps {
  routeId?: string
  routeName?: string
  driver?: string
  vehicle?: string
  zone?: string
  stops?: Stop[]
  progress?: number
  status?: "scheduled" | "in-progress" | "completed" | "paused"
}

const defaultStops: Stop[] = [
  { id: "S001", address: "Bole Road, House 123", resident: "Abebe Kebede", status: "completed", time: "8:15 AM", wasteType: "General" },
  { id: "S002", address: "Bole Road, House 145", resident: "Sara Mekonnen", status: "completed", time: "8:22 AM", wasteType: "Recyclable" },
  { id: "S003", address: "Bole Medhanealem, Apt 12", resident: "Dawit Haile", status: "completed", time: "8:35 AM", wasteType: "General" },
  { id: "S004", address: "Atlas, Building A", resident: "Tigist Assefa", status: "current", time: "In progress", wasteType: "General" },
  { id: "S005", address: "Atlas, Building C", resident: "Yohannes Bekele", status: "pending", wasteType: "Hazardous" },
  { id: "S006", address: "Friendship Building", resident: "Hana Tadesse", status: "pending", wasteType: "Recyclable" },
  { id: "S007", address: "Edna Mall Area", resident: "Mulugeta Gebre", status: "pending", wasteType: "General" },
  { id: "S008", address: "Bole Brass, Villa 89", resident: "Selamawit Alemu", status: "pending", wasteType: "General" },
]

export function RouteVisualization({
  routeId = "R001",
  routeName = "Bole Morning Route",
  driver = "Kebede Alemu",
  vehicle = "AA-12345",
  zone = "Bole",
  stops = defaultStops,
  progress = 42,
  status = "in-progress",
}: RouteVisualizationProps) {
  const [expandedStop, setExpandedStop] = useState<string | null>(null)
  
  const completedStops = stops.filter(s => s.status === "completed").length
  const currentStop = stops.find(s => s.status === "current")

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {/* Route Map Visualization */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{routeName}</CardTitle>
              <CardDescription>{zone} Zone - {stops.length} stops</CardDescription>
            </div>
            <Badge variant={
              status === "in-progress" ? "default" :
              status === "completed" ? "secondary" : "outline"
            }>
              {status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {/* Route Progress Map */}
          <div className="relative rounded-lg bg-gradient-to-br from-muted/50 to-muted p-6 min-h-[400px]">
            {/* Map Background Grid */}
            <div className="absolute inset-0 opacity-10">
              <svg width="100%" height="100%">
                <defs>
                  <pattern id="route-grid" width="30" height="30" patternUnits="userSpaceOnUse">
                    <path d="M 30 0 L 0 0 0 30" fill="none" stroke="currentColor" strokeWidth="0.5" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#route-grid)" />
              </svg>
            </div>

            {/* Route Path SVG */}
            <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
              <path
                d="M 80 60 Q 120 80 160 100 T 240 140 T 320 180 T 400 220 T 480 260 T 560 300"
                fill="none"
                stroke="hsl(var(--muted-foreground))"
                strokeWidth="3"
                strokeDasharray="8 4"
                opacity="0.3"
              />
              <path
                d="M 80 60 Q 120 80 160 100 T 240 140"
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="4"
                strokeLinecap="round"
              />
            </svg>

            {/* Stop Markers */}
            <div className="relative h-full">
              {stops.slice(0, 6).map((stop, index) => {
                const positions = [
                  { left: "10%", top: "12%" },
                  { left: "22%", top: "22%" },
                  { left: "35%", top: "32%" },
                  { left: "50%", top: "42%" },
                  { left: "65%", top: "55%" },
                  { left: "80%", top: "68%" },
                ]
                const pos = positions[index]

                return (
                  <button
                    key={stop.id}
                    type="button"
                    onClick={() => setExpandedStop(expandedStop === stop.id ? null : stop.id)}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 group"
                    style={{ left: pos.left, top: pos.top }}
                  >
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-transform group-hover:scale-110 ${
                      stop.status === "completed" 
                        ? "bg-green-500 border-green-600 text-white" 
                        : stop.status === "current"
                        ? "bg-primary border-primary text-primary-foreground animate-pulse"
                        : "bg-background border-muted-foreground/30"
                    }`}>
                      {stop.status === "completed" ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : stop.status === "current" ? (
                        <Truck className="h-4 w-4" />
                      ) : (
                        <span className="text-xs font-medium text-muted-foreground">{index + 1}</span>
                      )}
                    </div>
                    {expandedStop === stop.id && (
                      <div className="absolute left-1/2 top-10 -translate-x-1/2 z-10 w-48 rounded-lg bg-background p-3 shadow-lg border">
                        <p className="font-medium text-sm">{stop.resident}</p>
                        <p className="text-xs text-muted-foreground">{stop.address}</p>
                        <div className="mt-2 flex items-center justify-between text-xs">
                          <Badge variant="outline">{stop.wasteType}</Badge>
                          {stop.time && <span className="text-muted-foreground">{stop.time}</span>}
                        </div>
                      </div>
                    )}
                  </button>
                )
              })}

              {/* Current Vehicle Position */}
              <div 
                className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20"
                style={{ left: "48%", top: "40%" }}
              >
                <div className="relative">
                  <div className="absolute -inset-4 rounded-full bg-primary/20 animate-ping" />
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary shadow-lg">
                    <Truck className="h-6 w-6 text-primary-foreground" />
                  </div>
                </div>
              </div>
            </div>

            {/* Map Legend */}
            <div className="absolute bottom-4 left-4 flex items-center gap-4 rounded-md bg-background/90 px-3 py-2 text-xs shadow-sm">
              <div className="flex items-center gap-1.5">
                <div className="h-3 w-3 rounded-full bg-green-500" />
                <span>Completed</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-3 w-3 rounded-full bg-primary" />
                <span>Current</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-3 w-3 rounded-full border-2 border-muted-foreground/30 bg-background" />
                <span>Pending</span>
              </div>
            </div>
          </div>

          {/* Route Controls */}
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm">
                <Pause className="mr-1 h-4 w-4" />
                Pause Route
              </Button>
              <Button variant="outline" size="sm">
                <SkipForward className="mr-1 h-4 w-4" />
                Skip Stop
              </Button>
            </div>
            <div className="text-sm text-muted-foreground">
              ETA: <span className="font-medium text-foreground">45 minutes</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Route Details Sidebar */}
      <div className="space-y-4">
        {/* Driver Info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Driver Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-primary/10 text-primary">
                  {driver.split(" ").map(n => n[0]).join("")}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{driver}</p>
                <p className="text-sm text-muted-foreground">{vehicle}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="mt-3 w-full bg-transparent">
              <Phone className="mr-2 h-4 w-4" />
              Contact Driver
            </Button>
          </CardContent>
        </Card>

        {/* Progress */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Route Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Completed</span>
                <span className="font-medium">{completedStops}/{stops.length} stops</span>
              </div>
              <div className="h-3 w-full rounded-full bg-secondary">
                <div 
                  className="h-3 rounded-full bg-primary transition-all"
                  style={{ width: `${(completedStops / stops.length) * 100}%` }}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Started</p>
                <p className="font-medium">8:00 AM</p>
              </div>
              <div>
                <p className="text-muted-foreground">Est. Completion</p>
                <p className="font-medium">11:30 AM</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stop List */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Stops</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {stops.map((stop, index) => (
                <div 
                  key={stop.id}
                  className={`flex items-start gap-3 rounded-lg p-2 ${
                    stop.status === "current" ? "bg-primary/5 border border-primary/20" : ""
                  }`}
                >
                  <div className={`mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full ${
                    stop.status === "completed" 
                      ? "bg-green-500 text-white" 
                      : stop.status === "current"
                      ? "bg-primary text-primary-foreground"
                      : "border-2 border-muted-foreground/30"
                  }`}>
                    {stop.status === "completed" ? (
                      <CheckCircle className="h-3.5 w-3.5" />
                    ) : stop.status === "current" ? (
                      <Circle className="h-3 w-3 fill-current" />
                    ) : (
                      <span className="text-xs text-muted-foreground">{index + 1}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${
                      stop.status === "pending" ? "text-muted-foreground" : ""
                    }`}>
                      {stop.resident}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{stop.address}</p>
                    {stop.time && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        <Clock className="inline mr-1 h-3 w-3" />
                        {stop.time}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
