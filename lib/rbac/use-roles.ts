"use client"

import { useEffect, useState } from "react"
import { publicGet } from "@/lib/api/client"
import type { Role } from "@/lib/rbac/types"

export function useRoles() {
  const [roles, setRoles] = useState<Role[]>([])
  const [rolesLoading, setRolesLoading] = useState(true)
  const [rolesError, setRolesError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    const load = async () => {
      setRolesLoading(true)
      setRolesError(null)
      try {
        const res = await publicGet<Role[]>("/auth/roles/")
        if (!active) return
        setRoles(Array.isArray(res) ? res : [])
      } catch (err) {
        if (!active) return
        setRolesError(err instanceof Error ? err.message : "Failed to load roles")
      } finally {
        if (active) setRolesLoading(false)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [])

  return { roles, rolesLoading, rolesError }
}
