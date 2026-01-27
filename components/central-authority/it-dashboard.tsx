"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
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
  BarChart3,
  Bell,
  Search,
  Settings,
  XCircle,
  ChevronDown,
  TrendingUp,
  TrendingDown,
  Server,
  Database,
  Wifi,
  Shield,
  HardDrive,
  Activity,
  Download,
  Terminal,
  Monitor,
} from "lucide-react"
import { type User, type Role } from "@/lib/rbac/types"
import { authorizedGet } from "@/lib/api/client"
import { useRoles } from "@/lib/rbac/use-roles"

interface ITDashboardProps {
  user: User
  onLogout: () => void
}

const MOCK_SERVERS = [
  { id: 1, name: "App Server 1", status: "healthy", cpu: 42, memory: 58, uptime: "12d", location: "DC-1" },
  { id: 2, name: "DB Server", status: "healthy", cpu: 55, memory: 67, uptime: "21d", location: "DC-1" },
  { id: 3, name: "Cache Node", status: "warning", cpu: 70, memory: 72, uptime: "5d", location: "DC-2" },
]

export function ITDashboard({ user, onLogout }: ITDashboardProps) {
  const [activeTab, setActiveTab] = useState("overview")
  const [searchQuery, setSearchQuery] = useState("")
  const [status, setStatus] = useState<{ uptime_seconds: number; db_size_bytes: number | null; latest_backup: string | null; security_events: any[] }>({ uptime_seconds: 0, db_size_bytes: null, latest_backup: null, security_events: [] })
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
    const hours = Math.floor(status.uptime_seconds / 3600)
    const dbSizeMb = status.db_size_bytes ? (status.db_size_bytes / (1024 * 1024)).toFixed(1) + " MB" : "—"
    return [
      { title: "Uptime", value: `${hours}h`, change: "", trend: "up", icon: Activity },
      { title: "DB Size", value: dbSizeMb, change: "", trend: "neutral", icon: Database },
      { title: "Latest Backup", value: status.latest_backup ? new Date(status.latest_backup).toLocaleString() : "None", change: "", trend: status.latest_backup ? "up" : "down", icon: HardDrive },
      { title: "Security Events", value: `${status.security_events.length}`, change: "", trend: status.security_events.length > 0 ? "down" : "up", icon: Shield },
    ]
  }, [status])

  const menuItems = [
    { id: "overview", label: "System Overview", icon: Monitor },
    { id: "servers", label: "Server Status", icon: Server },
    { id: "database", label: "Database", icon: Database },
    { id: "backups", label: "Backups", icon: HardDrive },
    { id: "security", label: "Security", icon: Shield },
    { id: "network", label: "Network", icon: Wifi },
  ]

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await authorizedGet<typeof status>("/central/role/it/status/")
        setStatus({
          uptime_seconds: data.uptime_seconds ?? 0,
          db_size_bytes: data.db_size_bytes ?? null,
          latest_backup: data.latest_backup ?? null,
          security_events: data.security_events ?? [],
        })
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to load IT status"
        setError(msg)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const criticalEvents = useMemo(() => (status.security_events || []).filter((e: any) => (e.action || "").includes("reject")), [status.security_events])

  return (
    <div className="flex h-screen bg-background">
      <aside className="w-64 border-r bg-sidebar text-sidebar-foreground">
        <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <Terminal className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold text-sm">IT Authority</p>
            <p className="text-xs text-sidebar-foreground/70">Infrastructure</p>
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

      <main className="flex-1 overflow-auto">
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
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 pl-9"
              />
            </div>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-warning text-xs text-warning-foreground">
                {criticalEvents.length}
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

        <div className="p-6">
          {error && (
            <div className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex h-40 items-center justify-center text-muted-foreground">Loading IT status...</div>
          ) : activeTab === "overview" ? (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => (
                  <Card key={stat.title}>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                      <stat.icon className="h-5 w-5 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{stat.value}</div>
                      <div className="flex items-center gap-1 text-sm">
                        {stat.trend === "up" && <TrendingUp className="h-4 w-4 text-green-600" />}
                        {stat.trend === "down" && <TrendingDown className="h-4 w-4 text-red-600" />}
                        <span className="text-muted-foreground">{stat.change}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Security Events</CardTitle>
                      <CardDescription>Recent security-related activities</CardDescription>
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
                        <TableHead>Action</TableHead>
                        <TableHead>Model</TableHead>
                        <TableHead>IP</TableHead>
                        <TableHead>Timestamp</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(status.security_events || []).length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-sm text-muted-foreground">No security events recorded.</TableCell>
                        </TableRow>
                      ) : (
                        status.security_events.map((event: any) => (
                          <TableRow key={event.id}>
                            <TableCell className="capitalize">{event.action || "-"}</TableCell>
                            <TableCell>{event.model_name || "-"}</TableCell>
                            <TableCell className="font-mono text-sm">{event.ip_address || "-"}</TableCell>
                            <TableCell className="font-mono text-sm">{event.timestamp ? new Date(event.timestamp).toLocaleString() : ""}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          ) : activeTab === "servers" ? (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>All Servers</CardTitle>
                  <CardDescription>Detailed server information and controls</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Server</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>CPU</TableHead>
                        <TableHead>Memory</TableHead>
                        <TableHead>Uptime</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {MOCK_SERVERS.map((server) => (
                        <TableRow key={server.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Server className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{server.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={server.status === "healthy" ? "default" : "secondary"}>{server.status}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="w-20">
                              <Progress value={server.cpu} className="h-2" />
                              <span className="text-xs text-muted-foreground">{server.cpu}%</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="w-20">
                              <Progress value={server.memory} className="h-2" />
                              <span className="text-xs text-muted-foreground">{server.memory}%</span>
                            </div>
                          </TableCell>
                          <TableCell>{server.uptime}</TableCell>
                          <TableCell>{server.location}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="outline" size="sm">Manage</Button>
                          </TableCell>
                        </TableRow>
                      ))}
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
