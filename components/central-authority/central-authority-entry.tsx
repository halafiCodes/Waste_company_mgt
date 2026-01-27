"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Building2, LogIn, Shield, Users } from "lucide-react"
import { type User, type RoleId } from "@/lib/rbac/types"
import { useRoles } from "@/lib/rbac/use-roles"
import { DirectorateDashboard } from "./directorate-dashboard"
import { SupervisorDashboard } from "./supervisor-dashboard"
import { AdminDashboard } from "./admin-dashboard"
import { ITDashboard } from "./it-dashboard"
import { AuditDashboard } from "./audit-dashboard"
import { AnalyticsDashboard } from "./analytics-dashboard"
import { clearTokens, fetchMe, getStoredTokens, login, storeTokens } from "@/lib/api/client"

interface CentralAuthorityEntryProps {
  onBack: () => void
}

/**
 * Central Authority Entry Point
 * 
 * This component acts as the single entry point for the Central Authority module.
 * It handles authentication and automatically routes users to their appropriate
 * dashboard based on their role_id.
 * 
 * RBAC Logic:
 * - Role 1 (Directorate) → /central-authority/directorate
 * - Role 2 (Supervisory Authority) → /central-authority/supervisor
 * - Role 3 (System Administrator) → /central-authority/admin
 * - Role 4 (Technical/IT Authority) → /central-authority/it
 * - Role 5 (Audit & Compliance Authority) → /central-authority/audit
 * - Role 6 (Data & Analytics Authority) → /central-authority/analytics
 */
