# Plan 2 — Móvil completo (Perfil, Horario, Comedor, Biblioteca)

> **No git commits.** Mismo principio del Plan 1.

**Goal:** Cablear las 4 pantallas restantes de la app móvil contra backend real, con sus modelos y endpoints. Al terminar: el estudiante puede editar perfil + avatar, ver su horario, comprar en comedor descontando saldo, y prestar/desear libros.

**Architecture:** Mismo patrón que Plan 1 — Mongoose models por dominio, rutas Express con zod, hooks de frontend `useX()` con `{ data, loading, error, refresh, ...mutations }`.

**Tech stack:** Igual que Plan 1.

**Spec base:** `docs/superpowers/specs/2026-04-28-accesos-udlap-backend-design.md`

---

## File structure (delta sobre lo que existe)

### Backend nuevo

| Path | Responsabilidad |
|------|-----------------|
| `server/modules/users/users.routes.ts` | `PATCH /api/users/me`, `POST /api/users/me/avatar` |
| `server/modules/horario/clase.model.ts` | Schema `Clase` |
| `server/modules/horario/horario.routes.ts` | `GET /api/horario` |
| `server/modules/comedor/menuItem.model.ts` | Schema `MenuItem` |
| `server/modules/comedor/orden.model.ts` | Schema `OrdenComedor` |
| `server/modules/comedor/comedor.service.ts` | Lógica de orden con descuento de saldo |
| `server/modules/comedor/comedor.routes.ts` | `/api/comedor/menu`, `/api/comedor/ordenes` |
| `server/modules/biblioteca/libro.model.ts` | Schema `Libro` |
| `server/modules/biblioteca/prestamo.model.ts` | Schema `PrestamoBiblioteca` |
| `server/modules/biblioteca/deseo.model.ts` | Schema `DeseoBiblioteca` |
| `server/modules/biblioteca/biblioteca.service.ts` | Préstamos + deseos |
| `server/modules/biblioteca/biblioteca.routes.ts` | `/api/biblioteca/*` |

### Frontend nuevo (hooks)

| Path | Responsabilidad |
|------|-----------------|
| `src/screens/movil/hooks/useHorario.ts` | clases del estudiante |
| `src/screens/movil/hooks/useComedor.ts` | menú + crear orden + saldo |
| `src/screens/movil/hooks/useBiblioteca.ts` | libros + préstamos + deseos |
| `src/screens/movil/hooks/usePerfil.ts` | editar user + avatar |

### Modificados

- `server/app.ts` — montar 4 nuevos routers
- `server/seed.ts` — extender con clases, menú, libros para el estudiante demo
- `src/screens/movil/PerfilScreen.tsx`, `HorarioScreen.tsx`, `ComedorScreen.tsx`, `BibliotecaScreen.tsx`

---

## Phase A — Modelos + endpoints + seed extendido

### Task 1 — `Clase` model + ruta + seed

`server/modules/horario/clase.model.ts`:
```ts
import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose"

const claseSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    dia: { type: Number, min: 0, max: 5, required: true }, // 0=Lu ... 5=Sá
    inicio: { type: Number, required: true }, // hora decimal: 7.5 = 7:30
    fin: { type: Number, required: true },
    materia: { type: String, required: true },
    salon: { type: String, required: true },
    periodo: { type: String, default: "OT26" },
  },
  { timestamps: true }
)

export type ClaseDoc = InferSchemaType<typeof claseSchema> & { _id: unknown }
export const Clase: Model<ClaseDoc> =
  (mongoose.models.Clase as Model<ClaseDoc>) ||
  mongoose.model<ClaseDoc>("Clase", claseSchema)
```

`server/modules/horario/horario.routes.ts`:
```ts
import { Router } from "express"
import { asyncHandler } from "../../lib/asyncHandler"
import { requireAuth } from "../../middlewares/auth"
import { Clase } from "./clase.model"

export const horarioRoutes = Router()
horarioRoutes.use(requireAuth)

horarioRoutes.get(
  "/",
  asyncHandler(async (req, res) => {
    const clases = await Clase.find({ userId: req.user._id })
      .sort({ dia: 1, inicio: 1 })
      .lean()
    res.json({ data: clases })
  })
)
```

Mount in `server/app.ts`:
```ts
import { horarioRoutes } from "./modules/horario/horario.routes"
// ...
app.use("/api/horario", horarioRoutes)
```

### Task 2 — `MenuItem`, `OrdenComedor`, comedor service + routes

