"use client"

import React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Recycle, Eye, EyeOff } from "lucide-react"

interface LoginModalProps {
  open: boolean
  onClose: () => void
  onLogin: (payload: { username: string; password: string }) => Promise<void>
  onSwitchToSignup: () => void
}

export function LoginModal({ open, onClose, onLogin, onSwitchToSignup }: LoginModalProps) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    
    try {
      await onLogin({ username, password })
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed"
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary">
            <Recycle className="h-8 w-8 text-primary-foreground" />
          </div>
          <DialogTitle className="text-2xl">Welcome Back</DialogTitle>
          <DialogDescription>
            Sign in to your AACMA account to continue
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="username">Email or Username</Label>
            <Input
              id="username"
              type="text"
              placeholder="admin or you@example.com"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <Button type="button" variant="link" className="px-0 text-sm">
              Forgot password?
            </Button>
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Signing in..." : "Sign In"}
          </Button>
          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}
        </form>
        <div className="mt-4 text-center text-sm">
          <span className="text-muted-foreground">{"Don't have an account? "}</span>
          <Button variant="link" className="p-0" onClick={onSwitchToSignup}>
            Create account
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
