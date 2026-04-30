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

// lista las multas filtrando opcionalmente por vehiculo o por estado
export async function listMultas(filter: { vehiculoId?: string; estado?: string }) {
  const q: Record<string, unknown> = {}
  if (filter.vehiculoId) q.vehiculoId = filter.vehiculoId
  if (filter.estado) q.estado = filter.estado
  return Multa.find(q).sort({ fecha: -1 }).limit(200).lean()
}

// crea una multa nueva, sube el contador del vehiculo y dispara una alerta
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

// cambia el estado de una multa a pagada o cancelada y baja el contador del vehiculo si aplica
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
