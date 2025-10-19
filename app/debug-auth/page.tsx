"use client"

import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react"

export default function DebugAuthPage() {
  const { user, userProfile, loading } = useAuth()
  const router = useRouter()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Diagnóstico de Autenticación</h1>
          <Button onClick={() => router.push("/")} variant="outline">
            Volver al inicio
          </Button>
        </div>

        {/* Estado de Firebase Auth */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {user ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              Firebase Authentication
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {user ? (
              <>
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>✅ Usuario autenticado correctamente</AlertDescription>
                </Alert>
                <div className="bg-muted p-4 rounded-lg space-y-2 text-sm font-mono">
                  <div><strong>UID:</strong> {user.uid}</div>
                  <div><strong>Email:</strong> {user.email}</div>
                  <div><strong>Display Name:</strong> {user.displayName || "(no definido)"}</div>
                  <div><strong>Photo URL:</strong> {user.photoURL || "(no definido)"}</div>
                  <div><strong>Email Verified:</strong> {user.emailVerified ? "Sí" : "No"}</div>
                  <div><strong>Provider:</strong> {user.providerData[0]?.providerId || "(desconocido)"}</div>
                </div>
              </>
            ) : (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>❌ No hay usuario autenticado</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Estado del Perfil en Firestore */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {userProfile ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : user ? (
                <AlertCircle className="h-5 w-5 text-yellow-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              Perfil en Firestore
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {user && userProfile ? (
              <>
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>✅ Perfil cargado desde Firestore</AlertDescription>
                </Alert>
                <div className="bg-muted p-4 rounded-lg space-y-2 text-sm font-mono">
                  <div><strong>ID:</strong> {userProfile.id}</div>
                  <div><strong>Email:</strong> {userProfile.email}</div>
                  <div><strong>Display Name:</strong> {userProfile.displayName}</div>
                  <div><strong>Bio:</strong> {userProfile.bio || "(vacío)"}</div>
                  <div><strong>Avatar:</strong> {userProfile.avatar || "(no definido)"}</div>
                  <div><strong>Skills:</strong> {userProfile.skills.length > 0 ? userProfile.skills.join(", ") : "(ninguna)"}</div>
                  <div><strong>Seguidores:</strong> {userProfile.followers.length}</div>
                  <div><strong>Siguiendo:</strong> {userProfile.following.length}</div>
                  <div><strong>Creado:</strong> {userProfile.createdAt?.toDate().toLocaleString()}</div>
                  <div><strong>Ruta en Firestore:</strong> apps/controlDat/users/{userProfile.id}</div>
                </div>
              </>
            ) : user && !userProfile ? (
              <>
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    ⚠️ Usuario autenticado pero SIN perfil en Firestore
                  </AlertDescription>
                </Alert>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Esto significa que el documento de usuario no existe en la ruta:
                  </p>
                  <div className="bg-muted p-3 rounded font-mono text-sm">
                    apps/controlDat/users/{user.uid}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Verifica en Firebase Console que:
                  </p>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    <li>La colección existe en Firestore</li>
                    <li>Las reglas de seguridad permiten lectura</li>
                    <li>El documento se creó correctamente al registrarte</li>
                  </ul>
                  <div className="pt-2">
                    <strong className="text-sm">Abre la consola del navegador (F12)</strong> para ver los logs de creación del documento.
                  </div>
                </div>
              </>
            ) : (
              <Alert>
                <AlertDescription>No hay usuario autenticado</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Instrucciones */}
        <Card>
          <CardHeader>
            <CardTitle>Pasos para solucionar problemas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <ol className="list-decimal list-inside space-y-2">
              <li>
                <strong>Verifica Firebase Console:</strong> Ve a{" "}
                <a
                  href="https://console.firebase.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Firebase Console
                </a>{" "}
                → Firestore Database → Busca la ruta <code className="bg-muted px-1 rounded">apps/controlDat/users</code>
              </li>
              <li>
                <strong>Verifica las reglas de Firestore:</strong> Asegúrate de que las reglas permitan crear y leer documentos en esa ruta
              </li>
              <li>
                <strong>Revisa la consola del navegador:</strong> Abre las DevTools (F12) y busca errores o logs de Firestore
              </li>
              <li>
                <strong>Si el problema persiste:</strong> Cierra sesión, elimina el usuario en Firebase Auth, y regístrate de nuevo
              </li>
            </ol>
          </CardContent>
        </Card>

        {/* Reglas de Firestore recomendadas */}
        <Card>
          <CardHeader>
            <CardTitle>Reglas de Firestore recomendadas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Copia estas reglas en Firestore Database → Rules:
            </p>
            <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Reglas para la app controlDat
    match /apps/controlDat/{document=**} {
      // Los usuarios pueden leer todos los documentos
      allow read: if request.auth != null;
      
      // Los usuarios solo pueden crear/editar su propio perfil
      match /users/{userId} {
        allow create: if request.auth != null && request.auth.uid == userId;
        allow update: if request.auth != null && request.auth.uid == userId;
      }
      
      // Los usuarios pueden crear posts
      match /posts/{postId} {
        allow create: if request.auth != null;
        allow update, delete: if request.auth != null && 
          resource.data.userId == request.auth.uid;
      }
      
      // Comentarios y notificaciones
      match /comments/{commentId} {
        allow create: if request.auth != null;
      }
      
      match /notifications/{notificationId} {
        allow create: if request.auth != null;
        allow update: if request.auth != null && 
          resource.data.userId == request.auth.uid;
      }
    }
  }
}`}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

