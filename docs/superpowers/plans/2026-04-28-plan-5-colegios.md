# Plan 5 — Colegios residenciales (Backend + cableado)

> **No git commits.**

**Goal:** Las 9 pantallas Colegios contra backend real. KPIs, residentes (users con role `residente`), edificios, movimientos, alertas residenciales (reutiliza colección `alertas` con `scope: residencial`), visitas con destino a edificio.

**Architecture:** Reusa lo que ya existe (alertas, visitas). Añade `Edificio`, `MovimientoResidente`, KPIs. Mismo adapter pattern que en iPad: el `ColegiosDataContext` mantiene su forma legacy y traduce.

---

## File structure

### Backend nuevo

| Path | Responsabilidad |
|------|-----------------|
| `server/modules/colegios/edificio.model.ts` | Schema `Edificio` |
| `server/modules/colegios/movimiento.model.ts` | Schema `MovimientoResidente` |
| `server/modules/colegios/colegios.service.ts` | Listas, ocupación calculada, movimientos |
| `server/modules/colegios/colegios.routes.ts` | `/api/colegios/*` |
| Extend `server/modules/kpis/kpis.routes.ts` | añadir `GET /api/kpis/colegios` |

### Frontend nuevo (hooks)

| Path | Responsabilidad |
|------|-----------------|
| `src/screens/colegios/hooks/useColegiosEdificios.ts` | edificios + ocupación |
| `src/screens/colegios/hooks/useColegiosResidentes.ts` | residentes |
| `src/screens/colegios/hooks/useColegiosMovimientos.ts` | movimientos |
| `src/screens/colegios/hooks/useColegiosAlertas.ts` | alertas scope=residencial |
| `src/screens/colegios/hooks/useColegiosVisitas.ts` | visitas con destino a edificios |
| `src/screens/colegios/hooks/useColegiosKpis.ts` | KPIs |

### Modificados

- `server/seed.ts` — añadir 4 edificios, 1 admin colegios user, ~10 residentes (users con role residente), 5 movimientos, 4 alertas residenciales, 2 visitas a edificios.
- `src/screens/colegios/context/ColegiosDataContext.tsx` — fetch real con adapters.
- `src/screens/colegios/context/ColegiosSessionContext.tsx` — usar `useAuth()` global.
- `src/screens/colegios/ColegiosLayout.tsx` — gate similar al iPad (no necesita login interno; la app.tsx route guard se encarga).
- `src/App.tsx` — `/colegios/*` con `RequireAuth role={"adminColegios"|"admin"}`. Añadir un `/colegios/login` que use email login (no PIN).
- `src/screens/colegios/RegistrarVisitaScreen.tsx` y `VerificacionScreen.tsx` — mantener pero usando datos reales (residentes, edificios) del contexto.

---

## Phase A — Backend

### Task 1 — Modelos

`server/modules/colegios/edificio.model.ts`:
```ts
import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose"

const edificioSchema = new Schema(
  {
    nombre: { type: String, required: true, unique: true },
    capacidad: { type: Number, required: true, min: 1 },
  },
  { timestamps: true }
)

export type EdificioDoc = InferSchemaType<typeof edificioSchema> & { _id: unknown }
export const Edificio: Model<EdificioDoc> =
  (mongoose.models.Edificio as Model<EdificioDoc>) ||
  mongoose.model<EdificioDoc>("Edificio", edificioSchema)
```

`server/modules/colegios/movimiento.model.ts`:
```ts
import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose"

const movimientoSchema = new Schema(
  {
    residenteUserId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    edificioId: { type: Schema.Types.ObjectId, ref: "Edificio", required: true },
    hora: { type: Date, default: () => new Date() },
    tipo: { type: String, enum: ["entrada", "salida"], required: true },
    estado: { type: String, enum: ["normal", "ebriedad", "autorizada", "alerta"], default: "normal" },
  },
  { timestamps: true }
)

export type MovimientoDoc = InferSchemaType<typeof movimientoSchema> & { _id: unknown }
export const Movimiento: Model<MovimientoDoc> =
  (mongoose.models.MovimientoResidente as Model<MovimientoDoc>) ||
  mongoose.model<MovimientoDoc>("MovimientoResidente", movimientoSchema)
```

### Task 2 — Servicio + rutas

