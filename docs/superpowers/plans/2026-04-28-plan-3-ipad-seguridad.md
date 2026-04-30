# Plan 3 — iPad Seguridad (Backend + cableado)

> **No git commits.**

**Goal:** Wirear las 8 pantallas iPad contra backend real. Login por PIN, gestión vehicular, multas, alertas, KPIs.

**Architecture:** Mismo patrón. Reemplazar `IpadDataContext` y `IpadSessionContext` para usar la API real, manteniendo la interfaz expuesta a las pantallas (que no se modifican estructuralmente).

**Spec:** `docs/superpowers/specs/2026-04-28-accesos-udlap-backend-design.md`

---

## File structure

### Backend nuevo

| Path | Responsabilidad |
|------|-----------------|
| `server/modules/vehiculos/vehiculo.model.ts` | Schema `Vehiculo` |
| `server/modules/vehiculos/multa.model.ts` | Schema `Multa` |
| `server/modules/vehiculos/evento.model.ts` | Schema `EventoAcceso` |
| `server/modules/vehiculos/punto.model.ts` | Schema `PuntoControl` |
| `server/modules/vehiculos/vehiculos.service.ts` | CRUD + permitir/denegar/autorizar-salida |
| `server/modules/vehiculos/multas.service.ts` | CRUD de multas |
| `server/modules/vehiculos/vehiculos.routes.ts` | `/api/vehiculos`, `/api/multas`, `/api/eventos-acceso`, `/api/puntos-control` |
| `server/modules/alertas/alerta.model.ts` | Schema `Alerta` (con scope) |
| `server/modules/alertas/alertas.routes.ts` | `/api/alertas` |
| `server/modules/kpis/kpis.routes.ts` | `/api/kpis/ipad`, `/api/kpis/colegios` (este último en plan 5) |

### Frontend nuevo (hooks)

| Path | Responsabilidad |
|------|-----------------|
| `src/screens/ipad/hooks/useIpadVehiculos.ts` | Listas + acciones |
| `src/screens/ipad/hooks/useIpadMultas.ts` | Multas + crear |
| `src/screens/ipad/hooks/useIpadEventos.ts` | Historial |
| `src/screens/ipad/hooks/useIpadAlertas.ts` | Alertas vehiculares |
| `src/screens/ipad/hooks/useIpadKpis.ts` | KPIs |

### Modificados

- `server/modules/auth/auth.routes.ts` — añadir `POST /api/auth/login-pin`
- `server/modules/auth/auth.service.ts` — añadir `loginPin()`
- `server/seed.ts` — añadir Vehiculo, Multa, EventoAcceso, PuntoControl, Alerta + más oficiales
- `src/App.tsx` — proteger `/ipad/*` con `RequireAuth role="oficial"` (excepto `/ipad/login`)
- `src/screens/ipad/context/IpadSessionContext.tsx` — usar backend real
- `src/screens/ipad/context/IpadDataContext.tsx` — fetch del backend
- `src/screens/ipad/LoginScreen.tsx` — listar oficiales del backend, login por PIN
- (Las 7 demás pantallas no requieren cambios visibles si los contexts mantienen su forma)

---

## Phase A — Backend

### Task 1 — Modelos `Vehiculo`, `Multa`, `EventoAcceso`, `PuntoControl`

`server/modules/vehiculos/vehiculo.model.ts`:
```ts
import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose"

const propietarioSchema = new Schema(
  {
    nombre: { type: String, required: true },
    idUdlap: String,
    tipo: { type: String, enum: ["estudiante", "empleado", "visita", "externo"], required: true },
  },
  { _id: false }
)

const selloSchema = new Schema(
  {
    vigente: { type: Boolean, default: true },
    vence: Date,
  },
  { _id: false }
)

const bloqueoSalidaSchema = new Schema(
  {
    motivo: { type: String, enum: ["multa", "restriccion_academica", "incidente"] },
    descripcion: String,
  },
  { _id: false }
)

const vehiculoSchema = new Schema(
  {
    matricula: { type: String, required: true, unique: true, index: true, uppercase: true },
    propietarioUserId: { type: Schema.Types.ObjectId, ref: "User" },
    propietarioInfo: { type: propietarioSchema, required: true },
    modelo: String,
    color: String,
    foto: String, // base64
    sello: { type: selloSchema, default: () => ({ vigente: true }) },
    ubicacion: String,
    estadoAcceso: {
      type: String,
      enum: ["permitido", "denegado", "revision"],
      default: "permitido",
    },
    ocupantes: { type: Number, default: 1 },
    multasPendientes: { type: Number, default: 0 },
    bloqueoSalida: bloqueoSalidaSchema,
  },
  { timestamps: true }
)

export type VehiculoDoc = InferSchemaType<typeof vehiculoSchema> & { _id: unknown }
export const Vehiculo: Model<VehiculoDoc> =
  (mongoose.models.Vehiculo as Model<VehiculoDoc>) ||
  mongoose.model<VehiculoDoc>("Vehiculo", vehiculoSchema)
```

`server/modules/vehiculos/multa.model.ts`:
```ts
import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose"

const multaSchema = new Schema(
  {
    vehiculoId: { type: Schema.Types.ObjectId, ref: "Vehiculo", required: true, index: true },
    oficialId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    tipo: { type: String, required: true },
    montoMxn: { type: Number, required: true },
    evidencia: [String], // base64
    comentarios: String,
    estado: { type: String, enum: ["pendiente", "pagada", "cancelada"], default: "pendiente", index: true },
    fecha: { type: Date, default: () => new Date() },
  },
  { timestamps: true }
)

export type MultaDoc = InferSchemaType<typeof multaSchema> & { _id: unknown }
export const Multa: Model<MultaDoc> =
  (mongoose.models.Multa as Model<MultaDoc>) ||
  mongoose.model<MultaDoc>("Multa", multaSchema)
```

`server/modules/vehiculos/evento.model.ts`:
```ts
import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose"

const eventoSchema = new Schema(
  {
    vehiculoId: { type: Schema.Types.ObjectId, ref: "Vehiculo", required: true, index: true },
    puntoId: { type: Schema.Types.ObjectId, ref: "PuntoControl" },
    oficialId: { type: Schema.Types.ObjectId, ref: "User" },
    resultado: { type: String, enum: ["permitido", "denegado"], required: true },
    motivo: String,
    timestamp: { type: Date, default: () => new Date(), index: true },
  },
  { timestamps: true }
)

export type EventoDoc = InferSchemaType<typeof eventoSchema> & { _id: unknown }
export const EventoAcceso: Model<EventoDoc> =
  (mongoose.models.EventoAcceso as Model<EventoDoc>) ||
  mongoose.model<EventoDoc>("EventoAcceso", eventoSchema)
```

