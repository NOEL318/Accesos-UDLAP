import crypto from "node:crypto"
import { z } from "zod"
import { Visita, type VisitaStatus } from "./visita.model.js"
import { ApiError } from "../../lib/errors.js"

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
  edificioDestinoId: z.string().optional(),
  estatusVisitante: z.enum(["sin_antecedentes", "con_antecedentes"]).optional(),
})

const patchInput = z.object({
  status: z.enum(["cancelada"]).optional(),
  comentarios: z.string().optional(),
})

// calcula la fecha de expiracion del QR: 4h despues o fin del dia si es multiples entradas
function defaultExpiry(fechaHora: Date, multiples: boolean): Date {
  if (multiples) {
    const end = new Date(fechaHora)
    end.setHours(23, 59, 59, 999)
    return end
  }
  return new Date(fechaHora.getTime() + 1000 * 60 * 60 * 4)
}

// arma una visita nueva, genera el QR token y le pone status segun la fecha
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
    edificioDestinoId: input.edificioDestinoId,
    estatusVisitante: input.estatusVisitante,
    qrToken,
    qrExpiraEn,
    status,
  })

  return doc.toObject()
}

// regresa las visitas del anfitrion ordenadas por fecha descendente
export async function listVisitasDe(anfitrionId: string, status?: string) {
  const filter: Record<string, unknown> = { anfitrionId }
  if (status) filter.status = status
  return Visita.find(filter).sort({ fechaHora: -1 }).lean()
}

// obtiene una visita por id, opcionalmente verificando que sea del anfitrion dado
export async function getVisitaById(id: string, anfitrionId?: string) {
  const filter: Record<string, unknown> = { _id: id }
  if (anfitrionId) filter.anfitrionId = anfitrionId
  const doc = await Visita.findOne(filter).lean()
  if (!doc) throw new ApiError("NOT_FOUND", "Visita no encontrada")
  return doc
}

// actualiza status (a cancelada) o comentarios de una visita del anfitrion
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

// borra una visita verificando que pertenezca al anfitrion
export async function deleteVisita(id: string, anfitrionId: string) {
  const r = await Visita.deleteOne({ _id: id, anfitrionId })
  if (r.deletedCount === 0) {
    throw new ApiError("NOT_FOUND", "Visita no encontrada")
  }
}

// busca la visita por su QR token validando que no haya expirado
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

// registra un scan del QR por el oficial, actualiza el status a activa si fue permitido
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
