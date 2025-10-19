"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Navigation } from "@/components/navigation"
import { PostCard } from "@/components/post-card"
import { getFeedPosts, getDocuments, getUserById, type Post, type User } from "@/lib/firestore"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, UserPlus, UserMinus } from "lucide-react"
import { orderBy, limit } from "firebase/firestore"
import { updateDocument } from "@/lib/firestore"

export default function SearchPage() {
  const { user, userProfile, loading: authLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchTerm, setSearchTerm] = useState(searchParams.get("q") || "")
  const [posts, setPosts] = useState<Post[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [postAuthors, setPostAuthors] = useState<Record<string, User>>({})
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<"posts" | "users">("posts")

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
    }
  }, [user, authLoading, router])

  useEffect(() => {
    const performSearch = async () => {
      if (!searchTerm.trim()) {
        setPosts([])
        setUsers([])
        return
      }

      setLoading(true)
      try {
        // Search posts
        const allPosts = await getFeedPosts(100)
        const filteredPosts = allPosts.filter(
          (post) =>
            post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
            post.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase())),
        )
        setPosts(filteredPosts)

        // Load post authors
        const authors: Record<string, User> = {}
        for (const post of filteredPosts) {
          if (!authors[post.userId]) {
            const author = await getUserById(post.userId)
            if (author) {
              authors[post.userId] = author
            }
          }
        }
        setPostAuthors(authors)

        // Search users
        const allUsers = await getDocuments<User>("users", [orderBy("createdAt", "desc"), limit(50)])
        const filteredUsers = allUsers.filter(
          (u) =>
            u.id !== user?.uid &&
            (u.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
              u.bio?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              u.skills.some((skill) => skill.toLowerCase().includes(searchTerm.toLowerCase()))),
        )
        setUsers(filteredUsers)
      } catch (error) {
        console.error("Error searching:", error)
      } finally {
        setLoading(false)
      }
    }

    const debounce = setTimeout(performSearch, 300)
    return () => clearTimeout(debounce)
  }, [searchTerm, user])

  const isFollowing = (userId: string) => {
    return userProfile?.following.includes(userId) || false
  }

  const handleFollow = async (targetUser: User) => {
    if (!user || !userProfile) return

    try {
      const following = isFollowing(targetUser.id)

      if (following) {
        await updateDocument("users", targetUser.id, {
          followers: targetUser.followers.filter((id) => id !== user.uid),
        })
        await updateDocument("users", user.uid, {
          following: userProfile.following.filter((id) => id !== targetUser.id),
        })
      } else {
        await updateDocument("users", targetUser.id, {
          followers: [...targetUser.followers, user.uid],
        })
        await updateDocument("users", user.uid, {
          following: [...userProfile.following, targetUser.id],
        })
      }

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

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">Buscar</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar publicaciones, usuarios, etiquetas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 text-lg h-12"
              autoFocus
            />
          </div>
        </div>

        {searchTerm.trim() && (
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "posts" | "users")}>
            <TabsList>
              <TabsTrigger value="posts">Publicaciones ({posts.length})</TabsTrigger>
              <TabsTrigger value="users">Usuarios ({users.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="posts" className="mt-6 space-y-4">
              {loading ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <div className="text-muted-foreground">Buscando...</div>
                  </CardContent>
                </Card>
              ) : posts.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground">No se encontraron publicaciones</p>
                  </CardContent>
                </Card>
              ) : (
                posts.map((post) => {
                  const author = postAuthors[post.userId]
                  if (!author) return null
                  return <PostCard key={post.id} post={post} author={author} />
                })
              )}
            </TabsContent>

            <TabsContent value="users" className="mt-6">
              {loading ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <div className="text-muted-foreground">Buscando...</div>
                  </CardContent>
                </Card>
              ) : users.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground">No se encontraron usuarios</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {users.map((targetUser) => (
                    <Card key={targetUser.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-3">
                          <Avatar
                            className="h-12 w-12 cursor-pointer"
                            onClick={() => router.push(`/profile/${targetUser.id}`)}
                          >
                            <AvatarImage src={targetUser.avatar || "/placeholder.svg"} alt={targetUser.displayName} />
                            <AvatarFallback>{getInitials(targetUser.displayName)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <h3
                              className="font-semibold cursor-pointer hover:text-primary truncate"
                              onClick={() => router.push(`/profile/${targetUser.id}`)}
                            >
                              {targetUser.displayName}
                            </h3>
                            {targetUser.bio && (
                              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{targetUser.bio}</p>
                            )}
                            {targetUser.skills.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {targetUser.skills.slice(0, 3).map((skill) => (
                                  <Badge key={skill} variant="secondary" className="text-xs">
                                    {skill}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                          <Button
                            onClick={() => handleFollow(targetUser)}
                            variant={isFollowing(targetUser.id) ? "outline" : "default"}
                            size="sm"
                          >
                            {isFollowing(targetUser.id) ? (
                              <UserMinus className="h-4 w-4" />
                            ) : (
                              <UserPlus className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}

        {!searchTerm.trim() && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Escribe algo para comenzar a buscar</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
