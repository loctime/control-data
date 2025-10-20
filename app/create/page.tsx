"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Navigation } from "@/components/navigation"
import { collection, addDoc, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { getCollectionPath } from "@/lib/firestore"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { X, Plus } from "lucide-react"
import { MediaUploader } from "@/components/media-uploader"

export default function CreatePostPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [content, setContent] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [mediaFiles, setMediaFiles] = useState<{ fileId: string; url: string }[]>([])
  const [videoUrl, setVideoUrl] = useState("")
  const [mediaType, setMediaType] = useState<"image" | "video" | null>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
    }
  }, [user, authLoading, router])

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim()) && tags.length < 5) {
      setTags([...tags, newTag.trim()])
      setNewTag("")
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !content.trim()) return

    setError("")
    setLoading(true)

    try {
      const postsCollection = collection(db, getCollectionPath("posts"))
      await addDoc(postsCollection, {
        userId: user.uid,
        content: content.trim(),
        tags,
        mediaUrls: mediaType === "image" ? mediaFiles.map(f => f.fileId) : mediaType === "video" && videoUrl ? [videoUrl] : [],
        mediaType: mediaType ?? undefined,
        likes: [],
        commentCount: 0,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      })

      router.push("/")
    } catch (err: any) {
      console.error("Error creating post:", err)
      setError(err.message || "Error al crear la publicación")
    } finally {
      setLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Cargando...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Crear Publicación</CardTitle>
            <CardDescription>Comparte tu conocimiento con la comunidad</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              {error && (
                <div className="p-3 text-sm text-destructive-foreground bg-destructive/10 border border-destructive rounded-md">
                  {error}
                </div>
              )}

              {/* Content */}
              <div className="space-y-2">
                <Label htmlFor="content">Contenido</Label>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="¿Qué quieres compartir hoy?"
                  rows={8}
                  className="resize-none"
                  required
                />
                <p className="text-sm text-muted-foreground">{content.length}/2000 caracteres</p>
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label>Etiquetas (máximo 5)</Label>
                <div className="flex gap-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Agregar etiqueta"
                    disabled={tags.length >= 5}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        handleAddTag()
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={handleAddTag}
                    variant="outline"
                    size="icon"
                    disabled={tags.length >= 5}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="gap-1">
                        #{tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Media */}
              <div className="space-y-3">
                <Label>Multimedia</Label>
                <div className="flex gap-2 text-sm">
                  <Button
                    type="button"
                    variant={mediaType === "image" ? "default" : "outline"}
                    onClick={() => setMediaType("image")}
                    size="sm"
                  >
                    Imágenes
                  </Button>
                  <Button
                    type="button"
                    variant={mediaType === "video" ? "default" : "outline"}
                    onClick={() => setMediaType("video")}
                    size="sm"
                  >
                    URL de video
                  </Button>
                </div>

                {mediaType === "image" && (
                  <MediaUploader value={mediaFiles} onChange={setMediaFiles} max={4} />
                )}

                {mediaType === "video" && (
                  <div className="space-y-2">
                    <Input
                      placeholder="Pega una URL de YouTube/Vimeo/MP4"
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Validaremos la URL al publicar. Usa enlaces embebibles o directos.
                    </p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={
                    loading ||
                    !content.trim() ||
                    (mediaType === "image" && mediaFiles.length === 0 ? false : false)
                  }
                >
                  {loading ? "Publicando..." : "Publicar"}
                </Button>
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </form>
        </Card>
      </div>
    </div>
  )
}
