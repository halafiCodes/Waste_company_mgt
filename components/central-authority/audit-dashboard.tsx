"use client"

import { useEffect, useMemo, useState } from "react"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  BarChart3,
  Bell,
  Search,
  XCircle,
  Settings,
  ChevronDown,
  TrendingUp,
  TrendingDown,
  FileSearch,
  Filter,
  Download,
  Shield,
  Eye,
  ScrollText,
  AlertTriangle,
  Scale,
} from "lucide-react"
import { type User, type Role } from "@/lib/rbac/types"
import { authorizedGet } from "@/lib/api/client"
import { useRoles } from "@/lib/rbac/use-roles"

interface AuditDashboardProps {
  user: User
  onLogout: () => void
}

export function AuditDashboard({ user, onLogout }: AuditDashboardProps) {
  const [activeTab, setActiveTab] = useState("overview")
  const [searchQuery, setSearchQuery] = useState("")
  const [logFilter, setLogFilter] = useState("all")
  const [overview, setOverview] = useState<{ total: number; by_action: any[]; recent: any[] }>({ total: 0, by_action: [], recent: [] })
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

  const stats = useMemo(() => {
    const total = overview.total
    const failed = overview.by_action.find((b: any) => b.action === "reject")?.total ?? 0
    const approvals = overview.by_action.find((b: any) => b.action === "approve")?.total ?? 0
    const logins = overview.by_action.find((b: any) => b.action === "login")?.total ?? 0
    return [
      { title: "Total Log Entries", value: total.toLocaleString(), change: "", trend: "up", icon: ScrollText },
      { title: "Failed Actions", value: failed.toLocaleString(), change: "", trend: failed > 0 ? "down" : "up", icon: AlertTriangle },
      { title: "Approvals", value: approvals.toLocaleString(), change: "", trend: "up", icon: Scale },
      { title: "Logins", value: logins.toLocaleString(), change: "", trend: "up", icon: Eye },
    ]
  }, [overview])

  const menuItems = [
    { id: "overview", label: "Audit Overview", icon: Eye },
    { id: "logs", label: "System Logs", icon: ScrollText },
    { id: "access", label: "Access History", icon: FileSearch },
    { id: "changes", label: "Change Tracking", icon: FileSearch },
    { id: "compliance", label: "Compliance", icon: Scale },
    { id: "reports", label: "Audit Reports", icon: FileSearch },
  ]

  const normalizedLogs = useMemo(() => {
    return (overview.recent || []).map((log: any) => ({
      ...log,
      status: ["reject", "logout"].includes(log.action) ? "failed" : "success",
      user_label: log.user_email || log.user || "System",
    }))
  }, [overview.recent])

  const filteredLogs = useMemo(() => {
    const byFilter = logFilter === "all" ? normalizedLogs : normalizedLogs.filter((log: any) => log.status === logFilter)
    if (!searchQuery) return byFilter
    const q = searchQuery.toLowerCase()
    return byFilter.filter((log: any) =>
      [log.action, log.user_label, log.model_name, log.ip_address].some((val) => (val || "").toLowerCase().includes(q))
    )
  }, [logFilter, normalizedLogs, searchQuery])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await authorizedGet<typeof overview>("/central/role/audit/overview/")
        setOverview({
          total: data.total ?? 0,
          by_action: data.by_action ?? [],
          recent: data.recent ?? [],
        })
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to load audit overview"
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
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold text-sm">Audit Authority</p>
            <p className="text-xs text-sidebar-foreground/70">Compliance</p>
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
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 pl-9"
              />
            </div>
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
            <div className="flex h-40 items-center justify-center text-muted-foreground">Loading audit data...</div>
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
                        <span className="text-muted-foreground">{stat.change}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Recent Audit Logs */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Recent Activity Logs</CardTitle>
                      <CardDescription>Latest system activities and user actions</CardDescription>
                    </div>
                    <Button variant="outline" size="sm">
                      <Download className="mr-2 h-4 w-4" />
                      Export
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>IP Address</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLogs.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">No logs yet.</TableCell>
                        </TableRow>
                      ) : (
                        filteredLogs.slice(0, 10).map((log: any) => (
                          <TableRow key={log.id}>
                            <TableCell className="font-mono text-sm">{log.timestamp ? new Date(log.timestamp).toLocaleString() : ""}</TableCell>
                            <TableCell className="capitalize">{log.action}</TableCell>
                            <TableCell>{log.user_label}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{log.model_name || "-"}</Badge>
                            </TableCell>
                            <TableCell className="font-mono text-sm">{log.ip_address || "-"}</TableCell>
                            <TableCell>
                              <Badge variant={log.status === "success" ? "default" : "destructive"}>
                                {log.status === "success" ? "Success" : "Failed"}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          ) : activeTab === "logs" ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input placeholder="Search logs..." className="pl-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                  </div>
                  <Select value={logFilter} onValueChange={setLogFilter}>
                    <SelectTrigger className="w-40">
                      <Filter className="mr-2 h-4 w-4" />
                      <SelectValue placeholder="Filter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Logs</SelectItem>
                      <SelectItem value="success">Success</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Export Logs
                </Button>
              </div>

              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>IP Address</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLogs.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">No logs yet.</TableCell>
                        </TableRow>
                      ) : (
                        filteredLogs.map((log: any) => (
                          <TableRow key={log.id}>
                            <TableCell className="font-mono text-sm">{log.timestamp ? new Date(log.timestamp).toLocaleString() : ""}</TableCell>
                            <TableCell className="capitalize">{log.action}</TableCell>
                            <TableCell>{log.user_label}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{log.model_name || "-"}</Badge>
                            </TableCell>
                            <TableCell className="font-mono text-sm">{log.ip_address || "-"}</TableCell>
                            <TableCell>
                              <Badge variant={log.status === "success" ? "default" : "destructive"}>
                                {log.status === "success" ? "Success" : "Failed"}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
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
                  <p className="mt-2 text-muted-foreground">This section is under development.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
