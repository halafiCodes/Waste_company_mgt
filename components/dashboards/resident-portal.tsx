"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import { Textarea } from "@/components/ui/textarea"
import {
  Recycle,
  Package,
  MapPin,
  Bell,
  Clock,
  LogOut,
  Settings,
  Menu,
  ChevronDown,
  Plus,
  CheckCircle,
  AlertTriangle,
  FileText,
  Truck,
  Calendar,
  History,
  User,
  Phone,
  Mail,
  Home,
  MessageSquare,
  XCircle,
  Loader2,
} from "lucide-react"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { authorizedGet, authorizedPost } from "@/lib/api/client"
import { GoogleMapPicker } from "@/components/maps/google-map-picker"

interface ResidentPortalProps {
  user: { role: string; name: string }
  onLogout: () => void
}

// Data from API
const initialList: any[] = []

export function ResidentPortal({ user, onLogout }: ResidentPortalProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeTab, setActiveTab] = useState("dashboard")
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [showComplaintModal, setShowComplaintModal] = useState(false)
  const [showLocationModal, setShowLocationModal] = useState(false)
  const [showTrackingModal, setShowTrackingModal] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null)

  // Form states
  const [wasteType, setWasteType] = useState("")
  const [quantity, setQuantity] = useState("")
  const [preferredDate, setPreferredDate] = useState("")
  const [preferredTime, setPreferredTime] = useState("")
  const [complaintType, setComplaintType] = useState("")
  const [complaintDescription, setComplaintDescription] = useState("")
  const [complaintAddress, setComplaintAddress] = useState("")
  const [complaintLocation, setComplaintLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [locationLabel, setLocationLabel] = useState("")
  const [geoLoading, setGeoLoading] = useState(false)
  const [relatedRequestId, setRelatedRequestId] = useState<string | null>(null)
  const [requests, setRequests] = useState<any[]>(initialList)
  const [complaints, setComplaints] = useState<any[]>(initialList)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notifications, setNotifications] = useState<any[]>(initialList)
  const [requestSubmitting, setRequestSubmitting] = useState(false)
  const [complaintSubmitting, setComplaintSubmitting] = useState(false)
  const [address, setAddress] = useState("")
  const [notes, setNotes] = useState("")
  const [estimatedWeight, setEstimatedWeight] = useState("")
  const [requestFilter, setRequestFilter] = useState("all")
  const [complaintFilter, setComplaintFilter] = useState("all")

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "requests", label: "My Requests", icon: Package },
    { id: "complaints", label: "Complaints", icon: MessageSquare },
    { id: "history", label: "Collection History", icon: History },
    { id: "profile", label: "My Profile", icon: User },
    { id: "settings", label: "Settings", icon: Settings },
  ]

  const refreshResidentData = async () => {
    const normalize = (res: any) => (Array.isArray(res) ? res : res?.results ?? [])
    const [reqRes, complRes, notifRes] = await Promise.all([
      authorizedGet<any>("/collections/resident/requests/"),
      authorizedGet<any>("/complaints/resident/complaints/"),
      authorizedGet<any>("/notifications/"),
    ])
    setRequests(normalize(reqRes))
    setComplaints(normalize(complRes))
    setNotifications(normalize(notifRes))
  }

  const reverseGeocode = async (lat: number, lng: number) => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    if (!apiKey) return
    setGeoLoading(true)
    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`
      )
      const data = await res.json()
      const formatted = data?.results?.[0]?.formatted_address
      if (formatted) {
        setComplaintAddress(formatted)
        setLocationLabel(formatted)
      }
    } catch (err) {
      // ignore geocode errors, manual address still allowed
    } finally {
      setGeoLoading(false)
    }
  }

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported in this browser.")
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setComplaintLocation(coords)
        reverseGeocode(coords.lat, coords.lng)
      },
      () => setError("Unable to access your location. Please allow GPS permission."),
      { enableHighAccuracy: true }
    )
  }

  const handleNewRequest = async () => {
    if (!wasteType || !quantity || !preferredDate || !preferredTime || !address) {
      setError("Please fill waste type, quantity, date, time, and address.")
      return
    }
    setRequestSubmitting(true)
    setError(null)
    try {
      await authorizedPost("/collections/resident/requests/", {
        waste_type: wasteType,
        quantity_bags: Number(quantity) || 1,
        estimated_weight_kg: estimatedWeight ? Number(estimatedWeight) : null,
        preferred_date: preferredDate,
        preferred_time: preferredTime,
        address,
        special_instructions: notes,
      })
      await refreshResidentData()
      setShowRequestModal(false)
      setWasteType("")
      setQuantity("")
      setPreferredDate("")
      setPreferredTime("")
      setAddress("")
      setNotes("")
      setEstimatedWeight("")
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to submit request"
      setError(message)
    } finally {
      setRequestSubmitting(false)
    }
  }

  const handleNewComplaint = async () => {
    const resolvedAddress = complaintAddress || locationLabel
    if (!complaintType || !complaintDescription || !resolvedAddress) {
      setError("Please fill issue type, description, and address.")
      return
    }
    setComplaintSubmitting(true)
    setError(null)
    const typeMap: Record<string, string> = {
      missed: "missed_collection",
      late: "late_pickup",
      quality: "service_quality",
      illegal: "illegal_dumping",
      other: "other",
    }
    try {
      await authorizedPost("/complaints/resident/complaints/", {
        report_type: typeMap[complaintType] ?? "other",
        description: complaintDescription,
        location_address: resolvedAddress,
        latitude: complaintLocation?.lat ?? null,
        longitude: complaintLocation?.lng ?? null,
        priority: "medium",
        related_request: relatedRequestId,
      })
      await refreshResidentData()
      setShowComplaintModal(false)
      setComplaintType("")
      setComplaintDescription("")
      setComplaintAddress("")
      setComplaintLocation(null)
      setLocationLabel("")
      setRelatedRequestId(null)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to submit complaint"
      setError(message)
    } finally {
      setComplaintSubmitting(false)
    }
  }

  useEffect(() => {
    const normalize = (res: any) => (Array.isArray(res) ? res : res?.results ?? [])
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const [reqRes, complRes, notifRes] = await Promise.all([
          authorizedGet<any>("/collections/resident/requests/"),
          authorizedGet<any>("/complaints/resident/complaints/"),
          authorizedGet<any>("/notifications/"),
        ])
        setRequests(normalize(reqRes))
        setComplaints(normalize(complRes))
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

  const activeRequest = useMemo(() => requests.find(r => r.status === "in_progress"), [requests])
  const pendingCount = useMemo(() => requests.filter(r => r.status === "pending").length, [requests])
  const completedCount = useMemo(() => requests.filter(r => r.status === "completed").length, [requests])
  const openComplaints = useMemo(() => complaints.filter(c => c.status !== "resolved").length, [complaints])
  const filteredRequests = useMemo(() => {
    if (requestFilter === "pending") return requests.filter(r => r.status === "pending")
    if (requestFilter === "in-progress") return requests.filter(r => r.status === "in_progress")
    if (requestFilter === "completed") return requests.filter(r => r.status === "completed")
    return requests
  }, [requestFilter, requests])
  const filteredComplaints = useMemo(() => {
    if (complaintFilter === "open") return complaints.filter(c => c.status !== "resolved" && c.status !== "closed")
    if (complaintFilter === "resolved") return complaints.filter(c => c.status === "resolved")
    return complaints
  }, [complaintFilter, complaints])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-muted-foreground">
        Loading your data...
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
        userRole="Resident"
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
              <p className="text-sm text-muted-foreground">Welcome back, {user.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  {notifications.filter(n => !n.is_read).length > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs text-destructive-foreground">
                      {notifications.filter(n => !n.is_read).length}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {notifications.map(notification => (
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
                ))}
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
                <DropdownMenuItem onClick={() => setActiveTab("profile")}>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveTab("settings")}>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onLogout} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-6">
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              {/* Quick Actions */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card 
                  className="cursor-pointer hover:border-primary transition-colors"
                  onClick={() => setShowRequestModal(true)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                      <Plus className="h-6 w-6 text-primary" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <h3 className="font-semibold">Request Collection</h3>
                    <p className="text-sm text-muted-foreground">Schedule a waste pickup</p>
                  </CardContent>
                </Card>

                <Card 
                  className="cursor-pointer hover:border-primary transition-colors"
                  onClick={() => {
                    if (activeRequest) {
                      setSelectedRequest(activeRequest)
                      setShowTrackingModal(true)
                    }
                  }}
                >
                  <CardHeader className="pb-2">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                      <MapPin className="h-6 w-6 text-primary" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <h3 className="font-semibold">Track Pickup</h3>
                    <p className="text-sm text-muted-foreground">
                      {activeRequest ? "View live status" : "No active pickup"}
                    </p>
                  </CardContent>
                </Card>

                <Card 
                  className="cursor-pointer hover:border-primary transition-colors"
                  onClick={() => setShowComplaintModal(true)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-warning/10">
                      <AlertTriangle className="h-6 w-6 text-warning" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <h3 className="font-semibold">Report Issue</h3>
                    <p className="text-sm text-muted-foreground">Submit a complaint</p>
                  </CardContent>
                </Card>

                <Card 
                  className="cursor-pointer hover:border-primary transition-colors"
                  onClick={() => setActiveTab("history")}
                >
                  <CardHeader className="pb-2">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                      <History className="h-6 w-6 text-muted-foreground" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <h3 className="font-semibold">View History</h3>
                    <p className="text-sm text-muted-foreground">{completedCount} past collections</p>
                  </CardContent>
                </Card>
              </div>

              {/* Status Cards */}
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Pending Requests</CardTitle>
                    <Clock className="h-5 w-5 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{pendingCount}</div>
                    <p className="text-sm text-muted-foreground">Awaiting assignment</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Completed This Month</CardTitle>
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{completedCount}</div>
                    <p className="text-sm text-muted-foreground">Collections completed</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Open Complaints</CardTitle>
                    <MessageSquare className="h-5 w-5 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{openComplaints}</div>
                    <p className="text-sm text-muted-foreground">Being processed</p>
                  </CardContent>
                </Card>
              </div>

              {/* Active Collection */}
              {activeRequest && (
                <Card className="border-primary">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Loader2 className="h-5 w-5 animate-spin text-primary" />
                          Collection In Progress
                        </CardTitle>
                        <CardDescription>Request #{activeRequest.id}</CardDescription>
                      </div>
                      <Button onClick={() => {
                        setSelectedRequest(activeRequest)
                        setShowTrackingModal(true)
                      }}>
                        <MapPin className="mr-2 h-4 w-4" />
                        Track Live
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Waste Type</p>
                        <p className="font-medium">{activeRequest.wasteType}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Quantity</p>
                        <p className="font-medium">{activeRequest.quantity}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Driver</p>
                        <p className="font-medium">{activeRequest.driver}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Est. Arrival</p>
                        <p className="font-medium text-primary">{activeRequest.estimatedArrival}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Recent Requests */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Recent Requests</CardTitle>
                      <CardDescription>Your latest collection requests</CardDescription>
                    </div>
                    <Button variant="outline" onClick={() => setActiveTab("requests")}>
                      View All
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {requests.slice(0, 3).map((request) => (
                      <div key={request.id} className="flex items-center justify-between rounded-lg border p-4">
                        <div className="flex items-center gap-4">
                          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                            request.status === "completed" ? "bg-green-100" :
                            request.status === "in_progress" ? "bg-primary/10" : "bg-muted"
                          }`}>
                            {request.status === "completed" ? (
                              <CheckCircle className="h-5 w-5 text-green-600" />
                            ) : request.status === "in_progress" ? (
                              <Truck className="h-5 w-5 text-primary" />
                            ) : (
                              <Clock className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{request.waste_type} - {request.quantity_bags} bags</p>
                            <p className="text-sm text-muted-foreground">
                              {request.preferred_date} • {request.preferred_time}
                            </p>
                          </div>
                        </div>
                        <Badge variant={
                          request.status === "completed" ? "secondary" :
                          request.status === "in_progress" ? "default" : "outline"
                        }>
                          {request.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "requests" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <Tabs value={requestFilter} onValueChange={setRequestFilter} className="w-auto">
                  <TabsList>
                    <TabsTrigger value="all">All Requests</TabsTrigger>
                    <TabsTrigger value="pending">Pending</TabsTrigger>
                    <TabsTrigger value="in-progress">In Progress</TabsTrigger>
                    <TabsTrigger value="completed">Completed</TabsTrigger>
                  </TabsList>
                </Tabs>
                <Button onClick={() => setShowRequestModal(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  New Request
                </Button>
              </div>

              <div className="space-y-4">
                {filteredRequests.map((request) => (
                  <Card key={request.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${
                            request.status === "completed" ? "bg-green-100" :
                            request.status === "in_progress" ? "bg-primary/10" : "bg-muted"
                          }`}>
                            {request.status === "completed" ? (
                              <CheckCircle className="h-6 w-6 text-green-600" />
                            ) : request.status === "in_progress" ? (
                              <Truck className="h-6 w-6 text-primary" />
                            ) : (
                              <Clock className="h-6 w-6 text-muted-foreground" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">Request #{request.id}</h3>
                              <Badge variant={
                                request.status === "completed" ? "secondary" :
                                request.status === "in_progress" ? "default" : "outline"
                              }>
                                {request.status}
                              </Badge>
                            </div>
                            <div className="mt-2 grid gap-2 text-sm md:grid-cols-4">
                              <div>
                                <span className="text-muted-foreground">Type: </span>
                                <span className="font-medium">{request.waste_type}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Quantity: </span>
                                <span className="font-medium">{request.quantity_bags} bags</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Date: </span>
                                <span className="font-medium">{request.preferred_date}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Time: </span>
                                <span className="font-medium">{request.preferred_time}</span>
                              </div>
                            </div>
                            {request.driver && (
                              <div className="mt-2 text-sm">
                                <span className="text-muted-foreground">Assigned: </span>
                                <span className="font-medium">{request.driver} ({request.assignedVehicle})</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {request.status === "in-progress" && (
                            <Button size="sm" onClick={() => {
                              setSelectedRequest(request)
                              setShowTrackingModal(true)
                            }}>
                              <MapPin className="mr-1 h-4 w-4" />
                              Track
                            </Button>
                          )}
                          {request.status === "pending" && (
                            <Button size="sm" variant="outline" className="text-destructive bg-transparent">
                              <XCircle className="mr-1 h-4 w-4" />
                              Cancel
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {activeTab === "complaints" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <Tabs value={complaintFilter} onValueChange={setComplaintFilter} className="w-auto">
                  <TabsList>
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="open">Open</TabsTrigger>
                    <TabsTrigger value="resolved">Resolved</TabsTrigger>
                  </TabsList>
                </Tabs>
                <Button onClick={() => setShowComplaintModal(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  New Complaint
                </Button>
              </div>

              <div className="space-y-4">
                {filteredComplaints.map((complaint) => (
                  <Card key={complaint.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${
                            complaint.status === "resolved" ? "bg-green-100" :
                            complaint.status === "investigating" ? "bg-primary/10" : "bg-warning/10"
                          }`}>
                            {complaint.status === "resolved" ? (
                              <CheckCircle className="h-6 w-6 text-green-600" />
                            ) : (
                              <AlertTriangle className={`h-6 w-6 ${
                                complaint.status === "investigating" ? "text-primary" : "text-warning"
                              }`} />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">{complaint.complaint_type ?? complaint.type}</h3>
                              <Badge variant={
                                complaint.status === "resolved" ? "secondary" :
                                complaint.status === "investigating" ? "default" : "outline"
                              }>
                                {complaint.status}
                              </Badge>
                            </div>
                            <p className="mt-1 text-sm text-muted-foreground">{complaint.description || complaint.details}</p>
                            <p className="mt-2 text-xs text-muted-foreground">Submitted on {complaint.created_at ?? complaint.date}</p>
                            {complaint.response && (
                              <div className="mt-3 rounded-lg bg-muted p-3">
                                <p className="text-sm font-medium">Response:</p>
                                <p className="text-sm text-muted-foreground">{complaint.response}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {activeTab === "history" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Collection History</CardTitle>
                  <CardDescription>Your completed waste collections</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {requests.filter(r => r.status === "completed").map((request) => (
                      <div key={request.id} className="flex items-center justify-between rounded-lg border p-4">
                        <div className="flex items-center gap-4">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <p className="font-medium">{request.waste_type} - {request.quantity_bags} bags</p>
                            <p className="text-sm text-muted-foreground">
                              Collected on {request.collected_at ?? request.preferred_date}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{request.assigned_driver ?? "Unassigned"}</p>
                          <p className="text-xs text-muted-foreground">{request.assigned_vehicle ?? "Unassigned"}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "profile" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>Manage your personal details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-20 w-20">
                      <AvatarFallback className="bg-primary text-2xl text-primary-foreground">
                        {user.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-xl font-semibold">{user.name}</h3>
                      <p className="text-muted-foreground">Resident Account</p>
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Full Name</Label>
                      <Input defaultValue={user.name} />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input type="email" defaultValue={`${user.name.toLowerCase().replace(" ", ".")}@email.com`} />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input defaultValue="+251 911 234 567" />
                    </div>
                    <div className="space-y-2">
                      <Label>Zone</Label>
                      <Input defaultValue="Bole" disabled />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Address</Label>
                    <Textarea defaultValue="Bole Sub-city, House No. 123, Near Edna Mall" />
                  </div>
                  <Button>Save Changes</Button>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "settings" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Notification Preferences</CardTitle>
                  <CardDescription>Manage how you receive updates</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Collection Reminders</p>
                      <p className="text-sm text-muted-foreground">Get notified before scheduled pickups</p>
                    </div>
                    <input type="checkbox" defaultChecked className="h-4 w-4" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Status Updates</p>
                      <p className="text-sm text-muted-foreground">Receive updates on request status changes</p>
                    </div>
                    <input type="checkbox" defaultChecked className="h-4 w-4" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">SMS Notifications</p>
                      <p className="text-sm text-muted-foreground">Receive text messages for important updates</p>
                    </div>
                    <input type="checkbox" className="h-4 w-4" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>

      {/* New Request Modal */}
      <Dialog open={showRequestModal} onOpenChange={setShowRequestModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Request Waste Collection</DialogTitle>
            <DialogDescription>Submit a new collection request</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Waste Type</Label>
              <Select value={wasteType} onValueChange={setWasteType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select waste type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General Waste</SelectItem>
                  <SelectItem value="recyclable">Recyclable Materials</SelectItem>
                  <SelectItem value="hazardous">Hazardous Waste</SelectItem>
                  <SelectItem value="organic">Organic/Compost</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Number of Bags</Label>
                <Input 
                  type="number" 
                  placeholder="e.g., 5"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Estimated Weight (kg)</Label>
                <Input
                  type="number"
                  placeholder="Optional"
                  value={estimatedWeight}
                  onChange={(e) => setEstimatedWeight(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Preferred Date</Label>
              <Input 
                type="date"
                value={preferredDate}
                onChange={(e) => setPreferredDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Preferred Time</Label>
              <Select value={preferredTime} onValueChange={setPreferredTime}>
                <SelectTrigger>
                  <SelectValue placeholder="Select time slot" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="morning">Morning (6AM - 12PM)</SelectItem>
                  <SelectItem value="afternoon">Afternoon (12PM - 6PM)</SelectItem>
                  <SelectItem value="evening">Evening (6PM - 9PM)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Pickup Address</Label>
              <Textarea
                placeholder="Street, house number, landmarks"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Additional Notes</Label>
              <Textarea
                placeholder="Any special instructions..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRequestModal(false)}>Cancel</Button>
            <Button onClick={handleNewRequest} disabled={requestSubmitting}>
              {requestSubmitting ? "Submitting..." : "Submit Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Complaint Modal */}
      <Dialog open={showComplaintModal} onOpenChange={setShowComplaintModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Report an Issue</DialogTitle>
            <DialogDescription>Submit a complaint or report</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Issue Type</Label>
              <Select value={complaintType} onValueChange={setComplaintType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select issue type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="missed">Missed Collection</SelectItem>
                  <SelectItem value="late">Late Pickup</SelectItem>
                  <SelectItem value="quality">Service Quality</SelectItem>
                  <SelectItem value="illegal">Illegal Dumping</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea 
                placeholder="Describe the issue in detail..."
                value={complaintDescription}
                onChange={(e) => setComplaintDescription(e.target.value)}
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label>Address / Location</Label>
              <Textarea
                placeholder="Where did this occur?"
                value={complaintAddress}
                onChange={(e) => setComplaintAddress(e.target.value)}
                rows={2}
              />
              <div className="flex flex-wrap items-center gap-2">
                <Button type="button" variant="outline" onClick={() => setShowLocationModal(true)}>
                  <MapPin className="mr-2 h-4 w-4" />
                  Share Location
                </Button>
                {complaintLocation && (
                  <span className="text-xs text-muted-foreground">
                    {complaintLocation.lat.toFixed(5)}, {complaintLocation.lng.toFixed(5)}
                  </span>
                )}
                {geoLoading && (
                  <span className="text-xs text-muted-foreground">Resolving address...</span>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Related Request (Optional)</Label>
              <Select value={relatedRequestId ?? "none"} onValueChange={(v) => setRelatedRequestId(v === "none" ? null : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a request" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {requests.map(r => (
                    <SelectItem key={r.id} value={String(r.id)}>
                      {r.id} - {r.waste_type} ({r.preferred_date})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowComplaintModal(false)}>Cancel</Button>
            <Button onClick={handleNewComplaint} disabled={complaintSubmitting}>
              {complaintSubmitting ? "Submitting..." : "Submit Complaint"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Location Picker Modal */}
      <Dialog open={showLocationModal} onOpenChange={setShowLocationModal}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Share Location</DialogTitle>
            <DialogDescription>Select your complaint location</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={handleUseCurrentLocation}>
                <MapPin className="mr-2 h-4 w-4" />
                Use Current Location
              </Button>
              {complaintLocation && (
                <span className="text-xs text-muted-foreground">
                  {complaintLocation.lat.toFixed(5)}, {complaintLocation.lng.toFixed(5)}
                </span>
              )}
              {locationLabel && (
                <span className="text-xs text-muted-foreground">{locationLabel}</span>
              )}
            </div>
            <GoogleMapPicker
              value={complaintLocation}
              onChange={(value) => {
                setComplaintLocation(value)
                reverseGeocode(value.lat, value.lng)
              }}
              height="360px"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLocationModal(false)}>Cancel</Button>
            <Button
              onClick={() => {
                if (locationLabel) {
                  setComplaintAddress(locationLabel)
                }
                setShowLocationModal(false)
              }}
              disabled={!complaintLocation}
            >
              Use Selected Location
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tracking Modal */}
      <Dialog open={showTrackingModal} onOpenChange={setShowTrackingModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Track Your Pickup</DialogTitle>
            <DialogDescription>
              Request #{selectedRequest?.id}
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-6">
              {/* Status Timeline */}
              <div className="space-y-4">
                  <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Request Submitted</p>
                      <p className="text-sm text-muted-foreground">{selectedRequest.created_at ?? selectedRequest.preferred_date}</p>
                  </div>
                </div>
                <div className="ml-5 h-8 w-0.5 bg-green-200" />
                  <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Driver Assigned</p>
                      <p className="text-sm text-muted-foreground">{selectedRequest.assigned_driver ?? "Unassigned"}</p>
                  </div>
                </div>
                <div className="ml-5 h-8 w-0.5 bg-primary" />
                  <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <Truck className="h-5 w-5 text-primary animate-pulse" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">On The Way</p>
                      <p className="text-sm text-muted-foreground">Estimated arrival: {selectedRequest.estimated_arrival ?? "TBD"}</p>
                  </div>
                </div>
                <div className="ml-5 h-8 w-0.5 bg-muted" />
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                    <Package className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-muted-foreground">Collection Complete</p>
                    <p className="text-sm text-muted-foreground">Pending</p>
                  </div>
                </div>
              </div>

              {/* Map Placeholder */}
              <div className="rounded-lg border bg-muted/50 p-8 text-center">
                <MapPin className="mx-auto h-12 w-12 text-primary" />
                <p className="mt-2 font-medium">Live Map Tracking</p>
                <p className="text-sm text-muted-foreground">Vehicle location updates in real-time</p>
              </div>

              {/* Driver Info */}
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground mb-2">Your Driver</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {(selectedRequest.assigned_driver || "?")
                            .split(" ")
                            .filter(Boolean)
                            .map(n => n[0])
                            .join("") || "?"}
                        </AvatarFallback>
                      </Avatar>
                    <div>
                        <p className="font-medium">{selectedRequest.assigned_driver ?? "Unassigned"}</p>
                        <p className="text-sm text-muted-foreground">{selectedRequest.assigned_vehicle ?? "Unassigned"}</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    <Phone className="mr-1 h-4 w-4" />
                    Call
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