`server/modules/vehiculos/punto.model.ts`:
```ts
import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose"

const puntoSchema = new Schema(
  {
    nombre: { type: String, required: true },
    tipo: { type: String, enum: ["principal", "postgrado", "deportes", "residencial"], required: true },
    estado: { type: String, enum: ["activa", "standby"], default: "activa" },
    oficialOperadorId: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
)

export type PuntoDoc = InferSchemaType<typeof puntoSchema> & { _id: unknown }
export const PuntoControl: Model<PuntoDoc> =
  (mongoose.models.PuntoControl as Model<PuntoDoc>) ||
  mongoose.model<PuntoDoc>("PuntoControl", puntoSchema)
```

### Task 2 — `Alerta` model (compartido iPad + Colegios)

`server/modules/alertas/alerta.model.ts`:
```ts
import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose"

const alertaSchema = new Schema(
  {
    scope: { type: String, enum: ["vehicular", "residencial"], required: true, index: true },
    tipo: { type: String, required: true },
    severidad: {
      type: String,
      enum: ["critica", "alta", "moderada", "media", "info"],
      required: true,
    },
    descripcion: { type: String, required: true },
    refs: {
      vehiculoId: { type: Schema.Types.ObjectId, ref: "Vehiculo" },
      residenteUserId: { type: Schema.Types.ObjectId, ref: "User" },
      edificioId: { type: Schema.Types.ObjectId, ref: "Edificio" },
    },
    timestamp: { type: Date, default: () => new Date(), index: true },
    estado: { type: String, enum: ["activa", "atendida"], default: "activa" },
    atendidaPor: { type: Schema.Types.ObjectId, ref: "User" },
    atendidaEn: Date,
  },
  { timestamps: true }
)
alertaSchema.index({ estado: 1, timestamp: -1 })

export type AlertaDoc = InferSchemaType<typeof alertaSchema> & { _id: unknown }
export const Alerta: Model<AlertaDoc> =
  (mongoose.models.Alerta as Model<AlertaDoc>) ||
  mongoose.model<AlertaDoc>("Alerta", alertaSchema)
```

### Task 3 — Servicios y rutas de vehículos

`server/modules/vehiculos/vehiculos.service.ts`:
```ts
import { z } from "zod"
import { ApiError } from "../../lib/errors"
import { Vehiculo } from "./vehiculo.model"
import { EventoAcceso } from "./evento.model"
import { Alerta } from "../alertas/alerta.model"

const upsertInput = z.object({
  matricula: z.string().min(1),
  propietarioInfo: z.object({
    nombre: z.string().min(1),
    idUdlap: z.string().optional(),
    tipo: z.enum(["estudiante", "empleado", "visita", "externo"]),
  }),
  propietarioUserId: z.string().optional(),
  modelo: z.string().optional(),
  color: z.string().optional(),
  foto: z.string().optional(),
  sello: z.object({ vigente: z.boolean(), vence: z.coerce.date().optional() }).optional(),
  ubicacion: z.string().optional(),
  estadoAcceso: z.enum(["permitido", "denegado", "revision"]).optional(),
  ocupantes: z.number().int().nonnegative().optional(),
})

export async function listVehiculos(filter: { search?: string; estado?: string }) {
  const q: Record<string, unknown> = {}
  if (filter.estado) q.estadoAcceso = filter.estado
  if (filter.search) {
    const re = new RegExp(filter.search, "i")
    q.$or = [{ matricula: re }, { "propietarioInfo.nombre": re }]
  }
  return Vehiculo.find(q).sort({ updatedAt: -1 }).limit(100).lean()
}

export async function getVehiculo(id: string) {
  const doc = await Vehiculo.findById(id).lean()
  if (!doc) throw new ApiError("NOT_FOUND", "Vehículo no encontrado")
  return doc
}

export async function buscarPorMatricula(matricula: string) {
  if (!matricula) throw new ApiError("VALIDATION", "Falta matrícula")
  const doc = await Vehiculo.findOne({ matricula: matricula.toUpperCase().trim() }).lean()
  if (!doc) throw new ApiError("NOT_FOUND", "Vehículo no encontrado")
  return doc
}

export async function createVehiculo(raw: unknown) {
  const input = upsertInput.parse(raw)
  const doc = await Vehiculo.create({ ...input, matricula: input.matricula.toUpperCase().trim() })
  return doc.toObject()
}

export async function patchVehiculo(id: string, raw: unknown) {
  const input = upsertInput.partial().parse(raw)
  const doc = await Vehiculo.findByIdAndUpdate(id, { $set: input }, { new: true }).lean()
  if (!doc) throw new ApiError("NOT_FOUND", "Vehículo no encontrado")
  return doc
}

export async function deleteVehiculo(id: string) {
  const r = await Vehiculo.deleteOne({ _id: id })
  if (r.deletedCount === 0) throw new ApiError("NOT_FOUND", "Vehículo no encontrado")
}

export async function permitirAcceso(vehiculoId: string, oficialId: string, raw: unknown) {
  const { puntoId } = z.object({ puntoId: z.string().optional() }).parse(raw ?? {})
  const v = await Vehiculo.findById(vehiculoId)
  if (!v) throw new ApiError("NOT_FOUND", "Vehículo no encontrado")
  v.estadoAcceso = "permitido"
  await v.save()
  await EventoAcceso.create({
    vehiculoId,
    puntoId,
    oficialId,
    resultado: "permitido",
  })
  return v.toObject()
}

export async function denegarAcceso(vehiculoId: string, oficialId: string, raw: unknown) {
  const { puntoId, motivo } = z
    .object({ puntoId: z.string().optional(), motivo: z.string().min(1) })
    .parse(raw)
  const v = await Vehiculo.findById(vehiculoId)
  if (!v) throw new ApiError("NOT_FOUND", "Vehículo no encontrado")
  v.estadoAcceso = "denegado"
  await v.save()
  await EventoAcceso.create({
    vehiculoId,
    puntoId,
    oficialId,
    resultado: "denegado",
    motivo,
  })
  await Alerta.create({
    scope: "vehicular",
    tipo: "incidente",
    severidad: "moderada",
    descripcion: `Acceso denegado · ${motivo}`,
    refs: { vehiculoId },
  })
  return v.toObject()
}

export async function autorizarSalida(vehiculoId: string, oficialId: string) {
  const v = await Vehiculo.findById(vehiculoId)
  if (!v) throw new ApiError("NOT_FOUND", "Vehículo no encontrado")
  v.bloqueoSalida = undefined
  v.estadoAcceso = "permitido"
  await v.save()
  await EventoAcceso.create({
    vehiculoId,
    oficialId,
    resultado: "permitido",
    motivo: "Salida autorizada manualmente",
  })
  return v.toObject()
}

export async function listEventos(filter: { vehiculoId?: string; desde?: string; hasta?: string }) {
  const q: Record<string, unknown> = {}
  if (filter.vehiculoId) q.vehiculoId = filter.vehiculoId
  if (filter.desde || filter.hasta) {
    q.timestamp = {}
    if (filter.desde) (q.timestamp as any).$gte = new Date(filter.desde)
    if (filter.hasta) (q.timestamp as any).$lte = new Date(filter.hasta)
  }
  return EventoAcceso.find(q).sort({ timestamp: -1 }).limit(200).lean()
}
```

