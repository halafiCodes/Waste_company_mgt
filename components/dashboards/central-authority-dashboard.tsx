"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Recycle,
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
import { useRoles } from "@/lib/rbac/use-roles"

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

const policyFramework = [
  { id: "P-01", title: "Solid Waste Strategy 2026", owner: "Directorate", status: "active", lastReviewed: "2026-01-05" },
  { id: "P-02", title: "Fleet Emissions Standard", owner: "Env. Compliance", status: "draft", lastReviewed: "2025-12-18" },
  { id: "P-03", title: "Citizen Complaint SLA", owner: "Service Quality", status: "active", lastReviewed: "2025-11-30" },
  { id: "P-04", title: "Data Governance Policy", owner: "Analytics", status: "review", lastReviewed: "2025-12-20" },
]

const initiatives = [
  { id: "SI-12", name: "Smart Bins Pilot", sponsor: "Directorate", status: "in_progress", progress: 52, impact: "High" },
  { id: "SI-14", name: "Route Optimization V2", sponsor: "Analytics", status: "in_progress", progress: 68, impact: "High" },
  { id: "SI-09", name: "Recycling Hubs Scale-up", sponsor: "Env. Compliance", status: "planning", progress: 25, impact: "Medium" },
  { id: "SI-07", name: "Contractor Performance Reform", sponsor: "Directorate", status: "at_risk", progress: 41, impact: "Critical" },
]

const executiveReports = [
  { title: "Collection Performance", period: "MTD", coverage: "87%", recycling: "24%", incidents: 12 },
  { title: "Budget Utilization", period: "Q1", coverage: "62%", recycling: "—", incidents: 0 },
  { title: "Contractor Scorecard", period: "Q1", coverage: "A-/B+", recycling: "—", incidents: 4 },
]