`server/modules/comedor/menuItem.model.ts`:
```ts
import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose"

const menuItemSchema = new Schema(
  {
    nombre: { type: String, required: true },
    precio: { type: Number, required: true, min: 0 },
    descripcion: String,
    categoria: {
      type: String,
      enum: ["principal", "economico", "vegano"],
      required: true,
    },
    emoji: String,
    disponible: { type: Boolean, default: true },
    fecha: { type: Date, default: () => new Date(), index: true },
  },
  { timestamps: true }
)

export type MenuItemDoc = InferSchemaType<typeof menuItemSchema> & { _id: unknown }
export const MenuItem: Model<MenuItemDoc> =
  (mongoose.models.MenuItem as Model<MenuItemDoc>) ||
  mongoose.model<MenuItemDoc>("MenuItem", menuItemSchema)
```

`server/modules/comedor/orden.model.ts`:
```ts
import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose"

const ordenSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    items: [
      {
        menuItemId: { type: Schema.Types.ObjectId, ref: "MenuItem", required: true },
        cantidad: { type: Number, required: true, min: 1 },
        precioUnit: { type: Number, required: true },
        nombre: { type: String, required: true },
      },
    ],
    total: { type: Number, required: true },
    fecha: { type: Date, default: () => new Date() },
    estado: { type: String, enum: ["pagada", "cancelada"], default: "pagada" },
  },
  { timestamps: true }
)

export type OrdenDoc = InferSchemaType<typeof ordenSchema> & { _id: unknown }
export const Orden: Model<OrdenDoc> =
  (mongoose.models.OrdenComedor as Model<OrdenDoc>) ||
  mongoose.model<OrdenDoc>("OrdenComedor", ordenSchema)
```

`server/modules/comedor/comedor.service.ts`:
```ts
import { z } from "zod"
import { ApiError } from "../../lib/errors"
import { User } from "../users/user.model"
import { MenuItem } from "./menuItem.model"
import { Orden } from "./orden.model"

const createOrdenInput = z.object({
  items: z
    .array(
      z.object({
        menuItemId: z.string().min(1),
        cantidad: z.number().int().positive(),
      })
    )
    .min(1),
})

export async function listMenu(filter: { categoria?: string }) {
  const q: Record<string, unknown> = { disponible: true }
  if (filter.categoria) q.categoria = filter.categoria
  return MenuItem.find(q).sort({ categoria: 1, nombre: 1 }).lean()
}

export async function createOrden(userId: string, raw: unknown) {
  const input = createOrdenInput.parse(raw)
  const ids = input.items.map((i) => i.menuItemId)
  const items = await MenuItem.find({ _id: { $in: ids }, disponible: true })
  if (items.length !== ids.length) {
    throw new ApiError("VALIDATION", "Uno o más items no existen o están agotados")
  }

  const itemsById = new Map(items.map((it) => [String(it._id), it]))
  const ordenItems = input.items.map((line) => {
    const it = itemsById.get(line.menuItemId)!
    return {
      menuItemId: it._id,
      cantidad: line.cantidad,
      precioUnit: it.precio,
      nombre: it.nombre,
    }
  })
  const total = ordenItems.reduce(
    (acc, l) => acc + l.precioUnit * l.cantidad,
    0
  )

  const user = await User.findById(userId)
  if (!user) throw new ApiError("UNAUTHORIZED", "Usuario no encontrado")
  const saldo = user.profile?.estudiante?.saldoComedor ?? 0
  if (saldo < total) {
    throw new ApiError("VALIDATION", `Saldo insuficiente: $${saldo} disponible, $${total} requerido`)
  }

  // Descuenta saldo y crea la orden
  if (user.profile?.estudiante) {
    user.profile.estudiante.saldoComedor = saldo - total
    await user.save()
  } else {
    throw new ApiError("FORBIDDEN", "Solo estudiantes pueden ordenar comedor")
  }

  const orden = await Orden.create({
    userId,
    items: ordenItems,
    total,
  })

  return {
    orden: orden.toObject(),
    saldoRestante: user.profile.estudiante.saldoComedor,
  }
}

export async function listOrdenes(userId: string) {
  return Orden.find({ userId }).sort({ fecha: -1 }).lean()
}
```

