"use client"

import React from "react"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"
import { type User, type RoleId, ROLES, ROLE_PERMISSIONS, hasPermission, getRoleRoutePath, MOCK_CENTRAL_AUTHORITY_USERS } from "./types"

interface RoleContextType {
  currentUser: User | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  checkPermission: (permission: string) => boolean
  getRedirectPath: () => string
  switchUser: (userId: string) => void // For demo purposes
}

const RoleContext = createContext<RoleContextType | undefined>(undefined)

export function RoleProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null)

  // Mock login function - in production, this would verify against database
  const login = useCallback(async (email: string, _password: string): Promise<boolean> => {
    // Find user by email in mock data
    const user = MOCK_CENTRAL_AUTHORITY_USERS.find(u => u.email === email)
    if (user) {
      setCurrentUser(user)
      return true
    }
    return false
  }, [])

  const logout = useCallback(() => {
    setCurrentUser(null)
  }, [])

  // Check if current user has a specific permission
  const checkPermission = useCallback((permission: string): boolean => {
    if (!currentUser) return false
    return hasPermission(currentUser.roleId, permission)
  }, [currentUser])

  // Get the redirect path based on user's role
  const getRedirectPath = useCallback((): string => {
    if (!currentUser) return "/central-authority"
    return getRoleRoutePath(currentUser.roleId)
  }, [currentUser])

  // Switch user for demo purposes
  const switchUser = useCallback((userId: string) => {
    const user = MOCK_CENTRAL_AUTHORITY_USERS.find(u => u.id === userId)
    if (user) {
      setCurrentUser(user)
    }
  }, [])

  return (
    <RoleContext.Provider
      value={{
        currentUser,
        isAuthenticated: currentUser !== null,
        login,
        logout,
        checkPermission,
        getRedirectPath,
        switchUser,
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
              Required roles: {allowedRoles.map(r => ROLES[r].name).join(", ")}
            </p>
          </div>
        </div>
      )
    }

    return <Component {...props} />
  }
}
