"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { updateDocument, type Post, type User } from "@/lib/firestore"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Heart, MessageCircle, Share2 } from "lucide-react"

interface PostCardProps {
  post: Post
  author: User
}

export function PostCard({ post, author }: PostCardProps) {
  const router = useRouter()
  const { user } = useAuth()
  const [likes, setLikes] = useState(post.likes)
  const [isLiking, setIsLiking] = useState(false)

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!user || isLiking) return

    setIsLiking(true)
    try {
      const isLiked = likes.includes(user.uid)
      const newLikes = isLiked ? likes.filter((id) => id !== user.uid) : [...likes, user.uid]

      await updateDocument("posts", post.id, {
        likes: newLikes,
      })

      setLikes(newLikes)
    } catch (error) {
      console.error("Error liking post:", error)
    } finally {
      setIsLiking(false)
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

  const isLiked = user ? likes.includes(user.uid) : false

  return (
    <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => router.push(`/post/${post.id}`)}>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Avatar
            className="cursor-pointer"
            onClick={(e) => {
              e.stopPropagation()
              router.push(`/profile/${author.id}`)
            }}
          >
            <AvatarImage src={author.avatar || "/placeholder.svg"} alt={author.displayName} />
            <AvatarFallback>{getInitials(author.displayName)}</AvatarFallback>
          </Avatar>
          <div>
            <p
              className="font-semibold cursor-pointer hover:text-primary"
              onClick={(e) => {
                e.stopPropagation()
                router.push(`/profile/${author.id}`)
              }}
            >
              {author.displayName}
            </p>
            <p className="text-sm text-muted-foreground">{post.createdAt.toDate().toLocaleDateString("es-ES")}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="whitespace-pre-wrap line-clamp-4">{post.content}</p>

        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <Badge key={tag} variant="outline">
                #{tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-4 pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            disabled={!user || isLiking}
            className={isLiked ? "text-destructive" : ""}
          >
            <Heart className={`h-4 w-4 mr-1 ${isLiked ? "fill-current" : ""}`} />
            {likes.length}
          </Button>
          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); router.push(`/post/${post.id}`) }}>
            <MessageCircle className="h-4 w-4 mr-1" />
            {post.commentCount}
          </Button>
          <Button variant="ghost" size="sm">
            <Share2 className="h-4 w-4 mr-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
