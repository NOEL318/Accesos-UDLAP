import crypto from "node:crypto"
import { z } from "zod"
import { ApiError } from "../../lib/errors.js"
import { Edificio } from "./edificio.model.js"
import { Movimiento } from "./movimiento.model.js"
import { User } from "../users/user.model.js"
import { Visita } from "../visitas/visita.model.js"
import { Alerta } from "../alertas/alerta.model.js"

// trae todos los edificios y le calcula a cada uno cuantos residentes tiene en campus
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

// obtiene un edificio por id y le agrega su ocupacion actual
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

// lista users con role residente filtrando por edificio, estado o por nombre/matricula
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

// busca un user por id verificando que sea residente
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

// actualiza el perfil residente del user (estado, habitacion o edificio)
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

// lista los ultimos movimientos de residentes con filtros opcionales por id o rango de fechas
export async function listMovimientos(filter: { residenteId?: string; desde?: string; hasta?: string }) {
  const q: Record<string, unknown> = {}
  if (filter.residenteId) q.residenteUserId = filter.residenteId
  if (filter.desde || filter.hasta) {
    const horaFilter: Record<string, Date> = {}
    if (filter.desde) horaFilter.$gte = new Date(filter.desde)
    if (filter.hasta) horaFilter.$lte = new Date(filter.hasta)
    q.hora = horaFilter
  }
  return Movimiento.find(q).sort({ hora: -1 }).limit(200).lean()
}

const createMovInput = z
  .object({
    residenteUserId: z.string().optional(),
    residenteStudentId: z.string().optional(),
    edificioId: z.string().min(1),
    tipo: z.enum(["entrada", "salida"]),
    estado: z.enum(["normal", "ebriedad", "autorizada", "alerta"]).default("normal"),
  })
  .refine((v) => v.residenteUserId || v.residenteStudentId, {
    message: "Falta residenteUserId o residenteStudentId",
  })

// crea el movimiento y actualiza el estado del residente segun sea entrada o salida
export async function createMovimiento(raw: unknown) {
  const input = createMovInput.parse(raw)
  let userId = input.residenteUserId
  if (!userId && input.residenteStudentId) {
    const u = await User.findOne({
      role: "residente",
      "profile.residente.studentId": input.residenteStudentId,
    })
      .select({ _id: 1 })
      .lean()
    if (!u) throw new ApiError("NOT_FOUND", "Residente no encontrado")
    userId = String(u._id)
  }
  if (!userId) throw new ApiError("VALIDATION", "Residente no resuelto")

  const m = await Movimiento.create({
    residenteUserId: userId,
    edificioId: input.edificioId,
    tipo: input.tipo,
    estado: input.estado,
  })
  if (input.tipo === "entrada") {
    await User.updateOne(
      { _id: userId, role: "residente" },
      { $set: { "profile.residente.estado": "en_campus" } }
    )
  } else {
    await User.updateOne(
      { _id: userId, role: "residente" },
      { $set: { "profile.residente.estado": "fuera" } }
    )
  }
  return m.toObject()
}

// lista todas las visitas con edificio destino (bitacora del campus residencial)
export async function listVisitasResidenciales(filter: {
  edificioId?: string
  desde?: string
  hasta?: string
  search?: string
}) {
  const q: Record<string, unknown> = { edificioDestinoId: { $exists: true, $ne: null } }
  if (filter.edificioId) q.edificioDestinoId = filter.edificioId
  if (filter.desde || filter.hasta) {
    const r: Record<string, Date> = {}
    if (filter.desde) r.$gte = new Date(filter.desde)
    if (filter.hasta) r.$lte = new Date(filter.hasta)
    q.fechaHora = r
  }
  if (filter.search) {
    const re = new RegExp(filter.search, "i")
    q.$or = [
      { "invitado.nombre": re },
      { "invitado.tipoId": re },
      { puntoAcceso: re },
    ]
  }
  return Visita.find(q).sort({ fechaHora: -1 }).limit(500).lean()
}

const createVisitaResidencialInput = z.object({
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
  edificioDestinoId: z.string().min(1),
  estatusVisitante: z.enum(["sin_antecedentes", "con_antecedentes"]).optional(),
})

