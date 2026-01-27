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
import { Textarea } from "@/components/ui/textarea"
import {
  Users,
  AlertTriangle,
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
  Shield,
  Crown,
  Gavel,
  Globe,
} from "lucide-react"
import { type User, type Role } from "@/lib/rbac/types"
import { useRoles } from "@/lib/rbac/use-roles"
import { authorizedGet, authorizedPost } from "@/lib/api/client"

type Policy = {
  id: number
  title: string
  category: string
  status: string
  effectiveDate?: string
  description?: string
}

type Approval = {
  id: number
  requestType: string
  itemName: string
  status: string
  requestedByName: string
  approverName?: string
  createdAt?: string
  decidedAt?: string
  decisionNotes?: string
}

type CityReport = {
  id: number
  title: string
  period_start?: string
  period_end?: string
  created_at?: string
  total_requests?: number
  total_waste_generated_tons?: number
  completion_rate?: number
}

interface DirectorateDashboardProps {
  user: User
  onLogout: () => void
}


export function DirectorateDashboard({ user, onLogout }: DirectorateDashboardProps) {
  const [activeTab, setActiveTab] = useState("overview")
  const [searchQuery, setSearchQuery] = useState("")
  const [showPolicyModal, setShowPolicyModal] = useState(false)
  const [policies, setPolicies] = useState<Policy[]>([])
  const [approvals, setApprovals] = useState<Approval[]>([])
  const [reports, setReports] = useState<CityReport[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submittingPolicy, setSubmittingPolicy] = useState(false)
  const [processingApprovalId, setProcessingApprovalId] = useState<number | null>(null)
  const [reportModalOpen, setReportModalOpen] = useState(false)
  const [reportSubmitting, setReportSubmitting] = useState(false)
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
  const [policyForm, setPolicyForm] = useState({
    title: "",
    category: "Environmental",
    description: "",
    effectiveDate: "",
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

  const normalizeList = (res: any) => (Array.isArray(res) ? res : res?.results ?? [])

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [policyRes, approvalRes, reportRes] = await Promise.all([
        authorizedGet<any>("/central/governance/policies/"),
        authorizedGet<any>("/central/governance/approvals/"),
        authorizedGet<any>("/central/reports/citywide/"),
      ])

      const normalizedPolicies: Policy[] = normalizeList(policyRes).map((p: any) => ({
        id: p.id,
        title: p.title,
        category: p.category,
        status: p.status,
        effectiveDate: p.effective_date ?? p.effectiveDate ?? "",
        description: p.description,
      }))

      const normalizedApprovals: Approval[] = normalizeList(approvalRes).map((a: any) => ({
        id: a.id,
        requestType: a.request_type,
        itemName: a.item_name,
        status: a.status,
        requestedByName: a.requested_by_name,
        approverName: a.approver_name,
        createdAt: a.created_at,
        decidedAt: a.decided_at,
        decisionNotes: a.decision_notes,
      }))

      setPolicies(normalizedPolicies)
      setApprovals(normalizedApprovals)
      setReports(normalizeList(reportRes))
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load data"
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const stats = useMemo(() => {
    const activePolicies = policies.filter((p) => p.status === "active").length
    const draftPolicies = policies.filter((p) => p.status === "draft").length
    const pendingApprovals = approvals.filter((a) => a.status === "pending").length
    return [
      { title: "Active Policies", value: `${activePolicies}`, change: "", trend: "up", icon: FileText },
      { title: "Draft Policies", value: `${draftPolicies}`, change: "", trend: "up", icon: Globe },
      { title: "Pending Approvals", value: `${pendingApprovals}`, change: "", trend: pendingApprovals ? "up" : "down", icon: Gavel },
      { title: "Total Policies", value: `${policies.length}`, change: "", trend: "up", icon: Users },
    ]
  }, [approvals, policies])

  const initiatives = useMemo(() => {
    const grouped = policies.reduce<Record<string, { total: number; active: number }>>((acc, policy) => {
      const key = policy.category || "General"
      if (!acc[key]) acc[key] = { total: 0, active: 0 }
      acc[key].total += 1
      if (policy.status === "active") acc[key].active += 1
      return acc
    }, {})
    return Object.entries(grouped).map(([category, values], index) => {
      const progress = values.total ? Math.round((values.active / values.total) * 100) : 0
      const status = progress >= 70 ? "on_track" : progress >= 40 ? "at_risk" : "delayed"
      return {
        id: `CAT-${index + 1}`,
        name: `${category} Policy Program`,
        progress,
        status,
        total: values.total,
      }
    })
  }, [policies])

  const handleCreatePolicy = async () => {
    setSubmittingPolicy(true)
    setError(null)
    try {
      await authorizedPost("/central/governance/policies/", {
        title: policyForm.title || "Untitled Policy",
        category: policyForm.category,
        description: policyForm.description,
        effective_date: policyForm.effectiveDate || null,
      })
      setPolicyForm({ title: "", category: "Environmental", description: "", effectiveDate: "" })
      setShowPolicyModal(false)
      await loadData()
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create policy"
      setError(message)
    } finally {
      setSubmittingPolicy(false)
    }
  }

  const handleApprovalAction = async (id: number, action: "approve" | "reject") => {
    setProcessingApprovalId(id)
    setError(null)
    try {
      await authorizedPost(`/central/governance/approvals/${id}/${action}/`, {})
      await loadData()
    } catch (err) {
      const message = err instanceof Error ? err.message : `Failed to ${action} request`
      setError(message)
    } finally {
      setProcessingApprovalId(null)
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
      await authorizedPost("/central/reports/citywide/generate/", payload)
      setReportModalOpen(false)
      await loadData()
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to generate report"
      setError(message)
    } finally {
      setReportSubmitting(false)
    }
  }

  const formatDate = (value?: string) => {
    if (!value) return "—"
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) return value
    return parsed.toLocaleDateString()
  }

  const menuItems = [
    { id: "overview", label: "Strategic Overview", icon: BarChart3 },
    { id: "policies", label: "Policies & Rules", icon: FileText },
    { id: "approvals", label: "Approvals", icon: Gavel },
    { id: "initiatives", label: "Strategic Initiatives", icon: Globe },
    { id: "roles", label: "Role Management", icon: Shield },
    { id: "reports", label: "Executive Reports", icon: Crown },
  ]

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-muted-foreground">
        Loading central authority data...
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-sidebar text-sidebar-foreground">
        <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <Crown className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold text-sm">Directorate</p>
            <p className="text-xs text-sidebar-foreground/70">Strategic Authority</p>
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
                {approvals.length}
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
            <div className="mb-4 flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertTriangle className="h-4 w-4" />
              <span>{error}</span>
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
                        {stat.trend === "up" && <TrendingUp className="h-4 w-4 text-green-600" />}
                        {stat.trend === "down" && <TrendingDown className="h-4 w-4 text-green-600" />}
                        <span className="text-muted-foreground">
                          {stat.change ? `${stat.change} from last month` : "Live data"}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Pending Approvals */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Pending Approvals</CardTitle>
                    <CardDescription>Items requiring your authorization</CardDescription>
                  </div>
                  <Badge variant="destructive">{approvals.length} Pending</Badge>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {approvals.length === 0 && (
                      <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                        No pending approvals right now.
                      </div>
                    )}
                    {approvals.map((approval) => (
                      <div key={approval.id} className="flex flex-col gap-3 rounded-lg border p-4 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                            <Gavel className="h-5 w-5 text-warning" />
                          </div>
                          <div>
                            <p className="font-medium">{approval.itemName}</p>
                            <p className="text-sm text-muted-foreground">
                              {approval.requestType} - Requested by {approval.requestedByName}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm text-muted-foreground">{formatDate(approval.createdAt)}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-destructive bg-transparent"
                            onClick={() => handleApprovalAction(approval.id, "reject")}
                            disabled={processingApprovalId === approval.id}
                          >
                            <XCircle className="mr-1 h-4 w-4" />
                            Reject
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleApprovalAction(approval.id, "approve")}
                            disabled={processingApprovalId === approval.id}
                          >
                            <CheckCircle className="mr-1 h-4 w-4" />
                            Approve
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Strategic Initiatives Progress */}
              <Card>
                <CardHeader>
                  <CardTitle>Strategic Initiatives</CardTitle>
                  <CardDescription>Progress on major city-wide programs</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {initiatives.length === 0 && (
                      <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                        No initiatives yet. Create policies to build programs.
                      </div>
                    )}
                    {initiatives.map((initiative) => (
                      <div key={initiative.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{initiative.name}</span>
                            <Badge variant={
                              initiative.status === "on_track" ? "default" :
                              initiative.status === "at_risk" ? "secondary" : "destructive"
                            }>
                              {initiative.status.replace("_", " ")}
                            </Badge>
                          </div>
                          <span className="text-sm text-muted-foreground">Policies: {initiative.total}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="h-2 flex-1 rounded-full bg-secondary">
                            <div
                              className={`h-2 rounded-full ${
                                initiative.status === "on_track" ? "bg-primary" :
                                initiative.status === "at_risk" ? "bg-warning" : "bg-destructive"
                              }`}
                              style={{ width: `${initiative.progress}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium w-12">{initiative.progress}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "policies" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Search policies..." className="pl-9" />
                </div>
                <Button onClick={() => setShowPolicyModal(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Policy
                </Button>
              </div>

              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Policy ID</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Effective Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {policies.map((policy) => (
                        <TableRow key={policy.id}>
                          <TableCell className="font-mono">{policy.id}</TableCell>
                          <TableCell className="font-medium">{policy.title}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{policy.category}</Badge>
                          </TableCell>
                          <TableCell>{formatDate(policy.effectiveDate)}</TableCell>
                          <TableCell>
                            <Badge variant={
                              policy.status === "active" ? "default" :
                              policy.status === "draft" ? "secondary" : "outline"
                            }>
                              {policy.status.replace("_", " ")}
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
                                <DropdownMenuItem>
                                  <FileText className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Settings className="mr-2 h-4 w-4" />
                                  Edit Policy
                                </DropdownMenuItem>
                                {policy.status === "draft" && (
                                  <DropdownMenuItem className="text-green-600">
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Publish
                                  </DropdownMenuItem>
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

          {activeTab === "roles" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <p className="text-muted-foreground">Manage system roles and permissions</p>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Role
                </Button>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {roles.map((role) => (
                  <Card key={role.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{role.name}</CardTitle>
                        <Badge variant={role.id === 1 ? "default" : "secondary"}>
                          Level {role.id}
                        </Badge>
                      </div>
                      <CardDescription>{role.description || role.level || "Role"}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">{role.description}</p>
                      <div className="flex justify-end">
                        <Button variant="outline" size="sm">
                          <Settings className="mr-2 h-4 w-4" />
                          Configure
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {activeTab === "approvals" && (
            <Card>
              <CardHeader>
                <CardTitle>Approvals</CardTitle>
                <CardDescription>Review and act on pending requests</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Requested By</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Decision</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {approvals.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">
                          No approvals to display.
                        </TableCell>
                      </TableRow>
                    )}
                    {approvals.map((approval) => (
                      <TableRow key={approval.id}>
                        <TableCell className="font-medium">{approval.itemName}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{approval.requestType}</Badge>
                        </TableCell>
                        <TableCell>{approval.requestedByName}</TableCell>
                        <TableCell>
                          <Badge variant={
                            approval.status === "approved" ? "default" :
                            approval.status === "pending" ? "secondary" : "destructive"
                          }>
                            {approval.status.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell>{approval.approverName || "—"}</TableCell>
                        <TableCell className="text-right">
                          {approval.status === "pending" ? (
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-destructive bg-transparent"
                                onClick={() => handleApprovalAction(approval.id, "reject")}
                                disabled={processingApprovalId === approval.id}
                              >
                                <XCircle className="mr-1 h-4 w-4" />
                                Reject
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleApprovalAction(approval.id, "approve")}
                                disabled={processingApprovalId === approval.id}
                              >
                                <CheckCircle className="mr-1 h-4 w-4" />
                                Approve
                              </Button>
                            </div>
                          ) : (
                            <div className="text-sm text-muted-foreground">{formatDate(approval.decidedAt)}</div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {activeTab === "initiatives" && (
            <Card>
              <CardHeader>
                <CardTitle>Strategic Initiatives</CardTitle>
                <CardDescription>Programs derived from policy coverage</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {initiatives.length === 0 && (
                    <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                      No initiatives yet. Create policies to build programs.
                    </div>
                  )}
                  {initiatives.map((initiative) => (
                    <div key={initiative.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{initiative.name}</span>
                          <Badge variant={
                            initiative.status === "on_track" ? "default" :
                            initiative.status === "at_risk" ? "secondary" : "destructive"
                          }>
                            {initiative.status.replace("_", " ")}
                          </Badge>
                        </div>
                        <span className="text-sm text-muted-foreground">Policies: {initiative.total}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="h-2 flex-1 rounded-full bg-secondary">
                          <div
                            className={`h-2 rounded-full ${
                              initiative.status === "on_track" ? "bg-primary" :
                              initiative.status === "at_risk" ? "bg-warning" : "bg-destructive"
                            }`}
                            style={{ width: `${initiative.progress}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium w-12">{initiative.progress}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "reports" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Executive Reports</h3>
                  <p className="text-sm text-muted-foreground">City-wide performance summaries</p>
                </div>
                <Button onClick={() => setReportModalOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Generate Report
                </Button>
              </div>
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Period</TableHead>
                        <TableHead>Requests</TableHead>
                        <TableHead>Completion</TableHead>
                        <TableHead>Generated</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reports.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                            No executive reports yet.
                          </TableCell>
                        </TableRow>
                      )}
                      {reports.map((report) => (
                        <TableRow key={report.id}>
                          <TableCell className="font-medium">{report.title}</TableCell>
                          <TableCell>
                            {report.period_start} – {report.period_end}
                          </TableCell>
                          <TableCell>{report.total_requests ?? report.total_waste_generated_tons ?? "—"}</TableCell>
                          <TableCell>{report.completion_rate ? `${report.completion_rate}%` : "—"}</TableCell>
                          <TableCell>{formatDate(report.created_at)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
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

      {/* Create Policy Modal */}
      <Dialog open={showPolicyModal} onOpenChange={setShowPolicyModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Policy</DialogTitle>
            <DialogDescription>
              Define a new system-wide policy or rule
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Policy Title</Label>
              <Input
                id="title"
                placeholder="Enter policy title"
                value={policyForm.title}
                onChange={(e) => setPolicyForm({ ...policyForm, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={policyForm.category}
                onValueChange={(value) => setPolicyForm({ ...policyForm, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Environmental">Environmental</SelectItem>
                  <SelectItem value="Operations">Operations</SelectItem>
                  <SelectItem value="Financial">Financial</SelectItem>
                  <SelectItem value="Transport">Transport</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the policy objectives and requirements"
                rows={4}
                value={policyForm.description}
                onChange={(e) => setPolicyForm({ ...policyForm, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="effectiveDate">Effective Date</Label>
              <Input
                id="effectiveDate"
                type="date"
                value={policyForm.effectiveDate}
                onChange={(e) => setPolicyForm({ ...policyForm, effectiveDate: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPolicyModal(false)}>Cancel</Button>
            <Button
              onClick={handleCreatePolicy}
              disabled={submittingPolicy}
            >
              {submittingPolicy ? "Creating..." : "Create Policy"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
