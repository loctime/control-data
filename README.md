# Red Social de Conocimientos

Una plataforma moderna para compartir conocimientos y habilidades, construida con Next.js, Firebase y Tailwind CSS.

## Características

- 🔐 Autenticación de usuarios con Firebase Auth
  - Login con email y contraseña
  - Login con Google (OAuth)
  - Registro de nuevos usuarios
- 👤 Perfiles de usuario personalizables con habilidades y biografía
- Sistema de publicaciones con soporte para texto, imágenes, videos y enlaces
- Feed personalizado basado en usuarios seguidos
- Sistema de likes y comentarios
- Búsqueda de usuarios y publicaciones
- Exploración por tags/etiquetas
- Notificaciones en tiempo real
- Dashboard de actividad y estadísticas
- Modo oscuro por defecto con tema personalizable

## Configuración

### 1. Clonar el repositorio

\`\`\`bash
git clone <tu-repositorio>
cd knowledge-social-network
\`\`\`

### 2. Instalar dependencias

\`\`\`bash
npm install
# o
yarn install
# o
pnpm install
\`\`\`

### 3. Configurar Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita Authentication:
   - Ve a Authentication > Sign-in method
   - Habilita **Email/Password**
   - Habilita **Google** como proveedor de autenticación
   - Nota: Para Google Auth, Firebase configurará automáticamente el OAuth consent screen
4. Crea una base de datos Firestore
5. Habilita Storage para subir imágenes
6. Ve a Project Settings > General > Your apps
7. Copia las credenciales de configuración

### 4. Configurar variables de entorno

Crea un archivo `.env.local` en la raíz del proyecto (puedes usar `env.template` como referencia):

\`\`\`bash
cp env.template .env.local
\`\`\`

Edita `.env.local` y reemplaza los valores con tus credenciales de Firebase:

\`\`\`env
NEXT_PUBLIC_FIREBASE_API_KEY=tu_api_key_aqui
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu_proyecto_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu_proyecto.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=tu_app_id
\`\`\`

### 5. Configurar Firestore

La aplicación usa la siguiente estructura en Firestore:

\`\`\`
apps/
  └── controlDat/
      ├── users/
      │   └── {userId}/
      ├── posts/
      │   └── {postId}/
      ├── comments/
      │   └── {commentId}/
      ├── notifications/
      │   └── {notificationId}/
      └── follows/
          └── {followId}/
\`\`\`

Las reglas de seguridad se configurarán automáticamente al usar la aplicación.

### 6. Ejecutar en desarrollo

\`\`\`bash
npm run dev
# o
yarn dev
# o
pnpm dev
\`\`\`

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## Estructura del Proyecto

\`\`\`
├── app/                    # Rutas de Next.js App Router
│   ├── (auth)/            # Páginas de autenticación
│   ├── profile/           # Perfiles de usuario
│   ├── post/              # Páginas de publicaciones
│   ├── create/            # Crear publicaciones
│   ├── discover/          # Descubrir usuarios
│   ├── tags/              # Explorar por tags
│   ├── search/            # Búsqueda global
│   ├── notifications/     # Notificaciones
│   └── activity/          # Dashboard de actividad
├── components/            # Componentes React reutilizables
│   ├── ui/               # Componentes de UI (shadcn)
│   ├── navigation.tsx    # Navegación principal
│   └── post-card.tsx     # Tarjeta de publicación
├── contexts/             # Contextos de React
│   └── auth-context.tsx  # Contexto de autenticación
├── lib/                  # Utilidades y configuración
│   ├── firebase.ts       # Configuración de Firebase
│   ├── firestore.ts      # Funciones de Firestore
│   └── utils.ts          # Utilidades generales
└── public/               # Archivos estáticos
\`\`\`

## Tecnologías Utilizadas

- **Framework**: Next.js 15 (App Router)
- **Lenguaje**: TypeScript
- **Estilos**: Tailwind CSS v4
- **UI Components**: shadcn/ui
- **Base de datos**: Firebase Firestore
- **Autenticación**: Firebase Auth
- **Storage**: Firebase Storage
- **Iconos**: Lucide React

## Scripts Disponibles

- `npm run dev` - Ejecutar en modo desarrollo
- `npm run build` - Construir para producción
- `npm run start` - Ejecutar en producción
- `npm run lint` - Ejecutar linter

## Personalización del Tema

Los colores del tema se pueden personalizar fácilmente en `app/globals.css`. El sistema usa variables CSS para todos los colores:

\`\`\`css
@theme inline {
  --color-primary: ...;
  --color-secondary: ...;
  /* etc. */
}
\`\`\`

## Despliegue

La forma más fácil de desplegar es usando [Vercel](https://vercel.com):

1. Haz push de tu código a GitHub
2. Importa el proyecto en Vercel
3. Configura las variables de entorno
4. Despliega

## Licencia

MIT