`server/modules/comedor/comedor.routes.ts`:
```ts
import { Router } from "express"
import { asyncHandler } from "../../lib/asyncHandler"
import { requireAuth, requireRole } from "../../middlewares/auth"
import { createOrden, listMenu, listOrdenes } from "./comedor.service"

export const comedorRoutes = Router()

comedorRoutes.get(
  "/menu",
  requireAuth,
  asyncHandler(async (req, res) => {
    const categoria = typeof req.query.categoria === "string" ? req.query.categoria : undefined
    const items = await listMenu({ categoria })
    res.json({ data: items })
  })
)

comedorRoutes.post(
  "/ordenes",
  requireAuth,
  requireRole("estudiante", "residente", "admin"),
  asyncHandler(async (req, res) => {
    const result = await createOrden(String(req.user._id), req.body)
    res.status(201).json({ data: result })
  })
)

comedorRoutes.get(
  "/ordenes",
  requireAuth,
  asyncHandler(async (req, res) => {
    const items = await listOrdenes(String(req.user._id))
    res.json({ data: items })
  })
)
```

Mount in `app.ts`:
```ts
import { comedorRoutes } from "./modules/comedor/comedor.routes"
app.use("/api/comedor", comedorRoutes)
```

### Task 3 — Biblioteca: Libro, Prestamo, Deseo + service + routes

`server/modules/biblioteca/libro.model.ts`:
```ts
import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose"

const libroSchema = new Schema(
  {
    titulo: { type: String, required: true, index: true },
    autor: { type: String, required: true },
    isbn: String,
    cover: String, // emoji o base64
    totalCopias: { type: Number, default: 1 },
    copiasDisponibles: { type: Number, default: 1 },
  },
  { timestamps: true }
)

export type LibroDoc = InferSchemaType<typeof libroSchema> & { _id: unknown }
export const Libro: Model<LibroDoc> =
  (mongoose.models.Libro as Model<LibroDoc>) ||
  mongoose.model<LibroDoc>("Libro", libroSchema)
```

`server/modules/biblioteca/prestamo.model.ts`:
```ts
import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose"

const prestamoSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    libroId: { type: Schema.Types.ObjectId, ref: "Libro", required: true },
    fechaPrestamo: { type: Date, default: () => new Date() },
    fechaVencimiento: { type: Date, required: true },
    fechaDevolucion: Date,
    estado: { type: String, enum: ["activo", "devuelto", "vencido"], default: "activo" },
  },
  { timestamps: true }
)
prestamoSchema.index({ userId: 1, estado: 1 })

export type PrestamoDoc = InferSchemaType<typeof prestamoSchema> & { _id: unknown }
export const Prestamo: Model<PrestamoDoc> =
  (mongoose.models.PrestamoBiblioteca as Model<PrestamoDoc>) ||
  mongoose.model<PrestamoDoc>("PrestamoBiblioteca", prestamoSchema)
```

`server/modules/biblioteca/deseo.model.ts`:
```ts
import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose"

const deseoSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    libroId: { type: Schema.Types.ObjectId, ref: "Libro", required: true },
    fechaAgregado: { type: Date, default: () => new Date() },
  },
  { timestamps: true }
)
deseoSchema.index({ userId: 1, libroId: 1 }, { unique: true })

export type DeseoDoc = InferSchemaType<typeof deseoSchema> & { _id: unknown }
export const Deseo: Model<DeseoDoc> =
  (mongoose.models.DeseoBiblioteca as Model<DeseoDoc>) ||
  mongoose.model<DeseoDoc>("DeseoBiblioteca", deseoSchema)
```