`server/modules/colegios/colegios.service.ts`:
```ts
import { z } from "zod"
import { ApiError } from "../../lib/errors"
import { Edificio } from "./edificio.model"
import { Movimiento } from "./movimiento.model"
import { User } from "../users/user.model"

export async function listEdificios() {
  const edificios = await Edificio.find().sort({ nombre: 1 }).lean()
  // Computar ocupación = residentes en_campus en cada edificio
  const counts = await User.aggregate([
    { $match: { role: "residente", "profile.residente.estado": "en_campus" } },
    { $group: { _id: "$profile.residente.edificioId", c: { $sum: 1 } } },
  ])
  const countByEdif = new Map<string, number>(counts.map((d) => [String(d._id), d.c]))
  return edificios.map((e) => ({
    ...e,
    ocupacion: countByEdif.get(String(e._id)) ?? 0,
  }))
}

export async function getEdificio(id: string) {
  const e = await Edificio.findById(id).lean()
  if (!e) throw new ApiError("NOT_FOUND", "Edificio no encontrado")
  const ocupacion = await User.countDocuments({
    role: "residente",
    "profile.residente.edificioId": id,
    "profile.residente.estado": "en_campus",
  })
  return { ...e, ocupacion }
}

export async function listResidentes(filter: { edificioId?: string; estado?: string; search?: string }) {
  const q: Record<string, unknown> = { role: "residente" }
  if (filter.edificioId) q["profile.residente.edificioId"] = filter.edificioId
  if (filter.estado) q["profile.residente.estado"] = filter.estado
  if (filter.search) {
    const re = new RegExp(filter.search, "i")
    q.$or = [{ nombre: re }, { apellido: re }, { "profile.residente.studentId": re }]
  }
  return User.find(q).sort({ nombre: 1 }).limit(200).lean()
}

export async function getResidente(id: string) {
  const u = await User.findOne({ _id: id, role: "residente" }).lean()
  if (!u) throw new ApiError("NOT_FOUND", "Residente no encontrado")
  return u
}

const patchResidenteInput = z.object({
  estado: z.enum(["en_campus", "fuera", "invitado"]).optional(),
  habitacion: z.string().optional(),
  edificioId: z.string().optional(),
})

export async function patchResidente(id: string, raw: unknown) {
  const input = patchResidenteInput.parse(raw)
  const updates: Record<string, unknown> = {}
  if (input.estado) updates["profile.residente.estado"] = input.estado
  if (input.habitacion) updates["profile.residente.habitacion"] = input.habitacion
  if (input.edificioId) updates["profile.residente.edificioId"] = input.edificioId
  const u = await User.findOneAndUpdate(
    { _id: id, role: "residente" },
    { $set: updates },
    { new: true }
  ).lean()
  if (!u) throw new ApiError("NOT_FOUND", "Residente no encontrado")
  return u
}

export async function listMovimientos(filter: { residenteId?: string; desde?: string; hasta?: string }) {
  const q: Record<string, unknown> = {}
  if (filter.residenteId) q.residenteUserId = filter.residenteId
  if (filter.desde || filter.hasta) {
    q.hora = {}
    if (filter.desde) (q.hora as any).$gte = new Date(filter.desde)
    if (filter.hasta) (q.hora as any).$lte = new Date(filter.hasta)
  }
  return Movimiento.find(q).sort({ hora: -1 }).limit(200).lean()
}

const createMovInput = z.object({
  residenteUserId: z.string().min(1),
  edificioId: z.string().min(1),
  tipo: z.enum(["entrada", "salida"]),
  estado: z.enum(["normal", "ebriedad", "autorizada", "alerta"]).default("normal"),
})

export async function createMovimiento(raw: unknown) {
  const input = createMovInput.parse(raw)
  const m = await Movimiento.create(input)
  // Si es entrada/salida, actualizar el estado del residente
  if (input.tipo === "entrada") {
    await User.updateOne(
      { _id: input.residenteUserId, role: "residente" },
      { $set: { "profile.residente.estado": "en_campus" } }
    )
  } else {
    await User.updateOne(
      { _id: input.residenteUserId, role: "residente" },
      { $set: { "profile.residente.estado": "fuera" } }
    )
  }
  return m.toObject()
}
```

