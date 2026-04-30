import { Router } from "express"
import { asyncHandler } from "../../lib/asyncHandler"
import { requireAuth, requireRole } from "../../middlewares/auth"
import {
  createVisita,
  deleteVisita,
  getByQrToken,
  getVisitaById,
  listVisitasDe,
  patchVisita,
  scanVisita,
} from "./visitas.service"

export const visitasRoutes = Router()

// GET /api/visitas/qr/:qrToken - endpoint publico que devuelve la info de la visita por QR
// QR público (no requiere auth para mostrar info pre-aprobación)
visitasRoutes.get(
  "/qr/:qrToken",
  asyncHandler(async (req, res) => {
    const v = await getByQrToken(req.params.qrToken)
    res.json({ data: v })
  })
)

// POST /api/visitas/qr/:qrToken/scan - registra un scan del QR por un oficial autorizado
// Scan requiere oficial o adminColegios
visitasRoutes.post(
  "/qr/:qrToken/scan",
  requireAuth,
  requireRole("oficial", "adminColegios", "admin"),
  asyncHandler(async (req, res) => {
    const v = await scanVisita(
      req.params.qrToken,
      String(req.user._id),
      req.body
    )
    res.json({ data: v })
  })
)

// Resto requiere auth como anfitrión
visitasRoutes.use(requireAuth)

// GET /api/visitas - lista las visitas del usuario autenticado con filtro opcional por status
visitasRoutes.get(
  "/",
  asyncHandler(async (req, res) => {
    const status = typeof req.query.status === "string" ? req.query.status : undefined
    const items = await listVisitasDe(String(req.user._id), status)
    res.json({ data: items })
  })
)

// POST /api/visitas - crea una visita nueva con QR generado, validando rol del anfitrion
visitasRoutes.post(
  "/",
  requireRole("estudiante", "maestro", "proveedor", "residente", "exaudlap", "admin", "adminColegios"),
  asyncHandler(async (req, res) => {
    const v = await createVisita(String(req.user._id), req.body)
    res.status(201).json({ data: v })
  })
)

// GET /api/visitas/:id - obtiene la visita por id verificando que sea del anfitrion actual
visitasRoutes.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const v = await getVisitaById(req.params.id, String(req.user._id))
    res.json({ data: v })
  })
)

// PATCH /api/visitas/:id - actualiza status (cancelada) o comentarios de la visita del anfitrion
visitasRoutes.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const v = await patchVisita(req.params.id, String(req.user._id), req.body)
    res.json({ data: v })
  })
)

// DELETE /api/visitas/:id - borra la visita verificando que sea del anfitrion actual
visitasRoutes.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await deleteVisita(req.params.id, String(req.user._id))
    res.status(204).end()
  })
)