`server/modules/biblioteca/biblioteca.service.ts`:
```ts
import { z } from "zod"
import { ApiError } from "../../lib/errors"
import { Libro } from "./libro.model"
import { Prestamo } from "./prestamo.model"
import { Deseo } from "./deseo.model"

export async function listLibros(filter: { search?: string; disponibles?: boolean }) {
  const q: Record<string, unknown> = {}
  if (filter.search) {
    const re = new RegExp(filter.search, "i")
    q.$or = [{ titulo: re }, { autor: re }]
  }
  if (filter.disponibles) {
    q.copiasDisponibles = { $gt: 0 }
  }
  return Libro.find(q).sort({ titulo: 1 }).limit(50).lean()
}

const prestarInput = z.object({ libroId: z.string().min(1) })

export async function crearPrestamo(userId: string, raw: unknown) {
  const { libroId } = prestarInput.parse(raw)
  const libro = await Libro.findById(libroId)
  if (!libro) throw new ApiError("NOT_FOUND", "Libro no existe")
  if (libro.copiasDisponibles <= 0) {
    throw new ApiError("CONFLICT", "No hay copias disponibles")
  }
  // Vence en 14 días
  const fechaVencimiento = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
  libro.copiasDisponibles -= 1
  await libro.save()
  const prestamo = await Prestamo.create({ userId, libroId, fechaVencimiento })
  return prestamo.toObject()
}

export async function devolverPrestamo(userId: string, id: string) {
  const prestamo = await Prestamo.findOne({ _id: id, userId })
  if (!prestamo) throw new ApiError("NOT_FOUND", "Préstamo no encontrado")
  if (prestamo.estado === "devuelto") {
    return prestamo.toObject()
  }
  prestamo.estado = "devuelto"
  prestamo.fechaDevolucion = new Date()
  await prestamo.save()
  await Libro.updateOne(
    { _id: prestamo.libroId },
    { $inc: { copiasDisponibles: 1 } }
  )
  return prestamo.toObject()
}

export async function listPrestamos(userId: string) {
  const items = await Prestamo.find({ userId }).sort({ fechaPrestamo: -1 }).lean()
  // attach libro snippet
  const libroIds = items.map((p) => p.libroId)
  const libros = await Libro.find({ _id: { $in: libroIds } }).lean()
  const libroMap = new Map(libros.map((l) => [String(l._id), l]))
  return items.map((p) => ({ ...p, libro: libroMap.get(String(p.libroId)) ?? null }))
}

export async function agregarDeseo(userId: string, raw: unknown) {
  const { libroId } = prestarInput.parse(raw)
  const libro = await Libro.findById(libroId)
  if (!libro) throw new ApiError("NOT_FOUND", "Libro no existe")
  try {
    const d = await Deseo.create({ userId, libroId })
    return d.toObject()
  } catch (err: any) {
    if (err?.code === 11000) {
      throw new ApiError("CONFLICT", "Ya está en tu lista de deseos")
    }
    throw err
  }
}

export async function eliminarDeseo(userId: string, id: string) {
  const r = await Deseo.deleteOne({ _id: id, userId })
  if (r.deletedCount === 0) throw new ApiError("NOT_FOUND", "Deseo no encontrado")
}

export async function listDeseos(userId: string) {
  const items = await Deseo.find({ userId }).sort({ fechaAgregado: -1 }).lean()
  const libroIds = items.map((d) => d.libroId)
  const libros = await Libro.find({ _id: { $in: libroIds } }).lean()
  const libroMap = new Map(libros.map((l) => [String(l._id), l]))
  return items.map((d) => ({ ...d, libro: libroMap.get(String(d.libroId)) ?? null }))
}
```

`server/modules/biblioteca/biblioteca.routes.ts`:
```ts
import { Router } from "express"
import { asyncHandler } from "../../lib/asyncHandler"
import { requireAuth } from "../../middlewares/auth"
import {
  agregarDeseo,
  crearPrestamo,
  devolverPrestamo,
  eliminarDeseo,
  listDeseos,
  listLibros,
  listPrestamos,
} from "./biblioteca.service"

export const bibliotecaRoutes = Router()
bibliotecaRoutes.use(requireAuth)

bibliotecaRoutes.get(
  "/libros",
  asyncHandler(async (req, res) => {
    const search = typeof req.query.search === "string" ? req.query.search : undefined
    const disponibles = req.query.disponibles === "true"
    const items = await listLibros({ search, disponibles })
    res.json({ data: items })
  })
)

bibliotecaRoutes.post(
  "/prestamos",
  asyncHandler(async (req, res) => {
    const p = await crearPrestamo(String(req.user._id), req.body)
    res.status(201).json({ data: p })
  })
)

bibliotecaRoutes.patch(
  "/prestamos/:id",
  asyncHandler(async (req, res) => {
    const p = await devolverPrestamo(String(req.user._id), req.params.id)
    res.json({ data: p })
  })
)

bibliotecaRoutes.get(
  "/prestamos",
  asyncHandler(async (req, res) => {
    const items = await listPrestamos(String(req.user._id))
    res.json({ data: items })
  })
)

bibliotecaRoutes.post(
  "/deseos",
  asyncHandler(async (req, res) => {
    const d = await agregarDeseo(String(req.user._id), req.body)
    res.status(201).json({ data: d })
  })
)

bibliotecaRoutes.delete(
  "/deseos/:id",
  asyncHandler(async (req, res) => {
    await eliminarDeseo(String(req.user._id), req.params.id)
    res.status(204).end()
  })
)

bibliotecaRoutes.get(
  "/deseos",
  asyncHandler(async (req, res) => {
    const items = await listDeseos(String(req.user._id))
    res.json({ data: items })
  })
)
```