`server/modules/colegios/colegios.routes.ts`:
```ts
import { Router } from "express"
import { asyncHandler } from "../../lib/asyncHandler"
import { requireAuth, requireRole } from "../../middlewares/auth"
import {
  createMovimiento,
  getEdificio,
  getResidente,
  listEdificios,
  listMovimientos,
  listResidentes,
  patchResidente,
} from "./colegios.service"

export const colegiosRoutes = Router()
colegiosRoutes.use(requireAuth, requireRole("adminColegios", "admin"))

colegiosRoutes.get("/edificios", asyncHandler(async (_req, res) => {
  res.json({ data: await listEdificios() })
}))

colegiosRoutes.get("/edificios/:id", asyncHandler(async (req, res) => {
  res.json({ data: await getEdificio(req.params.id) })
}))

colegiosRoutes.get("/residentes", asyncHandler(async (req, res) => {
  const edificioId = typeof req.query.edificioId === "string" ? req.query.edificioId : undefined
  const estado = typeof req.query.estado === "string" ? req.query.estado : undefined
  const search = typeof req.query.search === "string" ? req.query.search : undefined
  res.json({ data: await listResidentes({ edificioId, estado, search }) })
}))

colegiosRoutes.get("/residentes/:id", asyncHandler(async (req, res) => {
  res.json({ data: await getResidente(req.params.id) })
}))

colegiosRoutes.patch("/residentes/:id", asyncHandler(async (req, res) => {
  res.json({ data: await patchResidente(req.params.id, req.body) })
}))

colegiosRoutes.get("/movimientos", asyncHandler(async (req, res) => {
  const residenteId = typeof req.query.residenteId === "string" ? req.query.residenteId : undefined
  const desde = typeof req.query.desde === "string" ? req.query.desde : undefined
  const hasta = typeof req.query.hasta === "string" ? req.query.hasta : undefined
  res.json({ data: await listMovimientos({ residenteId, desde, hasta }) })
}))

colegiosRoutes.post("/movimientos", asyncHandler(async (req, res) => {
  res.status(201).json({ data: await createMovimiento(req.body) })
}))
```

### Task 3 — Mount + KPIs colegios

En `app.ts`:
```ts
import { colegiosRoutes } from "./modules/colegios/colegios.routes"
app.use("/api/colegios", colegiosRoutes)
```

Extender `server/modules/kpis/kpis.routes.ts` añadiendo:
```ts
import { Edificio } from "../colegios/edificio.model"
import { Movimiento } from "../colegios/movimiento.model"
import { User } from "../users/user.model"

kpisRoutes.get(
  "/colegios",
  requireRole("adminColegios", "admin"),
  asyncHandler(async (_req, res) => {
    const startToday = new Date()
    startToday.setHours(0, 0, 0, 0)

    const [edificios, residentesTotal, residentesEnCampus, alertasActivas, movimientosHoy] = await Promise.all([
      Edificio.find().lean(),
      User.countDocuments({ role: "residente" }),
      User.countDocuments({ role: "residente", "profile.residente.estado": "en_campus" }),
      Alerta.countDocuments({ scope: "residencial", estado: "activa" }),
      Movimiento.countDocuments({ hora: { $gte: startToday } }),
    ])

    const capacidadTotal = edificios.reduce((acc, e) => acc + (e.capacidad ?? 0), 0)

    res.json({
      data: {
        residentesTotal,
        residentesEnCampus,
        residentesFuera: residentesTotal - residentesEnCampus,
        capacidadTotal,
        capacidadPct: capacidadTotal === 0 ? 0 : Math.round((residentesEnCampus / capacidadTotal) * 100),
        alertasActivas,
        movimientosHoy,
        edificios: edificios.length,
      },
    })
  })
)
```

> Asegurar que `Alerta` sigue importado al inicio de `kpis.routes.ts` (ya lo está desde Plan 3).

### Task 4 — Seed extendido

Añadir al final de `server/seed.ts` (después del seed iPad):

