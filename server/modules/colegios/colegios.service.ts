import { z } from "zod"
import { ApiError } from "../../lib/errors"
import { Edificio } from "./edificio.model"
import { Movimiento } from "./movimiento.model"
import { User } from "../users/user.model"

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

const createMovInput = z.object({
  residenteUserId: z.string().min(1),
  edificioId: z.string().min(1),
  tipo: z.enum(["entrada", "salida"]),
  estado: z.enum(["normal", "ebriedad", "autorizada", "alerta"]).default("normal"),
})

// crea el movimiento y actualiza el estado del residente segun sea entrada o salida
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