`server/modules/vehiculos/multas.service.ts`:
```ts
import { z } from "zod"
import { ApiError } from "../../lib/errors"
import { Multa } from "./multa.model"
import { Vehiculo } from "./vehiculo.model"
import { Alerta } from "../alertas/alerta.model"

const createMultaInput = z.object({
  vehiculoId: z.string().min(1),
  tipo: z.string().min(1),
  montoMxn: z.number().int().positive(),
  evidencia: z.array(z.string()).default([]),
  comentarios: z.string().optional(),
})

export async function listMultas(filter: { vehiculoId?: string; estado?: string }) {
  const q: Record<string, unknown> = {}
  if (filter.vehiculoId) q.vehiculoId = filter.vehiculoId
  if (filter.estado) q.estado = filter.estado
  return Multa.find(q).sort({ fecha: -1 }).limit(200).lean()
}

export async function createMulta(oficialId: string, raw: unknown) {
  const input = createMultaInput.parse(raw)
  const v = await Vehiculo.findById(input.vehiculoId)
  if (!v) throw new ApiError("NOT_FOUND", "Vehículo no encontrado")

  const multa = await Multa.create({ ...input, oficialId, fecha: new Date() })
  v.multasPendientes = (v.multasPendientes ?? 0) + 1
  await v.save()
  await Alerta.create({
    scope: "vehicular",
    tipo: "incidente",
    severidad: "moderada",
    descripcion: `Nueva multa: ${input.tipo} · $${input.montoMxn}`,
    refs: { vehiculoId: v._id },
  })
  return multa.toObject()
}

export async function patchMulta(id: string, raw: unknown) {
  const input = z.object({ estado: z.enum(["pagada", "cancelada"]) }).parse(raw)
  const m = await Multa.findById(id)
  if (!m) throw new ApiError("NOT_FOUND", "Multa no encontrada")
  const wasPending = m.estado === "pendiente"
  m.estado = input.estado
  await m.save()
  if (wasPending) {
    await Vehiculo.updateOne(
      { _id: m.vehiculoId },
      { $inc: { multasPendientes: -1 } }
    )
  }
  return m.toObject()
}
```

`server/modules/vehiculos/vehiculos.routes.ts`:
```ts
import { Router } from "express"
import { asyncHandler } from "../../lib/asyncHandler"
import { requireAuth, requireRole } from "../../middlewares/auth"
import {
  autorizarSalida,
  buscarPorMatricula,
  createVehiculo,
  deleteVehiculo,
  denegarAcceso,
  getVehiculo,
  listEventos,
  listVehiculos,
  patchVehiculo,
  permitirAcceso,
} from "./vehiculos.service"
import { createMulta, listMultas, patchMulta } from "./multas.service"
import { PuntoControl } from "./punto.model"

export const vehiculosRoutes = Router()
vehiculosRoutes.use(requireAuth)

vehiculosRoutes.get(
  "/",
  asyncHandler(async (req, res) => {
    const search = typeof req.query.search === "string" ? req.query.search : undefined
    const estado = typeof req.query.estado === "string" ? req.query.estado : undefined
    res.json({ data: await listVehiculos({ search, estado }) })
  })
)

vehiculosRoutes.post(
  "/",
  requireRole("oficial", "admin"),
  asyncHandler(async (req, res) => {
    const v = await createVehiculo(req.body)
    res.status(201).json({ data: v })
  })
)

vehiculosRoutes.post(
  "/buscar",
  asyncHandler(async (req, res) => {
    const matricula = String(req.body?.matricula ?? "")
    const v = await buscarPorMatricula(matricula)
    res.json({ data: v })
  })
)

vehiculosRoutes.get(
  "/:id",
  asyncHandler(async (req, res) => {
    res.json({ data: await getVehiculo(req.params.id) })
  })
)

vehiculosRoutes.patch(
  "/:id",
  requireRole("oficial", "admin"),
  asyncHandler(async (req, res) => {
    res.json({ data: await patchVehiculo(req.params.id, req.body) })
  })
)

vehiculosRoutes.delete(
  "/:id",
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    await deleteVehiculo(req.params.id)
    res.status(204).end()
  })
)

vehiculosRoutes.post(
  "/:id/permitir",
  requireRole("oficial", "admin"),
  asyncHandler(async (req, res) => {
    res.json({ data: await permitirAcceso(req.params.id, String(req.user._id), req.body) })
  })
)

vehiculosRoutes.post(
  "/:id/denegar",
  requireRole("oficial", "admin"),
  asyncHandler(async (req, res) => {
    res.json({ data: await denegarAcceso(req.params.id, String(req.user._id), req.body) })
  })
)

vehiculosRoutes.post(
  "/:id/autorizar-salida",
  requireRole("oficial", "admin"),
  asyncHandler(async (req, res) => {
    res.json({ data: await autorizarSalida(req.params.id, String(req.user._id)) })
  })
)

// ── Multas (montadas en el mismo módulo) ────────────────────────────────────

export const multasRoutes = Router()
multasRoutes.use(requireAuth)

multasRoutes.get(
  "/",
  asyncHandler(async (req, res) => {
    const vehiculoId = typeof req.query.vehiculoId === "string" ? req.query.vehiculoId : undefined
    const estado = typeof req.query.estado === "string" ? req.query.estado : undefined
    res.json({ data: await listMultas({ vehiculoId, estado }) })
  })
)

multasRoutes.post(
  "/",
  requireRole("oficial", "admin"),
  asyncHandler(async (req, res) => {
    const m = await createMulta(String(req.user._id), req.body)
    res.status(201).json({ data: m })
  })
)

multasRoutes.patch(
  "/:id",
  requireRole("oficial", "admin"),
  asyncHandler(async (req, res) => {
    res.json({ data: await patchMulta(req.params.id, req.body) })
  })
)

// ── Eventos ─────────────────────────────────────────────────────────────────

export const eventosRoutes = Router()
eventosRoutes.use(requireAuth)
eventosRoutes.get(
  "/",
  asyncHandler(async (req, res) => {
    const vehiculoId = typeof req.query.vehiculoId === "string" ? req.query.vehiculoId : undefined
    const desde = typeof req.query.desde === "string" ? req.query.desde : undefined
    const hasta = typeof req.query.hasta === "string" ? req.query.hasta : undefined
    res.json({ data: await listEventos({ vehiculoId, desde, hasta }) })
  })
)

// ── Puntos de control ───────────────────────────────────────────────────────

export const puntosRoutes = Router()
puntosRoutes.use(requireAuth)
puntosRoutes.get(
  "/",
  asyncHandler(async (_req, res) => {
    const items = await PuntoControl.find().sort({ nombre: 1 }).lean()
    res.json({ data: items })
  })
)
```

### Task 4 — Rutas de Alertas

