import { auth } from "@/lib/firebase"

const getBackendBaseUrl = () => {
  const url = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001"
  return url.replace(/\/$/, "")
}

export interface StartUploadResponse {
  uploadSessionId: string
  key: string
}

export interface ConfirmUploadResponse {
  fileId: string
  fileUrl?: string
}

export async function startUpload(file: File, parentId: string | null = null): Promise<StartUploadResponse> {
  const user = auth.currentUser
  if (!user) throw new Error("Usuario no autenticado")
  const token = await user.getIdToken()

  try {
    const res = await fetch(`${getBackendBaseUrl()}/api/uploads/presign`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: file.name, size: file.size, mime: file.type, parentId }),
    })
    
    if (!res.ok) {
      const errorText = await res.text()
      throw new Error(`Error del servidor (${res.status}): ${errorText}`)
    }
    
    return (await res.json()) as StartUploadResponse
  } catch (error) {
    console.error("Error en startUpload:", error)
    throw new Error(`No se pudo conectar con ControlFile: ${error instanceof Error ? error.message : 'Error desconocido'}`)
  }
}

export async function uploadViaProxy(file: File, uploadSessionId: string): Promise<void> {
  const user = auth.currentUser
  if (!user) throw new Error("Usuario no autenticado")
  const token = await user.getIdToken()

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open("POST", `${getBackendBaseUrl()}/api/uploads/proxy-upload`)
    xhr.setRequestHeader("Authorization", `Bearer ${token}`)

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve()
      else reject(new Error(`Error de proxy (${xhr.status})`))
    }
    xhr.onerror = () => reject(new Error("Error de red en subida"))

    const form = new FormData()
    form.append("file", file)
    form.append("sessionId", uploadSessionId)
    xhr.send(form)
  })
}

export async function confirmUpload(
  file: File,
  session: StartUploadResponse,
  parentId: string | null = null,
): Promise<ConfirmUploadResponse> {
  const user = auth.currentUser
  if (!user) throw new Error("Usuario no autenticado")
  const token = await user.getIdToken()

  const res = await fetch(`${getBackendBaseUrl()}/api/uploads/confirm`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      uploadSessionId: session.uploadSessionId,
      key: session.key,
      size: file.size,
      mime: file.type,
      name: file.name,
      parentId,
    }),
  })
  if (!res.ok) throw new Error("No se pudo confirmar la subida")
  return (await res.json()) as ConfirmUploadResponse
}

export async function uploadImageWithControlFile(
  file: File,
  parentId: string | null = null,
): Promise<{ fileId: string; url: string }>
{
  const session = await startUpload(file, parentId)
  await uploadViaProxy(file, session.uploadSessionId)
  const confirm = await confirmUpload(file, session, parentId)
  
  // Obtener URL temporal de descarga usando la API de ControlFile
  const downloadUrl = await getDownloadUrl(confirm.fileId)
  
  return { fileId: confirm.fileId, url: downloadUrl }
}

export async function getDownloadUrl(fileId: string): Promise<string> {
  const user = auth.currentUser
  if (!user) throw new Error("Usuario no autenticado")
  const token = await user.getIdToken()

  const res = await fetch(`${getBackendBaseUrl()}/api/files/presign-get`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ fileId }),
  })
  
  if (!res.ok) {
    const errorText = await res.text()
    throw new Error(`Error obteniendo URL de descarga (${res.status}): ${errorText}`)
  }
  
  const data = await res.json()
  return data.downloadUrl
}
