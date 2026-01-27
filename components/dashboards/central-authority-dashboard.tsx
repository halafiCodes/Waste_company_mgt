"use client"

import { useState } from "react"
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
import { Textarea } from "@/components/ui/textarea"
import {
  Recycle,
  Building2,
  Truck,
  Users,
  AlertTriangle,
  BarChart3,
  MapPin,
  Bell,
  Search,
  MoreHorizontal,
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  LogOut,
  Settings,
  Menu,
  ChevronDown,
  TrendingUp,
  TrendingDown,
  FileText,
} from "lucide-react"
import { DashboardSidebar } from "@/components/dashboard-sidebar"

interface CentralAuthorityDashboardProps {
  user: { role: string; name: string }
  onLogout: () => void
}

// Mock data
const mockCompanies = [
  { id: "WC001", name: "Green Clean Services", license: "AA-2024-001", zones: ["Bole", "Kirkos"], status: "approved", vehicles: 15, drivers: 22 },
  { id: "WC002", name: "Eco Waste Solutions", license: "AA-2024-002", zones: ["Yeka"], status: "approved", vehicles: 10, drivers: 15 },
  { id: "WC003", name: "City Cleaners Ltd", license: "AA-2024-003", zones: [], status: "pending", vehicles: 8, drivers: 12 },
  { id: "WC004", name: "Addis Waste Management", license: "AA-2024-004", zones: ["Arada", "Addis Ketema"], status: "approved", vehicles: 20, drivers: 30 },
  { id: "WC005", name: "Clean City Enterprise", license: "AA-2024-005", zones: [], status: "pending", vehicles: 5, drivers: 8 },
]

const mockZones = [
  { id: "Z001", name: "Bole", subcity: "Bole", population: "350,000", assignedCompany: "Green Clean Services", coverage: 92 },
  { id: "Z002", name: "Kirkos", subcity: "Kirkos", population: "280,000", assignedCompany: "Green Clean Services", coverage: 88 },
  { id: "Z003", name: "Yeka", subcity: "Yeka", population: "420,000", assignedCompany: "Eco Waste Solutions", coverage: 75 },
  { id: "Z004", name: "Arada", subcity: "Arada", population: "250,000", assignedCompany: "Addis Waste Management", coverage: 95 },
  { id: "Z005", name: "Addis Ketema", subcity: "Addis Ketema", population: "310,000", assignedCompany: "Addis Waste Management", coverage: 82 },
  { id: "Z006", name: "Lideta", subcity: "Lideta", population: "220,000", assignedCompany: null, coverage: 0 },
]

const mockComplaints = [
  { id: "C001", resident: "Abebe Kebede", zone: "Bole", type: "Missed Collection", status: "open", date: "2025-01-25", priority: "high" },
  { id: "C002", resident: "Sara Mekonnen", zone: "Yeka", type: "Illegal Dumping", status: "investigating", date: "2025-01-24", priority: "critical" },
  { id: "C003", resident: "Dawit Haile", zone: "Kirkos", type: "Delayed Pickup", status: "resolved", date: "2025-01-23", priority: "medium" },
  { id: "C004", resident: "Tigist Assefa", zone: "Arada", type: "Missed Collection", status: "open", date: "2025-01-25", priority: "high" },
  { id: "C005", resident: "Yohannes Bekele", zone: "Addis Ketema", type: "Service Quality", status: "investigating", date: "2025-01-22", priority: "medium" },
]

