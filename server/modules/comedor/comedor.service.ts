import { z } from "zod"
import { ApiError } from "../../lib/errors.js"
import { User } from "../users/user.model.js"
import { MenuItem } from "./menuItem.model.js"
import { Orden } from "./orden.model.js"

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

// regresa los items del menu disponibles, opcionalmente filtrados por categoria
export async function listMenu(filter: { categoria?: string }) {
  const q: Record<string, unknown> = { disponible: true }
  if (filter.categoria) q.categoria = filter.categoria
  return MenuItem.find(q).sort({ categoria: 1, nombre: 1 }).lean()
}

// valida items, calcula total, descuenta saldo del estudiante y guarda la orden
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

// regresa las ordenes del usuario ordenadas de la mas reciente a la mas vieja
export async function listOrdenes(userId: string) {
  return Orden.find({ userId }).sort({ fecha: -1 }).lean()
}
