# Spec — Backend Express + MongoDB y cableado de frontend

**Fecha:** 2026-04-28
**Autor:** Claude (brainstorming con Noel)
**Estado:** Diseño aprobado, pendiente de plan de implementación

---

## 1. Contexto y meta

`accesos-udlap-2026` es un proyecto de escuela que ya tiene **4 interfaces** de frontend funcionando con datos mockeados (React 19 + Vite + Tailwind v4 + shadcn + react-router-dom):

- **Quiosco** (3 pantallas) — control de acceso público en la entrada
- **Móvil** (14 pantallas) — app del estudiante: dashboard, visitas, QR personal, horario, comedor, biblioteca, perfil
- **iPad** (8 pantallas) — app de seguridad: punto de control vehicular, multas, salidas, alertas, historial
- **Colegios residenciales** (9 pantallas) — admin residencial: dashboard, residentes, visitas, edificios, alertas, mapa, bitácora

Hoy todas las pantallas leen de seeds en archivos `data.ts` y mutan estado local en `Context`. **No existe backend.**

**Meta:** Construir un backend Node.js + Express + MongoDB (Atlas remoto) que sirva a las 4 interfaces, con autenticación multi-rol, y cablear el frontend completamente (todos los botones, modals, imágenes, navegaciones funcionando contra el backend real). Deploy objetivo: **Vercel**.

## 2. Decisiones tomadas durante brainstorming

| Decisión | Elección | Razón |
|----------|----------|-------|
| Tipo de proyecto | Demo escolar | No requiere hardening de producción |
| Base de datos | MongoDB Atlas remoto | Pedido del usuario |
| Plataforma de deploy | Vercel (serverless) | Pedido del usuario; sirve frontend + API en mismo origen |
| Modelo de usuarios | Una colección `users` con `role` + `profile` embebido por rol | Simplifica auth y queries; estándar en Mongo |
| Login | Único endpoint `/api/auth/login`, redirección por rol en cliente | Reduce duplicación de UI/lógica |
| Encriptación de passwords | **Ninguna por ahora** (texto plano) | Decisión explícita del usuario para escuela; flag para añadir bcrypt antes de presentar |
| Sesiones | UUID v4 random guardado en `users.sessionToken`, enviado en `Authorization: Bearer` | Sin JWT, sin encriptación, simple |
| Imágenes (avatar, evidencia, INE) | base64 guardado en MongoDB, comprimidas en cliente con `browser-image-compression` (≤300KB, ≤1280px) | FS de Vercel es read-only |
| Real-time | **No** (no hay WebSockets en serverless); polling cuando se requiera "vivo" | Aceptable para demo escolar |
| Orden de implementación de las interfaces | **Móvil → iPad → Quiosco → Colegios** | Móvil crea Visitas y QR que iPad y Quiosco luego consumen |

## 3. Layout del repositorio

```
accesos-udlap-2026/
├── api/
│   └── index.ts              ← Entry serverless de Vercel (re-exporta server/app)
├── server/
│   ├── index.ts              ← Bootstrap dev (escucha :4000)
│   ├── app.ts                ← Crea instancia Express, monta middlewares + rutas
│   ├── db.ts                 ← Conexión Mongoose con cachedConnection
│   ├── env.ts                ← Validación de env vars (zod)
│   ├── middlewares/
│   │   ├── auth.ts           ← requireAuth, requireRole(...)
│   │   └── error.ts          ← Captura de errores → JSON {error, message}
│   ├── modules/              ← Una carpeta por dominio
│   │   ├── auth/             ← login, logout, /me
│   │   ├── users/            ← CRUD de cuentas (admin) + /me
│   │   ├── visitas/          ← Visitas y QR (móvil + iPad + quiosco)
│   │   ├── vehiculos/        ← Vehículos + multas + eventos (iPad)
│   │   ├── alertas/          ← Alertas (iPad + colegios)
│   │   ├── colegios/         ← Residentes, edificios, movimientos
│   │   ├── comedor/          ← Menú y órdenes
│   │   ├── biblioteca/       ← Préstamos, deseos, libros
│   │   ├── horario/          ← Clases del estudiante
│   │   ├── quiosco/          ← Registro alternativo
│   │   └── kpis/             ← Dashboards
│   │   (cada módulo: model.ts + routes.ts + service.ts)
│   └── seed.ts               ← Pobla DB con usuarios demo + datos iniciales
├── src/                      ← Frontend (sin cambios estructurales)
│   ├── lib/
│   │   ├── api.ts            ← Cliente fetch tipado, baseURL via env
│   │   ├── auth-store.ts     ← Token + user en localStorage + AuthContext
│   │   └── image.ts          ← Compresión client-side antes de subir
│   ├── components/
│   │   └── RequireAuth.tsx   ← Wrapper de rutas privadas
│   └── …                     ← (resto igual)
├── shared/
│   └── types.ts              ← Tipos compartidos client↔server
├── vercel.json               ← Routing serverless: /api/* → función, todo lo demás → /dist
├── package.json              ← Scripts: dev, build, start, seed
└── .env.local                ← MONGODB_URI, etc. (ignored by git)
```