export function CentralAuthorityDashboard({ user, onLogout }: CentralAuthorityDashboardProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const [searchQuery, setSearchQuery] = useState("")
  const [showCompanyModal, setShowCompanyModal] = useState(false)
  const [showZoneAssignModal, setShowZoneAssignModal] = useState(false)
  const [selectedCompany, setSelectedCompany] = useState<typeof mockCompanies[0] | null>(null)

  const menuItems = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "companies", label: "Waste Companies", icon: Building2 },
    { id: "zones", label: "Service Zones", icon: MapPin },
    { id: "complaints", label: "Complaints", icon: AlertTriangle },
    { id: "reports", label: "Reports", icon: FileText },
    { id: "settings", label: "Settings", icon: Settings },
  ]

  const stats = [
    { title: "Registered Companies", value: "24", change: "+3", trend: "up", icon: Building2 },
    { title: "Active Vehicles", value: "320", change: "+12", trend: "up", icon: Truck },
    { title: "Service Zones", value: "11", change: "0", trend: "neutral", icon: MapPin },
    { title: "Open Complaints", value: "47", change: "-8", trend: "down", icon: AlertTriangle },
  ]

  return (
    <div className="flex h-screen bg-background">
      <DashboardSidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        menuItems={menuItems}
        activeItem={activeTab}
        onItemClick={setActiveTab}
        userRole="Central Authority"
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
              <p className="text-sm text-muted-foreground">City-wide waste management oversight</p>
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
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs text-destructive-foreground">
                5
              </span>
            </Button>
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
                      <div className="flex items-center gap-1 text-sm">
                        {stat.trend === "up" && <TrendingUp className="h-4 w-4 text-green-600" />}
                        {stat.trend === "down" && <TrendingDown className="h-4 w-4 text-green-600" />}
                        <span className={stat.trend === "up" ? "text-green-600" : stat.trend === "down" ? "text-green-600" : "text-muted-foreground"}>
                          {stat.change} from last month
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Recent Activity */}
              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Pending Company Approvals</CardTitle>
                    <CardDescription>Companies waiting for registration approval</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {mockCompanies.filter(c => c.status === "pending").map((company) => (
                        <div key={company.id} className="flex items-center justify-between rounded-lg border p-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                              <Building2 className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{company.name}</p>
                              <p className="text-sm text-muted-foreground">License: {company.license}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" className="text-destructive bg-transparent">
                              <XCircle className="mr-1 h-4 w-4" />
                              Reject
                            </Button>
                            <Button size="sm">
                              <CheckCircle className="mr-1 h-4 w-4" />
                              Approve
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Recent Complaints</CardTitle>
                    <CardDescription>Latest citizen reports requiring attention</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {mockComplaints.slice(0, 4).map((complaint) => (
                        <div key={complaint.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                              complaint.priority === "critical" ? "bg-destructive/10" : 
                              complaint.priority === "high" ? "bg-warning/10" : "bg-muted"
                            }`}>
                              <AlertTriangle className={`h-5 w-5 ${
                                complaint.priority === "critical" ? "text-destructive" : 
                                complaint.priority === "high" ? "text-warning" : "text-muted-foreground"
                              }`} />
                            </div>
                            <div>
                              <p className="font-medium">{complaint.type}</p>
                              <p className="text-sm text-muted-foreground">{complaint.zone} - {complaint.resident}</p>
                            </div>
                          </div>
                          <Badge variant={
                            complaint.status === "open" ? "destructive" : 
                            complaint.status === "investigating" ? "secondary" : "outline"
                          }>
                            {complaint.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Zone Coverage Overview */}
              <Card>
                <CardHeader>
                  <CardTitle>Zone Coverage Overview</CardTitle>
                  <CardDescription>Service coverage across all zones</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockZones.map((zone) => (
                      <div key={zone.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-medium">{zone.name}</span>
                            <span className="ml-2 text-sm text-muted-foreground">
                              ({zone.assignedCompany || "Unassigned"})
                            </span>
                          </div>
                          <span className="text-sm font-medium">{zone.coverage}%</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-secondary">
                          <div 
                            className={`h-2 rounded-full ${
                              zone.coverage >= 90 ? "bg-green-600" : 
                              zone.coverage >= 70 ? "bg-primary" : 
                              zone.coverage >= 50 ? "bg-warning" : "bg-destructive"
                            }`}
                            style={{ width: `${zone.coverage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "companies" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Search companies..." className="pl-9" />
                </div>
                <Button onClick={() => setShowCompanyModal(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Register Company
                </Button>
              </div>

              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Company</TableHead>
                        <TableHead>License</TableHead>
                        <TableHead>Service Zones</TableHead>
                        <TableHead>Vehicles</TableHead>
                        <TableHead>Drivers</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mockCompanies.map((company) => (
                        <TableRow key={company.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                                <Building2 className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium">{company.name}</p>
                                <p className="text-sm text-muted-foreground">{company.id}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{company.license}</TableCell>
                          <TableCell>
                            {company.zones.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {company.zones.map((zone) => (
                                  <Badge key={zone} variant="secondary">{zone}</Badge>
                                ))}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">None assigned</span>
                            )}
                          </TableCell>
                          <TableCell>{company.vehicles}</TableCell>
                          <TableCell>{company.drivers}</TableCell>
                          <TableCell>
                            <Badge variant={company.status === "approved" ? "default" : "secondary"}>
                              {company.status}
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
                                <DropdownMenuItem onClick={() => {
                                  setSelectedCompany(company)
                                  setShowZoneAssignModal(true)
                                }}>
                                  <MapPin className="mr-2 h-4 w-4" />
                                  Assign Zones
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <FileText className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                                {company.status === "pending" && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="text-green-600">
                                      <CheckCircle className="mr-2 h-4 w-4" />
                                      Approve
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="text-destructive">
                                      <XCircle className="mr-2 h-4 w-4" />
                                      Reject
                                    </DropdownMenuItem>
                                  </>
                                )}
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

          {activeTab === "zones" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Search zones..." className="pl-9" />
                </div>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Zone
                </Button>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {mockZones.map((zone) => (
                  <Card key={zone.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{zone.name}</CardTitle>
                        <Badge variant={zone.assignedCompany ? "default" : "destructive"}>
                          {zone.assignedCompany ? "Assigned" : "Unassigned"}
                        </Badge>
                      </div>
                      <CardDescription>{zone.subcity} Sub-city</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Population</p>
                          <p className="font-medium">{zone.population}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Coverage</p>
                          <p className="font-medium">{zone.coverage}%</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Assigned Company</p>
                        <p className="font-medium">{zone.assignedCompany || "Not assigned"}</p>
                      </div>
                      <div className="h-2 w-full rounded-full bg-secondary">
                        <div 
                          className={`h-2 rounded-full ${
                            zone.coverage >= 90 ? "bg-green-600" : 
                            zone.coverage >= 70 ? "bg-primary" : 
                            zone.coverage >= 50 ? "bg-warning" : "bg-destructive"
                          }`}
                          style={{ width: `${zone.coverage}%` }}
                        />
                      </div>
                      <Button variant="outline" className="w-full bg-transparent">
                        <MapPin className="mr-2 h-4 w-4" />
                        {zone.assignedCompany ? "Reassign Company" : "Assign Company"}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {activeTab === "complaints" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <Tabs defaultValue="all" className="w-auto">
                  <TabsList>
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="open">Open</TabsTrigger>
                    <TabsTrigger value="investigating">Investigating</TabsTrigger>
                    <TabsTrigger value="resolved">Resolved</TabsTrigger>
                  </TabsList>
                </Tabs>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Search complaints..." className="pl-9" />
                </div>
              </div>

              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Resident</TableHead>
                        <TableHead>Zone</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mockComplaints.map((complaint) => (
                        <TableRow key={complaint.id}>
                          <TableCell className="font-medium">{complaint.id}</TableCell>
                          <TableCell>{complaint.resident}</TableCell>
                          <TableCell>{complaint.zone}</TableCell>
                          <TableCell>{complaint.type}</TableCell>
                          <TableCell>
                            <Badge variant={
                              complaint.priority === "critical" ? "destructive" : 
                              complaint.priority === "high" ? "default" : "secondary"
                            }>
                              {complaint.priority}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={
                              complaint.status === "open" ? "destructive" : 
                              complaint.status === "investigating" ? "secondary" : "outline"
                            }>
                              {complaint.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{complaint.date}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <FileText className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <AlertTriangle className="mr-2 h-4 w-4" />
                                  Escalate
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-green-600">
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Mark Resolved
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
              <div className="grid gap-4 md:grid-cols-3">
                <Card className="cursor-pointer hover:border-primary transition-colors">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                        <BarChart3 className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle>Performance Report</CardTitle>
                        <CardDescription>Company efficiency metrics</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
                <Card className="cursor-pointer hover:border-primary transition-colors">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                        <Truck className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle>Collection Report</CardTitle>
                        <CardDescription>Daily/weekly collection stats</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
                <Card className="cursor-pointer hover:border-primary transition-colors">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                        <AlertTriangle className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle>Complaint Analysis</CardTitle>
                        <CardDescription>Complaint trends and resolution</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </div>
              <Card>
                <CardHeader>
                  <CardTitle>Generate Custom Report</CardTitle>
                  <CardDescription>Create detailed reports for specific time periods and metrics</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label>Report Type</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select report type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="performance">Performance Report</SelectItem>
                          <SelectItem value="collection">Collection Report</SelectItem>
                          <SelectItem value="complaint">Complaint Report</SelectItem>
                          <SelectItem value="zone">Zone Coverage Report</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Time Period</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select period" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="week">Last 7 Days</SelectItem>
                          <SelectItem value="month">Last 30 Days</SelectItem>
                          <SelectItem value="quarter">Last Quarter</SelectItem>
                          <SelectItem value="year">Last Year</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Zone/Company</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="All" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          {mockCompanies.map(c => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button>
                    <FileText className="mr-2 h-4 w-4" />
                    Generate Report
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "settings" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>System Settings</CardTitle>
                  <CardDescription>Configure system-wide settings and preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Default Collection Schedule</Label>
                    <Select defaultValue="daily">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="twice-weekly">Twice Weekly</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Complaint Escalation Threshold (hours)</Label>
                    <Input type="number" defaultValue="48" />
                  </div>
                  <div className="space-y-2">
                    <Label>Notification Email</Label>
                    <Input type="email" defaultValue="admin@aacma.gov.et" />
                  </div>
                  <Button>Save Settings</Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>

      {/* Register Company Modal */}
      <Dialog open={showCompanyModal} onOpenChange={setShowCompanyModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Register New Company</DialogTitle>
            <DialogDescription>Add a new waste management company to the system</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Company Name</Label>
              <Input placeholder="Enter company name" />
            </div>
            <div className="space-y-2">
              <Label>License Number</Label>
              <Input placeholder="Enter license number" />
            </div>
            <div className="space-y-2">
              <Label>Contact Email</Label>
              <Input type="email" placeholder="Enter email" />
            </div>
            <div className="space-y-2">
              <Label>Contact Phone</Label>
              <Input placeholder="Enter phone number" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCompanyModal(false)}>Cancel</Button>
            <Button onClick={() => setShowCompanyModal(false)}>Register Company</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Zone Assignment Modal */}
      <Dialog open={showZoneAssignModal} onOpenChange={setShowZoneAssignModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Service Zones</DialogTitle>
            <DialogDescription>
              Assign service zones to {selectedCompany?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Select Zones</Label>
              <div className="space-y-2">
                {mockZones.map((zone) => (
                  <div key={zone.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="font-medium">{zone.name}</p>
                      <p className="text-sm text-muted-foreground">Pop: {zone.population}</p>
                    </div>
                    <input type="checkbox" className="h-4 w-4" />
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowZoneAssignModal(false)}>Cancel</Button>
            <Button onClick={() => setShowZoneAssignModal(false)}>Assign Zones</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
