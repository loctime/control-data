"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import {
  type User as FirebaseUser,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth"
import { auth } from "@/lib/firebase"
import { createDocument, getUserById, type User } from "@/lib/firestore"

interface AuthContextType {
  user: FirebaseUser | null
  userProfile: User | null
  loading: boolean
  signUp: (email: string, password: string, displayName: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth debe ser usado dentro de un AuthProvider")
  }
  return context
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null)
  const [userProfile, setUserProfile] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser)

      if (firebaseUser) {
        // Cargar perfil del usuario
        const profile = await getUserById(firebaseUser.uid)
        setUserProfile(profile)
      } else {
        setUserProfile(null)
      }

      setLoading(false)
    })

    return unsubscribe
  }, [])

  const signUp = async (email: string, password: string, displayName: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)

    // Crear perfil de usuario en Firestore
    await createDocument<Omit<User, "id" | "createdAt" | "updatedAt">>("users", userCredential.user.uid, {
      email,
      displayName,
      bio: "",
      skills: [],
      followers: [],
      following: [],
    })
  }

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password)
  }

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider()
    const result = await signInWithPopup(auth, provider)
    const user = result.user

    // Verificar si el usuario ya existe en Firestore
    let existingProfile = await getUserById(user.uid)

    // Si no existe, crear el perfil
    if (!existingProfile) {
      console.log("Creando nuevo perfil para usuario de Google:", user.uid)
      await createDocument<Omit<User, "id" | "createdAt" | "updatedAt">>("users", user.uid, {
        email: user.email || "",
        displayName: user.displayName || "Usuario",
        bio: "",
        skills: [],
        followers: [],
        following: [],
        avatar: user.photoURL || undefined,
      })
      
      // Reintentar cargar el perfil hasta 3 veces con delay
      for (let i = 0; i < 3; i++) {
        await new Promise(resolve => setTimeout(resolve, 500)) // Esperar 500ms
        existingProfile = await getUserById(user.uid)
        if (existingProfile) {
          console.log("Perfil cargado exitosamente:", existingProfile)
          setUserProfile(existingProfile)
          break
        }
        console.log(`Intento ${i + 1} de cargar perfil...`)
      }
      
      if (!existingProfile) {
        console.error("No se pudo cargar el perfil después de crearlo")
      }
    } else {
      console.log("Usuario existente encontrado:", existingProfile)
      // Si ya existe, actualizar el estado inmediatamente
      setUserProfile(existingProfile)
    }
  }

  const signOut = async () => {
    await firebaseSignOut(auth)
  }

  const value = {
    user,
    userProfile,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
