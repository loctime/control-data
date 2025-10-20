import { storage } from "@/lib/firebase"
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage"
import { auth } from "@/lib/firebase"

export async function uploadImageToFirebase(file: File): Promise<string> {
  const user = auth.currentUser
  if (!user) throw new Error("Usuario no autenticado")

  // Crear referencia única para el archivo
  const timestamp = Date.now()
  const fileName = `${user.uid}/posts/${timestamp}_${file.name}`
  const storageRef = ref(storage, fileName)

  // Subir archivo
  const snapshot = await uploadBytes(storageRef, file)
  
  // Obtener URL de descarga
  const downloadURL = await getDownloadURL(snapshot.ref)
  
  return downloadURL
}

export async function deleteImageFromFirebase(url: string): Promise<void> {
  try {
    // Extraer la ruta del archivo de la URL
    const urlObj = new URL(url)
    const pathMatch = urlObj.pathname.match(/\/o\/(.+)\?/)
    if (!pathMatch) throw new Error("URL de Firebase no válida")
    
    const filePath = decodeURIComponent(pathMatch[1])
    const fileRef = ref(storage, filePath)
    
    await deleteObject(fileRef)
  } catch (error) {
    console.error("Error eliminando imagen:", error)
    // No lanzar error para no romper el flujo
  }
}
