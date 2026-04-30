# Plan 1 — Backend + Auth + Móvil flujo de Visitas (Implementation Plan)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> **⚠️ PREFERENCIA EXPLÍCITA DEL USUARIO:** No hacer `git commit` automáticos. Donde el plan dice "Pausa de revisión", **detente** y pídele al usuario que revise. Solo hacer commit si él lo pide explícitamente. Esta regla **anula** cualquier recomendación de "commit frequente" del skill.

**Goal:** Construir la infraestructura del backend Express + MongoDB Atlas, módulo de autenticación multi-rol (texto plano, sin bcrypt por decisión del usuario), módulo de visitas con generación de QR, y cablear la app móvil para login + crear/listar/cancelar visitas + ver QR del invitado. Resultado: demo end-to-end del estudiante registrando y administrando visitas contra DB real.

**Architecture:** Express en serverless mode (Vercel) con `cachedConnection` de Mongoose. Sesión por UUID v4 en `users.sessionToken` enviado en `Authorization: Bearer`. Frontend con `AuthContext` y cliente `fetch` centralizado en `src/lib/api.ts`. Sin react-query, sin JWT, sin bcrypt — todo simple para demo escolar.

**Tech Stack:** Node.js 20, Express 4, Mongoose 8, Zod, TypeScript, tsx, concurrently, browser-image-compression, qrcode.react, MongoDB Atlas free tier, Vercel.

**Spec base:** `docs/superpowers/specs/2026-04-28-accesos-udlap-backend-design.md`

**Out of scope de este plan (tendrán plan propio):**
- Pantallas móvil de Comedor, Biblioteca, Horario, Perfil
- Interfaz iPad (seguridad)
- Interfaz Quiosco
- Interfaz Colegios residenciales
- Imágenes en visitas (foto del invitado) — el form las acepta, pero no se cablean en este plan; se mete `null` por ahora

---

## File Structure

### Archivos nuevos del backend

| Path | Responsabilidad |
|------|-----------------|
| `server/index.ts` | Bootstrap dev (escucha en puerto local) |
| `server/app.ts` | Express app: middlewares, monta rutas, exporta handler |
| `server/env.ts` | Validación de env vars con zod |
| `server/db.ts` | Conexión Mongoose con cache para serverless |
| `server/middlewares/auth.ts` | `requireAuth`, `requireRole(...)` |
| `server/middlewares/error.ts` | Error handler centralizado |
| `server/lib/asyncHandler.ts` | Wrapper para async handlers |
| `server/lib/errors.ts` | Clase `ApiError` con códigos |
| `server/modules/auth/auth.routes.ts` | `/api/auth/*` |
| `server/modules/auth/auth.service.ts` | Lógica de login/logout |
| `server/modules/users/user.model.ts` | Schema Mongoose `User` |
| `server/modules/users/users.routes.ts` | `/api/users/me/*` |
| `server/modules/visitas/visita.model.ts` | Schema Mongoose `Visita` |
| `server/modules/visitas/visitas.routes.ts` | `/api/visitas/*` |
| `server/modules/visitas/visitas.service.ts` | Lógica de visitas + QR |
| `server/seed.ts` | Pobla DB con datos demo |
| `api/index.ts` | Entry serverless de Vercel |
| `vercel.json` | Routing serverless |
| `.env.local` (no commit) | Variables locales |

### Archivos nuevos del frontend

| Path | Responsabilidad |
|------|-----------------|
| `src/lib/api.ts` | Cliente HTTP tipado |
| `src/lib/auth-store.tsx` | `AuthProvider`, `useAuth`, `RequireAuth` |
| `src/lib/image.ts` | Compresión de imágenes a base64 |
| `src/lib/types.ts` | Tipos compartidos del frontend (User, Visita, etc.) |
| `src/screens/movil/hooks/useVisitas.ts` | Hook de listado de visitas |
| `src/screens/movil/hooks/useVisita.ts` | Hook de detalle de una visita |

### Archivos modificados

| Path | Qué cambia |
|------|-----------|
| `package.json` | Nuevas deps + scripts |
| `tsconfig.json` | Path al `server/` y `shared/` |
| `vite.config.ts` | Proxy `/api` → `:4000` en dev |
| `.gitignore` | Añadir `.env.local` |
| `src/main.tsx` | Envolver `<App />` en `<AuthProvider>` |
| `src/App.tsx` | Envolver rutas privadas con `<RequireAuth>` |
| `src/screens/movil/LoginScreen.tsx` | Cablear contra `/api/auth/login` |
| `src/screens/movil/DashboardScreen.tsx` | Cargar user + próxima visita real |
| `src/screens/movil/VisitasScreen.tsx` | Listar desde backend |
| `src/screens/movil/NuevaVisitaScreen.tsx` | Crear visita real |
| `src/screens/movil/DetallesVisitaScreen.tsx` | Cargar y cancelar visita real |
| `src/screens/movil/QrNfcScreen.tsx` | Render con `qrcode.react` y token real |
| `src/screens/movil/MovilLayout.tsx` | Botón logout |

---

## Phase A — Backend base

### Task 1: Instalar dependencias del backend y dev tooling

**Files:**
- Modify: `package.json`

- [ ] **Step 1.1:** Instalar deps de runtime

```bash
npm install express mongoose zod cors qrcode.react browser-image-compression
```

- [ ] **Step 1.2:** Instalar deps de dev

```bash
npm install --save-dev tsx concurrently @types/express @types/cors
```

- [ ] **Step 1.3:** Verificar `package.json`

Abre `package.json`, confirma que en `dependencies` aparecen `express`, `mongoose`, `zod`, `cors`, `qrcode.react`, `browser-image-compression`. En `devDependencies`: `tsx`, `concurrently`, `@types/express`, `@types/cors`.

- [ ] **Step 1.4:** Pausa de revisión — pídele al usuario que confirme las versiones instaladas antes de seguir. **No commit.**

---

### Task 2: Configurar `.gitignore` y plantilla de env vars

**Files:**
- Modify: `.gitignore`
- Create: `.env.example`
- Create: `.env.local` (local, no se commitea)

- [ ] **Step 2.1:** Asegurar `.env.local` en `.gitignore`

Lee `.gitignore`. Si ya tiene `.env.local` o `.env*.local`, sigue. Si no, añade al final:

```
# Local env (server)
.env.local
.env*.local
```

- [ ] **Step 2.2:** Crear `.env.example`

```
MONGODB_URI=mongodb+srv://USER:PASSWORD@cluster.mongodb.net/accesos_udlap
PORT=4000
CORS_ORIGIN=http://localhost:5173
NODE_ENV=development
```

- [ ] **Step 2.3:** Crear `.env.local` con el URI real del usuario

Pídele al usuario que pegue su `MONGODB_URI` real de Atlas. Crea `.env.local` con esos valores. **No incluyas el URI real en commits ni en este plan.**

---

### Task 3: Crear validador de env (`server/env.ts`)

**Files:**
- Create: `server/env.ts`

- [ ] **Step 3.1:** Escribir `server/env.ts`

```ts
import { z } from "zod"
import { config } from "dotenv"
import { resolve } from "node:path"

config({ path: resolve(process.cwd(), ".env.local") })

const schema = z.object({
  MONGODB_URI: z.string().min(1, "MONGODB_URI es requerido"),
  PORT: z.coerce.number().default(4000),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
})

const parsed = schema.safeParse(process.env)
if (!parsed.success) {
  console.error("❌ Variables de entorno inválidas:")
  console.error(parsed.error.flatten().fieldErrors)
  throw new Error("Falta(n) variables de entorno. Revisa .env.local")
}

export const env = parsed.data
```

- [ ] **Step 3.2:** Instalar `dotenv`

```bash
npm install dotenv
```

- [ ] **Step 3.3:** Verificación rápida

Crea archivo temporal `server/__check_env.ts`:

```ts
import { env } from "./env"
console.log("ENV OK:", { hasMongo: !!env.MONGODB_URI, port: env.PORT })
```

Ejecuta:

```bash
npx tsx server/__check_env.ts
```

Esperado: imprime `ENV OK: { hasMongo: true, port: 4000 }`.

- [ ] **Step 3.4:** Borrar archivo temporal

```bash
rm server/__check_env.ts
```

---

### Task 4: Conexión Mongoose con cache (`server/db.ts`)

**Files:**
- Create: `server/db.ts`

- [ ] **Step 4.1:** Escribir `server/db.ts`

```ts
import mongoose from "mongoose"
import { env } from "./env"

type Cached = { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null }

// En serverless cada invocación reusa el módulo si está caliente.
// Guardamos la conexión en globalThis para sobrevivir entre invocaciones.
const globalAny = globalThis as unknown as { __mongoose?: Cached }
const cached: Cached = globalAny.__mongoose ?? { conn: null, promise: null }
globalAny.__mongoose = cached

export async function connectDb(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn
  if (!cached.promise) {
    cached.promise = mongoose
      .connect(env.MONGODB_URI, {
        serverSelectionTimeoutMS: 8000,
        maxPoolSize: 5,
      })
      .then((m) => {
        console.log("✅ MongoDB conectado")
        return m
      })
  }
  cached.conn = await cached.promise
  return cached.conn
}
```

