import { z } from "zod"
import { ApiError } from "../../lib/errors"
import { Libro } from "./libro.model"
import { Prestamo } from "./prestamo.model"
import { Deseo } from "./deseo.model"

// busca libros por titulo/autor opcionalmente filtrando solo los que tienen copias libres
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

// crea un prestamo si hay copias disponibles, descuenta una y pone vencimiento a 14 dias
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

// marca el prestamo como devuelto y regresa una copia disponible al libro
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

// lista los prestamos del usuario adjuntando el snippet del libro de cada uno
export async function listPrestamos(userId: string) {
  const items = await Prestamo.find({ userId }).sort({ fechaPrestamo: -1 }).lean()
  // attach libro snippet
  const libroIds = items.map((p) => p.libroId)
  const libros = await Libro.find({ _id: { $in: libroIds } }).lean()
  const libroMap = new Map(libros.map((l) => [String(l._id), l]))
  return items.map((p) => ({ ...p, libro: libroMap.get(String(p.libroId)) ?? null }))
}

// agrega un libro a la lista de deseos cuidando que no se duplique
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

// borra un deseo por id verificando que pertenezca al usuario
export async function eliminarDeseo(userId: string, id: string) {
  const r = await Deseo.deleteOne({ _id: id, userId })
  if (r.deletedCount === 0) throw new ApiError("NOT_FOUND", "Deseo no encontrado")
}

// lista los deseos del usuario adjuntando los datos del libro de cada uno
export async function listDeseos(userId: string) {
  const items = await Deseo.find({ userId }).sort({ fechaAgregado: -1 }).lean()
  const libroIds = items.map((d) => d.libroId)
  const libros = await Libro.find({ _id: { $in: libroIds } }).lean()
  const libroMap = new Map(libros.map((l) => [String(l._id), l]))
  return items.map((d) => ({ ...d, libro: libroMap.get(String(d.libroId)) ?? null }))
}
