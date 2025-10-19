"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Navigation } from "@/components/navigation"
import { getUserNotifications, getUserById, updateDocument, type Notification, type User } from "@/lib/firestore"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Heart, MessageCircle, UserPlus, Bell, Check } from "lucide-react"

export default function NotificationsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [actors, setActors] = useState<Record<string, User>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
    }
  }, [user, authLoading, router])

  useEffect(() => {
    const loadNotifications = async () => {
      if (!user) return

      try {
        const userNotifications = await getUserNotifications(user.uid)
        setNotifications(userNotifications)

        // Load actors
        const actorMap: Record<string, User> = {}
        for (const notification of userNotifications) {
          if (!actorMap[notification.actorId]) {
            const actor = await getUserById(notification.actorId)
            if (actor) {
              actorMap[notification.actorId] = actor
            }
          }
        }
        setActors(actorMap)
      } catch (error) {
        console.error("Error loading notifications:", error)
      } finally {
        setLoading(false)
      }
    }

    loadNotifications()
  }, [user])

  const markAsRead = async (notificationId: string) => {
    try {
      await updateDocument("notifications", notificationId, { read: true })
      setNotifications(notifications.map((n) => (n.id === notificationId ? { ...n, read: true } : n)))
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter((n) => !n.read)
      await Promise.all(unreadNotifications.map((n) => updateDocument("notifications", n.id, { read: true })))
      setNotifications(notifications.map((n) => ({ ...n, read: true })))
    } catch (error) {
      console.error("Error marking all as read:", error)
    }
  }

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id)

    if (notification.postId) {
      router.push(`/post/${notification.postId}`)
    } else if (notification.type === "follow") {
      router.push(`/profile/${notification.actorId}`)
    }
  }

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "like":
        return <Heart className="h-5 w-5 text-destructive" />
      case "comment":
        return <MessageCircle className="h-5 w-5 text-primary" />
      case "follow":
        return <UserPlus className="h-5 w-5 text-accent" />
      default:
        return <Bell className="h-5 w-5" />
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Cargando...</div>
      </div>
    )
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CardTitle className="text-2xl">Notificaciones</CardTitle>
                {unreadCount > 0 && <Badge variant="destructive">{unreadCount}</Badge>}
              </div>
              {unreadCount > 0 && (
                <Button onClick={markAllAsRead} variant="outline" size="sm">
                  <Check className="h-4 w-4 mr-2" />
                  Marcar todas como leídas
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12 text-muted-foreground">Cargando notificaciones...</div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No tienes notificaciones</p>
              </div>
            ) : (
              <div className="space-y-2">
                {notifications.map((notification) => {
                  const actor = actors[notification.actorId]
                  if (!actor) return null

                  return (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`flex items-start gap-3 p-4 rounded-lg cursor-pointer transition-colors ${
                        notification.read ? "bg-muted/30 hover:bg-muted/50" : "bg-accent/10 hover:bg-accent/20"
                      }`}
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={actor.avatar || "/placeholder.svg"} alt={actor.displayName} />
                        <AvatarFallback>{getInitials(actor.displayName)}</AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2">
                          <div className="flex-1">
                            <p className="text-sm">
                              <span className="font-semibold">{actor.displayName}</span>{" "}
                              <span className="text-muted-foreground">{notification.message}</span>
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {notification.createdAt.toDate().toLocaleDateString("es-ES", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                          <div className="flex-shrink-0">{getNotificationIcon(notification.type)}</div>
                        </div>
                      </div>

                      {!notification.read && (
                        <div className="flex-shrink-0">
                          <div className="h-2 w-2 rounded-full bg-primary" />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