`server/modules/alertas/alertas.routes.ts`:
```ts
import { Router } from "express"
import { z } from "zod"
import { asyncHandler } from "../../lib/asyncHandler"
import { requireAuth, requireRole } from "../../middlewares/auth"
import { ApiError } from "../../lib/errors"
import { Alerta } from "./alerta.model"

export const alertasRoutes = Router()
alertasRoutes.use(requireAuth)

alertasRoutes.get(
  "/",
  asyncHandler(async (req, res) => {
    const q: Record<string, unknown> = {}
    if (typeof req.query.scope === "string") q.scope = req.query.scope
    if (typeof req.query.estado === "string") q.estado = req.query.estado
    if (typeof req.query.severidad === "string") q.severidad = req.query.severidad
    const items = await Alerta.find(q).sort({ timestamp: -1 }).limit(200).lean()
    res.json({ data: items })
  })
)

const createInput = z.object({
  scope: z.enum(["vehicular", "residencial"]),
  tipo: z.string().min(1),
  severidad: z.enum(["critica", "alta", "moderada", "media", "info"]),
  descripcion: z.string().min(1),
  refs: z
    .object({
      vehiculoId: z.string().optional(),
      residenteUserId: z.string().optional(),
      edificioId: z.string().optional(),
    })
    .optional(),
})

alertasRoutes.post(
  "/",
  requireRole("oficial", "adminColegios", "admin"),
  asyncHandler(async (req, res) => {
    const input = createInput.parse(req.body)
    const a = await Alerta.create(input)
    res.status(201).json({ data: a })
  })
)

alertasRoutes.patch(
  "/:id/atender",
  requireRole("oficial", "adminColegios", "admin"),
  asyncHandler(async (req, res) => {
    const a = await Alerta.findById(req.params.id)
    if (!a) throw new ApiError("NOT_FOUND", "Alerta no encontrada")
    a.estado = "atendida"
    a.atendidaPor = req.user._id
    a.atendidaEn = new Date()
    await a.save()
    res.json({ data: a.toObject() })
  })
)
```

### Task 5 — KPIs iPad

`server/modules/kpis/kpis.routes.ts`:
```ts
import { Router } from "express"
import { asyncHandler } from "../../lib/asyncHandler"
import { requireAuth, requireRole } from "../../middlewares/auth"
import { Vehiculo } from "../vehiculos/vehiculo.model"
import { EventoAcceso } from "../vehiculos/evento.model"
import { Alerta } from "../alertas/alerta.model"

export const kpisRoutes = Router()
kpisRoutes.use(requireAuth)

kpisRoutes.get(
  "/ipad",
  requireRole("oficial", "admin"),
  asyncHandler(async (_req, res) => {
    const startToday = new Date()
    startToday.setHours(0, 0, 0, 0)
    const startYesterday = new Date(startToday.getTime() - 86400000)

    const [entradasHoy, entradasAyer, vehiculosEnCampus, alertas] = await Promise.all([
      EventoAcceso.countDocuments({ resultado: "permitido", timestamp: { $gte: startToday } }),
      EventoAcceso.countDocuments({
        resultado: "permitido",
        timestamp: { $gte: startYesterday, $lt: startToday },
      }),
      Vehiculo.countDocuments({ estadoAcceso: "permitido" }),
      Alerta.find({ scope: "vehicular", estado: "activa" }).lean(),
    ])

    const moderadas = alertas.filter((a) => a.severidad === "moderada").length
    const criticas = alertas.filter((a) => a.severidad === "critica").length
    const deltaEntradas = entradasAyer === 0 ? 0 : Math.round(((entradasHoy - entradasAyer) / entradasAyer) * 100)

    res.json({
      data: {
        entradasHoy,
        deltaEntradas,
        incidentesActivos: alertas.length,
        incidentesModerados: moderadas,
        incidentesCriticos: criticas,
        vehiculosEnCampus,
        capacidadPct: Math.min(100, Math.round((vehiculosEnCampus / 600) * 100)),
        visitasNocturnas: 0, // a futuro
        pendientesCheckout: await Vehiculo.countDocuments({ "bloqueoSalida.motivo": { $exists: true } }),
      },
    })
  })
)
```

### Task 6 — Login por PIN

Modify `server/modules/auth/auth.service.ts` — añadir al final:

```ts
const loginPinInput = z.object({
  oficialUserId: z.string().min(1),
  pin: z.string().min(1),
})

export async function loginPin(rawInput: unknown) {
  const { oficialUserId, pin } = loginPinInput.parse(rawInput)
  const user = await User.findById(oficialUserId)
  if (!user || user.role !== "oficial") {
    throw new ApiError("UNAUTHORIZED", "Credenciales inválidas")
  }
  const expected = user.profile?.oficial?.pin
  if (!expected || expected !== pin) {
    throw new ApiError("UNAUTHORIZED", "Credenciales inválidas")
  }
  const token = crypto.randomUUID()
  user.sessionToken = token
  user.sessionExpiresAt = new Date(Date.now() + SESSION_TTL_MS)
  await user.save()
  return { user: serializeUser(user), token }
}
```

Modify `server/modules/auth/auth.routes.ts` — añadir:

```ts
import { loginPin } from "./auth.service"

authRoutes.post(
  "/login-pin",
  asyncHandler(async (req, res) => {
    const { user, token } = await loginPin(req.body)
    res.json({ data: { user, token } })
  })
)
```

Add a public `GET /api/users/oficiales` endpoint (in `users.routes.ts`) so the iPad login can list officers:

```ts
import { ROLES } from "./user.model"  // ya importado

usersRoutes.get(
  "/oficiales",
  // No requireAuth aquí: el iPad debe poder listar oficiales para mostrarlos en login.
  // Es público, pero solo expone datos no sensibles.
  asyncHandler(async (_req, res) => {
    // sobreescribir el requireAuth puesto al inicio del router:
    // como el router tiene un router-level requireAuth, hay que mover ESTA ruta
    // ANTES del use(requireAuth). El plan B es crear otro router.
  })
)
```

> **Importante:** `usersRoutes` ya tiene `usersRoutes.use(requireAuth)` al inicio. Para hacer pública la ruta de listar oficiales, **moverla a un router aparte** o crear el endpoint en `auth.routes.ts` (que solo tiene `requireAuth` en handlers específicos). **Solución limpia:** añadir el endpoint en `auth.routes.ts`:

```ts
authRoutes.get(
  "/oficiales",
  asyncHandler(async (_req, res) => {
    const oficiales = await User.find({ role: "oficial" })
      .select("nombre apellido profile.oficial.turno avatar")
      .sort({ nombre: 1 })
      .lean()
    res.json({
      data: oficiales.map((o: any) => ({
        id: String(o._id),
        nombre: o.nombre + " " + o.apellido,
        turno: o.profile?.oficial?.turno,
        avatar: o.avatar ?? null,
      })),
    })
  })
)
```

(Importar `User` en `auth.routes.ts`.)

### Task 7 — Mount nuevos routers en `app.ts` + extender seed