- [ ] **Step 4.2:** Verificación de conexión

Crea archivo temporal `server/__check_db.ts`:

```ts
import { connectDb } from "./db"
async function main() {
  const m = await connectDb()
  console.log("DB OK:", m.connection.name, m.connection.readyState)
  await m.disconnect()
}
main().catch((e) => {
  console.error(e)
  process.exit(1)
})
```

Ejecuta:

```bash
npx tsx server/__check_db.ts
```

Esperado: `DB OK: accesos_udlap 1` (o el nombre que pusiste). Si falla por DNS/whitelist, pídele al usuario que añada `0.0.0.0/0` en Network Access de Atlas.

- [ ] **Step 4.3:** Borrar archivo temporal

```bash
rm server/__check_db.ts
```

---

### Task 5: Errores y async handler (`server/lib/`)

**Files:**
- Create: `server/lib/errors.ts`
- Create: `server/lib/asyncHandler.ts`

- [ ] **Step 5.1:** Escribir `server/lib/errors.ts`

```ts
export type ErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION"
  | "CONFLICT"
  | "INTERNAL"

const STATUS_BY_CODE: Record<ErrorCode, number> = {
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  VALIDATION: 400,
  CONFLICT: 409,
  INTERNAL: 500,
}

export class ApiError extends Error {
  status: number
  code: ErrorCode
  details?: unknown

  constructor(code: ErrorCode, message: string, details?: unknown) {
    super(message)
    this.code = code
    this.status = STATUS_BY_CODE[code]
    this.details = details
  }
}
```

- [ ] **Step 5.2:** Escribir `server/lib/asyncHandler.ts`

```ts
import type { Request, Response, NextFunction, RequestHandler } from "express"

type AsyncHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<unknown>

export const asyncHandler =
  (fn: AsyncHandler): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
```

---

### Task 6: Middleware de errores (`server/middlewares/error.ts`)

**Files:**
- Create: `server/middlewares/error.ts`

- [ ] **Step 6.1:** Escribir `server/middlewares/error.ts`

```ts
import type { ErrorRequestHandler } from "express"
import { ZodError } from "zod"
import { ApiError } from "../lib/errors"

export const notFoundHandler: ErrorRequestHandler = (_req, res) => {
  res.status(404).json({ error: "NOT_FOUND", message: "Ruta no encontrada" })
}

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ApiError) {
    res.status(err.status).json({
      error: err.code,
      message: err.message,
      details: err.details,
    })
    return
  }
  if (err instanceof ZodError) {
    res.status(400).json({
      error: "VALIDATION",
      message: "Datos inválidos",
      details: err.flatten(),
    })
    return
  }
  console.error("Unhandled error:", err)
  res.status(500).json({
    error: "INTERNAL",
    message: "Error interno del servidor",
  })
}
```

> El export de `notFoundHandler` se usa **antes** de `errorHandler` en `app.ts`, pero como `ErrorRequestHandler` para que se conecte al chain de errores. Si prefieres, puedes hacerlo como `RequestHandler` normal — solo recuerda registrarlo después de las rutas y antes del `errorHandler`. Aquí lo dejamos como handler simple en `app.ts`; si lo importan como `RequestHandler` regular, está bien.

- [ ] **Step 6.2:** Cambiar `notFoundHandler` a `RequestHandler` (es más correcto)

Reemplaza el archivo entero:

```ts
import type { ErrorRequestHandler, RequestHandler } from "express"
import { ZodError } from "zod"
import { ApiError } from "../lib/errors"

export const notFoundHandler: RequestHandler = (_req, res) => {
  res.status(404).json({ error: "NOT_FOUND", message: "Ruta no encontrada" })
}

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ApiError) {
    res.status(err.status).json({
      error: err.code,
      message: err.message,
      details: err.details,
    })
    return
  }
  if (err instanceof ZodError) {
    res.status(400).json({
      error: "VALIDATION",
      message: "Datos inválidos",
      details: err.flatten(),
    })
    return
  }
  console.error("Unhandled error:", err)
  res.status(500).json({
    error: "INTERNAL",
    message: "Error interno del servidor",
  })
}
```

---

### Task 7: Express app skeleton (`server/app.ts`)

**Files:**
- Create: `server/app.ts`

- [ ] **Step 7.1:** Escribir `server/app.ts`

```ts
import express from "express"
import cors from "cors"
import { env } from "./env"
import { connectDb } from "./db"
import { errorHandler, notFoundHandler } from "./middlewares/error"

export function createApp() {
  const app = express()

  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
    })
  )
  app.use(express.json({ limit: "10mb" })) // imágenes base64

  // Conecta a Mongo lazily en el primer request (importante en serverless)
  app.use(async (_req, _res, next) => {
    try {
      await connectDb()
      next()
    } catch (err) {
      next(err)
    }
  })

  app.get("/api/health", (_req, res) => {
    res.json({ data: { ok: true, ts: new Date().toISOString() } })
  })

  // Las rutas se montan en Tasks posteriores:
  // app.use("/api/auth", authRoutes)
  // app.use("/api/users", usersRoutes)
  // app.use("/api/visitas", visitasRoutes)

  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}
```

---

### Task 8: Bootstrap dev (`server/index.ts`) y handler serverless (`api/index.ts`)

**Files:**
- Create: `server/index.ts`
- Create: `api/index.ts`

- [ ] **Step 8.1:** Escribir `server/index.ts`

```ts
import { createApp } from "./app"
import { env } from "./env"

const app = createApp()

app.listen(env.PORT, () => {
  console.log(`🚀 Server escuchando en http://localhost:${env.PORT}`)
})
```

- [ ] **Step 8.2:** Escribir `api/index.ts`

```ts
import { createApp } from "../server/app"

const app = createApp()
export default app
```

---

### Task 9: Configurar `vercel.json`

**Files:**
- Create: `vercel.json`

- [ ] **Step 9.1:** Escribir `vercel.json`

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

---

### Task 10: Scripts en `package.json` y proxy de Vite

**Files:**
- Modify: `package.json`
- Modify: `vite.config.ts`

- [ ] **Step 10.1:** Modificar scripts en `package.json`

Reemplaza la sección `"scripts"` por:

```json
"scripts": {
  "dev": "concurrently -n vite,api -c blue,magenta \"vite\" \"tsx watch server/index.ts\"",
  "dev:client": "vite",
  "dev:api": "tsx watch server/index.ts",
  "build": "tsc -b && vite build",
  "start": "node --import tsx server/index.ts",
  "seed": "tsx server/seed.ts",
  "lint": "eslint .",
  "preview": "vite preview"
}
```

- [ ] **Step 10.2:** Añadir proxy en `vite.config.ts`

Lee el archivo actual. Modifica la export default para incluir `server.proxy`:

```ts
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import path from "node:path"

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
    },
  },
})
```

> Si tu `vite.config.ts` actual ya tiene contenido distinto, fusiona en lugar de reemplazar. Lo crítico es añadir el bloque `server.proxy`.

- [ ] **Step 10.3:** Smoke test del backend

En una terminal:

```bash
npm run dev:api
```

En otra:

```bash
curl http://localhost:4000/api/health
```

Esperado: `{"data":{"ok":true,"ts":"..."}}`. Mata el server con Ctrl+C después.

- [ ] **Step 10.4:** Pausa de revisión. **No commit.**

---

## Phase B — Modelo `User` y módulo Auth

### Task 11: Modelo `User` (`server/modules/users/user.model.ts`)

**Files:**
- Create: `server/modules/users/user.model.ts`

- [ ] **Step 11.1:** Escribir el schema

```ts
import { Schema, model, type InferSchemaType, type Model } from "mongoose"

export const ROLES = [
  "admin",
  "estudiante",
  "maestro",
  "oficial",
  "proveedor",
  "exaudlap",
  "residente",
  "adminColegios",
] as const
export type Role = (typeof ROLES)[number]

const profileEstudianteSchema = new Schema(
  {
    studentId: { type: String, required: true },
    programa: String,
    semestre: Number,
    saldoComedor: { type: Number, default: 0 },
    frecuentes: [
      { nombre: String, iniciales: String },
    ],
  },
  { _id: false }
)

const profileOficialSchema = new Schema(
  {
    numeroPlaca: String,
    turno: { type: String, enum: ["Matutino", "Vespertino", "Nocturno"] },
    pin: String,
    gateAsignado: String,
  },
  { _id: false }
)

const profileProveedorSchema = new Schema(
  {
    empresa: String,
    rfc: String,
    vehiculoMatricula: String,
  },
  { _id: false }
)

const profileMaestroSchema = new Schema(
  {
    numeroEmpleado: String,
    departamento: String,
  },
  { _id: false }
)

const profileExaudlapSchema = new Schema(
  {
    studentId: String,
    anioGraduacion: Number,
    programa: String,
  },
  { _id: false }
)

