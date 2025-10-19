import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  type DocumentData,
  Timestamp,
} from "firebase/firestore"
import { db } from "./firebase"

// Ruta base para todas las colecciones
// Esta app comparte Firebase con otras apps, por eso los datos están bajo apps/controlDat/
const BASE_PATH = "apps/controlDat"

// Helper para obtener la ruta completa de una colección
// Retorna: apps/controlDat/{collectionName}
export const getCollectionPath = (collectionName: string) => {
  return `${BASE_PATH}/${collectionName}`
}

// Tipos
export interface User {
  id: string
  email: string
  displayName: string
  bio?: string
  skills: string[]
  avatar?: string
  followers: string[]
  following: string[]
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface Post {
  id: string
  userId: string
  content: string
  mediaUrls?: string[]
  mediaType?: "image" | "video" | "link"
  tags: string[]
  likes: string[]
  commentCount: number
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface Comment {
  id: string
  postId: string
  userId: string
  content: string
  createdAt: Timestamp
}

export interface Notification {
  id: string
  userId: string
  type: "like" | "comment" | "follow" | "mention"
  actorId: string
  postId?: string
  commentId?: string
  message: string
  read: boolean
  createdAt: Timestamp
}

// Funciones genéricas de Firestore
export const getDocument = async <T>(collectionName: string, docId: string)
: Promise<T | null> =>
{
  const fullPath = `${getCollectionPath(collectionName)}/${docId}`
  console.log("Buscando documento en:", fullPath)
  const docRef = doc(db, fullPath)
  const docSnap = await getDoc(docRef)

  if (docSnap.exists()) {
    console.log("Documento encontrado:", docSnap.id)
    return { id: docSnap.id, ...docSnap.data() } as T;
  }
  console.log("Documento NO encontrado en:", fullPath)
  return null;
}

export const getDocuments = async <T>(collectionName: string, constraints: any[] = [])
: Promise<T[]> =>
{
  const collectionRef = collection(db, getCollectionPath(collectionName))
  const q = query(collectionRef, ...constraints)
  const querySnapshot = await getDocs(q)

  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as T[];
}

export const createDocument = async <T extends DocumentData>(
  collectionName: string,
  docId: string,
  data: T,
): Promise<void> => {
  const fullPath = `${getCollectionPath(collectionName)}/${docId}`
  console.log("Creando documento en:", fullPath)
  const docRef = doc(db, fullPath)
  await setDoc(docRef, {
    ...data,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  })
  console.log("Documento creado exitosamente en:", fullPath)
}

export const updateDocument = async <T extends Partial<DocumentData>>(
  collectionName: string,
  docId: string,
  data: T,
): Promise<void> => {
  const docRef = doc(db, getCollectionPath(collectionName), docId)
  await updateDoc(docRef, {
    ...data,
    updatedAt: Timestamp.now(),
  })
}

export const deleteDocument = async (collectionName: string, docId: string): Promise<void> => {
  const docRef = doc(db, getCollectionPath(collectionName), docId)
  await deleteDoc(docRef)
}

// Funciones específicas para usuarios
export const getUserById = (userId: string) => getDocument<User>("users", userId)

export const getUsersBySkill = (skill: string) =>
  getDocuments<User>("users", [where("skills", "array-contains", skill)])

export const searchUsers = (searchTerm: string) =>
  getDocuments<User>("users", [
    where("displayName", ">=", searchTerm),
    where("displayName", "<=", searchTerm + "\uf8ff"),
    limit(20),
  ])

// Funciones específicas para posts
export const getPostById = (postId: string) => getDocument<Post>("posts", postId)

export const getFeedPosts = (limitCount = 20) =>
  getDocuments<Post>("posts", [orderBy("createdAt", "desc"), limit(limitCount)])

export const getUserPosts = (userId: string) =>
  getDocuments<Post>("posts", [where("userId", "==", userId), orderBy("createdAt", "desc")])

// Funciones específicas para comentarios
export const getPostComments = (postId: string) =>
  getDocuments<Comment>("comments", [where("postId", "==", postId), orderBy("createdAt", "desc")])

// Funciones específicas para notificaciones
export const getUserNotifications = (userId: string) =>
  getDocuments<Notification>("notifications", [where("userId", "==", userId), orderBy("createdAt", "desc"), limit(50)])

export const getUnreadNotificationCount = async (userId: string): Promise<number> => {
  const notifications = await getDocuments<Notification>("notifications", [
    where("userId", "==", userId),
    where("read", "==", false),
  ])
  return notifications.length
}
