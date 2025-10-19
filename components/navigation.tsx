"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Home, Compass, PlusSquare, User, LogOut, Settings, Search, Hash, Bell, Activity } from "lucide-react"
import { useEffect, useState } from "react"
import { getUnreadNotificationCount } from "@/lib/firestore"

export function Navigation() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, userProfile, signOut } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    const loadUnreadCount = async () => {
      if (user) {
        const count = await getUnreadNotificationCount(user.uid)
        setUnreadCount(count)
      }
    }

    loadUnreadCount()
    // Poll for new notifications every 30 seconds
    const interval = setInterval(loadUnreadCount, 30000)
    return () => clearInterval(interval)
  }, [user])

  const handleSignOut = async () => {
    await signOut()
    router.push("/login")
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const navItems = [
    { href: "/", icon: Home, label: "Inicio" },
    { href: "/discover", icon: Compass, label: "Descubrir" },
    { href: "/tags", icon: Hash, label: "Temas" },
    { href: "/search", icon: Search, label: "Buscar" },
    { href: "/create", icon: PlusSquare, label: "Crear" },
  ]

  return (
    <nav className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">K</span>
            </div>
            <span className="font-bold text-xl hidden sm:inline">KnowledgeNet</span>
          </Link>

          {/* Navigation Items */}
          <div className="flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Button key={item.href} variant={isActive ? "default" : "ghost"} size="sm" asChild className="gap-2">
                  <Link href={item.href}>
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{item.label}</span>
                  </Link>
                </Button>
              )
            })}

            {user && (
              <Button
                variant={pathname === "/notifications" ? "default" : "ghost"}
                size="sm"
                asChild
                className="gap-2 relative"
              >
                <Link href="/notifications">
                  <Bell className="h-4 w-4" />
                  <span className="hidden sm:inline">Notificaciones</span>
                  {unreadCount > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                    >
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </Badge>
                  )}
                </Link>
              </Button>
            )}
          </div>

          {/* User Menu */}
          {user && userProfile ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={userProfile.avatar || "/placeholder.svg"} alt={userProfile.displayName} />
                    <AvatarFallback>{getInitials(userProfile.displayName)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="flex items-center gap-2 p-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={userProfile.avatar || "/placeholder.svg"} alt={userProfile.displayName} />
                    <AvatarFallback>{getInitials(userProfile.displayName)}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <p className="text-sm font-medium">{userProfile.displayName}</p>
                    <p className="text-xs text-muted-foreground">{userProfile.email}</p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push(`/profile/${user.uid}`)}>
                  <User className="mr-2 h-4 w-4" />
                  Mi perfil
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/activity")}>
                  <Activity className="mr-2 h-4 w-4" />
                  Mi actividad
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/profile/edit")}>
                  <Settings className="mr-2 h-4 w-4" />
                  Configuración
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Cerrar sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild size="sm">
              <Link href="/login">Iniciar sesión</Link>
            </Button>
          )}
        </div>
      </div>
    </nav>
  )
}
