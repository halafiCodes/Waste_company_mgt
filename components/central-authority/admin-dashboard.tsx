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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Users,
  BarChart3,
  Bell,
  Search,
  MoreHorizontal,
  Plus,
  CheckCircle,
  XCircle,
  Settings,
  ChevronDown,
  TrendingUp,
  TrendingDown,
  FileText,
  Building2,
  Database,
  UserPlus,
  Edit,
  Trash2,
  Key,
  Cog,
  Download,
  RefreshCw,
  ShieldCheck,
} from "lucide-react"
import { type User, type Role } from "@/lib/rbac/types"
import { authorizedGet, authorizedPost } from "@/lib/api/client"
import { useRoles } from "@/lib/rbac/use-roles"

interface AdminDashboardProps {
  user: User
  onLogout: () => void
}

type SystemUser = {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  user_type: string
  role?: { name?: string; slug?: string }
  is_active: boolean
  last_login?: string | null
  date_joined?: string
}

type SystemTable = {
  table: string
  records: number
  last_updated?: string | null
}

export function AdminDashboard({ user, onLogout }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState("overview")
  const [searchQuery, setSearchQuery] = useState("")
  const [showUserModal, setShowUserModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<SystemUser | null>(null)
  const [statsData, setStatsData] = useState<{ users: number; companies: number; vehicles: number; collection_requests: number; complaints: number } | null>(null)
  const [users, setUsers] = useState<SystemUser[]>([])
  const [systemData, setSystemData] = useState<SystemTable[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submittingUser, setSubmittingUser] = useState(false)
  const [companies, setCompanies] = useState<any[]>([])
  const [companiesLoading, setCompaniesLoading] = useState(false)
  const [reports, setReports] = useState<any[]>([])
  const [reportModalOpen, setReportModalOpen] = useState(false)
  const today = useMemo(() => new Date(), [])
  const startOfMonth = useMemo(() => {
    const d = new Date()
    d.setDate(1)
    return d
  }, [])
  const [reportForm, setReportForm] = useState({
    title: "City Operations",
    period_start: startOfMonth.toISOString().substring(0, 10),
    period_end: today.toISOString().substring(0, 10),
  })
  const [reportSubmitting, setReportSubmitting] = useState(false)
  const [dataPreview, setDataPreview] = useState<{ table: string; rows: any[] } | null>(null)
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [supportStatus, setSupportStatus] = useState<string | null>(null)
  const [userForm, setUserForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    username: "",
    user_type: "central_authority",
    role_id: 3, // System admin default
    password: "TempPass123!",
  })

  const { roles } = useRoles()
  const role = user.role ?? roles.find((item) => item.id === user.roleId) ?? ({
    id: user.roleId,
    name: "",
    slug: "",
    level: "",
    authorityType: "",
    description: "",
  } as Role)

  const normalize = (res: any) => (Array.isArray(res) ? res : res?.results ?? [])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const [overview, usersRes, tablesRes, reportsRes] = await Promise.all([
          authorizedGet<{ users: number; companies: number; vehicles: number; collection_requests: number; complaints: number }>("/central/dashboard/"),
          authorizedGet<any>("/central/users/"),
          authorizedGet<SystemTable[]>("/central/role/admin/system-data/"),
          authorizedGet<any>("/central/reports/citywide/"),
        ])
        setStatsData(overview)
        setUsers(normalize(usersRes))
        setSystemData(tablesRes)
        setReports(normalize(reportsRes))
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load overview"
        setError(message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  useEffect(() => {
    if (activeTab !== "companies" || companies.length > 0 || companiesLoading) return
    const loadCompanies = async () => {
      setCompaniesLoading(true)
      try {
        const res = await authorizedGet<any>("/central/companies/")
        setCompanies(normalize(res))
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load companies")
      } finally {
        setCompaniesLoading(false)
      }
    }
    loadCompanies()
  }, [activeTab, companies.length, companiesLoading])

  const stats = useMemo(() => {
    const d = statsData || { users: 0, companies: 0, vehicles: 0, collection_requests: 0, complaints: 0 }
    return [
      { title: "Total Users", value: `${d.users}`, icon: Users },
      { title: "Companies", value: `${d.companies}`, icon: Building2 },
      { title: "Vehicles", value: `${d.vehicles}`, icon: Database },
      { title: "Requests", value: `${d.collection_requests}`, icon: FileText },
    ]
  }, [statsData])

  const handleCreateUser = async () => {
    setSubmittingUser(true)
    setError(null)
    try {
      await authorizedPost("/central/users/", {
        username: userForm.username || userForm.email.split("@")[0],
        email: userForm.email,
        first_name: userForm.first_name,
        last_name: userForm.last_name,
        user_type: userForm.user_type,
        role_id: userForm.role_id,
        password: userForm.password,
      })
      setShowUserModal(false)
      setUserForm({
        first_name: "",
        last_name: "",
        email: "",
        username: "",
        user_type: "central_authority",
        role_id: 3,
        password: "TempPass123!",
      })
      const refreshedUsers = await authorizedGet<any>("/central/users/")
      setUsers(normalize(refreshedUsers))
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to create user"
      setError(msg)
    } finally {
      setSubmittingUser(false)
    }
  }

  const handleGenerateReport = async () => {
    setReportSubmitting(true)
    setError(null)
    try {
      const payload = {
        title: reportForm.title || "City Operations",
        period_start: reportForm.period_start,
        period_end: reportForm.period_end,
      }
      const created = await authorizedPost<any>("/central/reports/citywide/generate/", payload)
      setReports((prev) => [created, ...prev].slice(0, 10))
      setReportModalOpen(false)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to generate report"
      setError(msg)
    } finally {
      setReportSubmitting(false)
    }
  }

  const handleCompanyAction = async (companyId: number, action: "approve" | "reject" | "suspend") => {
    try {
      await authorizedPost(`/central/companies/${companyId}/${action}/`, {})
      const refreshed = await authorizedGet<any>("/central/companies/")
      setCompanies(normalize(refreshed))
    } catch (err) {
      const msg = err instanceof Error ? err.message : `Failed to ${action} company`
      setError(msg)
    }
  }

  const supportedPreviews: Record<string, string> = {
    users: "/central/users/",
    companies: "/central/companies/",
    collection_requests: "/central/collections/",
    complaints: "/central/complaints/list/",
  }

  const handleManageTable = async (table: string) => {
    if (!supportedPreviews[table]) {
      setDataPreview({ table, rows: [{ detail: "Preview not available for this table" }] })
      return
    }
    setLoadingPreview(true)
    try {
      const res = await authorizedGet<any>(supportedPreviews[table])
      setDataPreview({ table, rows: normalize(res).slice(0, 10) })
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load preview"
      setDataPreview({ table, rows: [{ error: msg }] })
    } finally {
      setLoadingPreview(false)
    }
  }

  const handleSupportTask = async (task: "health" | "backup") => {
    setSupportStatus(null)
    try {
      if (task === "health") {
        const res = await authorizedGet<any>("/central/system/health/")
        setSupportStatus(`Health: ${res.status ?? "ok"}`)
      } else {
        await authorizedPost("/central/system/backup/", {})
        setSupportStatus("Backup triggered")
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Support task failed"
      setSupportStatus(msg)
    }
  }

  const toggleUserActive = async (id: number, active: boolean) => {
    try {
      await authorizedPost(`/central/users/${id}/${active ? "activate" : "suspend"}/`, {})
      const refreshedUsers = await authorizedGet<any>("/central/users/")
      setUsers(normalize(refreshedUsers))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update user")
    }
  }

  const exportCSV = (rows: any[], filename: string) => {
    if (!rows || rows.length === 0) return
    const headers = Object.keys(rows[0])
    const csv = [headers.join(","), ...rows.map((row) => headers.map((h) => JSON.stringify(row[h] ?? "")).join(","))].join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
  }

  const menuItems = [
    { id: "overview", label: "Operations Overview", icon: BarChart3 },
    { id: "users", label: "User Management", icon: Users },
    { id: "data", label: "Data Management", icon: Database },
    { id: "companies", label: "Company Data", icon: Building2 },
    { id: "support", label: "Support Tasks", icon: Settings },
    { id: "settings", label: "System Config", icon: Cog },
  ]

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-sidebar text-sidebar-foreground">
        <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <Cog className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold text-sm">System Admin</p>
            <p className="text-xs text-sidebar-foreground/70">Operations</p>
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
        {loading && (
          <div className="flex h-full items-center justify-center text-muted-foreground">Loading overview...</div>
        )}
        {error && !loading && (
          <div className="flex h-full items-center justify-center">
            <Card className="max-w-md">
              <CardHeader>
                <CardTitle>Unable to load overview</CardTitle>
                <CardDescription>{error}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => window.location.reload()}>Retry</Button>
              </CardContent>
            </Card>
          </div>
        )}
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
                placeholder="Search users, data..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 pl-9"
              />
            </div>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                3
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

              {/* Quick Actions */}
              <div className="grid gap-4 md:grid-cols-3">
                <Card className="cursor-pointer transition-shadow hover:shadow-md" onClick={() => setActiveTab("users")}>
                  <CardContent className="flex items-center gap-4 p-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                      <UserPlus className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">Add New User</p>
                      <p className="text-sm text-muted-foreground">Create user accounts</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="cursor-pointer transition-shadow hover:shadow-md" onClick={() => setActiveTab("data")}>
                  <CardContent className="flex items-center gap-4 p-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                      <Database className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">Manage Data</p>
                      <p className="text-sm text-muted-foreground">Update system records</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="cursor-pointer transition-shadow hover:shadow-md" onClick={() => setReportModalOpen(true)}>
                  <CardContent className="flex items-center gap-4 p-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                      <FileText className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">Generate Report</p>
                      <p className="text-sm text-muted-foreground">Create operational reports</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Users */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent User Activity</CardTitle>
                  <CardDescription>Users who logged in recently</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Last Login</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.slice(0, 5).map((sysUser) => (
                        <TableRow key={sysUser.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback>{`${sysUser.first_name?.[0] ?? ""}${sysUser.last_name?.[0] ?? ""}` || sysUser.username.substring(0, 2)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{`${sysUser.first_name} ${sysUser.last_name}`.trim() || sysUser.username}</p>
                                <p className="text-xs text-muted-foreground">{sysUser.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{sysUser.role?.name || sysUser.user_type}</TableCell>
                          <TableCell>-</TableCell>
                          <TableCell>{sysUser.last_login ? new Date(sysUser.last_login).toLocaleString() : "—"}</TableCell>
                          <TableCell>
                            <Badge variant={sysUser.is_active ? "default" : "secondary"}>
                              {sysUser.is_active ? "active" : "inactive"}
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
                  <CardTitle>Recent City Reports</CardTitle>
                  <CardDescription>Latest generated city-wide reports</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Period</TableHead>
                        <TableHead>Generated</TableHead>
                        <TableHead>Requests</TableHead>
                        <TableHead className="text-right">Export</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reports.slice(0, 5).map((r) => (
                        <TableRow key={r.id}>
                          <TableCell>{r.title}</TableCell>
                          <TableCell>
                            {r.period_start} – {r.period_end}
                          </TableCell>
                          <TableCell>{new Date(r.created_at).toLocaleString()}</TableCell>
                          <TableCell>{r.total_requests ?? r.total_waste_generated_tons ?? "—"}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="outline" size="sm" onClick={() => exportCSV([r], `report-${r.id}.csv`)}>
                              <Download className="mr-2 h-4 w-4" /> CSV
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {reports.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground">
                            No reports yet. Generate one to populate this list.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "users" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Search users..." className="pl-9" />
                </div>
                <Button onClick={() => setShowUserModal(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add User
                </Button>
              </div>

              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Last Login</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((sysUser) => (
                        <TableRow key={sysUser.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback>{`${sysUser.first_name?.[0] ?? ""}${sysUser.last_name?.[0] ?? ""}` || sysUser.username.substring(0, 2)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{`${sysUser.first_name} ${sysUser.last_name}`.trim() || sysUser.username}</p>
                                <p className="text-xs text-muted-foreground">{sysUser.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{sysUser.role?.name || sysUser.user_type}</Badge>
                          </TableCell>
                          <TableCell>-</TableCell>
                          <TableCell>
                            <Badge variant={sysUser.is_active ? "default" : "secondary"}>
                              {sysUser.is_active ? "active" : "inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell>{sysUser.last_login ? new Date(sysUser.last_login).toLocaleString() : "—"}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit User
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Key className="mr-2 h-4 w-4" />
                                  Reset Password
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive">
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete User
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

          {activeTab === "data" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>System Data Tables</CardTitle>
                  <CardDescription>Overview of data managed in the system</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Table Name</TableHead>
                        <TableHead>Total Records</TableHead>
                        <TableHead>Last Updated</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {systemData.map((data) => (
                        <TableRow key={data.table}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Database className="h-4 w-4 text-muted-foreground" />
                              <span className="font-mono">{data.table}</span>
                            </div>
                          </TableCell>
                          <TableCell>{data.records.toLocaleString()}</TableCell>
                          <TableCell>{data.last_updated ? new Date(data.last_updated).toLocaleString() : "—"}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="outline" size="sm" onClick={() => handleManageTable(data.table)}>
                              Manage
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "companies" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold">Registered Companies</h3>
                  <p className="text-sm text-muted-foreground">Approve, reject, or review status</p>
                </div>
                <Button variant="outline" onClick={() => setCompanies([])} disabled={companiesLoading}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
                </Button>
              </div>
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>License</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Registered</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {companies.map((company) => (
                        <TableRow key={company.id}>
                          <TableCell>
                            <div className="font-semibold">{company.name}</div>
                            <div className="text-xs text-muted-foreground">{company.contact_email}</div>
                          </TableCell>
                          <TableCell>{company.license_number}</TableCell>
                          <TableCell>
                            <Badge variant={company.status === "approved" ? "default" : company.status === "pending" ? "secondary" : "outline"}>
                              {company.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{company.registration_date ? new Date(company.registration_date).toLocaleDateString() : "—"}</TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button size="sm" variant="outline" onClick={() => handleCompanyAction(company.id, "approve")}>Approve</Button>
                            <Button size="sm" variant="outline" onClick={() => handleCompanyAction(company.id, "reject")}>Reject</Button>
                            <Button size="sm" variant="ghost" onClick={() => handleCompanyAction(company.id, "suspend")}>Suspend</Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {companies.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground">
                            {companiesLoading ? "Loading companies..." : "No companies found."}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "support" && (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold">System Health</CardTitle>
                    <CardDescription>Check core services</CardDescription>
                  </CardHeader>
                  <CardContent className="flex items-center justify-between">
                    <ShieldCheck className="h-10 w-10 text-primary" />
                    <Button size="sm" onClick={() => handleSupportTask("health")}>Run Check</Button>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold">Trigger Backup</CardTitle>
                    <CardDescription>Log a backup action</CardDescription>
                  </CardHeader>
                  <CardContent className="flex items-center justify-between">
                    <Database className="h-10 w-10 text-primary" />
                    <Button size="sm" variant="outline" onClick={() => handleSupportTask("backup")}>Trigger</Button>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>User Status</CardTitle>
                  <CardDescription>Quickly suspend or activate accounts</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.slice(0, 10).map((u) => (
                        <TableRow key={u.id}>
                          <TableCell>{u.username}</TableCell>
                          <TableCell>{u.role?.name || u.user_type}</TableCell>
                          <TableCell>
                            <Badge variant={u.is_active ? "default" : "secondary"}>{u.is_active ? "active" : "inactive"}</Badge>
                          </TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button size="sm" variant="outline" onClick={() => toggleUserActive(u.id, true)}>Activate</Button>
                            <Button size="sm" variant="ghost" onClick={() => toggleUserActive(u.id, false)}>Suspend</Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
              {supportStatus && (
                <p className="text-sm text-muted-foreground">{supportStatus}</p>
              )}
            </div>
          )}

          {activeTab === "settings" && (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                System configuration placeholders. Extend with environment toggles, integrations, and audit settings.
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* Generate Report Modal */}
      <Dialog open={reportModalOpen} onOpenChange={setReportModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Generate City Report</DialogTitle>
            <DialogDescription>Select a period and title for the report</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reportTitle">Title</Label>
              <Input
                id="reportTitle"
                value={reportForm.title}
                onChange={(e) => setReportForm({ ...reportForm, title: e.target.value })}
                placeholder="City Operations"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="periodStart">Start</Label>
                <Input
                  id="periodStart"
                  type="date"
                  value={reportForm.period_start}
                  onChange={(e) => setReportForm({ ...reportForm, period_start: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="periodEnd">End</Label>
                <Input
                  id="periodEnd"
                  type="date"
                  value={reportForm.period_end}
                  onChange={(e) => setReportForm({ ...reportForm, period_end: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleGenerateReport} disabled={reportSubmitting}>
              {reportSubmitting ? "Generating..." : "Generate"}
            </Button>
            <Button variant="outline" onClick={() => setReportModalOpen(false)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Data Preview Modal */}
      <Dialog open={!!dataPreview} onOpenChange={() => setDataPreview(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Table Preview: {dataPreview?.table}</DialogTitle>
            <DialogDescription>Showing up to 10 rows</DialogDescription>
          </DialogHeader>
          <div className="max-h-96 overflow-auto rounded-md border bg-muted p-3 text-xs">
            {loadingPreview ? "Loading..." : <pre className="whitespace-pre-wrap">{JSON.stringify(dataPreview?.rows, null, 2)}</pre>}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => dataPreview?.rows && exportCSV(dataPreview.rows, `${dataPreview.table}-preview.csv`)}
              disabled={!dataPreview?.rows || dataPreview.rows.length === 0}
            >
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            <Button onClick={() => setDataPreview(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add User Modal */}
      <Dialog open={showUserModal} onOpenChange={setShowUserModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Create a new user account in the system
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  placeholder="Enter first name"
                  value={userForm.first_name}
                  onChange={(e) => setUserForm({ ...userForm, first_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  placeholder="Enter last name"
                  value={userForm.last_name}
                  onChange={(e) => setUserForm({ ...userForm, last_name: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={userForm.email}
                onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                placeholder="username"
                value={userForm.username}
                onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Temporary password"
                value={userForm.password}
                onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={String(userForm.role_id)}
                onValueChange={(value) => setUserForm({ ...userForm, role_id: Number(value) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((r) => (
                    <SelectItem key={r.id} value={String(r.id)}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Company</Label>
              <Input disabled placeholder="Company linking not yet implemented" />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleCreateUser} disabled={submittingUser}>
              {submittingUser ? "Creating..." : "Create User"}
            </Button>
            <Button variant="outline" onClick={() => setShowUserModal(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