Mount in `app.ts`:
```ts
import { bibliotecaRoutes } from "./modules/biblioteca/biblioteca.routes"
app.use("/api/biblioteca", bibliotecaRoutes)
```

### Task 4 — Users routes (PATCH me + avatar)

`server/modules/users/users.routes.ts`:
```ts
import { Router } from "express"
import { z } from "zod"
import { asyncHandler } from "../../lib/asyncHandler"
import { requireAuth } from "../../middlewares/auth"
import { ApiError } from "../../lib/errors"
import { User } from "./user.model"
import { serializeUser } from "../auth/auth.service"

export const usersRoutes = Router()
usersRoutes.use(requireAuth)

const patchMeInput = z.object({
  nombre: z.string().min(1).optional(),
  apellido: z.string().min(1).optional(),
  telefono: z.string().optional().nullable(),
  profile: z.record(z.string(), z.any()).optional(),
})

usersRoutes.patch(
  "/me",
  asyncHandler(async (req, res) => {
    const input = patchMeInput.parse(req.body)
    const updated = await User.findByIdAndUpdate(
      req.user._id,
      { $set: input },
      { new: true }
    )
    if (!updated) throw new ApiError("NOT_FOUND", "Usuario no encontrado")
    res.json({ data: { user: serializeUser(updated) } })
  })
)

const avatarInput = z.object({
  base64: z.string().startsWith("data:image/"),
})

usersRoutes.post(
  "/me/avatar",
  asyncHandler(async (req, res) => {
    const { base64 } = avatarInput.parse(req.body)
    if (base64.length > 600_000) {
      throw new ApiError("VALIDATION", "Imagen muy grande (>450KB tras base64)")
    }
    const updated = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { avatar: base64 } },
      { new: true }
    )
    if (!updated) throw new ApiError("NOT_FOUND", "Usuario no encontrado")
    res.json({ data: { user: serializeUser(updated) } })
  })
)
```

Mount in `app.ts`:
```ts
import { usersRoutes } from "./modules/users/users.routes"
app.use("/api/users", usersRoutes)
```

### Task 5 — Extender seed con datos de comedor / biblioteca / horario

Editar `server/seed.ts`. Después de crear los 3 usuarios actuales, añadir:

```ts
import { Clase } from "./modules/horario/clase.model"
import { MenuItem } from "./modules/comedor/menuItem.model"
import { Libro } from "./modules/biblioteca/libro.model"
import { Prestamo } from "./modules/biblioteca/prestamo.model"
```

Antes del `console.log` final, agregar:

