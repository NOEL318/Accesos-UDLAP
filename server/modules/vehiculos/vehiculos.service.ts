import { z } from "zod"
import { ApiError } from "../../lib/errors.js"
import { Vehiculo } from "./vehiculo.model.js"
import { EventoAcceso } from "./evento.model.js"
import { Alerta } from "../alertas/alerta.model.js"

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

// regresa hasta 100 vehiculos filtrando por estado de acceso o por matricula/nombre
export async function listVehiculos(filter: { search?: string; estado?: string }) {
  const q: Record<string, unknown> = {}
  if (filter.estado) q.estadoAcceso = filter.estado
  if (filter.search) {
    const re = new RegExp(filter.search, "i")
    q.$or = [{ matricula: re }, { "propietarioInfo.nombre": re }]
  }
  return Vehiculo.find(q).sort({ updatedAt: -1 }).limit(100).lean()
}

// obtiene un vehiculo por id o tira NOT_FOUND si no existe
export async function getVehiculo(id: string) {
  const doc = await Vehiculo.findById(id).lean()
  if (!doc) throw new ApiError("NOT_FOUND", "Vehículo no encontrado")
  return doc
}

// busca un vehiculo por matricula exacta normalizada en mayusculas
export async function buscarPorMatricula(matricula: string) {
  if (!matricula) throw new ApiError("VALIDATION", "Falta matrícula")
  const doc = await Vehiculo.findOne({ matricula: matricula.toUpperCase().trim() }).lean()
  if (!doc) throw new ApiError("NOT_FOUND", "Vehículo no encontrado")
  return doc
}

// valida y registra un vehiculo nuevo normalizando la matricula
export async function createVehiculo(raw: unknown) {
  const input = upsertInput.parse(raw)
  const doc = await Vehiculo.create({ ...input, matricula: input.matricula.toUpperCase().trim() })
  return doc.toObject()
}

// actualiza parcialmente los datos de un vehiculo existente
export async function patchVehiculo(id: string, raw: unknown) {
  const input = upsertInput.partial().parse(raw)
  const doc = await Vehiculo.findByIdAndUpdate(id, { $set: input }, { new: true }).lean()
  if (!doc) throw new ApiError("NOT_FOUND", "Vehículo no encontrado")
  return doc
}

// elimina un vehiculo por id o tira NOT_FOUND si no existe
export async function deleteVehiculo(id: string) {
  const r = await Vehiculo.deleteOne({ _id: id })
  if (r.deletedCount === 0) throw new ApiError("NOT_FOUND", "Vehículo no encontrado")
}

// marca el acceso del vehiculo como permitido y registra el evento en bitacora
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

// deniega el acceso del vehiculo, registra evento y crea una alerta de incidente
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

// quita el bloqueo de salida del vehiculo y registra el evento manual del oficial
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

// lista los ultimos eventos de acceso filtrando por vehiculo o rango de fechas
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
