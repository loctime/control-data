"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { getUserById, getUserPosts, updateDocument, type User, type Post } from "@/lib/firestore"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserPlus, UserMinus, Settings, Calendar } from "lucide-react"
import type { Timestamp } from "firebase/firestore"

export default function ProfilePage() {
  const params = useParams()
  const router = useRouter()
  const { user: currentUser, userProfile: currentUserProfile } = useAuth()
  const [profile, setProfile] = useState<User | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [isFollowing, setIsFollowing] = useState(false)

  const userId = params.userId as string
  const isOwnProfile = currentUser?.uid === userId

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const userProfile = await getUserById(userId)
        if (userProfile) {
          setProfile(userProfile)
          // Check if current user is following this profile
          if (currentUser && userProfile.followers.includes(currentUser.uid)) {
            setIsFollowing(true)
          }
        }

        const userPosts = await getUserPosts(userId)
        setPosts(userPosts)
      } catch (error) {
        console.error("Error loading profile:", error)
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [userId, currentUser])

  const handleFollow = async () => {
    if (!currentUser || !profile || !currentUserProfile) return

    try {
      if (isFollowing) {
        // Unfollow
        await updateDocument("users", profile.id, {
          followers: profile.followers.filter((id) => id !== currentUser.uid),
        })
        await updateDocument("users", currentUser.uid, {
          following: currentUserProfile.following.filter((id) => id !== profile.id),
        })
        setIsFollowing(false)
        setProfile({
          ...profile,
          followers: profile.followers.filter((id) => id !== currentUser.uid),
        })
      } else {
        // Follow
        await updateDocument("users", profile.id, {
          followers: [...profile.followers, currentUser.uid],
        })
        await updateDocument("users", currentUser.uid, {
          following: [...currentUserProfile.following, profile.id],
        })
        setIsFollowing(true)
        setProfile({
          ...profile,
          followers: [...profile.followers, currentUser.uid],
        })
      }
    } catch (error) {
      console.error("Error following/unfollowing:", error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Cargando perfil...</div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Usuario no encontrado</h2>
          <Button onClick={() => router.push("/")}>Volver al inicio</Button>
        </div>
      </div>
    )
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const formatDate = (timestamp: Timestamp) => {
    return timestamp.toDate().toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
    })
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
            <Avatar className="h-24 w-24 border-4 border-background">
              <AvatarImage src={profile.avatar || "/placeholder.svg"} alt={profile.displayName} />
              <AvatarFallback className="text-2xl">{getInitials(profile.displayName)}</AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-center gap-4 mb-3">
                <h1 className="text-3xl font-bold">{profile.displayName}</h1>
                {isOwnProfile ? (
                  <Button variant="outline" onClick={() => router.push("/profile/edit")}>
                    <Settings className="h-4 w-4 mr-2" />
                    Editar perfil
                  </Button>
                ) : (
                  <Button onClick={handleFollow} variant={isFollowing ? "outline" : "default"}>
                    {isFollowing ? (
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
                )}
              </div>

              <div className="flex gap-6 mb-3 text-sm">
                <div>
                  <span className="font-bold">{posts.length}</span>{" "}
                  <span className="text-muted-foreground">publicaciones</span>
                </div>
                <div>
                  <span className="font-bold">{profile.followers.length}</span>{" "}
                  <span className="text-muted-foreground">seguidores</span>
                </div>
                <div>
                  <span className="font-bold">{profile.following.length}</span>{" "}
                  <span className="text-muted-foreground">siguiendo</span>
                </div>
              </div>

              {profile.bio && <p className="text-muted-foreground mb-3">{profile.bio}</p>}

              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                <Calendar className="h-4 w-4" />
                <span>Se unió en {formatDate(profile.createdAt)}</span>
              </div>

              {profile.skills.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((skill) => (
                    <Badge key={skill} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        <Tabs defaultValue="posts" className="w-full">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="posts">Publicaciones</TabsTrigger>
            <TabsTrigger value="about">Acerca de</TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="mt-6">
            {posts.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">
                    {isOwnProfile ? "Aún no has publicado nada" : "Este usuario no ha publicado nada aún"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {posts.map((post) => (
                  <Card key={post.id}>
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={profile.avatar || "/placeholder.svg"} alt={profile.displayName} />
                          <AvatarFallback>{getInitials(profile.displayName)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold">{profile.displayName}</p>
                          <p className="text-sm text-muted-foreground">
                            {post.createdAt.toDate().toLocaleDateString("es-ES")}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="whitespace-pre-wrap mb-3">{post.content}</p>
                      {post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {post.tags.map((tag) => (
                            <Badge key={tag} variant="outline">
                              #{tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="about" className="mt-6">
            <Card>
              <CardHeader>
                <h3 className="text-xl font-semibold">Información</h3>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Email</h4>
                  <p className="text-muted-foreground">{profile.email}</p>
                </div>
                {profile.bio && (
                  <div>
                    <h4 className="font-semibold mb-2">Biografía</h4>
                    <p className="text-muted-foreground">{profile.bio}</p>
                  </div>
                )}
                {profile.skills.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Habilidades</h4>
                    <div className="flex flex-wrap gap-2">
                      {profile.skills.map((skill) => (
                        <Badge key={skill} variant="secondary">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <h4 className="font-semibold mb-2">Miembro desde</h4>
                  <p className="text-muted-foreground">{formatDate(profile.createdAt)}</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
