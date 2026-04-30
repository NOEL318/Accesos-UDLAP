import { Router } from "express"
import { z } from "zod"
import { asyncHandler } from "../../lib/asyncHandler"
import { ApiError } from "../../lib/errors"
import { requireAuth, requireRole } from "../../middlewares/auth"
import { RegistroAlternativo } from "./registro.model"

export const quioscoRoutes = Router()
quioscoRoutes.use(requireAuth, requireRole("oficial", "admin"))

const createInput = z.object({
  nombre: z.string().min(1),
  tipoId: z.string().optional(),
  motivo: z.string().optional(),
  fotoIne: z.string().optional(), // base64 dataURL
  vehiculoMatricula: z.string().optional(),
})

// POST /api/quiosco/registro-alternativo - registra a un visitante sin invitacion previa con foto INE
quioscoRoutes.post(
  "/registro-alternativo",
  asyncHandler(async (req, res) => {
    const input = createInput.parse(req.body)
    if (input.fotoIne && input.fotoIne.length > 600_000) {
      throw new ApiError("VALIDATION", "Foto INE muy grande (>450KB)")
    }
    const doc = await RegistroAlternativo.create({
      ...input,
      oficialId: req.user._id,
    })
    res.status(201).json({ data: doc.toObject() })
  })
)

// PATCH /api/quiosco/registro-alternativo/:id/salida - marca la hora de salida del registro
quioscoRoutes.patch(
  "/registro-alternativo/:id/salida",
  asyncHandler(async (req, res) => {
    const r = await RegistroAlternativo.findById(req.params.id)
    if (!r) throw new ApiError("NOT_FOUND", "Registro no encontrado")
    r.salida = new Date()
    await r.save()
    res.json({ data: r.toObject() })
  })
)

// GET /api/quiosco/registro-alternativo - lista los ultimos registros alternativos (max 100)
quioscoRoutes.get(
  "/registro-alternativo",
  asyncHandler(async (_req, res) => {
    const items = await RegistroAlternativo.find()
      .sort({ ingreso: -1 })
      .limit(100)
      .lean()
    res.json({ data: items })
  })
)
