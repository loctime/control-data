"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Navigation } from "@/components/navigation"
import {
  getPostById,
  getUserById,
  getPostComments,
  updateDocument,
  type Post,
  type User,
  type Comment,
} from "@/lib/firestore"
import { collection, addDoc, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { getCollectionPath } from "@/lib/firestore"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Heart, MessageCircle, Share2 } from "lucide-react"

export default function PostPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [post, setPost] = useState<Post | null>(null)
  const [author, setAuthor] = useState<User | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [commentAuthors, setCommentAuthors] = useState<Record<string, User>>({})
  const [newComment, setNewComment] = useState("")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const postId = params.postId as string

  useEffect(() => {
    const loadPost = async () => {
      try {
        const postData = await getPostById(postId)
        if (postData) {
          setPost(postData)
          const authorData = await getUserById(postData.userId)
          setAuthor(authorData)

          const commentsData = await getPostComments(postId)
          setComments(commentsData)

          // Load comment authors
          const authors: Record<string, User> = {}
          for (const comment of commentsData) {
            if (!authors[comment.userId]) {
              const commentAuthor = await getUserById(comment.userId)
              if (commentAuthor) {
                authors[comment.userId] = commentAuthor
              }
            }
          }
          setCommentAuthors(authors)
        }
      } catch (error) {
        console.error("Error loading post:", error)
      } finally {
        setLoading(false)
      }
    }

    loadPost()
  }, [postId])

  const handleLike = async () => {
    if (!user || !post) return

    try {
      const isLiked = post.likes.includes(user.uid)
      const newLikes = isLiked ? post.likes.filter((id) => id !== user.uid) : [...post.likes, user.uid]

      await updateDocument("posts", post.id, {
        likes: newLikes,
      })

      setPost({ ...post, likes: newLikes })
    } catch (error) {
      console.error("Error liking post:", error)
    }
  }

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !post || !newComment.trim()) return

    setSubmitting(true)
    try {
      const commentsCollection = collection(db, getCollectionPath("comments"))
      const docRef = await addDoc(commentsCollection, {
        postId: post.id,
        userId: user.uid,
        content: newComment.trim(),
        createdAt: Timestamp.now(),
      })

      // Update comment count
      await updateDocument("posts", post.id, {
        commentCount: post.commentCount + 1,
      })

      // Add comment to local state
      const newCommentData: Comment = {
        id: docRef.id,
        postId: post.id,
        userId: user.uid,
        content: newComment.trim(),
        createdAt: Timestamp.now(),
      }
      setComments([newCommentData, ...comments])
      setPost({ ...post, commentCount: post.commentCount + 1 })

      // Load comment author if not already loaded
      if (!commentAuthors[user.uid]) {
        const commentAuthor = await getUserById(user.uid)
        if (commentAuthor) {
          setCommentAuthors({ ...commentAuthors, [user.uid]: commentAuthor })
        }
      }

      setNewComment("")
    } catch (error) {
      console.error("Error submitting comment:", error)
    } finally {
      setSubmitting(false)
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
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Cargando publicación...</div>
        </div>
      </div>
    )
  }

  if (!post || !author) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Publicación no encontrada</h2>
            <Button onClick={() => router.push("/")}>Volver al inicio</Button>
          </div>
        </div>
      </div>
    )
  }

  const isLiked = user ? post.likes.includes(user.uid) : false

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Post Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Avatar className="cursor-pointer" onClick={() => router.push(`/profile/${author.id}`)}>
                <AvatarImage src={author.avatar || "/placeholder.svg"} alt={author.displayName} />
                <AvatarFallback>{getInitials(author.displayName)}</AvatarFallback>
              </Avatar>
              <div>
                <p
                  className="font-semibold cursor-pointer hover:text-primary"
                  onClick={() => router.push(`/profile/${author.id}`)}
                >
                  {author.displayName}
                </p>
                <p className="text-sm text-muted-foreground">
                  {post.createdAt.toDate().toLocaleDateString("es-ES", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="whitespace-pre-wrap text-lg">{post.content}</p>

            {post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    #{tag}
                  </Badge>
                ))}
              </div>
            )}

            <Separator />

            {/* Actions */}
            <div className="flex items-center gap-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLike}
                disabled={!user}
                className={isLiked ? "text-destructive" : ""}
              >
                <Heart className={`h-5 w-5 mr-2 ${isLiked ? "fill-current" : ""}`} />
                {post.likes.length}
              </Button>
              <Button variant="ghost" size="sm">
                <MessageCircle className="h-5 w-5 mr-2" />
                {post.commentCount}
              </Button>
              <Button variant="ghost" size="sm">
                <Share2 className="h-5 w-5 mr-2" />
                Compartir
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Comments Section */}
        <Card>
          <CardHeader>
            <h3 className="text-xl font-semibold">Comentarios ({comments.length})</h3>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Add Comment */}
            {user && (
              <form onSubmit={handleSubmitComment} className="space-y-3">
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Escribe un comentario..."
                  rows={3}
                  className="resize-none"
                />
                <Button type="submit" disabled={submitting || !newComment.trim()} size="sm">
                  {submitting ? "Enviando..." : "Comentar"}
                </Button>
              </form>
            )}

            {!user && (
              <div className="text-center py-4">
                <p className="text-muted-foreground mb-3">Inicia sesión para comentar</p>
                <Button onClick={() => router.push("/login")} size="sm">
                  Iniciar sesión
                </Button>
              </div>
            )}

            <Separator />

            {/* Comments List */}
            {comments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No hay comentarios aún. ¡Sé el primero en comentar!
              </div>
            ) : (
              <div className="space-y-4">
                {comments.map((comment) => {
                  const commentAuthor = commentAuthors[comment.userId]
                  if (!commentAuthor) return null

                  return (
                    <div key={comment.id} className="flex gap-3">
                      <Avatar
                        className="h-10 w-10 cursor-pointer"
                        onClick={() => router.push(`/profile/${commentAuthor.id}`)}
                      >
                        <AvatarImage src={commentAuthor.avatar || "/placeholder.svg"} alt={commentAuthor.displayName} />
                        <AvatarFallback>{getInitials(commentAuthor.displayName)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="bg-muted rounded-lg p-3">
                          <p
                            className="font-semibold text-sm cursor-pointer hover:text-primary"
                            onClick={() => router.push(`/profile/${commentAuthor.id}`)}
                          >
                            {commentAuthor.displayName}
                          </p>
                          <p className="text-sm mt-1">{comment.content}</p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 ml-3">
                          {comment.createdAt.toDate().toLocaleDateString("es-ES")}
                        </p>
                      </div>
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
