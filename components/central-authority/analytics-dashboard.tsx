"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  BarChart3,
  Bell,
  Search,
  XCircle,
  Settings,
  ChevronDown,
  TrendingUp,
  TrendingDown,
  FileText,
  Download,
  PieChart,
  LineChart,
  Calendar,
  Layers,
  Target,
  Truck,
} from "lucide-react"
import { type User, type Role } from "@/lib/rbac/types"
import { authorizedGet } from "@/lib/api/client"
import { useRoles } from "@/lib/rbac/use-roles"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Line,
  LineChart as RechartsLineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Pie,
  PieChart as RechartsPieChart,
  Cell,
} from "recharts"

interface AnalyticsDashboardProps {
  user: User
  onLogout: () => void
}

export function AnalyticsDashboard({ user, onLogout }: AnalyticsDashboardProps) {
  const [activeTab, setActiveTab] = useState("overview")
  const [searchQuery, setSearchQuery] = useState("")
  const [dateRange, setDateRange] = useState("30d")
  const [analytics, setAnalytics] = useState<{
    totals: { collection_requests: number; completed_requests: number; open_requests: number; open_complaints: number }
    collections_monthly: any[]
    complaints_monthly: any[]
    request_status_distribution: any[]
    waste_type_distribution: any[]
    collection_volume_trends: any[]
    average_completion_hours: number
    company_performance: any[]
    area_insights: any[]
    vehicle_utilization: any[]
    route_utilization: any[]
    complaints_status_distribution: any[]
    route_status_distribution: any[]
    vehicle_status_distribution: any[]
    approvals_pending: number
    approvals_by_type: any[]
    collections_completed_monthly: any[]
  }>({
    totals: { collection_requests: 0, completed_requests: 0, open_requests: 0, open_complaints: 0 },
    collections_monthly: [],
    complaints_monthly: [],
    request_status_distribution: [],
    waste_type_distribution: [],
    collection_volume_trends: [],
    average_completion_hours: 0,
    company_performance: [],
    area_insights: [],
    vehicle_utilization: [],
    route_utilization: [],
    complaints_status_distribution: [],
    route_status_distribution: [],
    vehicle_status_distribution: [],
    approvals_pending: 0,
    approvals_by_type: [],
    collections_completed_monthly: [],
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { roles } = useRoles()
  const role = user.role ?? roles.find((item) => item.id === user.roleId) ?? ({
    id: user.roleId,
    name: "",
    slug: "",
    level: "",
    authorityType: "",
    description: "",
  } as Role)

  const totalVolumeKg = useMemo(() => {
    return (analytics.collection_volume_trends || []).reduce((acc: number, item: any) => acc + Number(item.total_weight_kg || 0), 0)
  }, [analytics.collection_volume_trends])

  const stats = useMemo(() => [
    { title: "Collection Requests", value: analytics.totals.collection_requests.toLocaleString(), change: "", trend: "up", icon: Truck },
    { title: "Completed", value: analytics.totals.completed_requests.toLocaleString(), change: "", trend: "up", icon: Target },
    { title: "Open Requests", value: analytics.totals.open_requests.toLocaleString(), change: "", trend: analytics.totals.open_requests > 0 ? "down" : "up", icon: FileText },
    { title: "Total Collected (kg)", value: totalVolumeKg.toLocaleString(), change: "", trend: "up", icon: Layers },
  ], [analytics, totalVolumeKg])

  const menuItems = [
    { id: "overview", label: "Analytics Overview", icon: PieChart },
    { id: "collections", label: "Collection Analytics", icon: BarChart3 },
    { id: "performance", label: "Performance Metrics", icon: Target },
    { id: "trends", label: "Trend Analysis", icon: LineChart },
    { id: "reports", label: "Custom Reports", icon: FileText },
    { id: "dashboards", label: "Saved Dashboards", icon: Layers },
  ]

  const chartConfig = {
    collections: {
      label: "Collections",
      color: "hsl(var(--chart-1))",
    },
    complaints: {
      label: "Complaints",
      color: "hsl(var(--chart-5))",
    },
    volume: {
      label: "Volume (kg)",
      color: "hsl(var(--chart-3))",
    },
    efficiency: {
      label: "Efficiency",
      color: "hsl(var(--chart-1))",
    },
    target: {
      label: "Target",
      color: "hsl(var(--chart-4))",
    },
  }

  const formatMonth = (value: string | null) => {
    if (!value) return "";
    const d = new Date(value)
    return d.toLocaleDateString(undefined, { month: "short", year: "2-digit" })
  }

  const collectionTrendData = useMemo(() => {
    return (analytics.collections_monthly || []).map((item: any) => ({
      month: formatMonth(item.month),
      collections: item.total,
      complaints: 0,
    }))
  }, [analytics.collections_monthly])

  const complaintsOverlay = useMemo(() => {
    return (analytics.complaints_monthly || []).reduce((acc: Record<string, number>, item: any) => {
      acc[formatMonth(item.month)] = item.total
      return acc
    }, {})
  }, [analytics.complaints_monthly])

  const mergedTrendData = useMemo(() => {
    return collectionTrendData.map((item) => ({
      ...item,
      complaints: complaintsOverlay[item.month] ?? 0,
    }))
  }, [collectionTrendData, complaintsOverlay])

  const wasteTypeData = useMemo(() => {
    return (analytics.waste_type_distribution || []).map((item: any, idx: number) => ({
      name: item.waste_type || "Unknown",
      value: item.total,
      color: `hsl(var(--chart-${(idx % 5) + 1}))`,
    }))
  }, [analytics.waste_type_distribution])

  const statusDistribution = useMemo(() => {
    return (analytics.request_status_distribution || []).map((item: any, idx: number) => ({
      name: item.status || "Unknown",
      value: item.total,
      color: `hsl(var(--chart-${(idx % 5) + 1}))`,
    }))
  }, [analytics.request_status_distribution])

  const complaintStatusData = useMemo(() => {
    return (analytics.complaints_status_distribution || []).map((item: any, idx: number) => ({
      name: item.status || "Unknown",
      value: item.total,
      color: `hsl(var(--chart-${(idx % 5) + 1}))`,
    }))
  }, [analytics.complaints_status_distribution])

  const approvalsByType = useMemo(() => {
    return (analytics.approvals_by_type || []).map((item: any) => ({
      type: item.request_type || "Unknown",
      total: item.total,
    }))
  }, [analytics.approvals_by_type])

  const routeStatusData = useMemo(() => {
    return (analytics.route_status_distribution || []).map((item: any, idx: number) => ({
      name: item.status || "Unknown",
      value: item.total,
      color: `hsl(var(--chart-${(idx % 5) + 1}))`,
    }))
  }, [analytics.route_status_distribution])

  const vehicleStatusData = useMemo(() => {
    return (analytics.vehicle_status_distribution || []).map((item: any, idx: number) => ({
      name: item.current_status || "Unknown",
      value: item.total,
      color: `hsl(var(--chart-${(idx % 5) + 1}))`,
    }))
  }, [analytics.vehicle_status_distribution])

  const volumeTrendData = useMemo(() => {
    return (analytics.collection_volume_trends || []).map((item: any) => ({
      month: formatMonth(item.month),
      volume: Number(item.total_weight_kg || 0),
    }))
  }, [analytics.collection_volume_trends])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await authorizedGet<typeof analytics>("/central/role/analytics/overview/")
        setAnalytics({
          totals: data.totals ?? { collection_requests: 0, completed_requests: 0, open_requests: 0, open_complaints: 0 },
          collections_monthly: data.collections_monthly ?? [],
          complaints_monthly: data.complaints_monthly ?? [],
          request_status_distribution: data.request_status_distribution ?? [],
          waste_type_distribution: data.waste_type_distribution ?? [],
          collection_volume_trends: data.collection_volume_trends ?? [],
          average_completion_hours: data.average_completion_hours ?? 0,
          company_performance: data.company_performance ?? [],
          area_insights: data.area_insights ?? [],
          vehicle_utilization: data.vehicle_utilization ?? [],
          route_utilization: data.route_utilization ?? [],
          complaints_status_distribution: data.complaints_status_distribution ?? [],
          route_status_distribution: data.route_status_distribution ?? [],
          vehicle_status_distribution: data.vehicle_status_distribution ?? [],
          approvals_pending: data.approvals_pending ?? 0,
          approvals_by_type: data.approvals_by_type ?? [],
          collections_completed_monthly: data.collections_completed_monthly ?? [],
        })
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to load analytics data"
        setError(msg)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-sidebar text-sidebar-foreground">
        <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold text-sm">Data & Analytics</p>
            <p className="text-xs text-sidebar-foreground/70">Reporting</p>
          </div>
        </div>
        <nav className="space-y-1 p-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                activeTab === item.id
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Top Header */}
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-background px-6">
          <div>
            <h1 className="text-xl font-semibold text-foreground">
              {menuItems.find(item => item.id === activeTab)?.label || "Dashboard"}
            </h1>
            <p className="text-sm text-muted-foreground">{role.description}</p>
          </div>
          <div className="flex items-center gap-4">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-40">
                <Calendar className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="1y">Last year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
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
                <DropdownMenuLabel>
                  <div>
                    <p>{user.name}</p>
                    <p className="text-xs font-normal text-muted-foreground">{role.name}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onLogout} className="text-destructive">
                  <XCircle className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex h-40 items-center justify-center text-muted-foreground">Loading analytics...</div>
          ) : activeTab === "overview" ? (
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
                        <span className="text-muted-foreground">{stat.change} vs last period</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Charts Row */}
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Collection Trend Chart */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Collection Trends</CardTitle>
                        <CardDescription>Collections vs complaints over time</CardDescription>
                      </div>
                      <Button variant="outline" size="sm">
                        <Download className="mr-2 h-4 w-4" />
                        Export
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={chartConfig} className="h-[300px]">
                      <RechartsLineChart data={mergedTrendData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis yAxisId="left" />
                        <YAxis yAxisId="right" orientation="right" />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Line 
                          yAxisId="left"
                          type="monotone" 
                          dataKey="collections" 
                          stroke="var(--color-collections)" 
                          strokeWidth={2}
                        />
                        <Line 
                          yAxisId="right"
                          type="monotone" 
                          dataKey="complaints" 
                          stroke="var(--color-complaints)" 
                          strokeWidth={2}
                        />
                      </RechartsLineChart>
                    </ChartContainer>
                  </CardContent>
                </Card>

                {/* Waste Type Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle>Waste Type Distribution</CardTitle>
                    <CardDescription>Breakdown by waste category</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-center h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPieChart>
                          <Pie
                            data={wasteTypeData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={2}
                            dataKey="value"
                            label={({ name, value }) => `${name}: ${value}%`}
                          >
                            {wasteTypeData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex flex-wrap justify-center gap-4 mt-4">
                      {wasteTypeData.map((type) => (
                        <div key={type.name} className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: type.color }} />
                          <span className="text-sm text-muted-foreground">{type.name}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* KPI Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Key Performance Indicators</CardTitle>
                  <CardDescription>Current performance against targets</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-lg border p-4">
                      <p className="font-medium">Collections Completed</p>
                      <p className="text-2xl font-bold mt-2">{analytics.totals.completed_requests.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">of {analytics.totals.collection_requests.toLocaleString()} total</p>
                    </div>
                    <div className="rounded-lg border p-4">
                      <p className="font-medium">Average Completion (hrs)</p>
                      <p className="text-2xl font-bold mt-2">{analytics.average_completion_hours.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">Time from request to completion</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : activeTab === "collections" ? (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Request Status Distribution</CardTitle>
                  <CardDescription>How collection requests are progressing</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center h-[320px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={statusDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {statusDistribution.map((entry, index) => (
                            <Cell key={`status-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 flex flex-wrap justify-center gap-4">
                    {statusDistribution.map((status) => (
                      <div key={status.name} className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: status.color }} />
                        <span className="text-sm text-muted-foreground">{status.name}: {status.value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Complaint Status Distribution</CardTitle>
                  <CardDescription>Live complaints grouped by status</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center h-[320px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={complaintStatusData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {complaintStatusData.map((entry, index) => (
                            <Cell key={`complaint-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 flex flex-wrap justify-center gap-4">
                    {complaintStatusData.map((status) => (
                      <div key={status.name} className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: status.color }} />
                        <span className="text-sm text-muted-foreground">{status.name}: {status.value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Collection Volume Trends</CardTitle>
                  <CardDescription>Total collected weight (kg) over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[300px]">
                    <RechartsLineChart data={volumeTrendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line type="monotone" dataKey="volume" stroke="var(--color-volume)" strokeWidth={2} />
                    </RechartsLineChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>
          ) : activeTab === "performance" ? (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Company Performance</CardTitle>
                  <CardDescription>Operational output by waste company</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {(analytics.company_performance || []).map((item: any) => (
                      <div key={item.company_id ?? item.company_name} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4">
                        <div>
                          <p className="font-medium">{item.company_name}</p>
                          <p className="text-sm text-muted-foreground">Requests: {item.total_requests} • Completed: {item.completed_requests}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-sm">
                          <Badge variant="secondary">Completion: {item.completion_rate}%</Badge>
                          <Badge variant="outline">Avg hrs: {item.avg_completion_hours}</Badge>
                          <Badge variant="outline">Weight: {Number(item.total_collected_weight_kg || 0).toLocaleString()} kg</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Vehicle Utilization</CardTitle>
                  <CardDescription>Routes, distance, and active hours</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {(analytics.vehicle_utilization || []).map((vehicle: any) => (
                      <div key={vehicle.vehicle_id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4">
                        <div>
                          <p className="font-medium">{vehicle.plate_number || `Vehicle ${vehicle.vehicle_id}`}</p>
                          <p className="text-sm text-muted-foreground">Routes: {vehicle.total_routes}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-sm">
                          <Badge variant="secondary">Distance: {Number(vehicle.total_distance_km || 0).toLocaleString()} km</Badge>
                          <Badge variant="outline">Active hrs: {Number(vehicle.total_active_hours || 0).toLocaleString()}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Vehicle Status Distribution</CardTitle>
                  <CardDescription>Active, inactive, and maintenance totals</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={vehicleStatusData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {vehicleStatusData.map((entry, index) => (
                            <Cell key={`vehicle-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 flex flex-wrap justify-center gap-4">
                    {vehicleStatusData.map((status) => (
                      <div key={status.name} className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full"  style={{ backgroundColor: status.color }} />
                        <span className="text-sm text-muted-foreground">{status.name}: {status.value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : activeTab === "trends" ? (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Area-based Collection Insights</CardTitle>
                  <CardDescription>Zone-level request volume and performance</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {(analytics.area_insights || []).map((zone: any) => (
                      <div key={zone.zone_id ?? zone.zone_name} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4">
                        <div>
                          <p className="font-medium">{zone.zone_name}</p>
                          <p className="text-sm text-muted-foreground">Requests: {zone.total_requests} • Completed: {zone.completed_requests}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-sm">
                          <Badge variant="outline">Weight: {Number(zone.total_collected_weight_kg || 0).toLocaleString()} kg</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Supervisory Approvals</CardTitle>
                  <CardDescription>Pending approvals and request types</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4 text-sm text-muted-foreground">Pending approvals: <strong>{analytics.approvals_pending}</strong></div>
                  <div className="grid gap-3">
                    {approvalsByType.map((item) => (
                      <div key={item.type} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                        <span className="font-medium">{item.type}</span>
                        <Badge variant="secondary">{item.total}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : activeTab === "reports" ? (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Service Requests</CardTitle>
                  <CardDescription>Latest collection requests across zones</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {(analytics as any).recent_requests?.map((req: any) => (
                      <div key={req.request_id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4">
                        <div>
                          <p className="font-medium">Request #{req.request_id}</p>
                          <p className="text-sm text-muted-foreground">{req.request_type} • {req.zone || "Unassigned"}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-sm">
                          <Badge variant="secondary">{req.status}</Badge>
                          <Badge variant="outline">Submitted: {new Date(req.submitted_at).toLocaleString()}</Badge>
                          {req.completed_at && <Badge variant="outline">Completed: {new Date(req.completed_at).toLocaleString()}</Badge>}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Collection Records</CardTitle>
                  <CardDescription>Completed pickups and recorded weights</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {(analytics as any).recent_collection_records?.map((record: any) => (
                      <div key={record.record_id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4">
                        <div>
                          <p className="font-medium">Record #{record.record_id}</p>
                          <p className="text-sm text-muted-foreground">Request #{record.request_id} • Truck {record.truck_id ?? "N/A"}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-sm">
                          <Badge variant="secondary">{Number(record.actual_weight_kg || 0).toLocaleString()} kg</Badge>
                          <Badge variant="outline">{new Date(record.collected_at).toLocaleString()}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : activeTab === "dashboards" ? (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Route Utilization</CardTitle>
                  <CardDescription>Operational activity by route</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {(analytics.route_utilization || []).map((route: any) => (
                      <div key={route.route_id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4">
                        <div>
                          <p className="font-medium">{route.route_name}</p>
                          <p className="text-sm text-muted-foreground">Status: {route.status}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-sm">
                          <Badge variant="secondary">Distance: {Number(route.distance_km || 0).toLocaleString()} km</Badge>
                          <Badge variant="outline">Duration: {Number(route.duration_hours || 0).toLocaleString()} hrs</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Route Status Distribution</CardTitle>
                  <CardDescription>Routes grouped by operational status</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={routeStatusData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {routeStatusData.map((entry, index) => (
                            <Cell key={`route-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 flex flex-wrap justify-center gap-4">
                    {routeStatusData.map((status) => (
                      <div key={status.name} className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full"  style={{ backgroundColor: status.color }} />
                        <span className="text-sm text-muted-foreground">{status.name}: {status.value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">
                    {menuItems.find(m => m.id === activeTab)?.label}
                  </h3>
                  <p className="mt-2 text-muted-foreground">
                    This section is under development.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