export function CentralAuthorityEntry({ onBack }: CentralAuthorityEntryProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [selectedUserId, setSelectedUserId] = useState<string>("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { roles } = useRoles()
  const usernameByRole: Record<string, { username: string; password: string }> = {
    directorate: { username: "directorate_admin", password: "Passw0rd!2026" },
    supervisor: { username: "supervisor_ca", password: "Passw0rd!2026" },
    admin: { username: "admin", password: "admin1234" },
    it: { username: "it_ca", password: "Passw0rd!2026" },
    audit: { username: "audit_ca", password: "Passw0rd!2026" },
    analytics: { username: "analytics_ca", password: "Passw0rd!2026" },
  }

  // Auto-resume session if tokens exist
  useEffect(() => {
    const tokens = getStoredTokens()
    if (!tokens) return
    const load = async () => {
      try {
        const apiUser = await fetchMe()
        const role = apiUser.role
        if (!role?.id || apiUser.user_type !== "central_authority") {
          setError("Your account is not a central authority role.")
          clearTokens()
          return
        }
        setCurrentUser({
          id: String(apiUser.id),
          name: `${apiUser.first_name} ${apiUser.last_name}`.trim() || apiUser.username,
          email: apiUser.email,
          roleId: role.id as RoleId,
          role: {
            id: role.id as RoleId,
            name: role.name ?? "",
            slug: role.slug ?? "",
            level: "",
            authorityType: "",
            description: role.description ?? "",
          },
        })
      } catch (err) {
        clearTokens()
      }
    }
    load()
  }, [])

  // Handle login
  const handleLogin = async () => {
    setIsLoading(true)
    setError("")

    try {
      const auth = await login({ username: email.trim(), password: password.trim() })
      storeTokens(auth.tokens)
      const role = auth.user.role
      if (!role?.id || auth.user.user_type !== "central_authority") {
        setError("Your account does not have a central authority role.")
        clearTokens()
        return
      }
      setCurrentUser({
        id: String(auth.user.id),
        name: `${auth.user.first_name} ${auth.user.last_name}`.trim() || auth.user.username,
        email: auth.user.email,
        roleId: role.id as RoleId,
        role: {
          id: role.id as RoleId,
          name: role.name ?? "",
          slug: role.slug ?? "",
          level: "",
          authorityType: "",
          description: role.description ?? "",
        },
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Login failed"
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }

  // Demo: Quick login as specific role
  const handleDemoLogin = async () => {
    setIsLoading(true)
    setError("")
    try {
      if (!selectedUserId) {
        setError("Please select a role to demo")
        return
      }
      const role = roles.find((r) => String(r.id) === selectedUserId)
      if (!role) {
        setError("Invalid selection")
        return
      }
      // Map demo role to a real backend demo account
      const creds = usernameByRole[role.slug]
      if (!creds) {
        setError("Demo credentials not configured for this role.")
        return
      }
      const auth = await login({ username: creds.username, password: creds.password })
      storeTokens(auth.tokens)
      const resolvedRole = auth.user.role
      if (!resolvedRole?.id || auth.user.user_type !== "central_authority") {
        setError("Demo account is not a central authority role.")
        clearTokens()
        return
      }
      setCurrentUser({
        id: String(auth.user.id),
        name: `${auth.user.first_name} ${auth.user.last_name}`.trim() || auth.user.username,
        email: auth.user.email,
        roleId: resolvedRole.id as RoleId,
        role: {
          id: resolvedRole.id as RoleId,
          name: resolvedRole.name ?? "",
          slug: resolvedRole.slug ?? "",
          level: "",
          authorityType: "",
          description: resolvedRole.description ?? "",
        },
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Demo login failed"
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }

  // Logout handler
  const handleLogout = () => {
    setCurrentUser(null)
    setEmail("")
    setPassword("")
    setSelectedUserId("")
    setError("")
    clearTokens()
  }

  // If user is logged in, render the appropriate dashboard based on their role
  if (currentUser) {
    const roleId = currentUser.roleId

    switch (roleId) {
      case 1:
        return <DirectorateDashboard user={currentUser} onLogout={handleLogout} />
      case 2:
        return <SupervisorDashboard user={currentUser} onLogout={handleLogout} />
      case 3:
        return <AdminDashboard user={currentUser} onLogout={handleLogout} />
      case 4:
        return <ITDashboard user={currentUser} onLogout={handleLogout} />
      case 5:
        return <AuditDashboard user={currentUser} onLogout={handleLogout} />
      case 6:
        return <AnalyticsDashboard user={currentUser} onLogout={handleLogout} />
      default:
        return (
          <div className="flex h-screen items-center justify-center bg-background">
            <Card className="w-[400px]">
              <CardContent className="pt-6 text-center">
                <p className="text-destructive">Unknown role. Please contact administrator.</p>
                <Button onClick={handleLogout} className="mt-4">Back to Login</Button>
              </CardContent>
            </Card>
          </div>
        )
    }
  }

  // Login screen
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <Building2 className="h-8 w-8" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Central Authority Portal</h1>
          <p className="text-muted-foreground">AACMA Management System</p>
        </div>

        {/* Login Card */}
        <Card>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>
              Enter your credentials to access your dashboard. You will be automatically
              routed based on your assigned role.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email or username</Label>
              <Input
                id="email"
                type="text"
                placeholder="you@aacma.gov.et"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <Button 
              className="w-full" 
              onClick={handleLogin}
              disabled={isLoading || !email || !password}
            >
              <LogIn className="mr-2 h-4 w-4" />
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or demo as</span>
              </div>
            </div>

            {/* Demo Login */}
            <div className="space-y-3">
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role to demo" />
                </SelectTrigger>
                <SelectContent>
                  {roles.filter((r) => Boolean(usernameByRole[r.slug])).map((role) => (
                    <SelectItem key={role.id} value={String(role.id)}>
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        <span>{role.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                variant="outline" 
                className="w-full bg-transparent"
                onClick={handleDemoLogin}
                disabled={!selectedUserId}
              >
                <Users className="mr-2 h-4 w-4" />
                Login as Selected Role
              </Button>
            </div>

            <Button 
              variant="ghost" 
              className="w-full"
              onClick={onBack}
            >
              Back to Home
            </Button>
          </CardContent>
        </Card>

        {/* Role Reference */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Available Roles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {roles.map((role) => (
                <div key={role.id} className="flex items-center gap-2 text-sm">
                  <div className={`h-2 w-2 rounded-full ${
                    role.id === 1 ? "bg-primary" :
                    role.id === 2 ? "bg-warning" :
                    role.id === 3 ? "bg-chart-2" :
                    role.id === 4 ? "bg-chart-4" :
                    role.id === 5 ? "bg-chart-3" : "bg-chart-1"
                  }`} />
                  <span className="text-muted-foreground">{role.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
