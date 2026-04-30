# Plan 1 — Estado de salida y handoff a planes siguientes

**Fecha:** 2026-04-28
**Plan completado:** Backend + Auth + Móvil flujo de Visitas
**Spec base:** `docs/superpowers/specs/2026-04-28-accesos-udlap-backend-design.md`

---

## Lo que ya quedó listo

### Backend (Express + MongoDB Atlas)

- `server/env.ts` — validación de env vars con zod
- `server/db.ts` — conexión Mongoose con cache para serverless
- `server/lib/{errors.ts,asyncHandler.ts}` — `ApiError` + wrapper de async handlers
- `server/middlewares/{auth.ts,error.ts}` — `requireAuth`, `requireRole(...)`, error handler central
- `server/app.ts` — Express app: CORS, JSON 10mb, conexión lazy, monta `/api/auth` y `/api/visitas`
- `server/index.ts` — bootstrap dev (escucha :4000)
- `api/index.ts` — entry serverless de Vercel
- `vercel.json` — routing serverless

### Modelos Mongoose

- `server/modules/users/user.model.ts` — `User` con 8 roles y `profile` embebido por rol
- `server/modules/visitas/visita.model.ts` — `Visita` con `qrToken` único y `scans[]`

### Endpoints implementados

- `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`
- `GET /api/visitas`, `POST /api/visitas`, `GET /api/visitas/:id`, `PATCH /api/visitas/:id`, `DELETE /api/visitas/:id`
- `GET /api/visitas/qr/:qrToken` (público), `POST /api/visitas/qr/:qrToken/scan` (oficial)
- `GET /api/health`

### Seed (`npm run seed`)

3 cuentas demo, todas con password `demo1234`:
- `admin@udlap.mx` (rol `admin`)
- `estudiante@udlap.mx` (rol `estudiante`, studentId 181278, saldoComedor 450, frecuentes)
- `seguridad@udlap.mx` (rol `oficial`, turno Matutino, PIN 1234)

### Frontend infra

- `src/lib/api.ts` — cliente HTTP con token + 401 global
- `src/lib/auth-store.tsx` — `AuthProvider`, `useAuth()`, `<RequireAuth>`
- `src/lib/types.ts` — tipos compartidos (`User`, `Visita`, `Role`, etc.)
- `src/lib/image.ts` — `compressToBase64()` (browser-image-compression)
- `src/main.tsx` — wrap `<BrowserRouter><AuthProvider><App/></AuthProvider></BrowserRouter>`
- `src/App.tsx` — `/movil/login` público; `/movil/*` protegido por `RequireAuth`

### Móvil pantallas cableadas contra backend real

- `LoginScreen` — `useAuth().login`, redirige según rol, error/loading inline, demo quick-fill
- `DashboardScreen` — saluda al user real, muestra próxima visita y saldo desde `user.profile.estudiante`
- `VisitasScreen` — lista vía `useVisitas()`, estados loading/error/empty
- `NuevaVisitaScreen` — submit real con `useVisitas().create`, navega al detalle
- `DetallesVisitaScreen` — fetch por id, botón cancelar (`PATCH status:cancelada`), QR `qrcode.react`
- `QrNfcScreen` — render del QR real (`QRCodeSVG` + `qrToken`)
- `MovilLayout` — botón logout flotante

### Hooks

- `src/screens/movil/hooks/useVisitas.ts` — list + create
- `src/screens/movil/hooks/useVisita.ts` — get by id + cancel

### Verificación e2e

Flujo completo probado a través del proxy de Vite (puerto 5173 → 4000):
1. ✅ Login devuelve user + token
2. ✅ List visitas
3. ✅ Crear visita devuelve `_id`, `qrToken`, `status: programada`
4. ✅ Detalle por id
5. ✅ `/me` con token
6. ✅ Logout 204
7. ✅ `/me` con token revocado → 401

`npm run build` pasa sin errores.

---

## Cómo correrlo

```bash
# 1) Sembrar la DB (si está vacía o quieres resetear)
npm run seed

# 2) Levantar todo (Vite + API juntos)
npm run dev
# → http://localhost:5173 (frontend)
# → http://localhost:4000 (API directa, opcional)

# 3) En el browser:
#    - Abre http://localhost:5173/
#    - Click en "Móvil"
#    - Login con estudiante@udlap.mx / demo1234
#    - Crea visitas, ve QR, cancela, logout
```

