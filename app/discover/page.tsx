"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { getDocuments, updateDocument, type User } from "@/lib/firestore"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { UserPlus, UserMinus, Search } from "lucide-react"
import { orderBy, limit } from "firebase/firestore"

export default function DiscoverPage() {
  const { user, userProfile } = useAuth()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const allUsers = await getDocuments<User>("users", [orderBy("createdAt", "desc"), limit(50)])
        // Filter out current user
        const otherUsers = allUsers.filter((u) => u.id !== user?.uid)
        setUsers(otherUsers)
        setFilteredUsers(otherUsers)
      } catch (error) {
        console.error("Error loading users:", error)
      } finally {
        setLoading(false)
      }
    }

    loadUsers()
  }, [user])

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredUsers(users)
    } else {
      const filtered = users.filter(
        (u) =>
          u.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          u.bio?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          u.skills.some((skill) => skill.toLowerCase().includes(searchTerm.toLowerCase())),
      )
      setFilteredUsers(filtered)
    }
  }, [searchTerm, users])

  const isFollowing = (userId: string) => {
    return userProfile?.following.includes(userId) || false
  }

  const handleFollow = async (targetUser: User) => {
    if (!user || !userProfile) return

    try {
      const following = isFollowing(targetUser.id)

      if (following) {
        // Unfollow
        await updateDocument("users", targetUser.id, {
          followers: targetUser.followers.filter((id) => id !== user.uid),
        })
        await updateDocument("users", user.uid, {
          following: userProfile.following.filter((id) => id !== targetUser.id),
        })
      } else {
        // Follow
        await updateDocument("users", targetUser.id, {
          followers: [...targetUser.followers, user.uid],
        })
        await updateDocument("users", user.uid, {
          following: [...userProfile.following, targetUser.id],
        })
      }

      // Update local state
      setUsers(
        users.map((u) =>
          u.id === targetUser.id
            ? {
                ...u,
                followers: following ? u.followers.filter((id) => id !== user.uid) : [...u.followers, user.uid],
              }
            : u,
        ),
      )
    } catch (error) {
      console.error("Error following/unfollowing:", error)
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Cargando usuarios...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Descubrir Usuarios</h1>
          <p className="text-muted-foreground">Encuentra personas con intereses similares</p>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar por nombre, biografía o habilidades..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Users Grid */}
        {filteredUsers.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No se encontraron usuarios</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUsers.map((targetUser) => (
              <Card key={targetUser.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex flex-col items-center text-center gap-3">
                    <Avatar
                      className="h-20 w-20 cursor-pointer"
                      onClick={() => router.push(`/profile/${targetUser.id}`)}
                    >
                      <AvatarImage src={targetUser.avatar || "/placeholder.svg"} alt={targetUser.displayName} />
                      <AvatarFallback className="text-lg">{getInitials(targetUser.displayName)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3
                        className="font-semibold text-lg cursor-pointer hover:text-primary"
                        onClick={() => router.push(`/profile/${targetUser.id}`)}
                      >
                        {targetUser.displayName}
                      </h3>
                      {targetUser.bio && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{targetUser.bio}</p>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {targetUser.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1 justify-center">
                      {targetUser.skills.slice(0, 3).map((skill) => (
                        <Badge key={skill} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                      {targetUser.skills.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{targetUser.skills.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                  <div className="flex gap-4 justify-center text-sm text-muted-foreground">
                    <div>
                      <span className="font-semibold text-foreground">{targetUser.followers.length}</span> seguidores
                    </div>
                    <div>
                      <span className="font-semibold text-foreground">{targetUser.following.length}</span> siguiendo
                    </div>
                  </div>

                  <Button
                    onClick={() => handleFollow(targetUser)}
                    variant={isFollowing(targetUser.id) ? "outline" : "default"}
                    className="w-full"
                    size="sm"
                  >
                    {isFollowing(targetUser.id) ? (
                      <>
                        <UserMinus className="h-4 w-4 mr-2" />
                        Dejar de seguir
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Seguir
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