```ts
import { Edificio } from "./modules/colegios/edificio.model"
import { Movimiento } from "./modules/colegios/movimiento.model"

await Promise.all([
  Edificio.deleteMany({}),
  Movimiento.deleteMany({}),
])

// Edificios
const edificios = await Edificio.insertMany([
  { nombre: "Edificio Cain-Murray", capacidad: 250 },
  { nombre: "Edificio Ray Lindley", capacidad: 200 },
  { nombre: "Residencias Ignacio Bernal", capacidad: 400 },
  { nombre: "Edificio José Gaos", capacidad: 150 },
])

// Admin colegios
const adminColegios = await User.create({
  email: "colegios@udlap.mx", password: "demo1234", role: "adminColegios",
  nombre: "Coordinador", apellido: "Residencias",
  profile: { adminColegios: { edificiosACargo: edificios.map((e) => e._id) } },
})

// Residentes (users con role residente)
const residentesData = [
  { studentId: "158293", nombre: "Alejandro", apellido: "Ramírez", programa: "Ing. en Sistemas", semestre: 6, edif: 0, hab: "Villa I - Hab 204B", estado: "en_campus" },
  { studentId: "161044", nombre: "María José", apellido: "Flores", programa: "Diseño de Información", semestre: 4, edif: 2, hab: "Torre A - Hab 512", estado: "fuera" },
  { studentId: "159382", nombre: "David G.", apellido: "Smith", programa: "Administración de Negocios", semestre: 8, edif: 1, hab: "Villa II - Hab 101C", estado: "en_campus" },
  { studentId: "162271", nombre: "Sarah", apellido: "Williams", programa: "Derecho", semestre: 5, edif: 0, hab: "Villa I - Hab 303A", estado: "invitado" },
  { studentId: "165432", nombre: "Mariana", apellido: "Sosa", programa: "Arquitectura", semestre: 7, edif: 0, hab: "Villa I - Hab 410D", estado: "en_campus" },
  { studentId: "167890", nombre: "Roberto", apellido: "Méndez", programa: "Ing. Industrial", semestre: 9, edif: 2, hab: "Torre B - Hab 207", estado: "en_campus" },
  { studentId: "164221", nombre: "Luisa", apellido: "Ortega", programa: "Psicología", semestre: 3, edif: 3, hab: "Edif. C - Hab 105", estado: "fuera" },
  { studentId: "166543", nombre: "Juan Pablo", apellido: "García", programa: "Computer Science", semestre: 7, edif: 0, hab: "Villa I - Hab 502", estado: "en_campus" },
  { studentId: "168901", nombre: "Andrea", apellido: "Castillo", programa: "Comunicación", semestre: 4, edif: 1, hab: "Villa II - Hab 203A", estado: "fuera" },
  { studentId: "170112", nombre: "Carlos", apellido: "Mendoza", programa: "Mecatrónica", semestre: 5, edif: 3, hab: "Edif. C - Hab 312", estado: "en_campus" },
] as const

const residentes = await User.insertMany(
  residentesData.map((r, i) => ({
    email: `residente${i + 1}@udlap.mx`,
    password: "demo1234",
    role: "residente" as const,
    nombre: r.nombre,
    apellido: r.apellido,
    profile: {
      residente: {
        studentId: r.studentId,
        programa: r.programa,
        semestre: r.semestre,
        edificioId: edificios[r.edif]._id,
        habitacion: r.hab,
        estado: r.estado as any,
      },
    },
  }))
)

// Movimientos recientes
const ahora = Date.now()
await Movimiento.insertMany([
  { residenteUserId: residentes[4]._id, edificioId: edificios[0]._id, hora: new Date(ahora - 15 * 60 * 1000), tipo: "entrada", estado: "normal" },
  { residenteUserId: residentes[5]._id, edificioId: edificios[2]._id, hora: new Date(ahora - 48 * 60 * 1000), tipo: "entrada", estado: "ebriedad" },
  { residenteUserId: residentes[6]._id, edificioId: edificios[3]._id, hora: new Date(ahora - 65 * 60 * 1000), tipo: "salida", estado: "autorizada" },
  { residenteUserId: residentes[0]._id, edificioId: edificios[0]._id, hora: new Date(ahora - 82 * 60 * 1000), tipo: "entrada", estado: "normal" },
  { residenteUserId: residentes[7]._id, edificioId: edificios[0]._id, hora: new Date(ahora - 105 * 60 * 1000), tipo: "salida", estado: "autorizada" },
])

// Alertas residenciales
await Alerta.insertMany([
  { scope: "residencial", tipo: "ebriedad", severidad: "alta", descripcion: "Caso de ebriedad detectado en caseta nocturna", refs: { edificioId: edificios[2]._id, residenteUserId: residentes[5]._id }, timestamp: new Date(ahora - 18 * 60 * 1000), estado: "activa" },
  { scope: "residencial", tipo: "items_prohibidos", severidad: "media", descripcion: "Visitante con vape detectado en Villa I", refs: { edificioId: edificios[0]._id }, timestamp: new Date(ahora - 45 * 60 * 1000), estado: "activa" },
  { scope: "residencial", tipo: "ronda", severidad: "info", descripcion: "Ronda nocturna completada en Ray Lindley", refs: { edificioId: edificios[1]._id }, timestamp: new Date(ahora - 90 * 60 * 1000), estado: "atendida" },
  { scope: "residencial", tipo: "incidente", severidad: "media", descripcion: "Reporte de ruido excesivo en Edif. C", refs: { edificioId: edificios[3]._id }, timestamp: new Date(ahora - 120 * 60 * 1000), estado: "activa" },
])

console.log(`✅ Seed colegios: ${edificios.length} edificios, 1 admin, ${residentes.length} residentes, 5 movimientos, 4 alertas`)
console.log("   - colegios@udlap.mx / demo1234")
```