```ts
import { vehiculosRoutes, multasRoutes, eventosRoutes, puntosRoutes } from "./modules/vehiculos/vehiculos.routes"
import { alertasRoutes } from "./modules/alertas/alertas.routes"
import { kpisRoutes } from "./modules/kpis/kpis.routes"
// ...
app.use("/api/vehiculos", vehiculosRoutes)
app.use("/api/multas", multasRoutes)
app.use("/api/eventos-acceso", eventosRoutes)
app.use("/api/puntos-control", puntosRoutes)
app.use("/api/alertas", alertasRoutes)
app.use("/api/kpis", kpisRoutes)
```

Extender `server/seed.ts` (después de los datos de Plan 2) con:

```ts
import { Vehiculo } from "./modules/vehiculos/vehiculo.model"
import { Multa } from "./modules/vehiculos/multa.model"
import { EventoAcceso } from "./modules/vehiculos/evento.model"
import { PuntoControl } from "./modules/vehiculos/punto.model"
import { Alerta } from "./modules/alertas/alerta.model"

// Limpiar
await Promise.all([
  Vehiculo.deleteMany({}),
  Multa.deleteMany({}),
  EventoAcceso.deleteMany({}),
  PuntoControl.deleteMany({}),
  Alerta.deleteMany({}),
])

// Más oficiales (además del seguridad@udlap.mx ya creado)
const oficialesExtra = await User.insertMany([
  {
    email: "ramirez@udlap.mx", password: "demo1234", role: "oficial",
    nombre: "G.", apellido: "Ramírez",
    profile: { oficial: { numeroPlaca: "SEG-008", turno: "Vespertino", pin: "5678", gateAsignado: "Postgrado" } },
  },
  {
    email: "garza@udlap.mx", password: "demo1234", role: "oficial",
    nombre: "Garza", apellido: "Nocturno",
    profile: { oficial: { numeroPlaca: "SEG-009", turno: "Nocturno", pin: "9012", gateAsignado: "Residencial" } },
  },
])
const seguridad = await User.findOne({ email: "seguridad@udlap.mx" })

// Puntos de control
const puntos = await PuntoControl.insertMany([
  { nombre: "Puerta 1 (Principal)", tipo: "principal", estado: "activa", oficialOperadorId: seguridad?._id },
  { nombre: "Puerta 2 (Postgrado)", tipo: "postgrado", estado: "activa", oficialOperadorId: oficialesExtra[0]._id },
  { nombre: "Puerta 3 (Deportes)", tipo: "deportes", estado: "standby" },
  { nombre: "Acceso Residencial", tipo: "residencial", estado: "activa" },
])

// Vehículos demo
const vehiculos = await Vehiculo.insertMany([
  {
    matricula: "ABC-123-D",
    propietarioInfo: { nombre: "Juan Pérez Rodríguez", idUdlap: "154892", tipo: "estudiante" },
    modelo: "Mazda 3", color: "Rojo",
    sello: { vigente: true, vence: new Date("2027-12-31") },
    ubicacion: "Puerta 1", multasPendientes: 1, estadoAcceso: "permitido", ocupantes: 2,
  },
  {
    matricula: "TXY-4521",
    propietarioInfo: { nombre: "Carlos Méndez Rivera", idUdlap: "156432", tipo: "estudiante" },
    modelo: "Nissan Versa", color: "Blanco",
    sello: { vigente: true, vence: new Date("2027-12-31") },
    ubicacion: "Puerta 1", multasPendientes: 0, estadoAcceso: "permitido", ocupantes: 1,
  },
  {
    matricula: "UAL-9980",
    propietarioInfo: { nombre: "Dra. Elena García", idUdlap: "400192", tipo: "empleado" },
    modelo: "Honda Civic", color: "Negro",
    sello: { vigente: true, vence: new Date("2027-12-31") },
    ubicacion: "Puerta 2", multasPendientes: 1, estadoAcceso: "permitido", ocupantes: 1,
  },
  {
    matricula: "MXZ-1122",
    propietarioInfo: { nombre: "Juan Pérez S.", idUdlap: "Externo", tipo: "visita" },
    modelo: "Toyota Corolla", color: "Gris",
    sello: { vigente: false, vence: new Date("2024-12-31") },
    ubicacion: "Puerta 1", multasPendientes: 0, estadoAcceso: "denegado", ocupantes: 3,
  },
  {
    matricula: "PUE-6734",
    propietarioInfo: { nombre: "Mariana Torres", idUdlap: "158990", tipo: "estudiante" },
    modelo: "VW Jetta", color: "Azul",
    sello: { vigente: true, vence: new Date("2027-12-31") },
    ubicacion: "Estacionamiento 2", multasPendientes: 3, estadoAcceso: "revision", ocupantes: 1,
    bloqueoSalida: { motivo: "multa", descripcion: "3 multas pendientes sin pagar" },
  },
  {
    matricula: "HGT-5521",
    propietarioInfo: { nombre: "Andrea S. Valerdi", idUdlap: "164082", tipo: "estudiante" },
    modelo: "Kia Río", color: "Blanco",
    sello: { vigente: true, vence: new Date("2027-12-31") },
    ubicacion: "Estacionamiento 1", multasPendientes: 2, estadoAcceso: "revision", ocupantes: 1,
    bloqueoSalida: { motivo: "restriccion_academica", descripcion: "Estudiante con multas de $500" },
  },
  {
    matricula: "ROB-7788",
    propietarioInfo: { nombre: "Roberto G. Garza", idUdlap: "Empleado-021", tipo: "empleado" },
    modelo: "Ford Escape", color: "Plata",
    sello: { vigente: true, vence: new Date("2027-12-31") },
    ubicacion: "Estacionamiento 3", multasPendientes: 1, estadoAcceso: "revision", ocupantes: 1,
    bloqueoSalida: { motivo: "incidente", descripcion: "Conducir en estado de ebriedad" },
  },
])

// Multas
await Multa.insertMany([
  { vehiculoId: vehiculos[0]._id, oficialId: oficialesExtra[0]._id, tipo: "Estacionamiento prohibido", montoMxn: 450, comentarios: "Estacionado en zona roja", fecha: new Date(Date.now() - 9 * 86400000), evidencia: [] },
  { vehiculoId: vehiculos[2]._id, oficialId: seguridad?._id, tipo: "Exceso de velocidad", montoMxn: 850, comentarios: "45 km/h en zona escolar", fecha: new Date(Date.now() - 13 * 86400000), evidencia: [] },
  { vehiculoId: vehiculos[4]._id, oficialId: oficialesExtra[0]._id, tipo: "No respetar alto", montoMxn: 600, comentarios: "", fecha: new Date(Date.now() - 18 * 86400000), evidencia: [] },
])

// Eventos recientes
const ahora = Date.now()
await EventoAcceso.insertMany([
  { vehiculoId: vehiculos[1]._id, puntoId: puntos[0]._id, oficialId: seguridad?._id, resultado: "permitido", timestamp: new Date(ahora - 2 * 60 * 60 * 1000) },
  { vehiculoId: vehiculos[0]._id, puntoId: puntos[0]._id, oficialId: seguridad?._id, resultado: "permitido", timestamp: new Date(ahora - 3 * 60 * 60 * 1000) },
  { vehiculoId: vehiculos[3]._id, puntoId: puntos[0]._id, oficialId: seguridad?._id, resultado: "denegado", motivo: "Sello vencido", timestamp: new Date(ahora - 4 * 60 * 60 * 1000) },
  { vehiculoId: vehiculos[2]._id, puntoId: puntos[1]._id, oficialId: oficialesExtra[0]._id, resultado: "permitido", timestamp: new Date(ahora - 5 * 60 * 60 * 1000) },
])

// Alertas
await Alerta.insertMany([
  { scope: "vehicular", tipo: "placa_detectada", severidad: "info", descripcion: "Placa Detectada: ABC-123-D · Ingreso por Puerta 1", refs: { vehiculoId: vehiculos[0]._id }, timestamp: new Date(ahora - 60 * 60 * 1000), estado: "activa" },
  { scope: "vehicular", tipo: "incidente", severidad: "moderada", descripcion: "Objetos perdidos en Biblioteca", timestamp: new Date(ahora - 90 * 60 * 1000), estado: "activa" },
  { scope: "vehicular", tipo: "ronda", severidad: "info", descripcion: "Ronda Perimetral Completada · Sector 4 (Residencias)", timestamp: new Date(ahora - 120 * 60 * 1000), estado: "atendida" },
  { scope: "vehicular", tipo: "visitante", severidad: "info", descripcion: "Nuevo Visitante: Juan Pérez · Destino: Edificio Administrativo", timestamp: new Date(ahora - 150 * 60 * 1000), estado: "activa" },
  { scope: "vehicular", tipo: "salida_bloqueada", severidad: "critica", descripcion: "Salida bloqueada · Roberto G. Garza · Estado de ebriedad", refs: { vehiculoId: vehiculos[6]._id }, timestamp: new Date(ahora - 180 * 60 * 1000), estado: "activa" },
])

console.log(`✅ Seed iPad: ${oficialesExtra.length + 1} oficiales, ${puntos.length} puntos, ${vehiculos.length} vehículos, 3 multas, 4 eventos, 5 alertas`)
```