### 3.1 Stack del backend

- `express` — servidor HTTP
- `mongoose` — ODM para MongoDB
- `zod` — validación de env vars y bodies
- `cors` — CORS configurado por ambiente
- `tsx` (dev only) — correr TypeScript sin compilar
- `concurrently` (dev only) — correr Vite + servidor en paralelo
- `browser-image-compression` (frontend) — compresión cliente antes de subir
- `qrcode.react` (frontend) — render del QR

### 3.2 Scripts de `package.json`

| Script | Comando |
|--------|---------|
| `dev` | `concurrently "vite" "tsx watch server/index.ts"` |
| `build` | `tsc -b && vite build` |
| `start` | `node --import tsx server/index.ts` (solo si se quisiera correr fuera de Vercel) |
| `seed` | `tsx server/seed.ts` |
| `lint`, `preview` | sin cambios |

### 3.3 Variables de entorno

Desarrollo (`.env.local`, ignorado en git):

```
MONGODB_URI=mongodb+srv://...
PORT=4000
CORS_ORIGIN=http://localhost:5173
NODE_ENV=development
```

Producción (Vercel dashboard):

```
MONGODB_URI=mongodb+srv://...
NODE_ENV=production
```

`server/env.ts` valida con zod y revienta en arranque si falta algo crítico.

## 4. Modelo de datos en MongoDB

Una colección por agregado, referencias por `ObjectId`. Mongoose schemas con `timestamps: true`.

### 4.1 `users`

```
_id, email (unique), password (texto plano), role,
nombre, apellido, telefono, avatar (base64 jpeg ~30KB),
sessionToken, sessionExpiresAt,
profile: {
  estudiante?:    { studentId, programa, semestre, saldoComedor, frecuentes: [{nombre, iniciales}] },
  oficial?:       { numeroPlaca, turno: "Matutino"|"Vespertino"|"Nocturno", pin, gateAsignado },
  proveedor?:     { empresa, rfc, vehiculoMatricula },
  maestro?:       { numeroEmpleado, departamento },
  exaudlap?:      { studentId, anioGraduacion, programa },
  residente?:     { studentId, programa, semestre, edificioId, habitacion, estado: "en_campus"|"fuera"|"invitado" },
  adminColegios?: { edificiosACargo: [edificioId] },
},
createdAt, updatedAt
```

Roles válidos: `"admin" | "estudiante" | "maestro" | "oficial" | "proveedor" | "exaudlap" | "residente" | "adminColegios"`.

**Notas sobre roles:**
- `residente` es un superset de `estudiante`: vive en colegio + es estudiante. Hereda permisos de `estudiante` (puede usar comedor, biblioteca, registrar visitas) y se le añaden los del módulo de colegios para ver su edificio.
- `exaudlap` puede registrar visitas para sí mismo (regresar al campus) pero no usa comedor/biblioteca.

### 4.2 `visitas`