```ts
// ---- Limpiar y sembrar comedor / biblioteca / horario ----
await Promise.all([
  Clase.deleteMany({}),
  MenuItem.deleteMany({}),
  Libro.deleteMany({}),
  Prestamo.deleteMany({}),
])

const estudiante = await User.findOne({ email: "estudiante@udlap.mx" })
if (!estudiante) throw new Error("Estudiante demo no creado")
const studentId = estudiante._id

// Horario semanal del estudiante demo
await Clase.insertMany([
  { userId: studentId, dia: 0, inicio: 7, fin: 8.5, materia: "Cálculo Integral", salon: "CF301" },
  { userId: studentId, dia: 0, inicio: 9, fin: 10, materia: "Física II", salon: "CF201" },
  { userId: studentId, dia: 0, inicio: 11, fin: 12.5, materia: "Programación", salon: "CH105" },
  { userId: studentId, dia: 0, inicio: 14, fin: 15, materia: "Inglés B2", salon: "EI201" },
  { userId: studentId, dia: 1, inicio: 13, fin: 14, materia: "Ética Prof.", salon: "HM302" },
  { userId: studentId, dia: 1, inicio: 14, fin: 15, materia: "Estadística", salon: "CF402" },
  { userId: studentId, dia: 1, inicio: 16, fin: 17.5, materia: "Lab Física", salon: "LF101" },
  { userId: studentId, dia: 2, inicio: 7, fin: 8, materia: "Cálculo Integral", salon: "CF301" },
  { userId: studentId, dia: 2, inicio: 9, fin: 10, materia: "Física II", salon: "CF201" },
  { userId: studentId, dia: 2, inicio: 11, fin: 12.5, materia: "Programación", salon: "CH105" },
  { userId: studentId, dia: 2, inicio: 14, fin: 15, materia: "Inglés B2", salon: "EI201" },
  { userId: studentId, dia: 3, inicio: 13, fin: 14.5, materia: "Ética Prof.", salon: "HM302" },
  { userId: studentId, dia: 3, inicio: 16, fin: 17.5, materia: "Estadística", salon: "CF402" },
  { userId: studentId, dia: 4, inicio: 8, fin: 9.5, materia: "Lab Programación", salon: "CH102" },
  { userId: studentId, dia: 5, inicio: 8, fin: 9.5, materia: "Tutoría", salon: "DF201" },
])

// Menú de comedor
await MenuItem.insertMany([
  { nombre: "Bowl Mediterráneo", precio: 95, descripcion: "Quinoa, garbanzos, pepino, tomate cherry", categoria: "principal", emoji: "🥗" },
  { nombre: "Ensalada del Chef", precio: 63, descripcion: "Lechuga mixta, pollo a la plancha, aderezo cesar", categoria: "economico", emoji: "🥙" },
  { nombre: "Crema de Tomate", precio: 45, descripcion: "Sopa crema con crutones y albahaca fresca", categoria: "vegano", emoji: "🍲" },
  { nombre: "Pollo a la Plancha", precio: 85, descripcion: "Con arroz integral y verduras al vapor", categoria: "principal", emoji: "🍗" },
  { nombre: "Agua de Jamaica", precio: 25, descripcion: "500 ml, sin azúcar añadida", categoria: "economico", emoji: "🧃" },
  { nombre: "Tazón Vegano", precio: 90, descripcion: "Tofu salteado, edamame, arroz", categoria: "vegano", emoji: "🥒" },
  { nombre: "Hamburguesa UDLAP", precio: 110, descripcion: "Carne 150g, queso, papas", categoria: "principal", emoji: "🍔" },
  { nombre: "Smoothie Verde", precio: 55, descripcion: "Espinaca, plátano, manzana", categoria: "vegano", emoji: "🥤" },
])

// Libros (cover con emoji, simple)
const libros = await Libro.insertMany([
  { titulo: "Sistemas Operativos Modernos", autor: "Andrew S. Tanenbaum", cover: "📘", totalCopias: 3, copiasDisponibles: 2 },
  { titulo: "Cálculo Integral", autor: "James Stewart", cover: "📗", totalCopias: 2, copiasDisponibles: 1 },
  { titulo: "Artificial Intelligence: A Modern Approach", autor: "Stuart Russell", cover: "📙", totalCopias: 2, copiasDisponibles: 2 },
  { titulo: "Architecture Design Patterns", autor: "Martin Fowler", cover: "📕", totalCopias: 1, copiasDisponibles: 1 },
  { titulo: "C++ Programming Language", autor: "Bjarne Stroustrup", cover: "📓", totalCopias: 2, copiasDisponibles: 2 },
  { titulo: "Clean Code", autor: "Robert C. Martin", cover: "📔", totalCopias: 3, copiasDisponibles: 3 },
  { titulo: "Domain-Driven Design", autor: "Eric Evans", cover: "📒", totalCopias: 1, copiasDisponibles: 1 },
])

// Crear 2 préstamos activos para el estudiante demo
await Prestamo.insertMany([
  {
    userId: studentId,
    libroId: libros[0]._id,
    fechaPrestamo: new Date(),
    fechaVencimiento: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
  },
  {
    userId: studentId,
    libroId: libros[1]._id,
    fechaPrestamo: new Date(),
    fechaVencimiento: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
  },
])

console.log(`✅ Seed extendido: ${15} clases, ${8} ítems comedor, ${libros.length} libros, 2 préstamos`)
```

### Task 6 — Smoke tests del backend