### Task 8 — Smoke tests

```bash
# Login PIN
TOKEN=$(curl -sS http://localhost:4000/api/auth/oficiales | python3 -c "import sys,json; print(json.load(sys.stdin)['data'][0]['id'])")
# El primer oficial ya viene del seed: seguridad@udlap.mx con PIN 1234
LOGIN=$(curl -sS -X POST http://localhost:4000/api/auth/login-pin \
  -H "Content-Type: application/json" \
  -d "{\"oficialUserId\":\"$TOKEN\",\"pin\":\"1234\"}")
echo $LOGIN
T=$(echo $LOGIN | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['token'])")

# Listas
for path in /api/vehiculos /api/multas /api/eventos-acceso /api/puntos-control "/api/alertas?scope=vehicular" /api/kpis/ipad; do
  echo "--- $path ---"
  curl -sS "http://localhost:4000$path" -H "Authorization: Bearer $T" | python3 -c "import sys,json; d=json.load(sys.stdin)['data']; print('items/data:', len(d) if isinstance(d, list) else d)"
done

# Permitir acceso vehículo
VEH_ID=$(curl -sS http://localhost:4000/api/vehiculos -H "Authorization: Bearer $T" | python3 -c "import sys,json; print(json.load(sys.stdin)['data'][0]['_id'])")
curl -sS -X POST "http://localhost:4000/api/vehiculos/$VEH_ID/permitir" -H "Authorization: Bearer $T" -H "Content-Type: application/json" -d '{"puntoId":"opt"}'
```

Esperado: KPI tiene `entradasHoy`, listas con counts > 0, permitir acceso devuelve vehículo con `estadoAcceso: "permitido"`.

---

## Phase B — Frontend

### Task 9 — Hooks de iPad

`src/screens/ipad/hooks/useIpadVehiculos.ts`:
```ts
import { useCallback, useEffect, useState } from "react"
import { api } from "@/lib/api"

export function useIpadVehiculos() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const refresh = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      setData(await api.get<any[]>("/api/vehiculos"))
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error")
    } finally { setLoading(false) }
  }, [])
  useEffect(() => { void refresh() }, [refresh])

  const buscarPorMatricula = useCallback(async (matricula: string) => {
    return api.post<any>("/api/vehiculos/buscar", { matricula })
  }, [])

  const permitir = useCallback(async (id: string, puntoId?: string) => {
    await api.post(`/api/vehiculos/${id}/permitir`, { puntoId })
    await refresh()
  }, [refresh])

  const denegar = useCallback(async (id: string, motivo: string, puntoId?: string) => {
    await api.post(`/api/vehiculos/${id}/denegar`, { motivo, puntoId })
    await refresh()
  }, [refresh])

  const autorizarSalida = useCallback(async (id: string) => {
    await api.post(`/api/vehiculos/${id}/autorizar-salida`)
    await refresh()
  }, [refresh])

  return { data, loading, error, refresh, buscarPorMatricula, permitir, denegar, autorizarSalida }
}
```

`src/screens/ipad/hooks/useIpadMultas.ts`, `useIpadEventos.ts`, `useIpadAlertas.ts`, `useIpadKpis.ts` — patrón análogo (fetch + acciones). Ver código en pasos siguientes.

`src/screens/ipad/hooks/useIpadMultas.ts`:
```ts
import { useCallback, useEffect, useState } from "react"
import { api } from "@/lib/api"

export function useIpadMultas() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const refresh = useCallback(async () => {
    setLoading(true)
    try { setData(await api.get<any[]>("/api/multas")) } finally { setLoading(false) }
  }, [])
  useEffect(() => { void refresh() }, [refresh])

  const crear = useCallback(async (input: { vehiculoId: string; tipo: string; montoMxn: number; evidencia?: string[]; comentarios?: string }) => {
    await api.post("/api/multas", input)
    await refresh()
  }, [refresh])

  const cambiarEstado = useCallback(async (id: string, estado: "pagada" | "cancelada") => {
    await api.patch(`/api/multas/${id}`, { estado })
    await refresh()
  }, [refresh])

  return { data, loading, refresh, crear, cambiarEstado }
}
```

`src/screens/ipad/hooks/useIpadEventos.ts`:
```ts
import { useCallback, useEffect, useState } from "react"
import { api } from "@/lib/api"

export function useIpadEventos() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const refresh = useCallback(async () => {
    setLoading(true)
    try { setData(await api.get<any[]>("/api/eventos-acceso")) } finally { setLoading(false) }
  }, [])
  useEffect(() => { void refresh() }, [refresh])
  return { data, loading, refresh }
}
```