### Task 5 — Smoke

```bash
TOKEN=$(curl -sS -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"colegios@udlap.mx","password":"demo1234"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['token'])")

for path in /api/colegios/edificios /api/colegios/residentes /api/colegios/movimientos "/api/alertas?scope=residencial" /api/kpis/colegios; do
  echo "--- $path ---"
  curl -sS "http://localhost:4000$path" -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json; d=json.load(sys.stdin)['data']; print('items/data:', len(d) if isinstance(d, list) else d)"
done
```

Esperado: 4 edificios (con `ocupacion` calculada), 10 residentes, 5 movimientos, 4 alertas, KPIs.

---

## Phase B — Frontend

### Task 6 — Hooks

`src/screens/colegios/hooks/useColegiosEdificios.ts`:
```ts
import { useCallback, useEffect, useState } from "react"
import { api } from "@/lib/api"

export function useColegiosEdificios() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const refresh = useCallback(async () => {
    setLoading(true)
    try { setData(await api.get<any[]>("/api/colegios/edificios")) } finally { setLoading(false) }
  }, [])
  useEffect(() => { void refresh() }, [refresh])
  return { data, loading, refresh }
}
```

Hooks análogos para `useColegiosResidentes`, `useColegiosMovimientos`, `useColegiosAlertas` (scope=residencial), `useColegiosVisitas` (filtro `edificioDestinoId`), `useColegiosKpis`.

`useColegiosResidentes.ts`:
```ts
import { useCallback, useEffect, useState } from "react"
import { api } from "@/lib/api"

export function useColegiosResidentes() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const refresh = useCallback(async () => {
    setLoading(true)
    try { setData(await api.get<any[]>("/api/colegios/residentes")) } finally { setLoading(false) }
  }, [])
  useEffect(() => { void refresh() }, [refresh])
  return { data, loading, refresh }
}
```

`useColegiosMovimientos.ts`:
```ts
import { useCallback, useEffect, useState } from "react"
import { api } from "@/lib/api"

export function useColegiosMovimientos() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const refresh = useCallback(async () => {
    setLoading(true)
    try { setData(await api.get<any[]>("/api/colegios/movimientos")) } finally { setLoading(false) }
  }, [])
  useEffect(() => { void refresh() }, [refresh])
  return { data, loading, refresh }
}
```

`useColegiosAlertas.ts`:
```ts
import { useCallback, useEffect, useState } from "react"
import { api } from "@/lib/api"

export function useColegiosAlertas() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const refresh = useCallback(async () => {
    setLoading(true)
    try { setData(await api.get<any[]>("/api/alertas", { scope: "residencial" })) } finally { setLoading(false) }
  }, [])
  useEffect(() => { void refresh() }, [refresh])
  return { data, loading, refresh }
}
```

`useColegiosVisitas.ts`:
```ts
import { useCallback, useEffect, useState } from "react"
import { api } from "@/lib/api"

export function useColegiosVisitas() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      // Todas las visitas (incluso las del estudiante normal); el frontend filtrará por edificioDestinoId
      const all = await api.get<any[]>("/api/visitas")
      setData(all.filter((v) => v.edificioDestinoId))
    } finally { setLoading(false) }
  }, [])
  useEffect(() => { void refresh() }, [refresh])

  const registrar = useCallback(async (input: any) => {
    const visita = await api.post<any>("/api/visitas", input)
    await refresh()
    return visita
  }, [refresh])

  return { data, loading, refresh, registrar }
}
```

