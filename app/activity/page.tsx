"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Navigation } from "@/components/navigation"
import { getUserPosts, getFeedPosts, getUserById, type Post, type User } from "@/lib/firestore"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Heart, MessageCircle, TrendingUp, Calendar } from "lucide-react"

export default function ActivityPage() {
  const { user, userProfile, loading: authLoading } = useAuth()
  const router = useRouter()
  const [myPosts, setMyPosts] = useState<Post[]>([])
  const [likedPosts, setLikedPosts] = useState<Post[]>([])
  const [postAuthors, setPostAuthors] = useState<Record<string, User>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
    }
  }, [user, authLoading, router])

  useEffect(() => {
    const loadActivity = async () => {
      if (!user) return

      try {
        // Load user's posts
        const userPosts = await getUserPosts(user.uid)
        setMyPosts(userPosts)

        // Load posts the user has liked
        const allPosts = await getFeedPosts(100)
        const liked = allPosts.filter((post) => post.likes.includes(user.uid))
        setLikedPosts(liked)

        // Load authors
        const authors: Record<string, User> = {}
        for (const post of [...userPosts, ...liked]) {
          if (!authors[post.userId]) {
            const author = await getUserById(post.userId)
            if (author) {
              authors[post.userId] = author
            }
          }
        }
        setPostAuthors(authors)
      } catch (error) {
        console.error("Error loading activity:", error)
      } finally {
        setLoading(false)
      }
    }

    loadActivity()
  }, [user])

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const totalLikes = myPosts.reduce((sum, post) => sum + post.likes.length, 0)
  const totalComments = myPosts.reduce((sum, post) => sum + post.commentCount, 0)

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
          <h1 className="text-3xl font-bold mb-2">Mi Actividad</h1>
          <p className="text-muted-foreground">Revisa tu actividad y estadísticas</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Publicaciones</p>
                  <p className="text-2xl font-bold">{myPosts.length}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Me gusta recibidos</p>
                  <p className="text-2xl font-bold">{totalLikes}</p>
                </div>
                <Heart className="h-8 w-8 text-destructive" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Comentarios</p>
                  <p className="text-2xl font-bold">{totalComments}</p>
                </div>
                <MessageCircle className="h-8 w-8 text-accent" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Seguidores</p>
                  <p className="text-2xl font-bold">{userProfile?.followers.length || 0}</p>
                </div>
                <Calendar className="h-8 w-8 text-chart-2" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Activity Tabs */}
        <Tabs defaultValue="posts">
          <TabsList>
            <TabsTrigger value="posts">Mis Publicaciones ({myPosts.length})</TabsTrigger>
            <TabsTrigger value="liked">Me gusta ({likedPosts.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="mt-6">
            {loading ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <div className="text-muted-foreground">Cargando...</div>
                </CardContent>
              </Card>
            ) : myPosts.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground mb-4">No has publicado nada aún</p>
                  <button onClick={() => router.push("/create")} className="text-primary hover:underline font-medium">
                    Crear tu primera publicación
                  </button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {myPosts.map((post) => (
                  <Card
                    key={post.id}
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => router.push(`/post/${post.id}`)}
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                          {post.createdAt.toDate().toLocaleDateString("es-ES", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Heart className="h-4 w-4" />
                            {post.likes.length}
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageCircle className="h-4 w-4" />
                            {post.commentCount}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="line-clamp-3 mb-3">{post.content}</p>
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

          <TabsContent value="liked" className="mt-6">
            {loading ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <div className="text-muted-foreground">Cargando...</div>
                </CardContent>
              </Card>
            ) : likedPosts.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">No has dado me gusta a ninguna publicación</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {likedPosts.map((post) => {
                  const author = postAuthors[post.userId]
                  if (!author) return null

                  return (
                    <Card
                      key={post.id}
                      className="cursor-pointer hover:shadow-lg transition-shadow"
                      onClick={() => router.push(`/post/${post.id}`)}
                    >
                      <CardHeader>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={author.avatar || "/placeholder.svg"} alt={author.displayName} />
                            <AvatarFallback>{getInitials(author.displayName)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold">{author.displayName}</p>
                            <p className="text-sm text-muted-foreground">
                              {post.createdAt.toDate().toLocaleDateString("es-ES")}
                            </p>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="line-clamp-3 mb-3">{post.content}</p>
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
                  )
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
