import { Router } from "express"
import { z } from "zod"
import { asyncHandler } from "../../lib/asyncHandler.js"
import { requireAuth, requireRole } from "../../middlewares/auth.js"
import { ApiError } from "../../lib/errors.js"
import { Alerta } from "./alerta.model.js"

export const alertasRoutes = Router()
alertasRoutes.use(requireAuth)

// GET /api/alertas - lista alertas con filtros opcionales por scope, estado y severidad
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

// POST /api/alertas - crea una nueva alerta (solo oficial, adminColegios o admin)
alertasRoutes.post(
  "/",
  requireRole("oficial", "adminColegios", "admin"),
  asyncHandler(async (req, res) => {
    const input = createInput.parse(req.body)
    const a = await Alerta.create(input)
    res.status(201).json({ data: a })
  })
)

// PATCH /api/alertas/:id/atender - marca la alerta como atendida y guarda quien la atendio
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
