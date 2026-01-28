"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Truck,
  Users,
  MapPin,
  BarChart3,
  Bell,
  Search,
  MoreHorizontal,
  Plus,
  CheckCircle,
  Clock,
  LogOut,
  Settings,
  Menu,
  ChevronDown,
  TrendingUp,
  FileText,
  Navigation,
  Calendar,
  Package,
  AlertCircle,
  Play,
  Pause,
  RotateCcw,
} from "lucide-react"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { authorizedGet, authorizedPost, authorizedPostForm, authorizedPut } from "@/lib/api/client"
import { GoogleMapView, type MapMarker } from "@/components/maps/google-map"
import { jsPDF } from "jspdf"

interface WasteCompanyDashboardProps {
  user: { role: string; name: string }
  onLogout: () => void
}

export function WasteCompanyDashboard({ user, onLogout }: WasteCompanyDashboardProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const [searchQuery, setSearchQuery] = useState("")
  const [showVehicleModal, setShowVehicleModal] = useState(false)
  const [showDriverModal, setShowDriverModal] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [vehicles, setVehicles] = useState<any[]>([])
  const [drivers, setDrivers] = useState<any[]>([])
  const [routes, setRoutes] = useState<any[]>([])
  const [requests, setRequests] = useState<any[]>([])
  const [dailyReports, setDailyReports] = useState<any[]>([])
  const [notifications, setNotifications] = useState<any[]>([])
  const [selectedReport, setSelectedReport] = useState<"daily" | "fleet" | "driver" | "route">("daily")
  const [companyStats, setCompanyStats] = useState<{ fleet_size: number; employee_count: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [vehicleForm, setVehicleForm] = useState({
    plate_number: "",
    vehicle_type: "compactor",
    capacity_kg: "",
  })
  const [driverForm, setDriverForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    license_number: "",
    license_expiry: "",
    assigned_vehicle: "",
  })
  const [assignDriverModal, setAssignDriverModal] = useState<{ open: boolean; vehicleId: number | null }>({ open: false, vehicleId: null })
  const [assignRouteModal, setAssignRouteModal] = useState<{ open: boolean; vehicleId: number | null }>({ open: false, vehicleId: null })
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null)
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null)
  const [assigningDriver, setAssigningDriver] = useState(false)
  const [assigningRoute, setAssigningRoute] = useState(false)
  const [selectedRouteMapId, setSelectedRouteMapId] = useState<number | null>(null)
  const [selectedDriverMapId, setSelectedDriverMapId] = useState<number | null>(null)
  const [updatingLocationId, setUpdatingLocationId] = useState<number | null>(null)
  const [dailyReportSubmitting, setDailyReportSubmitting] = useState(false)
  const [dailyReportForm, setDailyReportForm] = useState({
    report_date: new Date().toISOString().substring(0, 10),
    total_waste_kg: "",
    waste_organic_kg: "",
    waste_plastic_kg: "",
    waste_paper_kg: "",
    waste_metal_kg: "",
    waste_electronic_kg: "",
    waste_hazardous_kg: "",
    service_requests_completed: "",
    areas_covered: "",
    trucks_used: "",
    distance_traveled_km: "",
    missed_pickups: "",
    disposal_site: "",
    recycled_kg: "",
    disposed_kg: "",
    safety_incidents: "",
  })
  const [dailyReportPhoto, setDailyReportPhoto] = useState<File | null>(null)

  useEffect(() => {
    const normalize = (res: any) => (Array.isArray(res) ? res : res?.results ?? [])

    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const [statsRes, vehicleRes, driverRes, routeRes, requestRes, dailyRes, notifRes] = await Promise.all([
          authorizedGet<{ fleet_size: number; employee_count: number }>("/company/dashboard/"),
          authorizedGet<any>("/fleet/vehicles/"),
          authorizedGet<any>("/fleet/drivers/"),
          authorizedGet<any>("/routes/"),
          authorizedGet<any>("/collections/company/requests/"),
          authorizedGet<any>("/reports/daily/"),
          authorizedGet<any>("/notifications/"),
        ])

        setCompanyStats(statsRes)
        setVehicles(normalize(vehicleRes))
        setDrivers(normalize(driverRes))
        setRoutes(normalize(routeRes).map((r: any) => ({
          ...r,
          progress: r.total_stops ? Math.round(((r.completed_stops ?? 0) / r.total_stops) * 100) : 0,
        })))
        setRequests(normalize(requestRes))
        setDailyReports(normalize(dailyRes))
        setNotifications(normalize(notifRes))
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load data"
        setError(message)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const reload = async () => {
    const normalize = (res: any) => (Array.isArray(res) ? res : res?.results ?? [])
    const [vehicleRes, driverRes, routeRes, dailyRes, notifRes] = await Promise.all([
      authorizedGet<any>("/fleet/vehicles/"),
      authorizedGet<any>("/fleet/drivers/"),
      authorizedGet<any>("/routes/"),
      authorizedGet<any>("/reports/daily/"),
      authorizedGet<any>("/notifications/"),
    ])
    setVehicles(normalize(vehicleRes))
    setDrivers(normalize(driverRes))
    setRoutes(normalize(routeRes).map((r: any) => ({
      ...r,
      progress: r.total_stops ? Math.round(((r.completed_stops ?? 0) / r.total_stops) * 100) : 0,
    })))
    setDailyReports(normalize(dailyRes))
    setNotifications(normalize(notifRes))
  }

  const randomizeLocation = () => {
    const baseLat = 8.9806
    const baseLng = 38.7578
    const jitter = () => (Math.random() - 0.5) * 0.04
    return { lat: baseLat + jitter(), lng: baseLng + jitter() }
  }

  const updateVehicleLocation = async (vehicleId: number) => {
    setUpdatingLocationId(vehicleId)
    setError(null)
    try {
      const { lat, lng } = randomizeLocation()
      await authorizedPut(`/fleet/vehicles/${vehicleId}/location/`, {
        last_location_lat: lat,
        last_location_lng: lng,
      })
      await reload()
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to update location"
      setError(msg)
    } finally {
      setUpdatingLocationId(null)
    }
  }

  const updateDriverLocation = async (driver: any) => {
    const vehicleId = typeof driver.assigned_vehicle === "number"
      ? driver.assigned_vehicle
      : vehicles.find((v) => v.plate_number === driver.assigned_vehicle)?.id

    if (!vehicleId) {
      setError("Assign a vehicle to this driver first.")
      return
    }
    await updateVehicleLocation(vehicleId)
  }

  const handleSubmitDailyReport = async () => {
    setDailyReportSubmitting(true)
    setError(null)
    try {
      const formData = new FormData()
      Object.entries(dailyReportForm).forEach(([key, value]) => {
        if (value !== "") {
          formData.append(key, String(value))
        }
      })
      if (dailyReportPhoto) {
        formData.append("photo_evidence", dailyReportPhoto)
      }
      await authorizedPostForm("/reports/daily/", formData)
      await reload()
      setDailyReportForm({
        report_date: new Date().toISOString().substring(0, 10),
        total_waste_kg: "",
        waste_organic_kg: "",
        waste_plastic_kg: "",
        waste_paper_kg: "",
        waste_metal_kg: "",
        waste_electronic_kg: "",
        waste_hazardous_kg: "",
        service_requests_completed: "",
        areas_covered: "",
        trucks_used: "",
        distance_traveled_km: "",
        missed_pickups: "",
        disposal_site: "",
        recycled_kg: "",
        disposed_kg: "",
        safety_incidents: "",
      })
      setDailyReportPhoto(null)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to submit daily report"
      setError(msg)
    } finally {
      setDailyReportSubmitting(false)
    }
  }

  const downloadDailyReportPdf = (report: any) => {
    const doc = new jsPDF()
    doc.setFontSize(16)
    doc.text("Daily Waste Report", 14, 16)
    doc.setFontSize(10)
    const lines = [
      `Date: ${report.report_date}`,
      `Total Waste (kg): ${report.total_waste_kg}`,
      `Organic: ${report.waste_organic_kg} kg`,
      `Plastic: ${report.waste_plastic_kg} kg`,
      `Paper: ${report.waste_paper_kg} kg`,
      `Metal: ${report.waste_metal_kg} kg`,
      `Electronic: ${report.waste_electronic_kg} kg`,
      `Hazardous: ${report.waste_hazardous_kg} kg`,
      `Requests Completed: ${report.service_requests_completed}`,
      `Areas Covered: ${report.areas_covered}`,
      `Trucks Used: ${report.trucks_used}`,
      `Distance Traveled (km): ${report.distance_traveled_km}`,
      `Missed Pickups: ${report.missed_pickups}`,
      `Disposal Site: ${report.disposal_site}`,
      `Recycled (kg): ${report.recycled_kg}`,
      `Disposed (kg): ${report.disposed_kg}`,
      `Safety Incidents: ${report.safety_incidents || "None"}`,
      `Status: ${report.status}`,
    ]
    let y = 28
    lines.forEach((line) => {
      doc.text(line, 14, y)
      y += 6
    })
    doc.save(`daily-report-${report.id}.pdf`)
  }

  const handleAddVehicle = async () => {
    try {
      setError(null)
      await authorizedPost("/fleet/vehicles/", {
        plate_number: vehicleForm.plate_number,
        vehicle_type: vehicleForm.vehicle_type,
        capacity_kg: Number(vehicleForm.capacity_kg) || 0,
        current_status: "active",
      })
      setShowVehicleModal(false)
      setVehicleForm({ plate_number: "", vehicle_type: "compactor", capacity_kg: "" })
      await reload()
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to add vehicle"
      setError(msg)
    }
  }

  const handleAddDriver = async () => {
    try {
      setError(null)
      await authorizedPost("/fleet/drivers/", {
        full_name: driverForm.full_name,
        email: driverForm.email,
        phone: driverForm.phone,
        license_number: driverForm.license_number,
        license_expiry: driverForm.license_expiry,
        assigned_vehicle: driverForm.assigned_vehicle || null,
        current_status: "on_duty",
      })
      setShowDriverModal(false)
      setDriverForm({ full_name: "", email: "", phone: "", license_number: "", license_expiry: "", assigned_vehicle: "" })
      await reload()
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to add driver"
      setError(msg)
    }
  }

  const handleAssignDriverToVehicle = async () => {
    if (!assignDriverModal.vehicleId || !selectedDriverId) return
    setAssigningDriver(true)
    setError(null)
    try {
      await authorizedPost(`/fleet/drivers/${selectedDriverId}/assign/`, {
        vehicle_id: assignDriverModal.vehicleId,
      })
      setAssignDriverModal({ open: false, vehicleId: null })
      setSelectedDriverId(null)
      await reload()
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to assign driver"
      setError(msg)
    } finally {
      setAssigningDriver(false)
    }
  }

  const handleAssignRouteToVehicle = async () => {
    if (!assignRouteModal.vehicleId || !selectedRouteId) return
    setAssigningRoute(true)
    setError(null)
    try {
      await authorizedPut(`/routes/${selectedRouteId}/`, {
        assigned_vehicle: assignRouteModal.vehicleId,
      })
      setAssignRouteModal({ open: false, vehicleId: null })
      setSelectedRouteId(null)
      await reload()
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to assign route"
      setError(msg)
    } finally {
      setAssigningRoute(false)
    }
  }

  const menuItems = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "vehicles", label: "Fleet Management", icon: Truck },
    { id: "drivers", label: "Drivers", icon: Users },
    { id: "routes", label: "Routes", icon: Navigation },
    { id: "requests", label: "Collection Requests", icon: Package },
    { id: "reports", label: "Reports", icon: FileText },
    { id: "settings", label: "Settings", icon: Settings },
  ]

  const stats = useMemo(() => {
    const activeVehicles = vehicles.filter((v) => v.current_status === "active").length
    const onDutyDrivers = drivers.filter((d) => d.current_status === "on_duty").length
    const pendingRequests = requests.filter((r) => r.status === "pending").length
    return [
      { title: "Active Vehicles", value: `${activeVehicles}`, icon: Truck },
      { title: "Drivers On Duty", value: `${onDutyDrivers}`, icon: Users },
      { title: "Total Requests", value: `${requests.length}`, icon: Package },
      { title: "Pending Requests", value: `${pendingRequests}`, icon: Clock },
    ]
  }, [vehicles, drivers, requests])

  const activeRoutes = useMemo(() => routes.filter((r) => r.status === "in_progress"), [routes])
  const selectedRoute = useMemo(() => routes.find((r) => r.id === selectedRouteMapId) ?? routes[0], [routes, selectedRouteMapId])
  const routeStops = useMemo(() => (selectedRoute?.stops ?? []).map((stop: any, index: number) => ({
    id: `stop-${stop.id ?? index}`,
    position: { lat: Number(stop.latitude), lng: Number(stop.longitude) },
    label: String(stop.sequence_number ?? index + 1),
    title: stop.address,
  })), [selectedRoute])
  const routePath = useMemo(() => routeStops.map((stop: any) => stop.position), [routeStops])

  const vehicleMarkers = useMemo<MapMarker[]>(() => {
    return vehicles
      .filter((v) => typeof v.last_location_lat === "number" && typeof v.last_location_lng === "number")
      .map((v) => ({
        id: v.id,
        position: { lat: Number(v.last_location_lat), lng: Number(v.last_location_lng) },
        title: v.plate_number,
      }))
  }, [vehicles])

  const driverMapMarkers = useMemo<MapMarker[]>(() => {
    const selectedDriver = drivers.find((d) => d.id === selectedDriverMapId)
    if (selectedDriver?.assigned_vehicle) {
      const assignedVehicle = vehicles.find((v) => v.id === selectedDriver.assigned_vehicle || v.plate_number === selectedDriver.assigned_vehicle)
      if (assignedVehicle?.last_location_lat && assignedVehicle?.last_location_lng) {
        return [{
          id: `driver-${selectedDriver.id}`,
          position: { lat: Number(assignedVehicle.last_location_lat), lng: Number(assignedVehicle.last_location_lng) },
          title: selectedDriver.full_name || "Driver",
        }]
      }
    }
    return vehicleMarkers
  }, [drivers, selectedDriverMapId, vehicles, vehicleMarkers])
  const pendingRequestsList = useMemo(() => requests.filter((r) => r.status === "pending"), [requests])

  const dailySummary = useMemo(() => {
    const completedCollections = requests.filter((r) => r.status === "completed").length
    const totalVolume = requests.reduce((acc, r) => acc + (Number(r.quantity_bags) || 0), 0)
    const routesCompleted = routes.filter((r) => r.status === "completed").length
    const activeVehicles = vehicles.filter((v) => v.current_status === "active").length
    const pendingRequests = requests.filter((r) => r.status === "pending").length
    return {
      Date: new Date().toLocaleDateString(),
      TotalCollections: completedCollections,
      TotalVolume: totalVolume,
      RoutesCompleted: routesCompleted,
      ActiveVehicles: activeVehicles,
      PendingRequests: pendingRequests,
    }
  }, [requests, routes, vehicles])

  const fleetReport = useMemo(() => {
    return vehicles.map((v) => {
      const trips = routes.filter((r) => r.assigned_vehicle === v.id).length
      const volume = Number(v.total_volume || 0)
      return {
        VehicleID: v.id,
        Plate: v.plate_number,
        Type: v.vehicle_type,
        Status: v.current_status,
        TotalTrips: trips,
        TotalVolume: volume,
      }
    })
  }, [vehicles, routes])

  const driverReport = useMemo(() => {
    return drivers.map((d) => {
      const trips = Number(d.total_collections || d.total_trips || 0)
      const totalVolume = Number(d.total_volume || 0)
      const avgVolume = trips ? Number((totalVolume / trips).toFixed(1)) : 0
      return {
        DriverID: d.id,
        Name: d.full_name || "Driver",
        AssignedVehicle: d.assigned_vehicle || "Unassigned",
        TotalTrips: trips,
        TotalVolume: totalVolume,
        AvgVolumePerTrip: avgVolume,
        HoursWorked: Number(d.hours_worked || d.shift_hours || 0),
      }
    })
  }, [drivers])

  const routeReport = useMemo(() => {
    return routes.map((r) => {
      const completed = Number(r.completed_stops || 0)
      const total = Number(r.total_stops || 0)
      const pending = Math.max(total - completed, 0)
      const completionRate = total ? Math.round((completed / total) * 100) : 0
      return {
        RouteID: r.id,
        Name: r.name,
        TotalStops: total,
        CompletedStops: completed,
        PendingStops: pending,
        TotalVolume: Number(r.total_volume || 0),
        CompletionRate: `${completionRate}%`,
      }
    })
  }, [routes])

  const reportConfig = useMemo(() => {
    return {
      daily: {
        title: "Daily Summary",
        description: "Today’s operations overview",
        rows: [dailySummary],
      },
      fleet: {
        title: "Fleet Report",
        description: "Vehicle performance",
        rows: fleetReport,
      },
      driver: {
        title: "Driver Report",
        description: "Driver productivity",
        rows: driverReport,
      },
      route: {
        title: "Route Analysis",
        description: "Route efficiency",
        rows: routeReport,
      },
    } as const
  }, [dailySummary, fleetReport, driverReport, routeReport])

  const exportCSV = (rows: Record<string, any>[], filename: string) => {
    if (!rows.length) return
    const headers = Object.keys(rows[0])
    const csv = [headers.join(","), ...rows.map((row) => headers.map((h) => JSON.stringify(row[h] ?? "")).join(","))].join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
  }

  const exportPDF = (title: string, rows: Record<string, any>[]) => {
    const headers = Object.keys(rows[0] || {})
    const content = `Report: ${title}\n\n` + headers.join("\t") + "\n" + rows.map((row) => headers.map((h) => row[h]).join("\t")).join("\n")
    const win = window.open("", "_blank")
    if (!win) return
    win.document.write(`<pre>${content}</pre>`)
    win.document.close()
    win.print()
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-muted-foreground">
        Loading company data...
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Unable to load data</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      <DashboardSidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        menuItems={menuItems}
        activeItem={activeTab}
        onItemClick={setActiveTab}
        userRole="Waste Company"
        userName={user.name}
        onLogout={onLogout}
      />

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Top Header */}
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-background px-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-semibold text-foreground">
                {menuItems.find(item => item.id === activeTab)?.label || "Dashboard"}
              </h1>
              <p className="text-sm text-muted-foreground">Green Clean Services</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 pl-9"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  {notifications.filter((n) => !n.is_read).length > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs text-destructive-foreground">
                      {notifications.filter((n) => !n.is_read).length}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {notifications.length === 0 ? (
                  <DropdownMenuItem className="text-sm text-muted-foreground">
                    No notifications yet.
                  </DropdownMenuItem>
                ) : (
                  notifications.map((notification) => (
                    <DropdownMenuItem key={notification.id} className="flex flex-col items-start gap-1 py-3">
                      <div className="flex w-full items-center justify-between">
                        <span className={`font-medium ${!notification.is_read ? "text-foreground" : "text-muted-foreground"}`}>
                          {notification.title || notification.type || "Notification"}
                        </span>
                        {!notification.is_read && <span className="h-2 w-2 rounded-full bg-primary" />}
                      </div>
                      <span className="text-sm text-muted-foreground">{notification.message || notification.content || ""}</span>
                      <span className="text-xs text-muted-foreground">{notification.created_at}</span>
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {user.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden md:inline">{user.name}</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onLogout} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        {/* Modals */}
        {/* Assign Driver Modal */}
        <Dialog open={assignDriverModal.open} onOpenChange={(open) => setAssignDriverModal({ open, vehicleId: open ? assignDriverModal.vehicleId : null })}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Assign Driver</DialogTitle>
              <DialogDescription>Select a driver to assign to this vehicle.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <Label>Driver</Label>
              <Select value={selectedDriverId ?? ""} onValueChange={setSelectedDriverId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose driver" />
                </SelectTrigger>
                <SelectContent>
                  {drivers.map((d) => (
                    <SelectItem key={d.id} value={String(d.id)}>
                      {d.full_name || d.id} {d.assigned_vehicle ? `(Vehicle ${d.assigned_vehicle})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAssignDriverModal({ open: false, vehicleId: null })}>Cancel</Button>
              <Button onClick={handleAssignDriverToVehicle} disabled={assigningDriver || !selectedDriverId}>
                {assigningDriver ? "Assigning..." : "Assign"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Assign Route Modal */}
        <Dialog open={assignRouteModal.open} onOpenChange={(open) => setAssignRouteModal({ open, vehicleId: open ? assignRouteModal.vehicleId : null })}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Assign Route</DialogTitle>
              <DialogDescription>Bind a route to this vehicle.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <Label>Route</Label>
              <Select value={selectedRouteId ?? ""} onValueChange={setSelectedRouteId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose route" />
                </SelectTrigger>
                <SelectContent>
                  {routes.map((r) => (
                    <SelectItem key={r.id} value={String(r.id)}>
                      {r.name} ({r.status})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAssignRouteModal({ open: false, vehicleId: null })}>Cancel</Button>
              <Button onClick={handleAssignRouteToVehicle} disabled={assigningRoute || !selectedRouteId}>
                {assigningRoute ? "Assigning..." : "Assign"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dashboard Content */}
        <div className="p-6">
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => (
                  <Card key={stat.title}>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        {stat.title}
                      </CardTitle>
                      <stat.icon className="h-5 w-5 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{stat.value}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Active Routes & Recent Activity */}
              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Active Routes</CardTitle>
                    <CardDescription>Currently running collection routes</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {activeRoutes.map((route) => (
                        <div key={route.id} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                                <Navigation className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium">{route.name}</p>
                                <p className="text-sm text-muted-foreground">{route.assigned_driver || "Unassigned"} - {route.assigned_vehicle || "No vehicle"}</p>
                              </div>
                            </div>
                            <span className="text-sm font-medium">{route.progress ?? 0}%</span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-secondary">
                            <div 
                              className="h-2 rounded-full bg-primary"
                              style={{ width: `${route.progress ?? 0}%` }}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground">{route.completed_stops ?? 0}/{route.total_stops ?? 0} stops completed</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Pending Requests</CardTitle>
                    <CardDescription>Collection requests awaiting assignment</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {pendingRequestsList.map((request) => (
                        <div key={request.id} className="flex items-center justify-between rounded-lg border p-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                              <Package className="h-5 w-5 text-warning" />
                            </div>
                            <div>
                              <p className="font-medium">{request.resident_name || request.resident || "Resident"}</p>
                              <p className="text-sm text-muted-foreground">{request.address}</p>
                            </div>
                          </div>
                          <Button size="sm" onClick={() => setShowAssignModal(true)}>
                            Assign
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Vehicle Status Overview */}
              <Card>
                <CardHeader>
                  <CardTitle>Fleet Status</CardTitle>
                  <CardDescription>Real-time status of all vehicles</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                    {vehicles.map((vehicle) => (
                      <div key={vehicle.id} className="rounded-lg border p-4">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant={
                            vehicle.current_status === "active" ? "default" : 
                            vehicle.current_status === "maintenance" ? "secondary" : "outline"
                          }>
                            {vehicle.current_status || "unknown"}
                          </Badge>
                          <Truck className={`h-5 w-5 ${
                            vehicle.current_status === "active" ? "text-primary" : "text-muted-foreground"
                          }`} />
                        </div>
                        <p className="font-medium">{vehicle.plate_number}</p>
                        <p className="text-sm text-muted-foreground">{vehicle.vehicle_type}</p>
                        <p className="text-xs text-muted-foreground">
                          Capacity: {vehicle.capacity_kg} kg
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "vehicles" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Search vehicles..." className="pl-9" />
                </div>
                <Button onClick={() => setShowVehicleModal(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Vehicle
                </Button>
              </div>

              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Vehicle</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Capacity</TableHead>
                        <TableHead>Driver</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Last Update</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {vehicles.map((vehicle) => (
                        <TableRow key={vehicle.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                                vehicle.current_status === "active" ? "bg-primary/10" : "bg-muted"
                              }`}>
                                <Truck className={`h-5 w-5 ${
                                  vehicle.current_status === "active" ? "text-primary" : "text-muted-foreground"
                                }`} />
                              </div>
                              <div>
                                <p className="font-medium">{vehicle.plate_number}</p>
                                <p className="text-sm text-muted-foreground">{vehicle.id}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{vehicle.vehicle_type}</TableCell>
                          <TableCell>{vehicle.capacity_kg} kg</TableCell>
                          <TableCell>{vehicle.assigned_driver || <span className="text-muted-foreground">Unassigned</span>}</TableCell>
                          <TableCell className="text-muted-foreground">—</TableCell>
                          <TableCell>
                            <Badge variant={
                              vehicle.current_status === "active" ? "default" : 
                              vehicle.current_status === "maintenance" ? "secondary" : "outline"
                            }>
                              {vehicle.current_status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{vehicle.last_location_update || ""}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setSelectedDriverMapId(null)}>
                                  <MapPin className="mr-2 h-4 w-4" />
                                  Track Location
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => updateVehicleLocation(vehicle.id)}>
                                  <Navigation className="mr-2 h-4 w-4" />
                                  {updatingLocationId === vehicle.id ? "Updating..." : "Update Location"}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setAssignDriverModal({ open: true, vehicleId: vehicle.id })}>
                                  <Users className="mr-2 h-4 w-4" />
                                  Assign Driver
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setAssignRouteModal({ open: true, vehicleId: vehicle.id })}>
                                  <Navigation className="mr-2 h-4 w-4" />
                                  Assign Route
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>
                                  <Settings className="mr-2 h-4 w-4" />
                                  Edit Details
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "drivers" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Search drivers..." className="pl-9" />
                </div>
                <Button onClick={() => setShowDriverModal(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Driver
                </Button>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Driver & Vehicle Tracking</CardTitle>
                  <CardDescription>Live map of assigned vehicles and driver positions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant={selectedDriverMapId ? "outline" : "default"}
                      onClick={() => setSelectedDriverMapId(null)}
                    >
                      All Vehicles
                    </Button>
                    {drivers.map((driver) => (
                      <Button
                        key={driver.id}
                        size="sm"
                        variant={selectedDriverMapId === driver.id ? "default" : "outline"}
                        onClick={() => setSelectedDriverMapId(driver.id)}
                      >
                        {driver.full_name || `Driver ${driver.id}`}
                      </Button>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {drivers.map((driver) => (
                      <Button
                        key={`update-${driver.id}`}
                        size="sm"
                        variant="outline"
                        onClick={() => updateDriverLocation(driver)}
                        disabled={updatingLocationId !== null}
                      >
                        Update {driver.full_name || `Driver ${driver.id}`} Location
                      </Button>
                    ))}
                  </div>
                  <GoogleMapView
                    markers={driverMapMarkers}
                    zoom={12}
                    height="320px"
                  />
                  {driverMapMarkers.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      No live vehicle locations available yet.
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Driver</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>License</TableHead>
                        <TableHead>Assigned Vehicle</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Completed Today</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {drivers.map((driver) => (
                        <TableRow key={driver.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarFallback className="bg-primary/10 text-primary">
                                  {(driver.full_name || "").split(" ").map((n: string) => n[0]).join("") || "DR"}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{driver.full_name || driver.id}</p>
                                <p className="text-sm text-muted-foreground">{driver.id}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{driver.user}</TableCell>
                          <TableCell>{driver.license_number}</TableCell>
                          <TableCell>
                            {driver.assigned_vehicle ? (
                              <Badge variant="outline">{driver.assigned_vehicle}</Badge>
                            ) : (
                              <span className="text-muted-foreground">Unassigned</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={driver.current_status === "on_duty" ? "default" : "secondary"}>
                              {driver.current_status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              {driver.total_collections ?? 0} pickups
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Truck className="mr-2 h-4 w-4" />
                                  Assign Vehicle
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => updateDriverLocation(driver)}>
                                  <MapPin className="mr-2 h-4 w-4" />
                                  {updatingLocationId ? "Updating..." : "Update Location"}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setAssignRouteModal({ open: true, vehicleId: driver.assigned_vehicle || null })}>
                                  <Navigation className="mr-2 h-4 w-4" />
                                  Assign Route
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>
                                  <Settings className="mr-2 h-4 w-4" />
                                  Edit Profile
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "routes" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <Tabs defaultValue="all" className="w-auto">
                  <TabsList>
                    <TabsTrigger value="all">All Routes</TabsTrigger>
                    <TabsTrigger value="active">In Progress</TabsTrigger>
                    <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
                    <TabsTrigger value="completed">Completed</TabsTrigger>
                  </TabsList>
                </Tabs>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Route
                </Button>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Route Map</CardTitle>
                  <CardDescription>Stops and path for the selected route</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {routes.map((route) => (
                      <Button
                        key={route.id}
                        size="sm"
                        variant={selectedRoute?.id === route.id ? "default" : "outline"}
                        onClick={() => setSelectedRouteMapId(route.id)}
                      >
                        {route.name}
                      </Button>
                    ))}
                  </div>
                  <GoogleMapView
                    markers={routeStops}
                    path={routePath}
                    zoom={12}
                    height="360px"
                  />
                  {routeStops.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      No stops available for the selected route.
                    </p>
                  )}
                </CardContent>
              </Card>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {routes.map((route) => (
                  <Card key={route.id} onClick={() => setSelectedRouteMapId(route.id)} className="cursor-pointer">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{route.name}</CardTitle>
                        <Badge variant={
                          route.status === "in_progress" ? "default" : 
                          route.status === "completed" ? "secondary" : "outline"
                        }>
                          {route.status?.replace("_", " ")}
                        </Badge>
                      </div>
                      <CardDescription>{route.zone || ""} Zone - {route.total_stops ?? 0} stops</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {route.status !== "scheduled" && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Progress</span>
                            <span className="font-medium">{route.progress ?? 0}%</span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-secondary">
                            <div 
                              className={`h-2 rounded-full ${route.status === "completed" ? "bg-green-600" : "bg-primary"}`}
                              style={{ width: `${route.progress ?? 0}%` }}
                            />
                          </div>
                        </div>
                      )}
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Truck className="h-4 w-4 text-muted-foreground" />
                          <span>{route.assigned_vehicle || "No vehicle assigned"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{route.assigned_driver || "No driver assigned"}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {route.status === "scheduled" && (
                          <Button size="sm" className="flex-1">
                            <Play className="mr-1 h-4 w-4" />
                            Start
                          </Button>
                        )}
                        {route.status === "in_progress" && (
                          <>
                            <Button size="sm" variant="outline" className="flex-1 bg-transparent">
                              <Pause className="mr-1 h-4 w-4" />
                              Pause
                            </Button>
                            <Button size="sm" className="flex-1">
                              <CheckCircle className="mr-1 h-4 w-4" />
                              Complete
                            </Button>
                          </>
                        )}
                        {route.status === "completed" && (
                          <Button size="sm" variant="outline" className="flex-1 bg-transparent">
                            <RotateCcw className="mr-1 h-4 w-4" />
                            Restart
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {activeTab === "requests" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <Tabs defaultValue="all" className="w-auto">
                  <TabsList>
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="pending">Pending</TabsTrigger>
                    <TabsTrigger value="assigned">Assigned</TabsTrigger>
                    <TabsTrigger value="completed">Completed</TabsTrigger>
                  </TabsList>
                </Tabs>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Search requests..." className="pl-9" />
                </div>
              </div>

              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Request ID</TableHead>
                        <TableHead>Resident</TableHead>
                        <TableHead>Address</TableHead>
                        <TableHead>Waste Type</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Preferred Time</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {requests.map((request) => (
                        <TableRow key={request.id}>
                          <TableCell className="font-medium">{request.id}</TableCell>
                          <TableCell>{request.resident_name || request.resident || "Resident"}</TableCell>
                          <TableCell>{request.address}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{request.waste_type}</Badge>
                          </TableCell>
                          <TableCell>{request.quantity_bags}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              {request.preferred_time}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={
                              request.status === "pending" ? "secondary" : 
                              request.status === "assigned" ? "default" : "outline"
                            }>
                              {request.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setShowAssignModal(true)}>
                                  <Truck className="mr-2 h-4 w-4" />
                                  Assign to Route
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <FileText className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-green-600">
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Mark Complete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "reports" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Daily Waste Report Submission</CardTitle>
                  <CardDescription>Submit today’s operational summary for supervisor review</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label>Report Date</Label>
                      <Input
                        type="date"
                        value={dailyReportForm.report_date}
                        onChange={(e) => setDailyReportForm({ ...dailyReportForm, report_date: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Total Waste (kg)</Label>
                      <Input
                        type="number"
                        value={dailyReportForm.total_waste_kg}
                        onChange={(e) => setDailyReportForm({ ...dailyReportForm, total_waste_kg: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Requests Completed</Label>
                      <Input
                        type="number"
                        value={dailyReportForm.service_requests_completed}
                        onChange={(e) => setDailyReportForm({ ...dailyReportForm, service_requests_completed: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label>Organic (kg)</Label>
                      <Input
                        type="number"
                        value={dailyReportForm.waste_organic_kg}
                        onChange={(e) => setDailyReportForm({ ...dailyReportForm, waste_organic_kg: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Plastic (kg)</Label>
                      <Input
                        type="number"
                        value={dailyReportForm.waste_plastic_kg}
                        onChange={(e) => setDailyReportForm({ ...dailyReportForm, waste_plastic_kg: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Paper (kg)</Label>
                      <Input
                        type="number"
                        value={dailyReportForm.waste_paper_kg}
                        onChange={(e) => setDailyReportForm({ ...dailyReportForm, waste_paper_kg: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label>Metal (kg)</Label>
                      <Input
                        type="number"
                        value={dailyReportForm.waste_metal_kg}
                        onChange={(e) => setDailyReportForm({ ...dailyReportForm, waste_metal_kg: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Electronic (kg)</Label>
                      <Input
                        type="number"
                        value={dailyReportForm.waste_electronic_kg}
                        onChange={(e) => setDailyReportForm({ ...dailyReportForm, waste_electronic_kg: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Hazardous (kg)</Label>
                      <Input
                        type="number"
                        value={dailyReportForm.waste_hazardous_kg}
                        onChange={(e) => setDailyReportForm({ ...dailyReportForm, waste_hazardous_kg: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label>Areas Covered</Label>
                      <Input
                        value={dailyReportForm.areas_covered}
                        onChange={(e) => setDailyReportForm({ ...dailyReportForm, areas_covered: e.target.value })}
                        placeholder="Bole, Yeka, Kirkos"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Trucks Used</Label>
                      <Input
                        type="number"
                        value={dailyReportForm.trucks_used}
                        onChange={(e) => setDailyReportForm({ ...dailyReportForm, trucks_used: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Distance Traveled (km)</Label>
                      <Input
                        type="number"
                        value={dailyReportForm.distance_traveled_km}
                        onChange={(e) => setDailyReportForm({ ...dailyReportForm, distance_traveled_km: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label>Missed Pickups</Label>
                      <Input
                        type="number"
                        value={dailyReportForm.missed_pickups}
                        onChange={(e) => setDailyReportForm({ ...dailyReportForm, missed_pickups: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Disposal Site</Label>
                      <Input
                        value={dailyReportForm.disposal_site}
                        onChange={(e) => setDailyReportForm({ ...dailyReportForm, disposal_site: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Safety Incidents</Label>
                      <Input
                        value={dailyReportForm.safety_incidents}
                        onChange={(e) => setDailyReportForm({ ...dailyReportForm, safety_incidents: e.target.value })}
                        placeholder="None"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label>Recycled (kg)</Label>
                      <Input
                        type="number"
                        value={dailyReportForm.recycled_kg}
                        onChange={(e) => setDailyReportForm({ ...dailyReportForm, recycled_kg: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Disposed (kg)</Label>
                      <Input
                        type="number"
                        value={dailyReportForm.disposed_kg}
                        onChange={(e) => setDailyReportForm({ ...dailyReportForm, disposed_kg: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Photo Evidence (optional)</Label>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setDailyReportPhoto(e.target.files?.[0] ?? null)}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={handleSubmitDailyReport} disabled={dailyReportSubmitting}>
                      {dailyReportSubmitting ? "Submitting..." : "Submit Daily Report"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Submitted Daily Reports</CardTitle>
                  <CardDescription>Track supervisor approvals</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Total Waste (kg)</TableHead>
                        <TableHead>Requests Completed</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Export</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dailyReports.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                            No daily reports submitted yet.
                          </TableCell>
                        </TableRow>
                      ) : (
                        dailyReports.map((report) => (
                          <TableRow key={report.id}>
                            <TableCell>{report.report_date}</TableCell>
                            <TableCell>{report.total_waste_kg}</TableCell>
                            <TableCell>{report.service_requests_completed}</TableCell>
                            <TableCell>
                              <Badge variant={report.status === "approved" ? "default" : report.status === "rejected" ? "destructive" : "secondary"}>
                                {report.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button size="sm" variant="outline" onClick={() => downloadDailyReportPdf(report)}>
                                Export PDF
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[{
                  id: "daily" as const,
                  title: "Daily Summary",
                  description: "Today’s operations",
                  icon: BarChart3,
                }, {
                  id: "fleet" as const,
                  title: "Fleet Report",
                  description: "Vehicle performance",
                  icon: Truck,
                }, {
                  id: "driver" as const,
                  title: "Driver Report",
                  description: "Driver productivity",
                  icon: Users,
                }, {
                  id: "route" as const,
                  title: "Route Analysis",
                  description: "Route efficiency",
                  icon: Navigation,
                }].map((report) => (
                  <Card
                    key={report.id}
                    className={`cursor-pointer transition-colors ${selectedReport === report.id ? "border-primary shadow-sm" : "hover:border-primary"}`}
                    onClick={() => setSelectedReport(report.id)}
                  >
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                          <report.icon className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{report.title}</CardTitle>
                          <CardDescription>{report.description}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>

              <Card>
                <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle>{reportConfig[selectedReport].title}</CardTitle>
                    <CardDescription>{reportConfig[selectedReport].description}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportCSV(reportConfig[selectedReport].rows as Record<string, any>[], `${reportConfig[selectedReport].title}.csv`)}
                      disabled={!reportConfig[selectedReport].rows.length}
                    >
                      Export CSV
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => reportConfig[selectedReport].rows.length && exportPDF(reportConfig[selectedReport].title, reportConfig[selectedReport].rows as Record<string, any>[])}
                      disabled={!reportConfig[selectedReport].rows.length}
                    >
                      Export PDF
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {reportConfig[selectedReport].rows.length ? (
                    <div className="overflow-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            {Object.keys(reportConfig[selectedReport].rows[0] as Record<string, any>).map((col) => (
                              <TableHead key={col}>{col.replace(/([A-Z])/g, " $1").trim()}</TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {reportConfig[selectedReport].rows.map((row, idx) => (
                            <TableRow key={idx}>
                              {Object.keys(row as Record<string, any>).map((col) => (
                                <TableCell key={col}>{(row as Record<string, any>)[col]}</TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No data available for this report.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "settings" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Company Settings</CardTitle>
                  <CardDescription>Manage your company profile and preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Company Name</Label>
                    <Input defaultValue="Green Clean Services" />
                  </div>
                  <div className="space-y-2">
                    <Label>Contact Email</Label>
                    <Input type="email" defaultValue="info@greenclean.et" />
                  </div>
                  <div className="space-y-2">
                    <Label>Contact Phone</Label>
                    <Input defaultValue="+251 11 234 5678" />
                  </div>
                  <Button>Save Changes</Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>

      {/* Add Vehicle Modal */}
      <Dialog open={showVehicleModal} onOpenChange={setShowVehicleModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Vehicle</DialogTitle>
            <DialogDescription>Register a new vehicle to your fleet</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Plate Number</Label>
              <Input
                placeholder="e.g., AA-12345"
                value={vehicleForm.plate_number}
                onChange={(e) => setVehicleForm({ ...vehicleForm, plate_number: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Vehicle Type</Label>
              <Select
                value={vehicleForm.vehicle_type}
                onValueChange={(value) => setVehicleForm({ ...vehicleForm, vehicle_type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="compactor">Compactor Truck</SelectItem>
                  <SelectItem value="rear_loader">Rear Loader</SelectItem>
                  <SelectItem value="side_loader">Side Loader</SelectItem>
                  <SelectItem value="roll_off">Roll-off Truck</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Capacity</Label>
              <Input
                placeholder="e.g., 8000"
                value={vehicleForm.capacity_kg}
                onChange={(e) => setVehicleForm({ ...vehicleForm, capacity_kg: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowVehicleModal(false)}>Cancel</Button>
            <Button onClick={handleAddVehicle}>Add Vehicle</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Driver Modal */}
      <Dialog open={showDriverModal} onOpenChange={setShowDriverModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Driver</DialogTitle>
            <DialogDescription>Register a new driver to your team</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input
                placeholder="Enter driver's name"
                value={driverForm.full_name}
                onChange={(e) => setDriverForm({ ...driverForm, full_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input
                placeholder="+251 9XX XXX XXXX"
                value={driverForm.phone}
                onChange={(e) => setDriverForm({ ...driverForm, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>License Number</Label>
              <Input
                placeholder="Enter license number"
                value={driverForm.license_number}
                onChange={(e) => setDriverForm({ ...driverForm, license_number: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>License Expiry</Label>
              <Input
                type="date"
                value={driverForm.license_expiry}
                onChange={(e) => setDriverForm({ ...driverForm, license_expiry: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Assign Vehicle (Optional)</Label>
              <Select
                value={driverForm.assigned_vehicle}
                onValueChange={(value) => setDriverForm({ ...driverForm, assigned_vehicle: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select vehicle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No vehicle</SelectItem>
                  {vehicles
                    .filter((v) => !v.assigned_driver)
                    .map((v) => (
                      <SelectItem key={v.id} value={String(v.id)}>
                        {v.plate_number || v.plateNumber || v.id}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDriverModal(false)}>Cancel</Button>
            <Button onClick={handleAddDriver}>Add Driver</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Request Modal */}
      <Dialog open={showAssignModal} onOpenChange={setShowAssignModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign to Route</DialogTitle>
            <DialogDescription>Select a route and vehicle for this collection request</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Select Route</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a route" />
                </SelectTrigger>
                <SelectContent>
                  {routes.map((route) => (
                    <SelectItem key={route.id} value={String(route.id)}>
                      {route.name || route.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Select Vehicle</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a vehicle" />
                </SelectTrigger>
                <SelectContent>
                  {vehicles
                    .filter((v) => (v.current_status || v.status) === "active")
                    .map((v) => (
                      <SelectItem key={v.id} value={String(v.id)}>
                        {v.plate_number || v.plateNumber || v.id}
                        {v.assigned_driver ? ` - ${v.assigned_driver}` : ""}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Scheduled Time</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select time slot" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="morning">Morning (6AM - 12PM)</SelectItem>
                  <SelectItem value="afternoon">Afternoon (12PM - 6PM)</SelectItem>
                  <SelectItem value="evening">Evening (6PM - 10PM)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssignModal(false)}>Cancel</Button>
            <Button onClick={() => setShowAssignModal(false)}>Assign Request</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