const profileResidenteSchema = new Schema(
  {
    studentId: String,
    programa: String,
    semestre: Number,
    edificioId: { type: Schema.Types.ObjectId, ref: "Edificio" },
    habitacion: String,
    estado: {
      type: String,
      enum: ["en_campus", "fuera", "invitado"],
      default: "fuera",
    },
  },
  { _id: false }
)

const profileAdminColegiosSchema = new Schema(
  {
    edificiosACargo: [{ type: Schema.Types.ObjectId, ref: "Edificio" }],
  },
  { _id: false }
)

const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
    password: { type: String, required: true }, // texto plano (decisión del usuario)
    role: { type: String, enum: ROLES, required: true, index: true },
    nombre: { type: String, required: true },
    apellido: { type: String, required: true },
    telefono: String,
    avatar: String, // base64
    sessionToken: { type: String, index: true },
    sessionExpiresAt: Date,
    profile: {
      estudiante: profileEstudianteSchema,
      oficial: profileOficialSchema,
      proveedor: profileProveedorSchema,
      maestro: profileMaestroSchema,
      exaudlap: profileExaudlapSchema,
      residente: profileResidenteSchema,
      adminColegios: profileAdminColegiosSchema,
    },
  },
  { timestamps: true }
)

export type UserDoc = InferSchemaType<typeof userSchema> & { _id: unknown }
export const User: Model<UserDoc> =
  (model as unknown as { models?: Record<string, Model<UserDoc>> }).models?.User ??
  model<UserDoc>("User", userSchema)
```

> El truco al final con `(model as unknown as ...).models?.User ??` evita el error de "OverwriteModelError" que tira Mongoose cuando se importa el archivo dos veces (frecuente en watch mode).

- [ ] **Step 11.2:** Forma más sencilla y correcta de evitar OverwriteModelError

Reemplaza el final del archivo por:

```ts
import mongoose from "mongoose"
// ... (resto del archivo igual hasta `export type UserDoc`)
export type UserDoc = InferSchemaType<typeof userSchema> & { _id: unknown }
export const User: Model<UserDoc> =
  (mongoose.models.User as Model<UserDoc>) ||
  mongoose.model<UserDoc>("User", userSchema)
```

> Asegúrate de tener el `import mongoose from "mongoose"` arriba (puede coexistir con el `import { Schema, model, ... }`).

---

### Task 12: Servicio + rutas de Auth

**Files:**
- Create: `server/modules/auth/auth.service.ts`
- Create: `server/modules/auth/auth.routes.ts`

- [ ] **Step 12.1:** Escribir `auth.service.ts`

```ts
import crypto from "node:crypto"
import { z } from "zod"
import { User } from "../users/user.model"
import { ApiError } from "../../lib/errors"

const loginInput = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7 // 7 días

export async function login(rawInput: unknown) {
  const { email, password } = loginInput.parse(rawInput)
  const user = await User.findOne({ email: email.toLowerCase().trim() })
  if (!user) throw new ApiError("UNAUTHORIZED", "Credenciales inválidas")
  if (user.password !== password) {
    throw new ApiError("UNAUTHORIZED", "Credenciales inválidas")
  }
  const token = crypto.randomUUID()
  user.sessionToken = token
  user.sessionExpiresAt = new Date(Date.now() + SESSION_TTL_MS)
  await user.save()
  return { user: serializeUser(user), token }
}

export async function logoutByToken(token: string) {
  await User.updateOne(
    { sessionToken: token },
    { $unset: { sessionToken: 1, sessionExpiresAt: 1 } }
  )
}

export async function findUserBySessionToken(token: string) {
  const user = await User.findOne({ sessionToken: token })
  if (!user) return null
  if (user.sessionExpiresAt && user.sessionExpiresAt.getTime() < Date.now()) {
    return null
  }
  return user
}

export function serializeUser(user: any) {
  return {
    id: String(user._id),
    email: user.email,
    role: user.role,
    nombre: user.nombre,
    apellido: user.apellido,
    telefono: user.telefono ?? null,
    avatar: user.avatar ?? null,
    profile: user.profile ?? {},
  }
}
```

- [ ] **Step 12.2:** Escribir `auth.routes.ts`

```ts
import { Router } from "express"
import { asyncHandler } from "../../lib/asyncHandler"
import { ApiError } from "../../lib/errors"
import { requireAuth } from "../../middlewares/auth"
import {
  login,
  logoutByToken,
  serializeUser,
} from "./auth.service"

export const authRoutes = Router()

authRoutes.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { user, token } = await login(req.body)
    res.json({ data: { user, token } })
  })
)

authRoutes.post(
  "/logout",
  requireAuth,
  asyncHandler(async (req, res) => {
    const token = req.authToken!
    await logoutByToken(token)
    res.status(204).end()
  })
)

authRoutes.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    if (!req.user) throw new ApiError("UNAUTHORIZED", "No autenticado")
    res.json({ data: { user: serializeUser(req.user) } })
  })
)
```

---

### Task 13: Middleware de auth (`server/middlewares/auth.ts`)

**Files:**
- Create: `server/middlewares/auth.ts`

- [ ] **Step 13.1:** Escribir el middleware

```ts
import type { RequestHandler } from "express"
import { findUserBySessionToken } from "../modules/auth/auth.service"
import type { Role } from "../modules/users/user.model"
import { ApiError } from "../lib/errors"

declare module "express-serve-static-core" {
  interface Request {
    user?: any
    authToken?: string
  }
}

function readToken(req: Parameters<RequestHandler>[0]): string | null {
  const h = req.headers.authorization
  if (!h) return null
  const [scheme, token] = h.split(" ")
  if (scheme !== "Bearer" || !token) return null
  return token
}

export const requireAuth: RequestHandler = async (req, _res, next) => {
  try {
    const token = readToken(req)
    if (!token) throw new ApiError("UNAUTHORIZED", "Falta token")
    const user = await findUserBySessionToken(token)
    if (!user) throw new ApiError("UNAUTHORIZED", "Token inválido o expirado")
    req.user = user
    req.authToken = token
    next()
  } catch (err) {
    next(err)
  }
}

export const requireRole =
  (...roles: Role[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.user) return next(new ApiError("UNAUTHORIZED", "No autenticado"))
    if (!roles.includes(req.user.role)) {
      return next(new ApiError("FORBIDDEN", "No tienes permiso para esto"))
    }
    next()
  }
```

---

### Task 14: Montar rutas auth en `app.ts`

**Files:**
- Modify: `server/app.ts`

- [ ] **Step 14.1:** Importar y montar `authRoutes`

En `server/app.ts`, añade el import al inicio (junto con los otros):

```ts
import { authRoutes } from "./modules/auth/auth.routes"
```

Reemplaza la sección de comentarios `// Las rutas se montan en Tasks posteriores:` por:

```ts
app.use("/api/auth", authRoutes)
// app.use("/api/users", usersRoutes)
// app.use("/api/visitas", visitasRoutes)
```

---

### Task 15: Seed básico para Auth (1 usuario por rol crítico)

**Files:**
- Create: `server/seed.ts`

- [ ] **Step 15.1:** Escribir `server/seed.ts`

```ts
import { connectDb } from "./db"
import { User } from "./modules/users/user.model"

async function main() {
  await connectDb()

  // Limpiar usuarios para que el seed sea idempotente
  await User.deleteMany({})

  const docs = [
    {
      email: "admin@udlap.mx",
      password: "demo1234",
      role: "admin" as const,
      nombre: "Administrador",
      apellido: "UDLAP",
    },
    {
      email: "estudiante@udlap.mx",
      password: "demo1234",
      role: "estudiante" as const,
      nombre: "Juan",
      apellido: "Pérez",
      telefono: "222-1234567",
      profile: {
        estudiante: {
          studentId: "181278",
          programa: "Ing. en Sistemas",
          semestre: 6,
          saldoComedor: 450,
          frecuentes: [
            { nombre: "Juan López", iniciales: "JL" },
            { nombre: "Ana S.", iniciales: "AS" },
          ],
        },
      },
    },
    {
      email: "seguridad@udlap.mx",
      password: "demo1234",
      role: "oficial" as const,
      nombre: "María",
      apellido: "González",
      profile: {
        oficial: {
          numeroPlaca: "SEG-007",
          turno: "Matutino",
          pin: "1234",
          gateAsignado: "Gaos",
        },
      },
    },
  ]

  await User.insertMany(docs)

  console.log(`✅ Seed completo: ${docs.length} usuarios creados`)
  console.log("   - admin@udlap.mx / demo1234")
  console.log("   - estudiante@udlap.mx / demo1234")
  console.log("   - seguridad@udlap.mx / demo1234")
}

main()
  .catch((e) => {
    console.error("❌ Seed falló:", e)
    process.exit(1)
  })
  .finally(async () => {
    const mongoose = await import("mongoose")
    await mongoose.disconnect()
  })
```

- [ ] **Step 15.2:** Ejecutar el seed

```bash
npm run seed
```

