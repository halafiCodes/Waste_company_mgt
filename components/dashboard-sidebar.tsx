"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Recycle, LogOut, ChevronLeft, Type as type, LucideIcon } from "lucide-react"

interface MenuItem {
  id: string
  label: string
  icon: LucideIcon
}

interface DashboardSidebarProps {
  isOpen: boolean
  onToggle: () => void
  menuItems: MenuItem[]
  activeItem: string
  onItemClick: (id: string) => void
  userRole: string
  userName: string
  onLogout: () => void
}

export function DashboardSidebar({
  isOpen,
  onToggle,
  menuItems,
  activeItem,
  onItemClick,
  userRole,
  userName,
  onLogout,
}: DashboardSidebarProps) {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={onToggle}
        />
      )}
      
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-sidebar text-sidebar-foreground transition-transform duration-300 lg:static lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary">
              <Recycle className="h-5 w-5 text-sidebar-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold">AACMA</span>
              <span className="text-xs text-sidebar-foreground/60">{userRole}</span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-sidebar-foreground hover:bg-sidebar-accent"
            onClick={onToggle}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4">
          {menuItems.map((item) => (
            <Button
              key={item.id}
              variant="ghost"
              className={cn(
                "w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                activeItem === item.id && "bg-sidebar-accent text-sidebar-accent-foreground"
              )}
              onClick={() => onItemClick(item.id)}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Button>
          ))}
        </nav>

        {/* User Section */}
        <div className="border-t border-sidebar-border p-4">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sidebar-primary text-sidebar-primary-foreground">
              {userName.substring(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm font-medium">{userName}</p>
              <p className="truncate text-xs text-sidebar-foreground/60">{userRole}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent hover:text-destructive"
            onClick={onLogout}
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </Button>
        </div>
      </aside>
    </>
  )
}