`src/screens/ipad/hooks/useIpadAlertas.ts`:
```ts
import { useCallback, useEffect, useState } from "react"
import { api } from "@/lib/api"

export function useIpadAlertas() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const refresh = useCallback(async () => {
    setLoading(true)
    try { setData(await api.get<any[]>("/api/alertas", { scope: "vehicular" })) } finally { setLoading(false) }
  }, [])
  useEffect(() => { void refresh() }, [refresh])

  const atender = useCallback(async (id: string) => {
    await api.patch(`/api/alertas/${id}/atender`)
    await refresh()
  }, [refresh])

  return { data, loading, refresh, atender }
}
```

`src/screens/ipad/hooks/useIpadKpis.ts`:
```ts
import { useCallback, useEffect, useState } from "react"
import { api } from "@/lib/api"

export interface IpadKpis {
  entradasHoy: number
  deltaEntradas: number
  incidentesActivos: number
  incidentesModerados: number
  incidentesCriticos: number
  vehiculosEnCampus: number
  capacidadPct: number
  visitasNocturnas: number
  pendientesCheckout: number
}

export function useIpadKpis() {
  const [data, setData] = useState<IpadKpis | null>(null)
  const [loading, setLoading] = useState(true)
  const refresh = useCallback(async () => {
    setLoading(true)
    try { setData(await api.get<IpadKpis>("/api/kpis/ipad")) } finally { setLoading(false) }
  }, [])
  useEffect(() => { void refresh() }, [refresh])
  return { data, loading, refresh }
}
```

### Task 10 — Reemplazar `IpadDataContext` para usar hooks

Reemplazar `src/screens/ipad/context/IpadDataContext.tsx` por una versión que combine los hooks y exponga la **misma forma** que el contexto actual (para no romper las pantallas):

```tsx
import { createContext, useContext, useMemo, type ReactNode } from "react"
import type { Alerta, EventoAcceso, Multa, MultaInput, Punto, Vehiculo, DashboardKpis } from "../types"
import { useIpadVehiculos } from "../hooks/useIpadVehiculos"
import { useIpadMultas } from "../hooks/useIpadMultas"
import { useIpadEventos } from "../hooks/useIpadEventos"
import { useIpadAlertas } from "../hooks/useIpadAlertas"
import { useIpadKpis } from "../hooks/useIpadKpis"
import { api } from "@/lib/api"

interface DataValue {
  vehiculos: Vehiculo[]
  multas: Multa[]
  eventos: EventoAcceso[]
  alertas: Alerta[]
  puntosControl: Punto[]
  kpis: DashboardKpis
  loading: boolean
  permitirAcceso(vehiculoId: string, puntoId: string, oficialId: string): Promise<void>
  denegarAcceso(vehiculoId: string, puntoId: string, oficialId: string, motivo: string): Promise<void>
  registrarMulta(input: MultaInput, oficialId: string): Promise<void>
  autorizarSalida(vehiculoId: string, oficialId: string): Promise<void>
  marcarAlertaAtendida(alertaId: string): Promise<void>
}

const Ctx = createContext<DataValue | null>(null)

// Adapter de los docs de Mongo a los tipos antiguos del frontend (compatible con las pantallas actuales)
function adaptVehiculo(v: any): Vehiculo {
  return {
    id: v._id,
    matricula: v.matricula,
    propietario: {
      nombre: v.propietarioInfo?.nombre ?? "",
      idUdlap: v.propietarioInfo?.idUdlap ?? "",
      tipo: v.propietarioInfo?.tipo ?? "externo",
    },
    foto: v.foto ?? "",
    modelo: v.modelo ?? "",
    color: v.color ?? "",
    sello: { vigente: v.sello?.vigente ?? false, vence: v.sello?.vence ? String(new Date(v.sello.vence).getFullYear()) : "" },
    ubicacion: v.ubicacion ?? "",
    multasPendientes: v.multasPendientes ?? 0,
    estadoAcceso: v.estadoAcceso ?? "permitido",
    ocupantes: v.ocupantes ?? 1,
    bloqueoSalida: v.bloqueoSalida,
  }
}

function adaptMulta(m: any): Multa {
  return {
    id: m._id,
    vehiculoId: m.vehiculoId,
    oficialId: m.oficialId,
    tipo: m.tipo,
    montoMxn: m.montoMxn,
    evidencia: m.evidencia ?? [],
    comentarios: m.comentarios ?? "",
    fecha: m.fecha,
    estado: m.estado,
  }
}

function adaptEvento(e: any): EventoAcceso {
  return {
    id: e._id,
    vehiculoId: e.vehiculoId,
    puntoId: e.puntoId,
    oficialId: e.oficialId,
    resultado: e.resultado,
    motivo: e.motivo,
    timestamp: e.timestamp,
  }
}

function adaptAlerta(a: any): Alerta {
  return {
    id: a._id,
    tipo: a.tipo,
    severidad: a.severidad === "alta" ? "moderada" : a.severidad, // map back if backend uses both
    descripcion: a.descripcion,
    vehiculoId: a.refs?.vehiculoId,
    timestamp: a.timestamp,
    estado: a.estado,
  }
}

function adaptPunto(p: any): Punto {
  return { id: p._id, nombre: p.nombre, tipo: p.tipo, estado: p.estado, oficialOperadorId: p.oficialOperadorId }
}

export function IpadDataProvider({ children }: { children: ReactNode }) {
  const vehHook = useIpadVehiculos()
  const multHook = useIpadMultas()
  const evHook = useIpadEventos()
  const alHook = useIpadAlertas()
  const kpisHook = useIpadKpis()
  const [puntos, setPuntos] = useState<Punto[]>([])

  // Cargar puntos una sola vez
  useEffect(() => {
    void api.get<any[]>("/api/puntos-control").then((items) => setPuntos(items.map(adaptPunto)))
  }, [])

  const value = useMemo<DataValue>(() => ({
    vehiculos: vehHook.data.map(adaptVehiculo),
    multas: multHook.data.map(adaptMulta),
    eventos: evHook.data.map(adaptEvento),
    alertas: alHook.data.map(adaptAlerta),
    puntosControl: puntos,
    kpis: kpisHook.data ?? {
      entradasHoy: 0, deltaEntradas: 0, incidentesActivos: 0,
      incidentesModerados: 0, incidentesCriticos: 0, vehiculosEnCampus: 0,
      capacidadPct: 0, visitasNocturnas: 0, pendientesCheckout: 0,
    },
    loading: vehHook.loading || kpisHook.loading,
    async permitirAcceso(vehiculoId, puntoId) {
      await vehHook.permitir(vehiculoId, puntoId)
      await Promise.all([evHook.refresh(), kpisHook.refresh()])
    },
    async denegarAcceso(vehiculoId, puntoId, _oficialId, motivo) {
      await vehHook.denegar(vehiculoId, motivo, puntoId)
      await Promise.all([evHook.refresh(), alHook.refresh(), kpisHook.refresh()])
    },
    async registrarMulta(input) {
      await multHook.crear(input)
      await Promise.all([vehHook.refresh(), alHook.refresh()])
    },
    async autorizarSalida(vehiculoId) {
      await vehHook.autorizarSalida(vehiculoId)
      await evHook.refresh()
    },
    async marcarAlertaAtendida(alertaId) {
      await alHook.atender(alertaId)
    },
  }), [vehHook, multHook, evHook, alHook, kpisHook, puntos])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useIpadData(): DataValue {
  const v = useContext(Ctx)
  if (!v) throw new Error("useIpadData fuera de IpadDataProvider")
  return v
}

import { useEffect, useState } from "react"
```