Esperado:
```
✅ MongoDB conectado
✅ Seed completo: 3 usuarios creados
   - admin@udlap.mx / demo1234
   - estudiante@udlap.mx / demo1234
   - seguridad@udlap.mx / demo1234
```

---

### Task 16: Smoke test manual de Auth

**Files:** ninguno

- [ ] **Step 16.1:** Levantar el server

```bash
npm run dev:api
```

- [ ] **Step 16.2:** Probar login

```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"estudiante@udlap.mx","password":"demo1234"}'
```

Esperado: respuesta con `{"data":{"user":{"id":"...","email":"estudiante@udlap.mx","role":"estudiante",...},"token":"..."}}`. Guarda el token (variable de entorno mental o copia/pega).

- [ ] **Step 16.3:** Probar `/me` con el token

```bash
TOKEN="<pega_aqui>"
curl http://localhost:4000/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

Esperado: regresa el usuario.

- [ ] **Step 16.4:** Probar login con password incorrecto

```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"estudiante@udlap.mx","password":"wrong"}'
```

Esperado: 401 con `{"error":"UNAUTHORIZED","message":"Credenciales inválidas"}`.

- [ ] **Step 16.5:** Pausa de revisión. **No commit.**

---

## Phase C — Módulo Visitas

### Task 17: Modelo `Visita` (`server/modules/visitas/visita.model.ts`)

**Files:**
- Create: `server/modules/visitas/visita.model.ts`

- [ ] **Step 17.1:** Escribir el schema

```ts
import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose"

export const VISITA_STATUS = [
  "programada",
  "activa",
  "expirada",
  "cancelada",
] as const
export type VisitaStatus = (typeof VISITA_STATUS)[number]

const invitadoSchema = new Schema(
  {
    nombre: { type: String, required: true },
    tipoId: String,
    foto: String, // base64; opcional, no usado en plan 1
    categoria: {
      type: String,
      enum: ["servicio", "personal", "comunidad_udlap", "visita"],
      default: "visita",
    },
  },
  { _id: false }
)

const scanSchema = new Schema(
  {
    puntoId: String,
    oficialId: { type: Schema.Types.ObjectId, ref: "User" },
    timestamp: { type: Date, default: () => new Date() },
    resultado: { type: String, enum: ["permitido", "denegado"] },
    motivo: String,
  },
  { _id: false }
)

const visitaSchema = new Schema(
  {
    anfitrionId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    invitado: { type: invitadoSchema, required: true },
    tipoAcceso: {
      type: String,
      enum: ["vehicular", "peatonal"],
      required: true,
    },
    puntoAcceso: { type: String, required: true },
    fechaHora: { type: Date, required: true, index: true },
    multiplesEntradas: { type: Boolean, default: false },
    status: {
      type: String,
      enum: VISITA_STATUS,
      default: "programada",
    },
    qrToken: { type: String, required: true, unique: true, index: true },
    qrExpiraEn: Date,
    edificioDestinoId: { type: Schema.Types.ObjectId, ref: "Edificio" },
    comentarios: String,
    estatusVisitante: {
      type: String,
      enum: ["sin_antecedentes", "con_antecedentes"],
      default: "sin_antecedentes",
    },
    scans: [scanSchema],
  },
  { timestamps: true }
)

export type VisitaDoc = InferSchemaType<typeof visitaSchema> & { _id: unknown }
export const Visita: Model<VisitaDoc> =
  (mongoose.models.Visita as Model<VisitaDoc>) ||
  mongoose.model<VisitaDoc>("Visita", visitaSchema)
```

---

### Task 18: Servicio de visitas (`server/modules/visitas/visitas.service.ts`)

**Files:**
- Create: `server/modules/visitas/visitas.service.ts`

- [ ] **Step 18.1:** Escribir el servicio

```ts
import crypto from "node:crypto"
import { z } from "zod"
import { Visita, type VisitaStatus } from "./visita.model"
import { ApiError } from "../../lib/errors"

const createInput = z.object({
  invitado: z.object({
    nombre: z.string().min(1),
    tipoId: z.string().optional(),
    foto: z.string().optional(),
    categoria: z
      .enum(["servicio", "personal", "comunidad_udlap", "visita"])
      .default("visita"),
  }),
  tipoAcceso: z.enum(["vehicular", "peatonal"]),
  puntoAcceso: z.string().min(1),
  fechaHora: z.coerce.date(),
  multiplesEntradas: z.boolean().default(false),
  comentarios: z.string().optional(),
})

const patchInput = z.object({
  status: z.enum(["cancelada"]).optional(), // por ahora solo permitimos cancelar manualmente
  comentarios: z.string().optional(),
})

function defaultExpiry(fechaHora: Date, multiples: boolean): Date {
  if (multiples) {
    const end = new Date(fechaHora)
    end.setHours(23, 59, 59, 999)
    return end
  }
  // Sin múltiples entradas: vence 4 h después de fechaHora
  return new Date(fechaHora.getTime() + 1000 * 60 * 60 * 4)
}

export async function createVisita(anfitrionId: string, raw: unknown) {
  const input = createInput.parse(raw)
  const qrToken = crypto.randomUUID()
  const qrExpiraEn = defaultExpiry(input.fechaHora, input.multiplesEntradas)
  const status: VisitaStatus =
    input.fechaHora.getTime() <= Date.now() ? "activa" : "programada"

  const doc = await Visita.create({
    anfitrionId,
    invitado: input.invitado,
    tipoAcceso: input.tipoAcceso,
    puntoAcceso: input.puntoAcceso,
    fechaHora: input.fechaHora,
    multiplesEntradas: input.multiplesEntradas,
    comentarios: input.comentarios,
    qrToken,
    qrExpiraEn,
    status,
  })

  return doc.toObject()
}

export async function listVisitasDe(anfitrionId: string, status?: string) {
  const filter: Record<string, unknown> = { anfitrionId }
  if (status) filter.status = status
  return Visita.find(filter).sort({ fechaHora: -1 }).lean()
}

export async function getVisitaById(id: string, anfitrionId?: string) {
  const filter: Record<string, unknown> = { _id: id }
  if (anfitrionId) filter.anfitrionId = anfitrionId
  const doc = await Visita.findOne(filter).lean()
  if (!doc) throw new ApiError("NOT_FOUND", "Visita no encontrada")
  return doc
}

export async function patchVisita(id: string, anfitrionId: string, raw: unknown) {
  const input = patchInput.parse(raw)
  const doc = await Visita.findOneAndUpdate(
    { _id: id, anfitrionId },
    { $set: input },
    { new: true }
  ).lean()
  if (!doc) throw new ApiError("NOT_FOUND", "Visita no encontrada")
  return doc
}

export async function deleteVisita(id: string, anfitrionId: string) {
  const r = await Visita.deleteOne({ _id: id, anfitrionId })
  if (r.deletedCount === 0) {
    throw new ApiError("NOT_FOUND", "Visita no encontrada")
  }
}

export async function getByQrToken(qrToken: string) {
  const doc = await Visita.findOne({ qrToken }).lean()
  if (!doc) throw new ApiError("NOT_FOUND", "QR inválido")
  if (doc.qrExpiraEn && doc.qrExpiraEn.getTime() < Date.now()) {
    throw new ApiError("VALIDATION", "QR expirado")
  }
  return doc
}

const scanInput = z.object({
  puntoId: z.string().min(1),
  resultado: z.enum(["permitido", "denegado"]),
  motivo: z.string().optional(),
})

export async function scanVisita(qrToken: string, oficialId: string, raw: unknown) {
  const input = scanInput.parse(raw)
  const visita = await Visita.findOne({ qrToken })
  if (!visita) throw new ApiError("NOT_FOUND", "QR inválido")
  if (visita.qrExpiraEn && visita.qrExpiraEn.getTime() < Date.now()) {
    throw new ApiError("VALIDATION", "QR expirado")
  }
  visita.scans.push({
    puntoId: input.puntoId,
    oficialId: oficialId as unknown as never,
    timestamp: new Date(),
    resultado: input.resultado,
    motivo: input.motivo,
  } as never)
  if (input.resultado === "permitido" && visita.status === "programada") {
    visita.status = "activa"
  }
  await visita.save()
  return visita.toObject()
}
```

---

### Task 19: Rutas de visitas (`server/modules/visitas/visitas.routes.ts`)

**Files:**
- Create: `server/modules/visitas/visitas.routes.ts`

- [ ] **Step 19.1:** Escribir las rutas

```ts
import { Router } from "express"
import { asyncHandler } from "../../lib/asyncHandler"
import { requireAuth, requireRole } from "../../middlewares/auth"
import {
  createVisita,
  deleteVisita,
  getByQrToken,
  getVisitaById,
  listVisitasDe,
  patchVisita,
  scanVisita,
} from "./visitas.service"

export const visitasRoutes = Router()

// QR público (no requiere auth para mostrar info pre-aprobación)
visitasRoutes.get(
  "/qr/:qrToken",
  asyncHandler(async (req, res) => {
    const v = await getByQrToken(req.params.qrToken)
    res.json({ data: v })
  })
)

