"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Navigation } from "@/components/navigation"
import { PostCard } from "@/components/post-card"
import { getFeedPosts, getUserById, type Post, type User } from "@/lib/firestore"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

interface TagCount {
  tag: string
  count: number
}

export default function TagsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [posts, setPosts] = useState<Post[]>([])
  const [postAuthors, setPostAuthors] = useState<Record<string, User>>({})
  const [tagCounts, setTagCounts] = useState<TagCount[]>([])
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
    }
  }, [user, authLoading, router])

  useEffect(() => {
    const loadData = async () => {
      try {
        const allPosts = await getFeedPosts(100)
        setPosts(allPosts)

        // Count tags
        const tagMap = new Map<string, number>()
        allPosts.forEach((post) => {
          post.tags.forEach((tag) => {
            tagMap.set(tag, (tagMap.get(tag) || 0) + 1)
          })
        })

        const sortedTags = Array.from(tagMap.entries())
          .map(([tag, count]) => ({ tag, count }))
          .sort((a, b) => b.count - a.count)

        setTagCounts(sortedTags)

        // Load authors
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
        console.error("Error loading data:", error)
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      loadData()
    }
  }, [user])

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Cargando...</div>
      </div>
    )
  }

  // Filter tags by search term
  const filteredTags = searchTerm
    ? tagCounts.filter((tc) => tc.tag.toLowerCase().includes(searchTerm.toLowerCase()))
    : tagCounts

  // Filter posts by selected tag
  const filteredPosts = selectedTag ? posts.filter((post) => post.tags.includes(selectedTag)) : []

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Temas Populares</h1>
          <p className="text-muted-foreground">Explora publicaciones por tema</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tags List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Etiquetas</CardTitle>
                <div className="relative mt-2">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Buscar etiquetas..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">Cargando etiquetas...</div>
                ) : filteredTags.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No se encontraron etiquetas</div>
                ) : (
                  <div className="space-y-2 max-h-[600px] overflow-y-auto">
                    {filteredTags.map(({ tag, count }) => (
                      <button
                        key={tag}
                        onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                        className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                          selectedTag === tag ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"
                        }`}
                      >
                        <span className="font-medium">#{tag}</span>
                        <Badge variant={selectedTag === tag ? "secondary" : "outline"}>{count}</Badge>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Posts */}
          <div className="lg:col-span-2">
            {selectedTag ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">#{selectedTag}</h2>
                  <Badge variant="secondary">{filteredPosts.length} publicaciones</Badge>
                </div>

                {filteredPosts.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <p className="text-muted-foreground">No hay publicaciones con esta etiqueta</p>
                    </CardContent>
                  </Card>
                ) : (
                  filteredPosts.map((post) => {
                    const author = postAuthors[post.userId]
                    if (!author) return null
                    return <PostCard key={post.id} post={post} author={author} />
                  })
                )}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">Selecciona una etiqueta para ver las publicaciones</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
