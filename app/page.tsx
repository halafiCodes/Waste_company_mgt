"use client"

import { useEffect, useState } from "react"
import { LandingPage } from "@/components/landing-page"
import { LoginModal } from "@/components/auth/login-modal"
import { SignupModal } from "@/components/auth/signup-modal"
import { CentralAuthorityEntry } from "@/components/central-authority/central-authority-entry"
import { DirectorateDashboard } from "@/components/central-authority/directorate-dashboard"
import { WasteCompanyDashboard } from "@/components/dashboards/waste-company-dashboard"
import { ResidentPortal } from "@/components/dashboards/resident-portal"
import {
  fetchMe,
  login as apiLogin,
  register as apiRegister,
  storeTokens,
  clearTokens,
  getStoredTokens,
  type ApiUser,
} from "@/lib/api/client"

export type UserRole = "central-authority" | "waste-company" | "resident" | null
export type AuthModal = "login" | "signup" | null

type SessionUser = {
  role: UserRole
  name: string
  user: ApiUser
}

const mapRole = (user: ApiUser): UserRole => {
  switch (user.user_type) {
    case "central_authority":
      return "central-authority"
    case "waste_company":
      return "waste-company"
    case "resident":
      return "resident"
    default:
      return null
  }
}

const toSessionUser = (user: ApiUser): SessionUser => {
  const fullName = `${user.first_name || ""} ${user.last_name || ""}`.trim()
  return {
    role: mapRole(user),
    name: fullName || user.username || user.email,
    user,
  }
}

export default function Home() {
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null)
  const [authModal, setAuthModal] = useState<AuthModal>(null)
  const [isHydrating, setIsHydrating] = useState(true)

  // Hydrate session if tokens exist
  useEffect(() => {
    const tokens = getStoredTokens()
    if (!tokens) {
      setIsHydrating(false)
      return
    }

    fetchMe()
      .then((user) => setCurrentUser(toSessionUser(user)))
      .catch(() => clearTokens())
        .finally(() => setIsHydrating(false))
      }, [])

  const handleLogin = async (payload: { username: string; password: string }) => {
    const result = await apiLogin(payload)
    storeTokens(result.tokens)
    setCurrentUser(toSessionUser(result.user))
    setAuthModal(null)
  }

  const handleSignup = async (payload: {
    username: string
    fullName: string
    email: string
    phone: string
    password: string
    role: UserRole
  }) => {
    if (payload.role !== "resident") {
      throw new Error("Self-signup currently supports residents. Please contact admin for other roles.")
    }

    const nameParts = payload.fullName.trim().split(" ")
    const first_name = nameParts[0] || payload.username
    const last_name = nameParts.slice(1).join(" ") || ""

    const result = await apiRegister({
      username: payload.username,
      email: payload.email,
      password: payload.password,
      phone: payload.phone,
      first_name,
      last_name,
      address: "",
      zone: null,
    })

    storeTokens(result.tokens)
    setCurrentUser(toSessionUser(result.user))
    setAuthModal(null)
  }

  const handleLogout = () => {
    clearTokens()
    setCurrentUser(null)
  }

  if (isHydrating && !currentUser) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Loading session...
      </div>
    )
  }

  if (currentUser) {
    switch (currentUser.role) {
      case "central-authority":
        // If the resolved role slug is 'directorate', take them straight to the Directorate dashboard.
        // Otherwise use the CentralAuthorityEntry to route based on role.
        if ((currentUser.user.role?.slug ?? "") === "directorate") {
          return <DirectorateDashboard user={{
            id: String(currentUser.user.id),
            name: currentUser.name,
            email: currentUser.user.email,
            roleId: 1,
            role: {
              id: 1,
              name: "Directorate",
              slug: "directorate",
              level: "Strategic / Policy",
              authorityType: "Highest decision-making body",
              description: "Define system-wide policies, rules, and objectives. Approve major system operations and changes.",
            }
          }} onLogout={handleLogout} />
        }
        return <CentralAuthorityEntry onBack={handleLogout} />
      case "waste-company":
        return <WasteCompanyDashboard user={currentUser} onLogout={handleLogout} />
      case "resident":
        return <ResidentPortal user={currentUser} onLogout={handleLogout} />
      default:
        return <LandingPage onOpenLogin={() => setAuthModal("login")} onOpenSignup={() => setAuthModal("signup")} />
    }
  }

  return (
    <>
      <LandingPage onOpenLogin={() => setAuthModal("login")} onOpenSignup={() => setAuthModal("signup")} />
      <LoginModal 
        open={authModal === "login"} 
        onClose={() => setAuthModal(null)} 
        onLogin={handleLogin}
        onSwitchToSignup={() => setAuthModal("signup")}
      />
      <SignupModal 
        open={authModal === "signup"} 
        onClose={() => setAuthModal(null)} 
        onSignup={handleSignup}
        onSwitchToLogin={() => setAuthModal("login")}
      />
    </>
  )
}