```
_id, anfitrionId (→ users._id),
invitado: { nombre, tipoId?(texto, ej "INE 1234..."), foto?(base64), categoria: "servicio"|"personal"|"comunidad_udlap"|"visita" },
tipoAcceso: "vehicular"|"peatonal",
puntoAcceso, fechaHora (Date),
multiplesEntradas (bool),
status: "programada"|"activa"|"expirada"|"cancelada",
qrToken (string único, indexed) ← QR del invitado
qrExpiraEn (Date),  // si multiplesEntradas=false: 4h después del primer scan; si true: fin del día de fechaHora

edificioDestinoId? (→ edificios, solo en colegios),
comentarios?,
estatusVisitante: "sin_antecedentes"|"con_antecedentes",
scans: [{ puntoId, oficialId, timestamp, resultado }],
createdAt, updatedAt
```

### 4.3 `vehiculos`

```
_id, matricula (unique, indexed),
propietarioUserId (→ users, opcional si externo),
propietarioInfo: { nombre, idUdlap?, tipo: "estudiante"|"empleado"|"visita"|"externo" },
modelo, color, foto (base64),
sello: { vigente (bool), vence (Date) },
ubicacion (texto),
estadoAcceso: "permitido"|"denegado"|"revision",
ocupantes (int),
bloqueoSalida?: { motivo: "multa"|"restriccion_academica"|"incidente", descripcion },
createdAt, updatedAt
```

### 4.4 `multas`

```
_id, vehiculoId (→ vehiculos), oficialId (→ users),
tipo (texto), montoMxn (int),
evidencia: [string base64],
comentarios,
estado: "pendiente"|"pagada"|"cancelada",
fecha (Date), createdAt, updatedAt
```

### 4.5 `eventosAcceso`

```
_id, vehiculoId, puntoId, oficialId,
resultado: "permitido"|"denegado", motivo?,
timestamp (Date)
```

### 4.6 `puntosControl`

```
_id, nombre, tipo: "principal"|"postgrado"|"deportes"|"residencial",
estado: "activa"|"standby",
oficialOperadorId (→ users)
```

### 4.7 `alertas`

```
_id, scope: "vehicular"|"residencial",
tipo (string, varía por scope),
severidad: "critica"|"alta"|"moderada"|"media"|"info",
descripcion,
refs: { vehiculoId?, residenteUserId?, edificioId? },
timestamp (Date),
estado: "activa"|"atendida",
atendidaPor? (→ users), atendidaEn? (Date)
```

### 4.8 `edificios`

```
_id, nombre, capacidad (int)
// ocupacion se calcula en runtime contando residentes activos
```

### 4.9 `movimientosResidente`

```
_id, residenteUserId (→ users), edificioId,
hora (Date), tipo: "entrada"|"salida",
estado: "normal"|"ebriedad"|"autorizada"|"alerta"
```

### 4.10 `menuItems`

```
_id, nombre, precio, descripcion, categoria: "principal"|"economico"|"vegano",
emoji, disponible (bool), fecha (Date)
```

### 4.11 `ordenesComedor`

```
_id, userId, items: [{menuItemId, cantidad}], total, fecha,
estado: "pagada"|"cancelada"
```

### 4.12 `libros`

```
_id, titulo, autor, isbn, cover (emoji o base64),
totalCopias, copiasDisponibles
```

### 4.13 `prestamosBiblioteca`

```
_id, userId, libroId, fechaPrestamo, fechaVencimiento, fechaDevolucion?,
estado: "activo"|"devuelto"|"vencido"
```

### 4.14 `deseosBiblioteca`

```
_id, userId, libroId, fechaAgregado
```

### 4.15 `clases`

```
_id, userId, dia (0-5), inicio (decimal), fin (decimal),
materia, salon, periodo
```

### 4.16 `registrosAlternativos`

```
_id, nombre, tipoId (texto), motivo, fotoIne (base64),
vehiculoMatricula?, oficialId,
ingreso (Date), salida? (Date)
```

### 4.17 Índices

- `users.email` único, `users.sessionToken`, `users.role`
- `visitas.qrToken` único, `visitas.anfitrionId`, `visitas.fechaHora`
- `vehiculos.matricula` único
- `eventosAcceso.timestamp` desc
- `alertas` compuesto (`estado`, `timestamp` desc)
- `prestamosBiblioteca` compuesto (`userId`, `estado`)

## 5. Endpoints REST