Levantar `npm run dev:api` y probar:
```bash
TOKEN=$(curl -sS -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"estudiante@udlap.mx","password":"demo1234"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['token'])")

echo "--- Horario ---"
curl -sS http://localhost:4000/api/horario -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json; print('clases:', len(json.load(sys.stdin)['data']))"

echo "--- Menú comedor ---"
curl -sS http://localhost:4000/api/comedor/menu -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json; print('items:', len(json.load(sys.stdin)['data']))"

echo "--- Libros ---"
curl -sS http://localhost:4000/api/biblioteca/libros -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json; print('libros:', len(json.load(sys.stdin)['data']))"

echo "--- Préstamos del estudiante ---"
curl -sS http://localhost:4000/api/biblioteca/prestamos -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json; print('prestamos:', len(json.load(sys.stdin)['data']))"

echo "--- Crear orden con saldo suficiente ---"
MENU_FIRST=$(curl -sS http://localhost:4000/api/comedor/menu -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json; print(json.load(sys.stdin)['data'][0]['_id'])")
curl -sS -X POST http://localhost:4000/api/comedor/ordenes \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"items\":[{\"menuItemId\":\"$MENU_FIRST\",\"cantidad\":1}]}"
echo

echo "--- /me debe reflejar saldo descontado ---"
curl -sS http://localhost:4000/api/auth/me -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json; print('saldo:', json.load(sys.stdin)['data']['user']['profile']['estudiante']['saldoComedor'])"

echo "--- PATCH /me cambia teléfono ---"
curl -sS -X PATCH http://localhost:4000/api/users/me \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"telefono":"222-9999999"}'
echo
```

Esperado: counts > 0, orden creada con saldo descontado, /me refleja telefono nuevo y saldo menor.

---

## Phase B — Hooks de frontend

### Task 7 — `useHorario.ts`

```ts
import { useCallback, useEffect, useState } from "react"
import { api } from "@/lib/api"

export interface Clase {
  _id: string
  dia: number
  inicio: number
  fin: number
  materia: string
  salon: string
  periodo: string
}

export function useHorario() {
  const [data, setData] = useState<Clase[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get<Clase[]>("/api/horario")
      setData(res)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void refresh() }, [refresh])

  return { data, loading, error, refresh }
}
```

### Task 8 — `useComedor.ts`

```ts
import { useCallback, useEffect, useState } from "react"
import { api } from "@/lib/api"
import { useAuth } from "@/lib/auth-store"

export interface MenuItem {
  _id: string
  nombre: string
  precio: number
  descripcion?: string
  categoria: "principal" | "economico" | "vegano"
  emoji?: string
}

export function useComedor() {
  const { refresh: refreshAuth, user } = useAuth()
  const [menu, setMenu] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get<MenuItem[]>("/api/comedor/menu")
      setMenu(res)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void refresh() }, [refresh])

  const ordenar = useCallback(
    async (items: { menuItemId: string; cantidad: number }[]) => {
      const result = await api.post<{ orden: any; saldoRestante: number }>(
        "/api/comedor/ordenes",
        { items }
      )
      // Refrescar el user para que el saldo en el header se actualice
      await refreshAuth()
      return result
    },
    [refreshAuth]
  )

  const saldo = user?.profile?.estudiante?.saldoComedor ?? 0
  return { menu, loading, error, refresh, ordenar, saldo }
}
```

### Task 9 — `useBiblioteca.ts`

```ts
import { useCallback, useEffect, useState } from "react"
import { api } from "@/lib/api"

export interface Libro {
  _id: string
  titulo: string
  autor: string
  cover?: string
  totalCopias: number
  copiasDisponibles: number
}

export interface Prestamo {
  _id: string
  libroId: string
  fechaPrestamo: string
  fechaVencimiento: string
  fechaDevolucion?: string
  estado: "activo" | "devuelto" | "vencido"
  libro: Libro | null
}

export interface Deseo {
  _id: string
  libroId: string
  fechaAgregado: string
  libro: Libro | null
}

export function useBiblioteca() {
  const [libros, setLibros] = useState<Libro[]>([])
  const [prestamos, setPrestamos] = useState<Prestamo[]>([])
  const [deseos, setDeseos] = useState<Deseo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [l, p, d] = await Promise.all([
        api.get<Libro[]>("/api/biblioteca/libros"),
        api.get<Prestamo[]>("/api/biblioteca/prestamos"),
        api.get<Deseo[]>("/api/biblioteca/deseos"),
      ])
      setLibros(l)
      setPrestamos(p)
      setDeseos(d)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void refresh() }, [refresh])

  const prestar = useCallback(async (libroId: string) => {
    await api.post("/api/biblioteca/prestamos", { libroId })
    await refresh()
  }, [refresh])

  const devolver = useCallback(async (prestamoId: string) => {
    await api.patch(`/api/biblioteca/prestamos/${prestamoId}`, { estado: "devuelto" })
    await refresh()
  }, [refresh])

  const agregarDeseo = useCallback(async (libroId: string) => {
    await api.post("/api/biblioteca/deseos", { libroId })
    await refresh()
  }, [refresh])

  const quitarDeseo = useCallback(async (deseoId: string) => {
    await api.delete(`/api/biblioteca/deseos/${deseoId}`)
    await refresh()
  }, [refresh])

  return {
    libros, prestamos, deseos,
    loading, error, refresh,
    prestar, devolver, agregarDeseo, quitarDeseo,
  }
}
```