`useColegiosKpis.ts`:
```ts
import { useCallback, useEffect, useState } from "react"
import { api } from "@/lib/api"

export function useColegiosKpis() {
  const [data, setData] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const refresh = useCallback(async () => {
    setLoading(true)
    try { setData(await api.get<any>("/api/kpis/colegios")) } finally { setLoading(false) }
  }, [])
  useEffect(() => { void refresh() }, [refresh])
  return { data, loading, refresh }
}
```

### Task 7 — Refactor `ColegiosDataContext` con adapters

Reemplazar el archivo completo. El contrato (`DataValue`) actual incluye `edificios`, `residentes`, `movimientos`, `alertas`, `visitas`, `registrarVisita`, `ultimaVisita`. Mantenerlo y traducir desde Mongo.

```tsx
import { createContext, useContext, useMemo, useState, useCallback, type ReactNode } from "react"
import type { AlertaColegio, Edificio, MovimientoResidente, Residente, Visita } from "../types"
import { useColegiosEdificios } from "../hooks/useColegiosEdificios"
import { useColegiosResidentes } from "../hooks/useColegiosResidentes"
import { useColegiosMovimientos } from "../hooks/useColegiosMovimientos"
import { useColegiosAlertas } from "../hooks/useColegiosAlertas"
import { useColegiosVisitas } from "../hooks/useColegiosVisitas"

interface DataValue {
  edificios: Edificio[]
  residentes: Residente[]
  movimientos: MovimientoResidente[]
  alertas: AlertaColegio[]
  visitas: Visita[]
  registrarVisita(input: Omit<Visita, "id">): Promise<Visita>
  ultimaVisita: Visita | null
  loading: boolean
}

const Ctx = createContext<DataValue | null>(null)

function adaptEdificio(e: any): Edificio {
  return {
    id: String(e._id),
    nombre: e.nombre,
    ocupacion: e.ocupacion ?? 0,
    capacidad: e.capacidad ?? 0,
  }
}

function adaptResidente(u: any): Residente {
  return {
    id: u.profile?.residente?.studentId ?? String(u._id),
    nombre: `${u.nombre} ${u.apellido}`,
    carrera: u.profile?.residente?.programa ?? "",
    semestre: u.profile?.residente?.semestre ?? 1,
    edificio: u.profile?.residente?.edificioId ?? "",
    habitacion: u.profile?.residente?.habitacion ?? "",
    avatar: u.avatar ?? "",
    estado: u.profile?.residente?.estado ?? "fuera",
  }
}

function adaptMovimiento(m: any): MovimientoResidente {
  const d = new Date(m.hora)
  return {
    id: String(m._id),
    residenteId: String(m.residenteUserId),
    edificioId: String(m.edificioId),
    hora: d.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", hour12: false }),
    tipo: m.tipo,
    estado: m.estado,
  }
}

function adaptAlerta(a: any): AlertaColegio {
  // Map server severidad to legacy enum (alta/media/info)
  const severidadMap: Record<string, AlertaColegio["severidad"]> = {
    critica: "alta",
    alta: "alta",
    moderada: "media",
    media: "media",
    info: "info",
  }
  return {
    id: String(a._id),
    edificioId: a.refs?.edificioId,
    residenteId: a.refs?.residenteUserId,
    tipo: a.tipo as AlertaColegio["tipo"],
    severidad: severidadMap[a.severidad] ?? "info",
    descripcion: a.descripcion,
    timestamp: a.timestamp,
    estado: a.estado,
  }
}

function adaptVisita(v: any): Visita {
  return {
    id: String(v._id),
    nombreCompleto: v.invitado?.nombre ?? "",
    categoria: v.invitado?.categoria ?? "comunidad_udlap",
    tipoAcceso: v.tipoAcceso,
    edificioDestinoId: String(v.edificioDestinoId ?? ""),
    fechaHora: v.fechaHora,
    multipleEntrada: v.multiplesEntradas ?? false,
    comentarios: v.comentarios,
    foto: v.invitado?.foto,
    tipoId: v.invitado?.tipoId ?? "",
    estatusVisitante: v.estatusVisitante ?? "sin_antecedentes",
    ubicacionEntrada: v.puntoAcceso ?? "",
  }
}

export function ColegiosDataProvider({ children }: { children: ReactNode }) {
  const edHook = useColegiosEdificios()
  const resHook = useColegiosResidentes()
  const movHook = useColegiosMovimientos()
  const alHook = useColegiosAlertas()
  const visHook = useColegiosVisitas()

  const [ultima, setUltima] = useState<Visita | null>(null)

  const registrar = useCallback(async (input: Omit<Visita, "id">): Promise<Visita> => {
    // Convertir el formato legacy al formato del backend
    const payload = {
      invitado: {
        nombre: input.nombreCompleto,
        categoria: input.categoria,
        tipoId: input.tipoId,
        foto: input.foto,
      },
      tipoAcceso: input.tipoAcceso,
      puntoAcceso: input.ubicacionEntrada,
      fechaHora: input.fechaHora,
      multiplesEntradas: input.multipleEntrada,
      comentarios: input.comentarios,
      edificioDestinoId: input.edificioDestinoId,
    }
    const created = await visHook.registrar(payload)
    const adapted = adaptVisita(created)
    setUltima(adapted)
    return adapted
  }, [visHook])

  const value = useMemo<DataValue>(() => ({
    edificios: edHook.data.map(adaptEdificio),
    residentes: resHook.data.map(adaptResidente),
    movimientos: movHook.data.map(adaptMovimiento),
    alertas: alHook.data.map(adaptAlerta),
    visitas: visHook.data.map(adaptVisita),
    ultimaVisita: ultima,
    registrarVisita: registrar,
    loading: edHook.loading || resHook.loading,
  }), [edHook, resHook, movHook, alHook, visHook, ultima, registrar])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useColegiosData(): DataValue {
  const v = useContext(Ctx)
  if (!v) throw new Error("useColegiosData fuera de ColegiosDataProvider")
  return v
}
```

