"use client"

import { useState } from "react"
import { uploadImageWithControlFile } from "@/lib/controlfile"
import { uploadImageToFirebase } from "@/lib/storage-fallback"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { X } from "lucide-react"

interface MediaFile {
  fileId: string
  url: string
}

interface MediaUploaderProps {
  max?: number
  onChange: (files: MediaFile[]) => void
  value: MediaFile[]
}

export function MediaUploader({ max = 4, value, onChange }: MediaUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFiles = async (files: FileList | null) => {
    if (!files || uploading) return
    const filesArr = Array.from(files).slice(0, Math.max(0, max - value.length))
    setUploading(true)
    setError(null)
    try {
      const uploads = [] as MediaFile[]
      for (const file of filesArr) {
        if (!file.type.startsWith("image/")) {
          console.warn(`Archivo ${file.name} no es una imagen, saltando...`)
          continue
        }
        if (file.size > 5 * 1024 * 1024) {
          console.warn(`Archivo ${file.name} es muy grande (${(file.size / 1024 / 1024).toFixed(1)}MB), saltando...`)
          continue
        }
        try {
          // Intentar ControlFile primero
          const { fileId, url } = await uploadImageWithControlFile(file)
          uploads.push({ fileId, url })
        } catch (controlFileError) {
          console.warn(`ControlFile falló para ${file.name}, usando Firebase Storage:`, controlFileError)
          try {
            // Fallback a Firebase Storage
            const url = await uploadImageToFirebase(file)
            uploads.push({ fileId: url, url }) // Para Firebase, usamos la URL como fileId
          } catch (firebaseError) {
            console.error(`Error subiendo ${file.name} con ambos métodos:`, firebaseError)
            setError(`Error subiendo ${file.name}: ${firebaseError instanceof Error ? firebaseError.message : 'Error desconocido'}`)
          }
        }
      }
      if (uploads.length > 0) onChange([...value, ...uploads])
    } finally {
      setUploading(false)
    }
  }

  const removeAt = (idx: number) => {
    const copy = [...value]
    copy.splice(idx, 1)
    onChange(copy)
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2 items-center">
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => handleFiles(e.target.files)}
          disabled={uploading || value.length >= max}
        />
        <Button type="button" variant="outline" disabled={uploading || value.length >= max}>
          {uploading ? "Subiendo..." : "Subir imágenes"}
        </Button>
        <span className="text-xs text-muted-foreground">Máx {max} imágenes, 5MB c/u</span>
      </div>
      
      {error && (
        <div className="p-2 text-sm text-destructive bg-destructive/10 border border-destructive rounded">
          {error}
        </div>
      )}

      {value.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {value.map((file, idx) => (
            <Card key={file.fileId} className="relative overflow-hidden">
              <img src={file.url} alt="media" className="w-full h-32 object-cover" />
              <button
                type="button"
                className="absolute top-1 right-1 bg-background/80 rounded-full p-1"
                onClick={() => removeAt(idx)}
              >
                <X className="h-4 w-4" />
              </button>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}


