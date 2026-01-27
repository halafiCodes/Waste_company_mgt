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
} from "lucide-react"
import { type User, ROLES } from "@/lib/rbac/types"
import { authorizedGet, authorizedPost } from "@/lib/api/client"

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
  const [userForm, setUserForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    username: "",
    user_type: "central_authority",
    role_id: 3, // System admin default
    password: "TempPass123!",
  })

  const role = ROLES[user.roleId]

  const normalize = (res: any) => (Array.isArray(res) ? res : res?.results ?? [])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const [overview, usersRes, tablesRes] = await Promise.all([
          authorizedGet<{ users: number; companies: number; vehicles: number; collection_requests: number; complaints: number }>("/central/dashboard/"),
          authorizedGet<any>("/central/users/"),
          authorizedGet<SystemTable[]>("/central/role/admin/system-data/"),
        ])
        setStatsData(overview)
        setUsers(normalize(usersRes))
        setSystemData(tablesRes)
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load overview"
        setError(message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

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
                <Card className="cursor-pointer transition-shadow hover:shadow-md">
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
                            <Button variant="outline" size="sm">
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

          {(activeTab === "companies" || activeTab === "support" || activeTab === "settings") && (
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
                  {Object.values(ROLES).map((r) => (
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
