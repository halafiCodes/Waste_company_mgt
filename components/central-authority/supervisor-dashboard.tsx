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
import { Textarea } from "@/components/ui/textarea"
import {
  Users,
  AlertTriangle,
  BarChart3,
  Bell,
  Search,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Settings,
  ChevronDown,
  TrendingUp,
  TrendingDown,
  FileText,
  Eye,
  Shield,
  Clock,
  UserX,
  Flag,
  ClipboardCheck,
} from "lucide-react"
import { type User, ROLES } from "@/lib/rbac/types"
import { authorizedGet } from "@/lib/api/client"

interface SupervisorDashboardProps {
  user: User
  onLogout: () => void
}

export function SupervisorDashboard({ user, onLogout }: SupervisorDashboardProps) {
  const [activeTab, setActiveTab] = useState("overview")
  const [searchQuery, setSearchQuery] = useState("")
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null)
  const [requests, setRequests] = useState<any[]>([])
  const [escalations, setEscalations] = useState<any[]>([])
  const [overview, setOverview] = useState({ pending_approvals: 0, pending_companies: 0, escalations: 0 })
  const [flaggedUsers, setFlaggedUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const role = ROLES[user.roleId]
  const stats = useMemo(() => [
    { title: "Pending Reviews", value: `${requests.filter(r => r.status === "pending").length}`, change: "", trend: "up", icon: ClipboardCheck },
    { title: "Active Escalations", value: `${overview.escalations}`, change: "", trend: "up", icon: AlertTriangle },
    { title: "Flagged Users", value: `${flaggedUsers.length}`, change: "", trend: "down", icon: Flag },
    { title: "Approved Today", value: `${requests.filter(r => r.status === "approved").length}`, change: "", trend: "up", icon: CheckCircle },
  ], [flaggedUsers.length, overview.escalations, requests])

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [overviewRes, requestsRes, escalationsRes] = await Promise.all([
        authorizedGet<typeof overview>("/central/role/supervisor/overview/"),
        authorizedGet<any>("/central/role/supervisor/requests/"),
        authorizedGet<any>("/central/role/supervisor/escalations/"),
      ])
      setOverview(overviewRes)
      const norm = (res: any) => (Array.isArray(res) ? res : res?.results ?? [])
      setRequests(norm(requestsRes))
      setEscalations(norm(escalationsRes))
      setFlaggedUsers([])
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load supervisor data"
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const menuItems = [
    { id: "overview", label: "Monitoring Overview", icon: Eye },
    { id: "requests", label: "Pending Requests", icon: ClipboardCheck },
    { id: "escalations", label: "Escalations", icon: AlertTriangle },
    { id: "users", label: "User Oversight", icon: Users },
    { id: "compliance", label: "Compliance", icon: Shield },
    { id: "reports", label: "Activity Reports", icon: FileText },
  ]

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-muted-foreground">
        Loading supervisor data...
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-sidebar text-sidebar-foreground">
        <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <Eye className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold text-sm">Supervisory</p>
            <p className="text-xs text-sidebar-foreground/70">Oversight & Control</p>
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
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 pl-9"
              />
            </div>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs text-destructive-foreground">
                {escalations.length}
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
          {error && (
            <div className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

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
                        {stat.trend === "up" ? (
                          <TrendingUp className={`h-4 w-4 ${stat.title.includes("Escalation") || stat.title.includes("Flagged") ? "text-destructive" : "text-green-600"}`} />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-green-600" />
                        )}
                        <span className="text-muted-foreground">{stat.change} from yesterday</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Recent Escalations */}
              <Card>
                <CardHeader>
                  <CardTitle>Active Escalations</CardTitle>
                  <CardDescription>Issues requiring immediate attention</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                      {escalations.map((escalation) => (
                      <div key={escalation.id} className="flex items-center justify-between rounded-lg border p-4">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                            escalation.priority === "emergency" ? "bg-destructive/10" :
                            escalation.priority === "high" ? "bg-warning/10" : "bg-muted"
                          }`}>
                            <AlertTriangle className={`h-5 w-5 ${
                              escalation.priority === "emergency" ? "text-destructive" :
                              escalation.priority === "high" ? "text-warning" : "text-muted-foreground"
                            }`} />
                          </div>
                          <div>
                            <p className="font-medium">{escalation.issue}</p>
                            <p className="text-sm text-muted-foreground">From: {escalation.from}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant={
                            escalation.priority === "emergency" ? "destructive" :
                            escalation.priority === "high" ? "secondary" : "outline"
                          }>
                            {escalation.priority}
                          </Badge>
                          <Button size="sm">Handle</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Pending Requests Quick View */}
              <Card>
                <CardHeader>
                  <CardTitle>Pending Requests</CardTitle>
                  <CardDescription>Requests awaiting your approval</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Request ID</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Submitted By</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {requests.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">
                            No pending requests right now.
                          </TableCell>
                        </TableRow>
                      ) : (
                        (requests.slice(0, 5)).map((request) => (
                          <TableRow key={request.id}>
                            <TableCell className="font-mono">{request.id}</TableCell>
                            <TableCell>{request.type}</TableCell>
                            <TableCell>{request.submitted_by || request.submittedBy || "Unknown"}</TableCell>
                            <TableCell>
                              <Badge variant={
                                request.priority === "high" ? "destructive" :
                                request.priority === "normal" ? "secondary" : "outline"
                              }>
                                {request.priority}
                              </Badge>
                            </TableCell>
                            <TableCell>{request.date ? new Date(request.date).toLocaleDateString() : "-"}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button size="sm" variant="outline" className="bg-transparent text-destructive">
                                  <XCircle className="h-4 w-4" />
                                </Button>
                                <Button size="sm">
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "users" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Flagged Users</CardTitle>
                  <CardDescription>Users requiring oversight action</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Flagged Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {flaggedUsers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                            No flagged users at the moment.
                          </TableCell>
                        </TableRow>
                      ) : (
                        flaggedUsers.map((flaggedUser) => (
                          <TableRow key={flaggedUser.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback>{flaggedUser.name.substring(0, 2)}</AvatarFallback>
                                </Avatar>
                                <span className="font-medium">{flaggedUser.name}</span>
                              </div>
                            </TableCell>
                            <TableCell>{flaggedUser.company}</TableCell>
                            <TableCell>
                              <span className="text-destructive">{flaggedUser.reason}</span>
                            </TableCell>
                            <TableCell>{flaggedUser.flaggedDate}</TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem>
                                    <Eye className="mr-2 h-4 w-4" />
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Clear Flag
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="text-destructive">
                                    <UserX className="mr-2 h-4 w-4" />
                                    Suspend User
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          {(activeTab === "requests" || activeTab === "escalations" || activeTab === "compliance" || activeTab === "reports") && (
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