Todo bajo `/api`. Respuestas JSON con `{ data }` o `{ error, message }`. Paginación: `?page=1&limit=20`. Auth: header `Authorization: Bearer <sessionToken>`.

### 5.1 Auth

```
POST   /api/auth/login        { email, password }   → { user, token }
POST   /api/auth/logout                              → 204
GET    /api/auth/me                                  → { user }
```

### 5.2 Users

```
GET    /api/users             ?role=&search=        (admin)
POST   /api/users             { email, password, role, profile, ... }   (admin)
GET    /api/users/:id
PATCH  /api/users/:id         (admin o el propio)
DELETE /api/users/:id         (admin)
POST   /api/users/me/avatar   { base64 }
PATCH  /api/users/me          { telefono, etc. }
```

### 5.3 Visitas

```
GET    /api/visitas                       ?anfitrionId=&status=
POST   /api/visitas                       { invitado, tipoAcceso, puntoAcceso, fechaHora, multiplesEntradas, comentarios? }
GET    /api/visitas/:id
PATCH  /api/visitas/:id                   { status?: "cancelada", ... }
DELETE /api/visitas/:id

GET    /api/visitas/qr/:qrToken                       (público; muestra info pre-aprobación)
POST   /api/visitas/qr/:qrToken/scan      { puntoId, resultado, motivo? }
```

### 5.4 Vehículos / Multas / Eventos

```
GET    /api/vehiculos              ?search=&estado=
POST   /api/vehiculos              (admin)
GET    /api/vehiculos/:id
PATCH  /api/vehiculos/:id
DELETE /api/vehiculos/:id
POST   /api/vehiculos/buscar       { matricula }    ← lookup en checkpoint

POST   /api/vehiculos/:id/permitir            { puntoId }
POST   /api/vehiculos/:id/denegar             { puntoId, motivo }
POST   /api/vehiculos/:id/autorizar-salida

GET    /api/multas                 ?vehiculoId=&estado=
POST   /api/multas                 { vehiculoId, tipo, montoMxn, evidencia, comentarios }
PATCH  /api/multas/:id             { estado: "pagada" | "cancelada" }

GET    /api/eventos-acceso         ?vehiculoId=&desde=&hasta=
GET    /api/puntos-control
```

### 5.5 Alertas

```
GET    /api/alertas                ?scope=&estado=&severidad=
POST   /api/alertas                { scope, tipo, severidad, descripcion, refs }
PATCH  /api/alertas/:id/atender
```

### 5.6 Colegios

```
GET    /api/colegios/edificios                      (incluye ocupacion calculada)
GET    /api/colegios/edificios/:id
GET    /api/colegios/residentes    ?edificioId=&estado=&search=
GET    /api/colegios/residentes/:id
PATCH  /api/colegios/residentes/:id { estado, ... }
GET    /api/colegios/movimientos   ?residenteId=&desde=&hasta=
POST   /api/colegios/movimientos   { residenteUserId, edificioId, tipo, estado }
```

### 5.7 Comedor

```
GET    /api/comedor/menu           ?categoria=&fecha=
POST   /api/comedor/ordenes        { items: [{menuItemId, cantidad}] }
GET    /api/comedor/ordenes        ?userId=
```

### 5.8 Biblioteca

```
GET    /api/biblioteca/libros      ?search=&disponibles=
POST   /api/biblioteca/prestamos   { libroId }
PATCH  /api/biblioteca/prestamos/:id { estado: "devuelto" }
GET    /api/biblioteca/prestamos   ?userId=
POST   /api/biblioteca/deseos      { libroId }
DELETE /api/biblioteca/deseos/:id
```

### 5.9 Horario

```
GET    /api/horario          ← clases del estudiante autenticado
```

### 5.10 Quiosco

```
POST   /api/quiosco/registro-alternativo   { nombre, tipoId, motivo, fotoIne, vehiculoMatricula? }
PATCH  /api/quiosco/registro-alternativo/:id/salida
```

### 5.11 KPIs

```
GET    /api/kpis/ipad         ← entradasHoy, incidentes, vehiculosEnCampus, etc.
GET    /api/kpis/colegios     ← ocupacion, alertas, movimientos
```

### 5.12 Reglas de autorización

