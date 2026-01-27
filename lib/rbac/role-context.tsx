"use client"

import React from "react"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"
import { type User, type RoleId, ROLE_PERMISSIONS, hasPermission, getRoleRoutePath } from "./types"
import { login as apiLogin, fetchMe, storeTokens, clearTokens } from "@/lib/api/client"

interface RoleContextType {
  currentUser: User | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  checkPermission: (permission: string) => boolean
  getRedirectPath: () => string
}

const RoleContext = createContext<RoleContextType | undefined>(undefined)

export function RoleProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null)

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    const auth = await apiLogin({ username: email, password })
    storeTokens(auth.tokens)
    const apiUser = await fetchMe()
    if (!apiUser.role?.id) {
      clearTokens()
      return false
    }
    setCurrentUser({
      id: String(apiUser.id),
      name: `${apiUser.first_name} ${apiUser.last_name}`.trim() || apiUser.username,
      email: apiUser.email,
      roleId: apiUser.role.id as RoleId,
      role: {
        id: apiUser.role.id as RoleId,
        name: apiUser.role.name ?? "",
        slug: apiUser.role.slug ?? "",
        level: "",
        authorityType: "",
        description: apiUser.role.description ?? "",
      },
    })
    return true
  }, [])

  const logout = useCallback(() => {
    setCurrentUser(null)
    clearTokens()
  }, [])

  // Check if current user has a specific permission
  const checkPermission = useCallback((permission: string): boolean => {
    if (!currentUser) return false
    return hasPermission(currentUser.roleId, permission)
  }, [currentUser])

  // Get the redirect path based on user's role
  const getRedirectPath = useCallback((): string => {
    if (!currentUser) return "/central-authority"
    return getRoleRoutePath(currentUser.role)
  }, [currentUser])

  return (
    <RoleContext.Provider
      value={{
        currentUser,
        isAuthenticated: currentUser !== null,
        login,
        logout,
        checkPermission,
        getRedirectPath,
      }}
    >
      {children}
    </RoleContext.Provider>
  )
}

export function useRole() {
  const context = useContext(RoleContext)
  if (context === undefined) {
    throw new Error("useRole must be used within a RoleProvider")
  }
  return context
}

// Higher-order component for protecting routes based on role
export function withRoleProtection<P extends object>(
  Component: React.ComponentType<P>,
  allowedRoles: RoleId[]
) {
  return function ProtectedComponent(props: P) {
    const { currentUser, isAuthenticated } = useRole()

    if (!isAuthenticated || !currentUser) {
      return (
        <div className="flex h-screen items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground">Access Denied</h2>
            <p className="text-muted-foreground">Please log in to access this page.</p>
          </div>
        </div>
      )
    }

    if (!allowedRoles.includes(currentUser.roleId)) {
      return (
        <div className="flex h-screen items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground">Unauthorized</h2>
            <p className="text-muted-foreground">
              You do not have permission to access this page.
              <br />
              Required roles: {allowedRoles.join(", ")}
            </p>
          </div>
        </div>
      )
    }

    return <Component {...props} />
  }
}