// Scan requiere oficial o adminColegios
visitasRoutes.post(
  "/qr/:qrToken/scan",
  requireAuth,
  requireRole("oficial", "adminColegios", "admin"),
  asyncHandler(async (req, res) => {
    const v = await scanVisita(
      req.params.qrToken,
      String(req.user._id),
      req.body
    )
    res.json({ data: v })
  })
)

// Resto requiere auth como anfitrión (estudiante, maestro, etc.)
visitasRoutes.use(requireAuth)

visitasRoutes.get(
  "/",
  asyncHandler(async (req, res) => {
    const status = typeof req.query.status === "string" ? req.query.status : undefined
    const items = await listVisitasDe(String(req.user._id), status)
    res.json({ data: items })
  })
)

visitasRoutes.post(
  "/",
  requireRole("estudiante", "maestro", "proveedor", "residente", "exaudlap", "admin"),
  asyncHandler(async (req, res) => {
    const v = await createVisita(String(req.user._id), req.body)
    res.status(201).json({ data: v })
  })
)

visitasRoutes.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const v = await getVisitaById(req.params.id, String(req.user._id))
    res.json({ data: v })
  })
)

visitasRoutes.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const v = await patchVisita(req.params.id, String(req.user._id), req.body)
    res.json({ data: v })
  })
)

visitasRoutes.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await deleteVisita(req.params.id, String(req.user._id))
    res.status(204).end()
  })
)
```

---

### Task 20: Montar visitas en `app.ts`

**Files:**
- Modify: `server/app.ts`

- [ ] **Step 20.1:** Importar y montar

Añade al inicio:

```ts
import { visitasRoutes } from "./modules/visitas/visitas.routes"
```

Reemplaza la línea comentada por:

```ts
app.use("/api/visitas", visitasRoutes)
```

- [ ] **Step 20.2:** Smoke test

```bash
npm run dev:api
```

En otra terminal, login para obtener token, luego crear visita:

```bash
TOKEN=$(curl -s -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"estudiante@udlap.mx","password":"demo1234"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['token'])")

echo "Token: $TOKEN"

curl -X POST http://localhost:4000/api/visitas \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "invitado": {"nombre":"Pedro Test","categoria":"visita"},
    "tipoAcceso":"peatonal",
    "puntoAcceso":"Acceso Gaos",
    "fechaHora":"2026-04-29T15:00:00Z",
    "multiplesEntradas":false
  }'
```

Esperado: status 201 con `{"data":{"_id":"...","qrToken":"...","status":"programada",...}}`.

- [ ] **Step 20.3:** Listar visitas

```bash
curl http://localhost:4000/api/visitas \
  -H "Authorization: Bearer $TOKEN"
```

Esperado: array con la visita creada.

- [ ] **Step 20.4:** Pausa de revisión. **No commit.**

---

## Phase D — Frontend infra

### Task 21: Cliente HTTP (`src/lib/api.ts`)

**Files:**
- Create: `src/lib/api.ts`

- [ ] **Step 21.1:** Escribir el cliente

```ts
const STORAGE_TOKEN_KEY = "accesos_udlap_token"

export class ApiError extends Error {
  status: number
  code: string
  details?: unknown
  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message)
    this.status = status
    this.code = code
    this.details = details
  }
}

const baseUrl: string =
  (import.meta.env.VITE_API_URL as string | undefined) ?? ""

function buildUrl(path: string, query?: Record<string, unknown>): string {
  const url = new URL(`${baseUrl}${path}`, window.location.origin)
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v === undefined || v === null) continue
      url.searchParams.set(k, String(v))
    }
  }
  // Si baseUrl está vacío y nuestro path empieza con /api, queda relativo correcto
  return url.pathname + url.search
}

function getToken(): string | null {
  return localStorage.getItem(STORAGE_TOKEN_KEY)
}

export function setStoredToken(token: string | null): void {
  if (token === null) localStorage.removeItem(STORAGE_TOKEN_KEY)
  else localStorage.setItem(STORAGE_TOKEN_KEY, token)
}

async function request<T>(
  method: string,
  path: string,
  opts?: { query?: Record<string, unknown>; body?: unknown }
): Promise<T> {
  const headers: Record<string, string> = {}
  const token = getToken()
  if (token) headers["Authorization"] = `Bearer ${token}`
  if (opts?.body !== undefined) headers["Content-Type"] = "application/json"

  const res = await fetch(buildUrl(path, opts?.query), {
    method,
    headers,
    body: opts?.body !== undefined ? JSON.stringify(opts.body) : undefined,
  })

  if (res.status === 204) return undefined as T

  const text = await res.text()
  let json: any = null
  try {
    json = text ? JSON.parse(text) : null
  } catch {
    /* not json */
  }

  if (!res.ok) {
    const code = json?.error ?? "INTERNAL"
    const message = json?.message ?? `HTTP ${res.status}`
    if (res.status === 401) {
      // 401 global: limpia token. La capa de auth-store detectará y redirigirá.
      setStoredToken(null)
      window.dispatchEvent(new Event("accesos:unauthorized"))
    }
    throw new ApiError(res.status, code, message, json?.details)
  }

  return (json?.data ?? json) as T
}

