"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Navigation } from "@/components/navigation"
import { PostCard } from "@/components/post-card"
import { getFeedPosts, getUserById, type Post, type User } from "@/lib/firestore"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Sparkles, TrendingUp } from "lucide-react"

export default function HomePage() {
  const { user, userProfile, loading: authLoading } = useAuth()
  const router = useRouter()
  const [posts, setPosts] = useState<Post[]>([])
  const [postAuthors, setPostAuthors] = useState<Record<string, User>>({})
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"following" | "all">("all")

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
    }
  }, [user, authLoading, router])

  useEffect(() => {
    const loadPosts = async () => {
      try {
        const allPosts = await getFeedPosts(50)
        setPosts(allPosts)

        // Load authors for all posts
        const authors: Record<string, User> = {}
        for (const post of allPosts) {
          if (!authors[post.userId]) {
            const author = await getUserById(post.userId)
            if (author) {
              authors[post.userId] = author
            }
          }
        }
        setPostAuthors(authors)
      } catch (error) {
        console.error("Error loading posts:", error)
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      loadPosts()
    }
  }, [user])

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Cargando...</div>
      </div>
    )
  }

  // Mostrar alerta si el usuario está autenticado pero no tiene perfil
  if (user && !userProfile && !authLoading) {
    console.warn("Usuario autenticado sin perfil:", user.uid)
  }

  // Filter posts based on active tab
  const filteredPosts =
    activeTab === "following" && userProfile
      ? posts.filter((post) => userProfile.following.includes(post.userId))
      : posts

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Feed */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold">Feed</h1>
              <Button onClick={() => router.push("/create")} size="sm">
                Crear publicación
              </Button>
            </div>

            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "following" | "all")}>
              <TabsList className="w-full">
                <TabsTrigger value="all" className="flex-1">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Todos
                </TabsTrigger>
                <TabsTrigger value="following" className="flex-1">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Siguiendo
                </TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-6 space-y-4">
                {loading ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <div className="text-muted-foreground">Cargando publicaciones...</div>
                    </CardContent>
                  </Card>
                ) : filteredPosts.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center space-y-4">
                      <p className="text-muted-foreground">
                        {activeTab === "following"
                          ? "No hay publicaciones de las personas que sigues"
                          : "No hay publicaciones aún"}
                      </p>
                      {activeTab === "following" && (
                        <Button onClick={() => router.push("/discover")} variant="outline">
                          Descubrir usuarios
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  filteredPosts.map((post) => {
                    const author = postAuthors[post.userId]
                    if (!author) return null
                    return <PostCard key={post.id} post={post} author={author} />
                  })
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* User Stats */}
            <Card>
              <CardContent className="pt-6 space-y-4">
                {userProfile ? (
                  <>
                    <div>
                      <h3 className="font-semibold mb-2">Tu perfil</h3>
                      <p className="text-sm text-muted-foreground mb-3">{userProfile.displayName}</p>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Seguidores</span>
                          <span className="font-semibold">{userProfile.followers.length || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Siguiendo</span>
                          <span className="font-semibold">{userProfile.following.length || 0}</span>
                        </div>
                      </div>
                    </div>
                    <Button onClick={() => router.push(`/profile/${user.uid}`)} variant="outline" className="w-full">
                      Ver perfil
                    </Button>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground mb-2">Cargando perfil...</p>
                    <p className="text-xs text-muted-foreground">Si esto tarda mucho, intenta cerrar sesión y volver a entrar</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Suggestions */}
            <Card>
              <CardContent className="pt-6 space-y-4">
                <h3 className="font-semibold">Descubre más</h3>
                <div className="space-y-3">
                  <Button onClick={() => router.push("/discover")} variant="outline" className="w-full justify-start">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Explorar usuarios
                  </Button>
                  <Button onClick={() => router.push("/tags")} variant="outline" className="w-full justify-start">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Temas populares
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