> **Nota sobre `Residente.edificio`:** los screens usan `r.edificio` como string del nombre del edificio, no del id. Para no romper, este adapter pone el `edificioId` en `Residente.edificio`. **Si las screens dependen del nombre del edificio**, hay que pasarles el mapa edificio_id → nombre. Revisar las screens y ajustar:

> **Si una screen usa `r.edificio` como nombre legible**, pásale `edificios.find(e => e.id === r.edificio)?.nombre`. Pero como muchas screens hacen `Array.from(new Set(residentes.map(r => r.edificio)))`, ya no funcionará si son IDs. **Solución más sencilla:** en `adaptResidente` calcular el nombre del edificio buscándolo en `edHook.data`. Pero `adaptResidente` no tiene acceso. Refactorizar:

Mejor versión:
```tsx
function makeAdaptResidente(edificiosById: Map<string, string>) {
  return (u: any): Residente => {
    const edId = String(u.profile?.residente?.edificioId ?? "")
    return {
      id: u.profile?.residente?.studentId ?? String(u._id),
      nombre: `${u.nombre} ${u.apellido}`,
      carrera: u.profile?.residente?.programa ?? "",
      semestre: u.profile?.residente?.semestre ?? 1,
      edificio: edificiosById.get(edId) ?? "",
      habitacion: u.profile?.residente?.habitacion ?? "",
      avatar: u.avatar ?? "",
      estado: u.profile?.residente?.estado ?? "fuera",
    }
  }
}
```

Y en el `useMemo` del provider:
```tsx
const edificiosById = new Map(edHook.data.map((e: any) => [String(e._id), e.nombre]))
const adaptR = makeAdaptResidente(edificiosById)
// ...
residentes: resHook.data.map(adaptR),
```

### Task 8 — `ColegiosSessionContext`: usar `useAuth()`

```tsx
import { createContext, useContext, useMemo, type ReactNode } from "react"
import type { Officer } from "../types"
import { useAuth } from "@/lib/auth-store"

interface SessionValue {
  officer: Officer
  officers: Officer[]
  setOfficer(id: string): void
}

const Ctx = createContext<SessionValue | null>(null)

const FALLBACK_OFFICER: Officer = {
  id: "OF-COL-FALLBACK",
  nombre: "Operador Colegios",
  turno: "Nocturno",
  avatar: "",
  gate: "Caseta Principal",
}

export function ColegiosSessionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()

  const officer: Officer = useMemo(() => {
    if (!user) return FALLBACK_OFFICER
    return {
      id: user.id,
      nombre: `${user.nombre} ${user.apellido}`,
      turno: "Nocturno",
      avatar: user.avatar ?? "",
      gate: "Caseta Principal",
    }
  }, [user])

  const value = useMemo<SessionValue>(() => ({
    officer,
    officers: [officer],
    setOfficer: () => { /* no-op: solo hay uno */ },
  }), [officer])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useColegiosSession(): SessionValue {
  const v = useContext(Ctx)
  if (!v) throw new Error("useColegiosSession fuera de ColegiosSessionProvider")
  return v
}
```