> Este adapter pattern preserva la API que las 8 pantallas iPad ya consumen (props `vehiculos`, `multas`, etc.). Solo el internal cambia.

### Task 11 — Reemplazar `IpadSessionContext` para usar el backend

```tsx
import { createContext, useContext, useMemo, type ReactNode } from "react"
import type { Officer } from "../types"
import { useAuth } from "@/lib/auth-store"
import { api } from "@/lib/api"
import { useEffect, useState } from "react"

interface SessionValue {
  officer: Officer | null
  officers: Officer[]
  login(id: string, pin: string): Promise<boolean>
  logout(): Promise<void>
}

const Ctx = createContext<SessionValue | null>(null)

export function IpadSessionProvider({ children }: { children: ReactNode }) {
  const { user, logout: globalLogout } = useAuth()
  const [officers, setOfficers] = useState<Officer[]>([])

  // Cargar oficiales para el LoginScreen (público)
  useEffect(() => {
    void api.get<any[]>("/api/auth/oficiales").then((items) => {
      setOfficers(items.map((o) => ({
        id: o.id,
        nombre: o.nombre,
        turno: o.turno ?? "Matutino",
        avatar: o.avatar ?? "",
        pin: "", // no se expone
      })))
    }).catch(() => setOfficers([]))
  }, [])

  const officer: Officer | null = useMemo(() => {
    if (!user || user.role !== "oficial") return null
    return {
      id: user.id,
      nombre: `${user.nombre} ${user.apellido}`,
      turno: (user.profile as any)?.oficial?.turno ?? "Matutino",
      avatar: user.avatar ?? "",
      pin: "",
    }
  }, [user])

  const value = useMemo<SessionValue>(() => ({
    officer,
    officers,
    async login(id, pin) {
      try {
        const data = await api.post<{ user: any; token: string }>("/api/auth/login-pin", {
          oficialUserId: id,
          pin,
        })
        // setStoredToken + AuthProvider.refresh — usamos el helper
        const { setStoredToken } = await import("@/lib/api")
        setStoredToken(data.token)
        // forzar el refresh del auth global
        window.dispatchEvent(new Event("storage"))
        // pequeño hack: forzar reload del user via auth.refresh
        const evt = new Event("focus")
        window.dispatchEvent(evt)
        // Más limpio: usar refresh del AuthContext
        // Como no tenemos acceso directo aquí, recargamos:
        location.reload()
        return true
      } catch {
        return false
      }
    },
    async logout() {
      await globalLogout()
    },
  }), [officer, officers, globalLogout])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useIpadSession(): SessionValue {
  const v = useContext(Ctx)
  if (!v) throw new Error("useIpadSession fuera de IpadSessionProvider")
  return v
}
```

> El `location.reload()` después del login es un atajo aceptable para escuela: simplifica el handshake con el AuthProvider. Para una versión más limpia, expondría `refresh` del AuthContext y lo llamaríamos aquí.

### Task 12 — Wrap `/ipad/*` con `RequireAuth`

En `src/App.tsx`, modificar el bloque `/ipad`:

```tsx
{/* ── iPad: login público ─────────────────── */}
<Route path="/ipad/login" element={
  // El LoginScreen del iPad se monta dentro del Layout, pero como el Layout
  // ya hace su propia gate por officer, lo mantenemos como está.
  // Solo "saca" el path a public no protegido por RequireAuth de roles.
  <></> // se mantiene el comportamiento actual: el IpadLayout maneja login interno
} />

<Route path="/ipad" element={
  <RequireAuth role={["oficial", "admin"]} loginPath="/ipad/login">
    <IpadLayout />
  </RequireAuth>
}>
  <Route index element={<Navigate to="/ipad/dashboard" replace />} />
  ...
</Route>
```

> **Espera:** el `IpadLayout` ya tiene su propio gate (`if (!officer && !isLogin) return <Navigate to="/ipad/login" />`). Combinar `RequireAuth` con eso causa redirección doble. **Mejor decisión: NO envolver con `RequireAuth` aquí**, dejar que `IpadLayout` haga el gate (ahora que `IpadSessionContext` usa el `useAuth` global). Eliminar el comportamiento "Navigate replace" en favor del flow del session context. Ver Task 13.

### Task 13 — Refactor `IpadLayout` para usar el auth global

`IpadLayout.tsx` actualmente usa `useIpadSession().officer`. Como ahora el session context lee del `useAuth()` global, el gate sigue funcionando. Solo asegurar que `IpadDataProvider` solo se monta cuando hay officer (para evitar que los hooks fetch sin token).

```tsx
function IpadLayoutInner() {
  const { pathname } = useLocation()
  const { officer } = useIpadSession()
  const [mobileOpen, setMobileOpen] = useState(false)

  const isLogin = pathname === "/ipad/login"

  if (!officer && !isLogin) {
    return <Navigate to="/ipad/login" replace />
  }
  if (officer && isLogin) {
    return <Navigate to="/ipad/dashboard" replace />
  }

  if (isLogin) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Outlet />
      </div>
    )
  }

  return (
    <IpadDataProvider>
      <div className="min-h-screen bg-slate-50 flex">
        <IpadSidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
        <div className="flex-1 flex flex-col min-w-0">
          <IpadHeader onMenuClick={() => setMobileOpen(true)} />
          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
            <Outlet />
          </main>
        </div>
      </div>
    </IpadDataProvider>
  )
}
```

(Mover `IpadDataProvider` al inner para que solo monte tras login. Quitarlo del `IpadLayout` outer.)

### Task 14 — Smoke

`npm run build` debe pasar. Levantar `npm run dev`. En navegador, ir a `/ipad/login`, click en oficial "Mendoza" (o el primero), PIN `1234`, debería entrar al dashboard con datos reales.

---

## Self-Review

- ✅ Sección 4.3-4.6 (Vehiculo, Multa, EventoAcceso, PuntoControl): Tasks 1, 7
- ✅ Sección 4.7 (Alerta): Task 2
- ✅ Sección 5.4 endpoints completos: Tasks 3
- ✅ Sección 5.5 (Alertas): Task 4
- ✅ Sección 5.11 KPIs iPad: Task 5
- ✅ Login PIN para oficiales: Task 6
- ✅ Frontend wiring: Tasks 9-13

Los nombres de funciones (`permitirAcceso`, `denegarAcceso`, `registrarMulta`, `autorizarSalida`, `marcarAlertaAtendida`) coinciden con los expuestos por el `IpadDataContext` original — las 8 pantallas no requieren cambios estructurales.