export const api = {
  get: <T>(path: string, query?: Record<string, unknown>) =>
    request<T>("GET", path, { query }),
  post: <T>(path: string, body?: unknown) =>
    request<T>("POST", path, { body }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>("PATCH", path, { body }),
  delete: <T>(path: string) => request<T>("DELETE", path),
}
```

---

### Task 22: Tipos compartidos (`src/lib/types.ts`)

**Files:**
- Create: `src/lib/types.ts`

- [ ] **Step 22.1:** Escribir los tipos

```ts
export type Role =
  | "admin"
  | "estudiante"
  | "maestro"
  | "oficial"
  | "proveedor"
  | "exaudlap"
  | "residente"
  | "adminColegios"

export interface UserProfileEstudiante {
  studentId: string
  programa?: string
  semestre?: number
  saldoComedor?: number
  frecuentes?: { nombre: string; iniciales: string }[]
}

export interface User {
  id: string
  email: string
  role: Role
  nombre: string
  apellido: string
  telefono?: string | null
  avatar?: string | null
  profile?: {
    estudiante?: UserProfileEstudiante
    [k: string]: unknown
  }
}

export type VisitaStatus = "programada" | "activa" | "expirada" | "cancelada"
export type TipoAcceso = "vehicular" | "peatonal"
export type CategoriaVisita = "servicio" | "personal" | "comunidad_udlap" | "visita"

export interface Visita {
  _id: string
  anfitrionId: string
  invitado: {
    nombre: string
    tipoId?: string
    foto?: string | null
    categoria: CategoriaVisita
  }
  tipoAcceso: TipoAcceso
  puntoAcceso: string
  fechaHora: string
  multiplesEntradas: boolean
  status: VisitaStatus
  qrToken: string
  qrExpiraEn?: string
  comentarios?: string
  estatusVisitante?: "sin_antecedentes" | "con_antecedentes"
  scans?: {
    puntoId: string
    oficialId?: string
    timestamp: string
    resultado: "permitido" | "denegado"
    motivo?: string
  }[]
  createdAt: string
  updatedAt: string
}
```

---

### Task 23: AuthProvider y RequireAuth (`src/lib/auth-store.tsx`)

**Files:**
- Create: `src/lib/auth-store.tsx`

- [ ] **Step 23.1:** Escribir el archivo

```tsx
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { Navigate, useLocation } from "react-router-dom"
import { api, setStoredToken } from "./api"
import type { Role, User } from "./types"

const STORAGE_USER_KEY = "accesos_udlap_user"

interface AuthValue {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<User>
  logout: () => Promise<void>
  refresh: () => Promise<void>
}

const Ctx = createContext<AuthValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const raw = localStorage.getItem(STORAGE_USER_KEY)
    if (!raw) return null
    try {
      return JSON.parse(raw) as User
    } catch {
      return null
    }
  })
  const [isLoading, setIsLoading] = useState(true)

  const persist = (u: User | null) => {
    setUser(u)
    if (u) localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(u))
    else localStorage.removeItem(STORAGE_USER_KEY)
  }

  const refresh = useCallback(async () => {
    try {
      const data = await api.get<{ user: User }>("/api/auth/me")
      persist(data.user)
    } catch {
      persist(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  useEffect(() => {
    const onUnauthorized = () => persist(null)
    window.addEventListener("accesos:unauthorized", onUnauthorized)
    return () => window.removeEventListener("accesos:unauthorized", onUnauthorized)
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const data = await api.post<{ user: User; token: string }>("/api/auth/login", {
      email,
      password,
    })
    setStoredToken(data.token)
    persist(data.user)
    setIsLoading(false)
    return data.user
  }, [])

  const logout = useCallback(async () => {
    try {
      await api.post("/api/auth/logout")
    } catch {
      /* ignore */
    } finally {
      setStoredToken(null)
      persist(null)
    }
  }, [])

  const value = useMemo<AuthValue>(
    () => ({ user, isLoading, login, logout, refresh }),
    [user, isLoading, login, logout, refresh]
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthValue {
  const v = useContext(Ctx)
  if (!v) throw new Error("useAuth fuera de AuthProvider")
  return v
}

interface RequireAuthProps {
  children: ReactNode
  role?: Role | Role[]
  loginPath?: string
}

export function RequireAuth({
  children,
  role,
  loginPath = "/movil/login",
}: RequireAuthProps) {
  const { user, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-gray-400">
        Cargando…
      </div>
    )
  }
  if (!user) {
    return <Navigate to={loginPath} replace state={{ from: location }} />
  }
  if (role) {
    const allowed = Array.isArray(role) ? role : [role]
    if (!allowed.includes(user.role)) {
      return <Navigate to="/" replace />
    }
  }
  return <>{children}</>
}
```

---

### Task 24: Compresión de imágenes (`src/lib/image.ts`)

**Files:**
- Create: `src/lib/image.ts`

- [ ] **Step 24.1:** Escribir el helper

```ts
import imageCompression from "browser-image-compression"

interface CompressOpts {
  maxKB?: number
  maxPx?: number
}

export async function compressToBase64(
  file: File,
  opts: CompressOpts = {}
): Promise<string> {
  const { maxKB = 300, maxPx = 1280 } = opts
  const compressed = await imageCompression(file, {
    maxSizeMB: maxKB / 1024,
    maxWidthOrHeight: maxPx,
    useWebWorker: true,
  })
  return await fileToDataUrl(compressed)
}

function fileToDataUrl(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}
```

---

### Task 25: Envolver `<App />` con `<AuthProvider>`

**Files:**
- Modify: `src/main.tsx`

- [ ] **Step 25.1:** Modificar `main.tsx`

Reemplaza el archivo completo:

```tsx
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import "./index.css"
import App from "./App.tsx"
import { AuthProvider } from "@/lib/auth-store"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>
)
```

> Nota: `<AuthProvider>` necesita estar **dentro** del `<BrowserRouter>` para que `useLocation()` funcione en `<RequireAuth>`. El `<BrowserRouter>` está dentro de `App.tsx`, no en `main.tsx`. Por eso necesitamos refactorizar.

- [ ] **Step 25.2:** Mover `<BrowserRouter>` a `main.tsx`

Reemplaza `src/main.tsx`:

```tsx
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter } from "react-router-dom"

import "./index.css"
import App from "./App.tsx"
import { AuthProvider } from "@/lib/auth-store"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
)
```

- [ ] **Step 25.3:** Quitar `<BrowserRouter>` de `App.tsx`

Lee `src/App.tsx`. Cambia el wrapper externo: `BrowserRouter` ya no se importa ni se usa aquí. La función `App` queda:

```tsx
export function App() {
  return (
    <Routes>
      {/* ... mismas rutas que antes ... */}
    </Routes>
  )
}
```

Quita el import `BrowserRouter` del top.

- [ ] **Step 25.4:** Verificar smoke

```bash
npm run dev
```

Abre `http://localhost:5173/`. Debe mostrar el `InterfaceSelector` igual que antes. Si algo se rompe, revisa la consola.

---

### Task 26: Aplicar `<RequireAuth>` a las rutas privadas de móvil

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 26.1:** Importar y envolver

En `src/App.tsx`, añade el import:

```tsx
import { RequireAuth } from "@/lib/auth-store"
```

Reemplaza el bloque de `Route path="/movil"`:

```tsx
{/* ── Móvil ───────────────────────────────────── */}
<Route path="/movil/login" element={<LoginScreen />} />
<Route
  path="/movil"
  element={
    <RequireAuth role={["estudiante", "residente", "exaudlap", "maestro", "proveedor"]}>
      <MovilLayout />
    </RequireAuth>
  }
>
  <Route index element={<Navigate to="/movil/dashboard" replace />} />
  <Route path="dashboard" element={<DashboardScreen />} />
  <Route path="qr-nfc" element={<QrNfcScreen />} />
  <Route path="visitas" element={<VisitasScreen />} />
  <Route path="visitas/nueva" element={<NuevaVisitaScreen />} />
  <Route path="visitas/:id" element={<DetallesVisitaScreen />} />
  <Route path="horario" element={<HorarioScreen />} />
  <Route path="perfil" element={<PerfilScreen />} />
  <Route path="comedor" element={<ComedorScreen />} />
  <Route path="biblioteca" element={<BibliotecaScreen />} />
</Route>
```

> **Importante:** la ruta `/movil/login` queda fuera del wrapper, para que un usuario sin sesión pueda acceder. Las hijas de `/movil` (dashboard, etc.) sí están protegidas porque heredan del padre.

---

## Phase E — Pantallas móvil

### Task 27: Cablear `LoginScreen` al backend

**Files:**
- Modify: `src/screens/movil/LoginScreen.tsx`

- [ ] **Step 27.1:** Reemplazar el componente

```tsx
import { useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, Scan, Globe, Fingerprint } from "lucide-react"
import { QrCode } from "./QrCode"
import { useAuth } from "@/lib/auth-store"
import { ApiError } from "@/lib/api"

export function LoginScreen() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, user } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const from =
    (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ??
    "/movil/dashboard"

  // Si ya está autenticado, manda al dashboard
  if (user) {
    navigate(from, { replace: true })
  }

  const handleLogin = async () => {
    setError(null)
    setSubmitting(true)
    try {
      const u = await login(email.trim().toLowerCase(), password)
      // Redirect según rol
      if (u.role === "oficial") navigate("/ipad", { replace: true })
      else if (u.role === "adminColegios") navigate("/colegios", { replace: true })
      else navigate(from, { replace: true })
    } catch (err) {
      if (err instanceof ApiError) setError(err.message)
      else setError("No se pudo iniciar sesión")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-white px-6 pt-12 pb-8">
      <div className="flex flex-col items-center mb-8">
        <div
          className="w-24 h-24 rounded-full mb-5 flex items-center justify-center overflow-hidden"
          style={{ border: "3px solid #ea580c", padding: 3 }}
        >
          <div
            className="w-full h-full rounded-full flex items-center justify-center text-white font-black text-2xl"
            style={{ background: "linear-gradient(135deg,#1e3a5f 0%,#0f2d5e 100%)" }}
          >
            UDLAP
          </div>
        </div>

        <h1 className="text-2xl font-black text-gray-900 mb-1">Iniciar Sesión</h1>
        <p className="text-sm text-gray-500 text-center">
          Ingresa tus credenciales institucionales
        </p>
      </div>

      <form
        className="flex flex-col gap-5 mb-6"
        onSubmit={(e) => {
          e.preventDefault()
          if (!submitting) void handleLogin()
        }}
      >
        <div className="space-y-1.5">
          <Label className="text-sm font-semibold text-gray-700">Correo institucional</Label>
          <Input
            placeholder="estudiante@udlap.mx"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-12 rounded-xl border-gray-200 bg-gray-50 text-sm"
            autoComplete="username"
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm font-semibold text-gray-700">Contraseña</Label>
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 rounded-xl border-gray-200 bg-gray-50 text-sm pr-12"
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              aria-label="Toggle password"
            >
              {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
            </button>
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              className="text-xs font-semibold"
              style={{ color: "#ea580c" }}
              onClick={() =>
                alert("Contacta al administrador. La recuperación no está habilitada en demo.")
              }
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <Button
          type="submit"
          disabled={submitting}
          className="h-13 rounded-xl text-white font-bold text-base w-full disabled:opacity-50"
          style={{ background: "linear-gradient(135deg,#ea580c 0%,#c2410c 100%)", border: "none", height: 52 }}
        >
          {submitting ? "Iniciando…" : "Iniciar Sesión"}
        </Button>
      </form>

      <div className="mb-6">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
          Cuentas demo
        </p>
        <div className="grid gap-2 text-xs text-gray-600">
          <button
            type="button"
            onClick={() => {
              setEmail("estudiante@udlap.mx")
              setPassword("demo1234")
            }}
            className="text-left p-3 rounded-lg bg-gray-50 hover:bg-gray-100"
          >
            <div className="font-bold text-gray-800">Estudiante</div>
            <div>estudiante@udlap.mx · demo1234</div>
          </button>
        </div>
      </div>

      <div className="mt-auto">
        <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest text-center mb-4">
          Otras Opciones
        </p>
        <div className="flex justify-center gap-8 mb-6">
          <button className="flex flex-col items-center gap-1.5" type="button" onClick={() => alert("FaceID no disponible en demo")}>
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
              <Scan className="size-5 text-gray-400" />
            </div>
          </button>
          <button className="flex flex-col items-center gap-1.5" type="button" onClick={() => alert("Huella no disponible en demo")}>
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
              <Fingerprint className="size-5 text-gray-400" />
            </div>
          </button>
          <button className="flex flex-col items-center gap-1.5" type="button" onClick={() => navigate("/")}>
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
              <Globe className="size-5 text-gray-400" />
            </div>
          </button>
        </div>

        <p className="text-center text-[11px] text-gray-300 leading-relaxed">
          © 2024 Universidad de las Américas Puebla
          <br />
          Todos los derechos reservados.
        </p>
      </div>

      {/* Decorativo (mantener por consistencia visual) */}
      <div className="hidden">
        <QrCode size={1} color="#000" />
      </div>
    </div>
  )
}
```

- [ ] **Step 27.2:** Probar login en navegador

Levanta `npm run dev`. Ve a `http://localhost:5173/movil/login`. Click en "Estudiante" para autollenar, click en "Iniciar Sesión". Debe redirigir a `/movil/dashboard`. Si la pantalla de dashboard truena, no te preocupes — la cableamos en la siguiente task.

- [ ] **Step 27.3:** Pausa de revisión. **No commit.**

---

### Task 28: Hooks de visitas (`src/screens/movil/hooks/`)

**Files:**
- Create: `src/screens/movil/hooks/useVisitas.ts`
- Create: `src/screens/movil/hooks/useVisita.ts`

- [ ] **Step 28.1:** Crear `useVisitas.ts`

```ts
import { useCallback, useEffect, useState } from "react"
import { api } from "@/lib/api"
import type { Visita, VisitaStatus } from "@/lib/types"

interface NuevaVisitaInput {
  invitado: { nombre: string; tipoId?: string; categoria?: Visita["invitado"]["categoria"] }
  tipoAcceso: Visita["tipoAcceso"]
  puntoAcceso: string
  fechaHora: string // ISO
  multiplesEntradas: boolean
  comentarios?: string
}

export function useVisitas(params?: { status?: VisitaStatus }) {
  const [data, setData] = useState<Visita[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get<Visita[]>("/api/visitas", { status: params?.status })
      setData(res)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error")
    } finally {
      setLoading(false)
    }
  }, [params?.status])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const create = useCallback(
    async (input: NuevaVisitaInput) => {
      const created = await api.post<Visita>("/api/visitas", input)
      await refresh()
      return created
    },
    [refresh]
  )

  return { data, loading, error, refresh, create }
}
```

- [ ] **Step 28.2:** Crear `useVisita.ts`

```ts
import { useCallback, useEffect, useState } from "react"
import { api } from "@/lib/api"
import type { Visita } from "@/lib/types"

export function useVisita(id: string | undefined) {
  const [data, setData] = useState<Visita | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!id) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await api.get<Visita>(`/api/visitas/${id}`)
      setData(res)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error")
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const cancel = useCallback(async () => {
    if (!id) return
    const updated = await api.patch<Visita>(`/api/visitas/${id}`, { status: "cancelada" })
    setData(updated)
  }, [id])

  return { data, loading, error, refresh, cancel }
}
```

---

### Task 29: Cablear `DashboardScreen`

**Files:**
- Modify: `src/screens/movil/DashboardScreen.tsx`

- [ ] **Step 29.1:** Leer el archivo actual

```bash
cat src/screens/movil/DashboardScreen.tsx
```

- [ ] **Step 29.2:** Reemplazar las fuentes de datos mock por hooks reales

En lugar de leer de `currentUser` y `visitasMock`, usa:

```tsx
import { useAuth } from "@/lib/auth-store"
import { useVisitas } from "./hooks/useVisitas"
```

Y dentro del componente:

```tsx
const { user } = useAuth()
const { data: visitas, loading } = useVisitas()
const proximaActiva = visitas.find((v) => v.status === "activa") ?? visitas.find((v) => v.status === "programada")
const saldoComedor = user?.profile?.estudiante?.saldoComedor ?? 0
const nombre = user?.nombre ?? ""
```

> Sustituye en el JSX las referencias a `currentUser.nombre`, `currentUser.saldo`, y la primera visita de `visitasMock` por las variables de arriba. Mantén toda la estética y layout actual. Si `loading` es `true`, muestra placeholders sutiles (ej: skeleton de shadcn ya existe en `@/components/ui/skeleton`).

> Como el archivo original no lo cito completo aquí, abre el archivo y haz los swaps quirúrgicos. **No** reescribas el archivo entero — solo cambia las fuentes de datos.

- [ ] **Step 29.3:** Probar en navegador

Login como estudiante → debes ver "Hola, Juan" (o lo que tengas en el seed) y saldo 450. Visitas todavía vacías.

---

### Task 30: Cablear `VisitasScreen`

**Files:**
- Modify: `src/screens/movil/VisitasScreen.tsx`

- [ ] **Step 30.1:** Reemplazar fuente de datos

Cambia el import de `visitasMock` por:

```tsx
import { useVisitas } from "./hooks/useVisitas"
```

Dentro del componente:

```tsx
const { data: visitas, loading, error } = useVisitas()
```

Y usa `visitas` en lugar de `visitasMock` en el resto del JSX.

- [ ] **Step 30.2:** Manejar estados loading / error / vacío

Justo antes del map, añade:

```tsx
if (loading) return <div className="p-6 text-sm text-gray-500">Cargando visitas…</div>
if (error) return <div className="p-6 text-sm text-red-600">{error}</div>
if (visitas.length === 0) {
  return (
    <div className="p-8 text-center">
      <p className="text-gray-500 mb-4">Aún no tienes visitas registradas.</p>
      <button
        onClick={() => navigate("/movil/visitas/nueva")}
        className="px-5 py-2.5 rounded-lg text-white font-bold"
        style={{ background: "#ea580c" }}
      >
        Registrar primera visita
      </button>
    </div>
  )
}
```

> Asegúrate de tener `useNavigate` importado y la variable `navigate` definida.

---

### Task 31: Cablear `NuevaVisitaScreen`

**Files:**
- Modify: `src/screens/movil/NuevaVisitaScreen.tsx`

- [ ] **Step 31.1:** Conectar el submit del form al hook

Añade al inicio:

```tsx
import { useVisitas } from "./hooks/useVisitas"
import { ApiError } from "@/lib/api"
```

Dentro del componente, donde antes había mock state:

```tsx
const navigate = useNavigate()
const { create } = useVisitas()
const [submitting, setSubmitting] = useState(false)
const [submitError, setSubmitError] = useState<string | null>(null)
```

Reemplaza el handler de submit por:

```tsx
const handleSubmit = async () => {
  setSubmitting(true)
  setSubmitError(null)
  try {
    // Combina fecha + hora en un ISO. Asume que `fecha` es 'YYYY-MM-DD' y `hora` es 'HH:MM'.
    const fechaHora = new Date(`${fecha}T${hora}:00`).toISOString()
    const created = await create({
      invitado: { nombre: nombreInvitado, categoria: "visita" },
      tipoAcceso: modoEntrada === "automovil" ? "vehicular" : "peatonal",
      puntoAcceso,
      fechaHora,
      multiplesEntradas,
      comentarios: comentarios || undefined,
    })
    navigate(`/movil/visitas/${created._id}`)
  } catch (err) {
    setSubmitError(err instanceof ApiError ? err.message : "No se pudo registrar")
  } finally {
    setSubmitting(false)
  }
}
```

> Si los nombres de los `useState` actuales son distintos (`nombreInvitado`, `fecha`, `hora`, etc.), ajústalos al lo que el archivo ya tenga. La idea es: usa el state que ya existe en la pantalla actual, solo cambia el handler de submit.

- [ ] **Step 31.2:** Mostrar error inline y bloquear botón

Donde está el botón principal:

```tsx
{submitError && (
  <div className="my-3 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
    {submitError}
  </div>
)}
<Button onClick={handleSubmit} disabled={submitting}>
  {submitting ? "Registrando…" : "Registrar visita"}
</Button>
```

---

### Task 32: Cablear `DetallesVisitaScreen`

**Files:**
- Modify: `src/screens/movil/DetallesVisitaScreen.tsx`

- [ ] **Step 32.1:** Cargar la visita real

```tsx
import { useParams, useNavigate } from "react-router-dom"
import { useVisita } from "./hooks/useVisita"
```

Dentro del componente:

```tsx
const { id } = useParams<{ id: string }>()
const navigate = useNavigate()
const { data: visita, loading, error, cancel } = useVisita(id)
```

Manejo de estados:

```tsx
if (loading) return <div className="p-6 text-sm text-gray-500">Cargando…</div>
if (error || !visita) return <div className="p-6 text-sm text-red-600">{error ?? "No encontrada"}</div>
```

Sustituye en el JSX las referencias mock por `visita.invitado.nombre`, `visita.fechaHora`, `visita.puntoAcceso`, etc. El QR se cablea en la siguiente task.

- [ ] **Step 32.2:** Botón cancelar

```tsx
<button
  onClick={async () => {
    if (confirm("¿Cancelar esta visita?")) {
      await cancel()
      navigate("/movil/visitas")
    }
  }}
  className="px-4 py-2 rounded-lg bg-red-50 text-red-700 font-semibold border border-red-200"
>
  Cancelar visita
</button>
```

---

### Task 33: Cablear `QrNfcScreen` con QR real

**Files:**
- Modify: `src/screens/movil/QrNfcScreen.tsx`

- [ ] **Step 33.1:** Importar `qrcode.react` y traer la última visita activa

```tsx
import { QRCodeSVG } from "qrcode.react"
import { useVisitas } from "./hooks/useVisitas"
```

Dentro del componente:

```tsx
const { data: visitas, loading } = useVisitas()
const visitaActiva =
  visitas.find((v) => v.status === "activa") ??
  visitas.find((v) => v.status === "programada")
```

Donde se renderiza el QR mock, sustituye por:

```tsx
{loading ? (
  <div className="text-sm text-gray-400">Cargando…</div>
) : visitaActiva ? (
  <div className="flex flex-col items-center gap-4">
    <QRCodeSVG
      value={visitaActiva.qrToken}
      size={240}
      level="M"
      bgColor="#ffffff"
      fgColor="#0a1528"
    />
    <div className="text-center">
      <p className="font-bold text-gray-900">{visitaActiva.invitado.nombre}</p>
      <p className="text-xs text-gray-500">{visitaActiva.puntoAcceso}</p>
      <p className="text-[10px] text-gray-400 mt-1">
        Token: {visitaActiva.qrToken.slice(0, 8)}…
      </p>
    </div>
  </div>
) : (
  <div className="text-center p-6">
    <p className="text-gray-500 mb-3">No tienes visitas activas.</p>
  </div>
)}
```

---

### Task 34: Botón de logout en `MovilLayout`

**Files:**
- Modify: `src/screens/movil/MovilLayout.tsx`

- [ ] **Step 34.1:** Añadir hook y botón

Importa:

```tsx
import { useAuth } from "@/lib/auth-store"
import { LogOut } from "lucide-react"
import { useNavigate } from "react-router-dom"
```

Donde se monte el header (busca el component header del layout), añade un botón de logout:

```tsx
const { logout } = useAuth()
const navigate = useNavigate()
const handleLogout = async () => {
  await logout()
  navigate("/movil/login", { replace: true })
}

// dentro del JSX del header:
<button
  onClick={handleLogout}
  className="p-2 rounded-full hover:bg-gray-100"
  aria-label="Cerrar sesión"
>
  <LogOut className="size-5 text-gray-600" />
</button>
```

> Si `MovilLayout` solo es un `<Outlet/>` sin header propio, añade un header simple arriba del outlet. Mantén el estilo del resto.

---

## Phase F — Verificación end-to-end

### Task 35: Flujo completo manual

**Files:** ninguno

- [ ] **Step 35.1:** Levantar todo

```bash
npm run dev
```

- [ ] **Step 35.2:** Flujo

1. Abre `http://localhost:5173`
2. Click "Móvil"
3. Login con `estudiante@udlap.mx` / `demo1234`
4. Estás en dashboard
5. Click en "Visitas" → debe estar vacío (o con "Registrar primera visita")
6. Click "Nueva visita", llena el form (nombre, fecha futura, hora, punto acceso, modo)
7. Submit → te lleva a detalles
8. Detalles muestra los datos correctos
9. Botón "Cancelar visita" funciona y regresa al listado
10. Crea otra visita
11. Ve a "QR" en el bottom nav → debe mostrar el QR de la visita activa
12. Logout → vuelve a login
13. Intenta ir directo a `http://localhost:5173/movil/dashboard` sin login → debe redirigir a login

- [ ] **Step 35.3:** Probar 401 global

Con sesión activa, en DevTools → Application → Local Storage, borra `accesos_udlap_token`. Recarga página. Cualquier llamada a `/api/auth/me` debe responder 401 y la app debe redirigir a login automáticamente.

- [ ] **Step 35.4:** Pausa de revisión final. **No commit.**

---

### Task 36: Documentar pendientes para próximos planes

**Files:**
- Create: `docs/superpowers/plans/2026-04-28-plan-1-followups.md`

- [ ] **Step 36.1:** Escribir followups

```markdown
# Plan 1 — Pendientes y handoff a planes siguientes

**Fecha:** 2026-04-28
**Plan completado:** Backend + Auth + Móvil flujo de Visitas

## Lo que ya quedó listo

- Backend Express con cachedConnection a Mongo Atlas.
- Auth multi-rol con sesión por UUID (sin JWT, sin bcrypt).
- Modelos `User` y `Visita` con índices.
- Endpoints `/api/auth/*`, `/api/visitas/*`, `/api/visitas/qr/:token/*`.
- `vercel.json` y `api/index.ts` listos para deploy.
- Frontend móvil: Login, Dashboard, Visitas (lista/nueva/detalle), QR contra backend real.
- Seed de 3 cuentas demo.

## Pendientes para Plan 2 (Móvil completo)

- `PerfilScreen`: PATCH /api/users/me + POST /api/users/me/avatar (con compresión).
- `HorarioScreen`: GET /api/horario + modelo `Clase`.
- `ComedorScreen`: modelos `MenuItem` y `OrdenComedor`, `POST /api/comedor/ordenes` que descuente saldo.
- `BibliotecaScreen`: modelos `Libro`, `PrestamoBiblioteca`, `DeseoBiblioteca`.

## Pendientes para Plan 3 (iPad seguridad)

- Modelos `Vehiculo`, `Multa`, `EventoAcceso`, `PuntoControl`.
- Login con PIN para oficiales.
- Cableado de las 8 pantallas iPad contra backend.

## Pendientes para Plan 4 (Quiosco)

- Modelos `RegistroAlternativo`.
- Cableado de las 3 pantallas del quiosco contra backend.
- Lógica de validación de QR en quiosco usando endpoints existentes.

## Pendientes para Plan 5 (Colegios residenciales)

- Modelos `Edificio`, `MovimientoResidente`, `AlertaColegio`.
- KPIs computados.
- Cableado de las 9 pantallas.

## Mejoras pendientes generales

- Añadir bcrypt antes de presentar (decisión actual: texto plano).
- Tests automatizados (smoke con node:test, e2e con Cypress).
- WebSocket o polling para alertas si lo presentación lo requiere.
- Subir imágenes a Cloudinary en lugar de base64 si los docs crecen mucho.
```

---

## Self-Review

(Esta sección la corro yo, el plan-writer, sobre el plan completo arriba)

**Spec coverage:**
- ✅ Sección 3 (layout repo): cubierta en Tasks 1-10
- ✅ Sección 4.1 (User): Task 11
- ✅ Sección 4.2 (Visita): Task 17
- ⏭ Secciones 4.3-4.16 (Vehículo, Multa, Edificio, etc.): out of scope (planes 2-5)
- ✅ Sección 5.1 (Auth endpoints): Tasks 12-14
- ✅ Sección 5.3 (Visitas endpoints): Tasks 18-20
- ⏭ Secciones 5.4-5.11 (Vehículos, Colegios, Comedor, Biblioteca, Horario, Quiosco, KPIs): out of scope
- ✅ Sección 6.1-6.5 (Frontend infra): Tasks 21-25
- ✅ Sección 6.6 pasos 1, 2, 5, 6, 7, 4: Tasks 27, 29, 30, 31, 32, 33
- ⏭ Sección 6.6 pasos 3, 8, 9, 10 (Perfil, Horario, Comedor, Biblioteca): plan 2
- ✅ Sección 7 (seed) parcial: Task 15 (cuentas demo críticas; resto en plan 2 cuando se necesiten datos)
- ⏭ Sección 8 (testing): pospuesto a plan 2 — ningún test automatizado en plan 1, solo smoke manual
- ✅ Sección 9 (deploy Vercel): config en Tasks 9, 10. Deploy real lo hace el usuario.
- ✅ Sección 10 (riesgos): mitigaciones implementadas (cachedConnection, base64 limit 10mb, etc.)

**Placeholder scan:** ningún "TBD"/"TODO". Tasks 29, 30, 31, 32 dicen "ajusta los nombres a lo que el archivo ya tenga" — esto es justificado porque no tengo la versión exacta de cada archivo aquí, pero el código real a escribir está completo.

**Type consistency:**
- `Role` tipo definido en spec → Task 11 (backend) y Task 22 (frontend) — coinciden.
- `Visita.status` valores → spec, Task 17, Task 22 — coinciden (`programada`/`activa`/`expirada`/`cancelada`).
- `qrToken` campo → Task 17 (model), Task 18 (service), Task 22 (frontend type) — coinciden.

**Cosa que arreglo inline:** la Task 6 tenía un comentario confuso sobre `notFoundHandler` siendo `ErrorRequestHandler` y luego `RequestHandler`. Step 6.2 ya lo deja correcto. OK.

---

## Execution Handoff

Plan listo y guardado en `docs/superpowers/plans/2026-04-28-plan-1-backend-auth-movil-visitas.md`.

**Dos opciones de ejecución:**

1. **Subagent-Driven (recomendado)** — Despacho un subagente fresco por tarea, reviso entre tareas, iteración rápida.
2. **Inline Execution** — Ejecuto las tareas en esta sesión con la skill `executing-plans`, batch con checkpoints.

**¿Cuál prefieres?**

Recordatorio: en cualquiera de los dos modos, **no se hacen `git commit` automáticos**. Cada "Pausa de revisión" del plan te da el punto natural para que tú decidas si commitear.