### Task 9 — App.tsx: proteger `/colegios/*`

Reemplazar el bloque `/colegios`:
```tsx
{/* ── Colegios login = email login ──────── */}
{/* (no se necesita pantalla aparte: el flow de login móvil ya devuelve adminColegios y el RequireAuth redirige) */}

<Route path="/colegios" element={
  <RequireAuth role={["adminColegios", "admin"]} loginPath="/colegios/login">
    <ColegiosLayout />
  </RequireAuth>
}>
  <Route index element={<Navigate to="/colegios/dashboard" replace />} />
  ...
</Route>

<Route path="/colegios/login" element={<ColegiosLoginScreen />} />
```

Crear `src/screens/colegios/LoginScreen.tsx` (similar al móvil):
```tsx
import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/lib/auth-store"
import { ApiError } from "@/lib/api"

export function ColegiosLoginScreen() {
  const navigate = useNavigate()
  const { login, user } = useAuth()
  const [email, setEmail] = useState("colegios@udlap.mx")
  const [password, setPassword] = useState("demo1234")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user?.role === "adminColegios" || user?.role === "admin") {
      navigate("/colegios", { replace: true })
    }
  }, [user, navigate])

  const submit = async () => {
    setSubmitting(true); setError(null)
    try {
      await login(email.trim().toLowerCase(), password)
      navigate("/colegios", { replace: true })
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Error")
    } finally { setSubmitting(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <Link to="/" className="absolute top-6 left-6 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900">
        <ArrowLeft className="size-4" /> Volver al selector
      </Link>
      <div className="w-full max-w-sm bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h1 className="text-xl font-black text-slate-900 mb-1 text-center">Colegios Residenciales</h1>
        <p className="text-sm text-slate-500 mb-5 text-center">Ingreso del coordinador</p>
        <form onSubmit={(e) => { e.preventDefault(); if (!submitting) void submit() }} className="space-y-3">
          <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="correo" type="email" required />
          <Input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="contraseña" type="password" required />
          {error && <div className="text-xs text-red-600">{error}</div>}
          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? "Ingresando…" : "Ingresar"}
          </Button>
        </form>
        <p className="text-[11px] text-center text-slate-400 mt-4">Demo: colegios@udlap.mx / demo1234</p>
      </div>
    </div>
  )
}
```

### Task 10 — Cambios menores en pantallas

Las 9 screens consumen `useColegiosData()` con la misma forma. **No cambiar las screens** salvo que el adapter rompa algo. Verificar:
- `DashboardScreen` consume `kpis` directamente — si lo hace, **revisar**: el contexto legacy NO tenía `kpis` expuesto. Si una pantalla los pide, hay que añadirlos al contexto. Ver el archivo y decidir.
- `RegistrarVisitaScreen` llama `registrarVisita(input)` con la forma legacy. El adapter del provider ya hace la conversión.

Si alguna screen consume `kpis`:
- Añadir `kpis: KpiResult` al `DataValue` y `useColegiosKpis()` adentro.
- Importar el shape esperado por la screen y mapear desde el endpoint.

### Task 11 — Build + smoke

`npm run build`. Smoke con `curl` a `/colegios/login` y `/colegios/dashboard`.

---

## Self-Review

- ✅ Sección 4.8 (Edificio): Task 1
- ✅ Sección 4.9 (MovimientoResidente): Task 1
- ✅ Sección 5.6 (Colegios endpoints): Tasks 2-3
- ✅ Sección 5.11 (KPIs colegios): Task 3
- ✅ Frontend: hooks, contexto adaptado, login, RequireAuth: Tasks 6-9
- ✅ Una sola colección `alertas` con scope: ya implementado en Plan 3, reusada aquí

Cosas a vigilar durante implementación:
- `Residente.edificio` debe ser **nombre legible** en el adapter (revisar uso en screens).
- Si alguna screen rompe por shape diferente, ajustar el adapter, no la screen.