export function CentralAuthorityDashboard({ user, onLogout }: CentralAuthorityDashboardProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeTab, setActiveTab] = useState("strategic-overview")
  const [searchQuery, setSearchQuery] = useState("")
  const { roles } = useRoles()

  const menuItems = [
    { id: "strategic-overview", label: "Strategic Overview", icon: BarChart3 },
    { id: "policies", label: "Policies & Rules", icon: FileText },
    { id: "approvals", label: "Approvals", icon: CheckCircle },
    { id: "initiatives", label: "Strategic Initiatives", icon: Recycle },
    { id: "roles", label: "Role Management", icon: Users },
    { id: "reports", label: "Executive Reports", icon: FileText },
    { id: "settings", label: "Settings", icon: Settings },
  ]

  const stats = [
    { title: "City Coverage", value: "87%", change: "+2.1%", trend: "up", icon: MapPin },
    { title: "Recycling Rate", value: "24%", change: "+1.4%", trend: "up", icon: Recycle },
    { title: "Operational Budget", value: "62% utilized", change: "On track", trend: "neutral", icon: TrendingUp },
    { title: "Open Risks", value: "18", change: "-4", trend: "down", icon: AlertTriangle },
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
          {activeTab === "strategic-overview" && (
            <div className="space-y-6">
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
                          {stat.change}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>City Performance Snapshot</CardTitle>
                    <CardDescription>Coverage, incidents, and recycling by zone</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Zone</TableHead>
                          <TableHead>Coverage</TableHead>
                          <TableHead>Assigned Company</TableHead>
                          <TableHead className="text-right">Incident Flag</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {mockZones.slice(0, 5).map((zone) => (
                          <TableRow key={zone.id}>
                            <TableCell className="font-medium">{zone.name}</TableCell>
                            <TableCell>{zone.coverage}%</TableCell>
                            <TableCell>{zone.assignedCompany || "Unassigned"}</TableCell>
                            <TableCell className="text-right">
                              <Badge variant={zone.coverage >= 80 ? "secondary" : "destructive"}>
                                {zone.coverage >= 80 ? "Stable" : "Investigate"}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>High-Priority Items</CardTitle>
                    <CardDescription>What needs directorate attention right now</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {mockComplaints.slice(0, 3).map((item) => (
                      <div key={item.id} className="flex items-center justify-between rounded-lg border p-3">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${item.priority === "critical" ? "bg-destructive/10" : "bg-warning/10"}`}>
                            <AlertTriangle className={`h-5 w-5 ${item.priority === "critical" ? "text-destructive" : "text-warning"}`} />
                          </div>
                          <div>
                            <p className="font-medium">{item.type}</p>
                            <p className="text-sm text-muted-foreground">{item.zone} • {item.date}</p>
                          </div>
                        </div>
                        <Badge variant="destructive">{item.priority}</Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activeTab === "policies" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Policies & Rules</h2>
                  <p className="text-sm text-muted-foreground">Approval and compliance status for governance documents</p>
                </div>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  New Policy
                </Button>
              </div>
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Owner</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Last Reviewed</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {policyFramework.map((policy) => (
                        <TableRow key={policy.id}>
                          <TableCell className="font-medium">{policy.title}</TableCell>
                          <TableCell>{policy.owner}</TableCell>
                          <TableCell>
                            <Badge variant={policy.status === "active" ? "default" : policy.status === "draft" ? "secondary" : "outline"}>
                              {policy.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{policy.lastReviewed}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="outline" size="sm" className="bg-transparent">Review</Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "approvals" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Approvals</h2>
                  <p className="text-sm text-muted-foreground">Contracts, company licenses, and system changes awaiting decision</p>
                </div>
                <Button size="sm" variant="outline" className="bg-transparent">
                  <Clock className="mr-2 h-4 w-4" />
                  SLA: 48h
                </Button>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Company & Contract Approvals</CardTitle>
                  <CardDescription>Review pending requests</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Applicant</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Zones</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Decision</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mockCompanies.filter(c => c.status === "pending").map((company) => (
                        <TableRow key={company.id}>
                          <TableCell className="font-medium">{company.name}</TableCell>
                          <TableCell>License & Contract</TableCell>
                          <TableCell>{company.zones.length ? company.zones.join(", ") : "None"}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">Pending</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button size="sm" variant="outline" className="bg-transparent text-destructive">
                                <XCircle className="mr-1 h-4 w-4" />
                                Reject
                              </Button>
                              <Button size="sm">
                                <CheckCircle className="mr-1 h-4 w-4" />
                                Approve
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>System Change Requests</CardTitle>
                  <CardDescription>Policy, budget, and IT changes awaiting governance</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {["Budget realignment for recycling hubs", "Data-sharing MOU update", "Route optimization rollout"].map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between rounded-lg border p-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                          <FileText className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{item}</p>
                          <p className="text-xs text-muted-foreground">Requires directorate sign-off</p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline" className="bg-transparent">Review</Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "initiatives" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Strategic Initiatives</h2>
                  <p className="text-sm text-muted-foreground">Directorate-led projects and outcomes</p>
                </div>
                <Button size="sm" variant="outline" className="bg-transparent">
                  <Plus className="mr-2 h-4 w-4" />
                  New Initiative
                </Button>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {initiatives.map((item) => (
                  <Card key={item.id}>
                    <CardHeader className="flex flex-row items-start justify-between pb-2">
                      <div>
                        <CardTitle className="text-base">{item.name}</CardTitle>
                        <CardDescription>{item.id} • Sponsor: {item.sponsor}</CardDescription>
                      </div>
                      <Badge variant={item.status === "in_progress" ? "secondary" : item.status === "planning" ? "outline" : "destructive"}>
                        {item.status}
                      </Badge>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Impact</span>
                        <Badge variant="outline">{item.impact}</Badge>
                      </div>
                      <div className="h-2 w-full rounded-full bg-secondary">
                        <div className={`h-2 rounded-full ${item.status === "at_risk" ? "bg-destructive" : "bg-primary"}`} style={{ width: `${item.progress}%` }} />
                      </div>
                      <p className="text-xs text-muted-foreground">Progress: {item.progress}%</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {activeTab === "roles" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Role Management</h2>
                  <p className="text-sm text-muted-foreground">Oversight of directorates and authorities</p>
                </div>
                <Button size="sm">Assign Role</Button>
              </div>
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Role</TableHead>
                        <TableHead>Scope</TableHead>
                        <TableHead>Approvals</TableHead>
                        <TableHead>Access Level</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {roles.map((role) => (
                        <TableRow key={role.id}>
                          <TableCell className="font-medium">{role.name}</TableCell>
                          <TableCell>{role.description || "—"}</TableCell>
                          <TableCell>{role.slug || "—"}</TableCell>
                          <TableCell>
                            <Badge variant={role.id === 1 ? "default" : "secondary"}>Level {role.id}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button size="sm" variant="outline" className="bg-transparent">Manage</Button>
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
                {executiveReports.map((report) => (
                  <Card key={report.title} className="cursor-pointer transition-colors hover:border-primary">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                          <FileText className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{report.title}</CardTitle>
                          <CardDescription>{report.period}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-1 text-sm">
                      <div className="flex justify-between"><span>Coverage</span><span className="font-medium">{report.coverage}</span></div>
                      <div className="flex justify-between"><span>Recycling / Score</span><span className="font-medium">{report.recycling}</span></div>
                      <div className="flex justify-between"><span>Incidents</span><span className="font-medium">{report.incidents}</span></div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Executive Report Queue</CardTitle>
                  <CardDescription>Upcoming packets for the directorate</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Report</TableHead>
                        <TableHead>Owner</TableHead>
                        <TableHead>Due</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[{ name: "Citywide KPI Pack", owner: "Analytics", due: "Feb 05", status: "In draft" }, { name: "Budget Performance", owner: "Finance", due: "Jan 31", status: "Review" }, { name: "Contractor Audit", owner: "Audit", due: "Feb 12", status: "Not started" }].map((item) => (
                        <TableRow key={item.name}>
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell>{item.owner}</TableCell>
                          <TableCell>{item.due}</TableCell>
                          <TableCell>
                            <Badge variant={item.status === "Review" ? "secondary" : item.status === "In draft" ? "outline" : "destructive"}>{item.status}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button size="sm" variant="outline" className="bg-transparent">Open</Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
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
    </div>
  )
}