### Task 10 — `usePerfil.ts`

```ts
import { useCallback, useState } from "react"
import { api } from "@/lib/api"
import { useAuth } from "@/lib/auth-store"
import { compressToBase64 } from "@/lib/image"

export function usePerfil() {
  const { user, refresh } = useAuth()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const update = useCallback(
    async (patch: Partial<{ nombre: string; apellido: string; telefono: string }>) => {
      setSaving(true)
      setError(null)
      try {
        await api.patch("/api/users/me", patch)
        await refresh()
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error")
        throw e
      } finally {
        setSaving(false)
      }
    },
    [refresh]
  )

  const changeAvatar = useCallback(
    async (file: File) => {
      setSaving(true)
      setError(null)
      try {
        const base64 = await compressToBase64(file, { maxKB: 250, maxPx: 512 })
        await api.post("/api/users/me/avatar", { base64 })
        await refresh()
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error")
        throw e
      } finally {
        setSaving(false)
      }
    },
    [refresh]
  )

  return { user, saving, error, update, changeAvatar }
}
```

---

## Phase C — Pantallas móvil restantes

### Task 11 — `PerfilScreen.tsx`

Reemplazar `currentUser` por `useAuth().user`. Para cada `field` mostrar el valor real (`user.nombre`, `user.apellido`, `user.profile?.estudiante?.studentId`, `user.email`). Avatar: si `user.avatar` existe, mostrarlo como `<img>`; si no, las iniciales.

Botón "Cambiar foto" → `<input type="file" accept="image/*" hidden ref={ref}>` + `onChange` llama `usePerfil().changeAvatar(file)`. Mostrar error si lo hay.

Logout: usar `useAuth().logout()` antes de navegar a `/movil/login`.

> Si la pantalla no tiene UI para edición inline, no agregar campos visibles en este plan — solo wirear el avatar. Editar nombre/apellido/teléfono puede ser un input modal en una versión futura.

### Task 12 — `HorarioScreen.tsx`

Reemplazar `horarioMock` por `useHorario().data`. Mantener el grid visual idéntico. Manejar loading/error.

### Task 13 — `ComedorScreen.tsx`

Reemplazar `menuMock` con `useComedor().menu`, `currentUser.saldo` con `useComedor().saldo`. Añadir un carrito local (estado `cart: { menuItemId: string; cantidad: number }[]`) y un botón "Pagar" que llama `ordenar(cart)`. Mostrar feedback de éxito/error (`toast` o `<div>` simple). Tras éxito, vacía el carrito.

### Task 14 — `BibliotecaScreen.tsx`

Reemplazar `librosMock` con `useBiblioteca()`. La tab "favoritos" muestra `prestamos` + `deseos`; la tab "material" muestra `libros` con búsqueda local sobre `libros`.

Acciones:
- En cada libro: botones "Prestar" (si `copiasDisponibles > 0`) y "Agregar deseo" (si no está ya en `deseos`).
- En cada préstamo activo: botón "Devolver".
- En cada deseo: botón quitar.

### Task 15 — Verificación final

`npm run build` debe pasar. Levantar `npm run dev` y verificar manualmente con `curl` (o navegador) que las 4 pantallas cargan sin errores 500.

---

## Self-Review

Coverage del spec:
- ✅ Sección 4.10 (MenuItem): Task 2
- ✅ Sección 4.11 (OrdenComedor): Task 2
- ✅ Sección 4.12 (Libro): Task 3
- ✅ Sección 4.13 (Prestamo): Task 3
- ✅ Sección 4.14 (Deseo): Task 3
- ✅ Sección 4.15 (Clase): Task 1
- ✅ Sección 5.2 (Users me + avatar): Task 4
- ✅ Sección 5.7 (Comedor): Task 2
- ✅ Sección 5.8 (Biblioteca): Task 3
- ✅ Sección 5.9 (Horario): Task 1
- ✅ Sección 6.6 pasos 3, 8, 9, 10: Tasks 11-14

Type consistency: `MenuItem` aparece en `comedor.service.ts` y en `useComedor.ts` con la misma forma. `Prestamo`, `Deseo`, `Libro` consistentes. `saldoComedor` lectura+escritura por `user.profile.estudiante.saldoComedor`.
