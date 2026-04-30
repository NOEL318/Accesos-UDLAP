import { Router } from "express"
import { asyncHandler } from "../../lib/asyncHandler"
import { requireAuth } from "../../middlewares/auth"
import { Clase } from "./clase.model"

export const horarioRoutes = Router()
horarioRoutes.use(requireAuth)

// GET /api/horario - regresa las clases del usuario autenticado ordenadas por dia y hora
horarioRoutes.get(
  "/",
  asyncHandler(async (req, res) => {
    const clases = await Clase.find({ userId: req.user._id })
      .sort({ dia: 1, inicio: 1 })
      .lean()
    res.json({ data: clases })
  })
)
