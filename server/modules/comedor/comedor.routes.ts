import { Router } from "express"
import { asyncHandler } from "../../lib/asyncHandler"
import { requireAuth, requireRole } from "../../middlewares/auth"
import { createOrden, listMenu, listOrdenes } from "./comedor.service"

export const comedorRoutes = Router()

// GET /api/comedor/menu - lista el menu del dia, opcionalmente filtrando por categoria
comedorRoutes.get(
  "/menu",
  requireAuth,
  asyncHandler(async (req, res) => {
    const categoria = typeof req.query.categoria === "string" ? req.query.categoria : undefined
    const items = await listMenu({ categoria })
    res.json({ data: items })
  })
)

// POST /api/comedor/ordenes - crea una orden descontando el saldo del estudiante
comedorRoutes.post(
  "/ordenes",
  requireAuth,
  requireRole("estudiante", "residente", "admin"),
  asyncHandler(async (req, res) => {
    const result = await createOrden(String(req.user._id), req.body)
    res.status(201).json({ data: result })
  })
)

// GET /api/comedor/ordenes - lista las ordenes del usuario autenticado
comedorRoutes.get(
  "/ordenes",
  requireAuth,
  asyncHandler(async (req, res) => {
    const items = await listOrdenes(String(req.user._id))
    res.json({ data: items })
  })
)