| Ruta | Roles permitidos |
|------|------------------|
| `/api/auth/login` | público |
| `/api/auth/logout`, `/api/auth/me` | autenticado |
| `/api/users/*` (CRUD admin) | `admin` |
| `/api/users/me/*` | propio usuario |
| `/api/visitas` (POST) | `estudiante`, `maestro`, `proveedor`, `residente`, `exaudlap` |
| `/api/visitas/qr/:t/scan` | `oficial`, `adminColegios` |
| `/api/vehiculos/*` (mutaciones) | `oficial`, `admin` |
| `/api/multas` (POST) | `oficial` |
| `/api/colegios/*` | `adminColegios`, `admin` |
| `/api/comedor/ordenes` (POST) | `estudiante` |
| `/api/biblioteca/*` | usuarios autenticados |
| `/api/quiosco/*` | `oficial` |
| `/api/kpis/ipad` | `oficial`, `admin` |
| `/api/kpis/colegios` | `adminColegios`, `admin` |

### 5.13 Validación y errores

- Cada ruta usa un schema `zod` para body/query. Body inválido → 400.
- Middleware central convierte excepciones a `{ error: code, message }`.
- Códigos: `UNAUTHORIZED` (401), `FORBIDDEN` (403), `NOT_FOUND` (404), `VALIDATION` (400), `CONFLICT` (409), `INTERNAL` (500).

## 6. Cableado del frontend

### 6.1 Cliente HTTP centralizado (`src/lib/api.ts`)

- `baseURL` desde `import.meta.env.VITE_API_URL` (dev `http://localhost:4000`, prod cadena vacía).
- Token de `localStorage` enviado en `Authorization: Bearer`.
- Errores parseados al tipo `{ error, message }` y lanzados como `ApiError`.
- Sobre 401 global: limpia store y redirige a `/movil/login`.

API:

```ts
const api = {
  get<T>(path: string, query?: Record<string, unknown>): Promise<T>,
  post<T>(path: string, body?: unknown): Promise<T>,
  patch<T>(path: string, body?: unknown): Promise<T>,
  delete<T>(path: string): Promise<T>,
}
```

### 6.2 Estado de autenticación (`src/lib/auth-store.ts`)

- `AuthContext` con `{ user, login, logout, isLoading }`.
- Lee token + user de `localStorage` en boot.
- `<RequireAuth role?>` envuelve rutas privadas. Sin token → redirige a login. Con role incorrecto → redirige a `/`.

`App.tsx` se actualiza para envolver rutas privadas.

### 6.3 Reemplazo de mocks por hooks reales

Los `Context` actuales (`IpadDataContext`, `ColegiosDataContext`) se mantienen como providers, pero internamente cambian: `useState(seed)` → `fetch` real, exponen `refresh()` y mutaciones que disparan `POST/PATCH`. Para móvil, hooks artesanales por dominio: `useVisitas`, `useNuevaVisita`, `useHorario`, `useMenuComedor`, `useLibros`, etc. Convención: cada hook devuelve `{ data, loading, error, refresh, ...mutations }`.

**No se usa `react-query`** — hooks con `useEffect`/`useState` son suficientes para escuela.

### 6.4 Compresión de imágenes (`src/lib/image.ts`)

```ts
import imageCompression from 'browser-image-compression'

export async function compressToBase64(
  file: File,
  opts?: { maxKB?: number; maxPx?: number }
): Promise<string> {
  const compressed = await imageCompression(file, {
    maxSizeMB: (opts?.maxKB ?? 300) / 1024,
    maxWidthOrHeight: opts?.maxPx ?? 1280,
    useWebWorker: true,
  })
  return await fileToBase64(compressed) // "data:image/jpeg;base64,..."
}
```

Se usa antes de subir avatar, foto de invitado, evidencia de multa, foto INE.

### 6.5 QR del invitado

- `QrCode.tsx` recibe `qrToken` real (lo devuelve `POST /api/visitas`) y lo codifica con `qrcode.react`.
- iPad/quiosco llaman `GET /api/visitas/qr/:token` para mostrar info, y `POST /api/visitas/qr/:token/scan` cuando se confirma.
- **Para demo**: input de texto donde el oficial pega el token (o botón "simular QR" que toma el último generado). Evita problema de permisos de cámara.