// crea una visita residencial registrada por el admin de colegios
export async function createVisitaResidencial(adminUserId: string, raw: unknown) {
  const input = createVisitaResidencialInput.parse(raw)
  if (input.invitado.foto && input.invitado.foto.length > 600_000) {
    throw new ApiError("VALIDATION", "Foto del visitante muy grande (>450KB)")
  }
  const qrToken = crypto.randomUUID()
  const qrExpiraEn = input.multiplesEntradas
    ? new Date(new Date(input.fechaHora).setHours(23, 59, 59, 999))
    : new Date(input.fechaHora.getTime() + 1000 * 60 * 60 * 4)
  const status =
    input.fechaHora.getTime() <= Date.now() ? "activa" : "programada"
  const doc = await Visita.create({
    anfitrionId: adminUserId,
    invitado: input.invitado,
    tipoAcceso: input.tipoAcceso,
    puntoAcceso: input.puntoAcceso,
    fechaHora: input.fechaHora,
    multiplesEntradas: input.multiplesEntradas,
    comentarios: input.comentarios,
    edificioDestinoId: input.edificioDestinoId,
    estatusVisitante: input.estatusVisitante,
    qrToken,
    qrExpiraEn,
    status,
  })
  return doc.toObject()
}

const verificacionInput = z.object({
  resultado: z.enum(["permitido", "denegado"]),
  ebriedad: z.boolean().default(false),
  itemsProhibidos: z.boolean().default(false),
  motivo: z.string().optional(),
  puntoAcceso: z.string().optional(),
  fotoEvidencia: z.string().optional(),
})

// registra el resultado de la inspeccion de una visita y actualiza su estado
export async function registrarVerificacion(
  visitaId: string,
  oficialId: string,
  raw: unknown
) {
  const input = verificacionInput.parse(raw)
  if (input.fotoEvidencia && input.fotoEvidencia.length > 600_000) {
    throw new ApiError("VALIDATION", "Foto de evidencia muy grande (>450KB)")
  }
  const visita = await Visita.findById(visitaId)
  if (!visita) throw new ApiError("NOT_FOUND", "Visita no encontrada")

  visita.scans.push({
    puntoId: input.puntoAcceso ?? visita.puntoAcceso,
    oficialId: oficialId as unknown as never,
    timestamp: new Date(),
    resultado: input.resultado,
    motivo: input.motivo,
  } as never)
  if (input.resultado === "permitido" && visita.status === "programada") {
    visita.status = "activa"
  }
  if (input.resultado === "denegado") {
    visita.status = "cancelada"
  }
  await visita.save()

  if (input.ebriedad || input.itemsProhibidos || input.resultado === "denegado") {
    const tipo: "ebriedad" | "items_prohibidos" | "incidente" = input.ebriedad
      ? "ebriedad"
      : input.itemsProhibidos
      ? "items_prohibidos"
      : "incidente"
    await Alerta.create({
      scope: "residencial",
      tipo,
      severidad: input.resultado === "denegado" ? "alta" : "moderada",
      descripcion:
        input.motivo ||
        (input.resultado === "denegado"
          ? `Acceso denegado a ${visita.invitado?.nombre ?? "visitante"}`
          : `Incidente en inspección: ${visita.invitado?.nombre ?? "visitante"}`),
      refs: visita.edificioDestinoId
        ? { edificioId: String(visita.edificioDestinoId) }
        : undefined,
    })
  }

  return visita.toObject()
}

const reporteIncidenteInput = z.object({
  residenteStudentId: z.string().optional(),
  residenteUserId: z.string().optional(),
  edificioId: z.string().optional(),
  tipo: z
    .enum(["ebriedad", "items_prohibidos", "incidente", "ronda"])
    .default("incidente"),
  severidad: z
    .enum(["critica", "alta", "moderada", "media", "info"])
    .default("moderada"),
  descripcion: z.string().min(1),
  fotoEvidencia: z.string().optional(),
})

// reporta un incidente sobre un residente o edificio creando la alerta correspondiente
export async function reportarIncidente(raw: unknown) {
  const input = reporteIncidenteInput.parse(raw)
  if (input.fotoEvidencia && input.fotoEvidencia.length > 600_000) {
    throw new ApiError("VALIDATION", "Foto de evidencia muy grande (>450KB)")
  }
  let residenteUserId = input.residenteUserId
  if (!residenteUserId && input.residenteStudentId) {
    const u = await User.findOne({
      role: "residente",
      "profile.residente.studentId": input.residenteStudentId,
    })
      .select({ _id: 1 })
      .lean()
    residenteUserId = u ? String(u._id) : undefined
  }
  const refs: Record<string, string> = {}
  if (residenteUserId) refs.residenteUserId = residenteUserId
  if (input.edificioId) refs.edificioId = input.edificioId

  const a = await Alerta.create({
    scope: "residencial",
    tipo: input.tipo,
    severidad: input.severidad,
    descripcion: input.descripcion,
    refs: Object.keys(refs).length ? refs : undefined,
  })
  return a.toObject()
}
