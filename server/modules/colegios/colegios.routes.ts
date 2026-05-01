import { Router } from "express"
import { asyncHandler } from "../../lib/asyncHandler.js"
import { requireAuth, requireRole } from "../../middlewares/auth.js"
import {
  createMovimiento,
  createVisitaResidencial,
  getEdificio,
  getResidente,
  listEdificios,
  listMovimientos,
  listResidentes,
  listVisitasResidenciales,
  patchResidente,
  registrarVerificacion,
  reportarIncidente,
} from "./colegios.service.js"

export const colegiosRoutes = Router()
colegiosRoutes.use(requireAuth, requireRole("adminColegios", "admin"))

// GET /api/colegios/edificios - lista los edificios residenciales con su ocupacion actual
colegiosRoutes.get("/edificios", asyncHandler(async (_req, res) => {
  res.json({ data: await listEdificios() })
}))

// GET /api/colegios/edificios/:id - regresa un edificio con su ocupacion calculada
colegiosRoutes.get("/edificios/:id", asyncHandler(async (req, res) => {
  res.json({ data: await getEdificio(req.params.id) })
}))

// GET /api/colegios/residentes - lista residentes filtrados por edificio, estado o busqueda
colegiosRoutes.get("/residentes", asyncHandler(async (req, res) => {
  const edificioId = typeof req.query.edificioId === "string" ? req.query.edificioId : undefined
  const estado = typeof req.query.estado === "string" ? req.query.estado : undefined
  const search = typeof req.query.search === "string" ? req.query.search : undefined
  res.json({ data: await listResidentes({ edificioId, estado, search }) })
}))

// GET /api/colegios/residentes/:id - obtiene la ficha completa de un residente
colegiosRoutes.get("/residentes/:id", asyncHandler(async (req, res) => {
  res.json({ data: await getResidente(req.params.id) })
}))

// PATCH /api/colegios/residentes/:id - actualiza estado, habitacion o edificio del residente
colegiosRoutes.patch("/residentes/:id", asyncHandler(async (req, res) => {
  res.json({ data: await patchResidente(req.params.id, req.body) })
}))

// GET /api/colegios/movimientos - lista movimientos de residentes filtrando por residente o fechas
colegiosRoutes.get("/movimientos", asyncHandler(async (req, res) => {
  const residenteId = typeof req.query.residenteId === "string" ? req.query.residenteId : undefined
  const desde = typeof req.query.desde === "string" ? req.query.desde : undefined
  const hasta = typeof req.query.hasta === "string" ? req.query.hasta : undefined
  res.json({ data: await listMovimientos({ residenteId, desde, hasta }) })
}))

// POST /api/colegios/movimientos - registra entrada o salida del residente y ajusta su estado
colegiosRoutes.post("/movimientos", asyncHandler(async (req, res) => {
  res.status(201).json({ data: await createMovimiento(req.body) })
}))

// GET /api/colegios/visitas - bitacora completa de visitas al campus residencial
colegiosRoutes.get("/visitas", asyncHandler(async (req, res) => {
  const edificioId = typeof req.query.edificioId === "string" ? req.query.edificioId : undefined
  const desde = typeof req.query.desde === "string" ? req.query.desde : undefined
  const hasta = typeof req.query.hasta === "string" ? req.query.hasta : undefined
  const search = typeof req.query.search === "string" ? req.query.search : undefined
  res.json({ data: await listVisitasResidenciales({ edificioId, desde, hasta, search }) })
}))

// POST /api/colegios/visitas - registra una nueva visita al campus residencial
colegiosRoutes.post("/visitas", asyncHandler(async (req, res) => {
  res.status(201).json({ data: await createVisitaResidencial(String(req.user._id), req.body) })
}))

// POST /api/colegios/visitas/:id/verificacion - registra el resultado de la inspeccion
colegiosRoutes.post("/visitas/:id/verificacion", asyncHandler(async (req, res) => {
  res.json({
    data: await registrarVerificacion(req.params.id, String(req.user._id), req.body),
  })
}))

// POST /api/colegios/incidentes - levanta un incidente sobre un residente o edificio
colegiosRoutes.post("/incidentes", asyncHandler(async (req, res) => {
  res.status(201).json({ data: await reportarIncidente(req.body) })
}))