### 6.6 Orden de cableado por pantalla (móvil)

1. `LoginScreen` → `POST /api/auth/login`, guarda token, redirige.
2. `DashboardScreen` → user, próxima visita activa, saldo comedor, último QR, alertas.
3. `PerfilScreen` → muestra y edita user, sube avatar.
4. `QrNfcScreen` → QR de la última visita activa o personal.
5. `VisitasScreen` → lista `GET /api/visitas?anfitrionId=me`.
6. `NuevaVisitaScreen` → form completo con `POST /api/visitas`.
7. `DetallesVisitaScreen` → `GET /api/visitas/:id`, QR, botón cancelar.
8. `HorarioScreen` → `GET /api/horario`.
9. `ComedorScreen` → menú, carrito, `POST /api/comedor/ordenes`.
10. `BibliotecaScreen` → libros, prestar, lista de deseos.

Cuando móvil esté al 100%, paso a iPad → Quiosco → Colegios siguiendo el mismo patrón.

## 7. Seed de datos demo (`server/seed.ts`)

Corre con `npm run seed`. Limpia DB y siembra:

- 1 admin: `admin@udlap.mx` / `demo1234`
- 2 estudiantes (uno con visitas activas, libros prestados, saldo comedor)
- 2 oficiales (Matutino, Vespertino) con PINs
- 1 proveedor, 1 maestro, 1 exaudlap
- 2 residentes en distintos edificios + 1 admin de colegios
- 5 vehículos (algunos con multas, uno con bloqueo de salida)
- 4 puntos de control, 3 edificios
- 15 ítems de menú, 10 libros, horario semanal típico
- Alertas y eventos de acceso recientes para que los dashboards no estén vacíos

## 8. Testing (mínimo viable)

- **Backend**: smoke tests con `node:test`:
  - `POST /api/auth/login` con credenciales válidas e inválidas
  - `POST /api/visitas` crea visita y devuelve `qrToken`
  - `POST /api/visitas/qr/:token/scan` registra evento y actualiza status
- **Frontend**: Cypress (ya configurado). Agregar e2e:
  - login estudiante → crear visita → ver QR → logout

No es TDD exhaustivo — son los flujos críticos.

## 9. Plan de despliegue en Vercel

1. Crear cluster MongoDB Atlas free tier, agregar IP `0.0.0.0/0` (Vercel rota IPs) o configurar peering si está disponible.
2. Push a GitHub.
3. Importar proyecto en Vercel, framework "Other".
4. Configurar variables de entorno: `MONGODB_URI`, `NODE_ENV=production`.
5. `vercel.json`:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/index" },
    { "source": "/(.*)", "destination": "/$1" }
  ]
}
```

6. Vercel detecta `api/index.ts` y lo despliega como serverless function.
7. Correr `npm run seed` localmente apuntando al `MONGODB_URI` de producción una vez antes del demo.

## 10. Riesgos conocidos y mitigaciones

| Riesgo | Mitigación |
|--------|-----------|
| Cold start de Vercel ~1-2s tras inactividad | Aceptable para demo escolar |
| MongoDB Atlas connection limit en serverless | Patrón `cachedConnection` en `server/db.ts` |
| Imágenes base64 inflan documentos | Compresión cliente (≤300KB) + límite de items por petición |
| Passwords en texto plano | **Decisión consciente** del usuario; agregar bcrypt antes de presentar |
| FS read-only en Vercel | base64 en DB resuelve el caso para esta demo |

## 11. Lo que **no** está en este spec (out of scope)

- Integración con sistemas reales de UDLAP (Banner, AD/SSO, lectores físicos).
- WebSockets / push notifications reales.
- Pagos reales (las multas y el saldo del comedor son simulados).
- Internacionalización; todo en español.
- Tests exhaustivos / TDD del 100% del backend.
- CI/CD; el deploy lo hace Vercel automático en push.

## 12. Próximo paso

Tras aprobación del usuario sobre este spec, invocar la skill `superpowers:writing-plans` para producir un plan de implementación detallado por fases. La fase 1 cubre infraestructura del servidor + auth + cableado de la interfaz **móvil** completa contra el backend.