---

## Pendientes para Plan 2 — Móvil completo

Las siguientes pantallas siguen leyendo del archivo mock `src/screens/movil/data.ts`:

- `PerfilScreen` — necesita `PATCH /api/users/me` y `POST /api/users/me/avatar` (con compresión client-side ya disponible en `src/lib/image.ts`)
- `HorarioScreen` — necesita modelo `Clase` y `GET /api/horario`
- `ComedorScreen` — necesita modelos `MenuItem` y `OrdenComedor`, `GET /api/comedor/menu`, `POST /api/comedor/ordenes` (descontar saldo del estudiante)
- `BibliotecaScreen` — necesita modelos `Libro`, `PrestamoBiblioteca`, `DeseoBiblioteca` y sus endpoints

`src/screens/movil/data.ts` debe **mantenerse** porque `puntosAcceso` (lista estática de gates) lo seguirá usando `NuevaVisitaScreen`. Las pantallas restantes pueden eliminar sus consumos de mock cuando se cableen.

---

## Pendientes para Plan 3 — iPad seguridad

- Modelos `Vehiculo`, `Multa`, `EventoAcceso`, `PuntoControl`
- Endpoints de `/api/vehiculos/*`, `/api/multas/*`, `/api/eventos-acceso`, `/api/puntos-control`, `/api/kpis/ipad`
- Login con PIN para oficiales (alternativo al login con email)
- Cableado de las 8 pantallas iPad: `LoginScreen` (PIN), `DashboardScreen`, `PuntoControlScreen`, `SalidasScreen`, `VehiculosScreen`, `MultasScreen`, `HistorialScreen`, `AlertasScreen`
- Aplicar `<RequireAuth role="oficial">` a las rutas `/ipad/*`

---

## Pendientes para Plan 4 — Quiosco

- Modelo `RegistroAlternativo`
- Endpoint `POST /api/quiosco/registro-alternativo` (con foto INE en base64)
- Lógica de validación de QR en quiosco usando `GET /api/visitas/qr/:token` (ya existe)
- Cableado de las 3 pantallas: `KioscoPrincipal`, `RegistroAlternativo`, `CapturaINE`

---

## Pendientes para Plan 5 — Colegios residenciales

- Modelos `Edificio`, `MovimientoResidente`, `AlertaColegio`
- Endpoints de `/api/colegios/*` y `/api/kpis/colegios`
- KPIs computados (ocupación, alertas activas, movimientos del día)
- Cableado de las 9 pantallas
- Aplicar `<RequireAuth role="adminColegios">` a las rutas `/colegios/*`

---

## Mejoras pendientes generales

- **Añadir bcrypt antes de presentar.** Decisión actual: passwords en texto plano. Hay que cambiarlo en `auth.service.ts` y rehashear los seeds.
- **Tests automatizados.** Smoke con `node:test` para auth y visitas; e2e con Cypress (login → crear visita → ver QR → logout).
- **Polling para alertas** si la presentación lo requiere (Vercel serverless no permite WebSockets).
- **Migrar imágenes a Cloudinary** si los documentos crecen mucho (>1MB). Por ahora base64 directo en MongoDB es suficiente.
- **Code splitting / dynamic imports** — Vite reporta el bundle a 1MB+ minified. Si se vuelve un problema, dividir por interfaz.
- **`server/seed.ts` extender** con más datos al arrancar planes 2-5 (vehículos, edificios, residentes, libros, etc.).

---

## Decisiones registradas (no cambiar sin discutirlas con el usuario)

| Decisión | Estado |
|----------|--------|
| Passwords en texto plano | ⚠️ Temporal por petición explícita; añadir bcrypt en futuro |
| Sesiones por UUID en `users.sessionToken` (sin JWT) | Estable |
| Imágenes en base64 en Mongo, comprimidas en cliente (≤300KB / ≤1280px) | Estable |
| Sin react-query — hooks artesanales | Estable |
| Una colección `users` con `role` + `profile` embebido | Estable |
| Sin WebSockets — polling cuando aplique | Estable |
| Una sola alerta colección con `scope` (no separar iPad/colegios) | Por implementar en plan 3/5 |
| No git commits automáticos | Regla del usuario, mantener en planes siguientes |
