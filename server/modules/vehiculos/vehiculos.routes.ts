import { Router } from "express"
import { asyncHandler } from "../../lib/asyncHandler.js"
import { requireAuth, requireRole } from "../../middlewares/auth.js"
import {
  autorizarSalida,
  buscarPorMatricula,
  createVehiculo,
  deleteVehiculo,
  denegarAcceso,
  getVehiculo,
  listEventos,
  listVehiculos,
  patchVehiculo,
  permitirAcceso,
} from "./vehiculos.service.js"
import { createMulta, listMultas, patchMulta } from "./multas.service.js"
import { PuntoControl } from "./punto.model.js"

export const vehiculosRoutes = Router()
vehiculosRoutes.use(requireAuth)

// GET /api/vehiculos - lista vehiculos filtrando por busqueda libre o estado de acceso
vehiculosRoutes.get(
  "/",
  asyncHandler(async (req, res) => {
    const search = typeof req.query.search === "string" ? req.query.search : undefined
    const estado = typeof req.query.estado === "string" ? req.query.estado : undefined
    res.json({ data: await listVehiculos({ search, estado }) })
  })
)

// POST /api/vehiculos - registra un vehiculo nuevo (solo oficial o admin)
vehiculosRoutes.post(
  "/",
  requireRole("oficial", "admin"),
  asyncHandler(async (req, res) => {
    const v = await createVehiculo(req.body)
    res.status(201).json({ data: v })
  })
)

// POST /api/vehiculos/buscar - busca un vehiculo exacto por matricula
vehiculosRoutes.post(
  "/buscar",
  asyncHandler(async (req, res) => {
    const matricula = String(req.body?.matricula ?? "")
    const v = await buscarPorMatricula(matricula)
    res.json({ data: v })
  })
)

// GET /api/vehiculos/:id - regresa la ficha completa de un vehiculo por id
vehiculosRoutes.get(
  "/:id",
  asyncHandler(async (req, res) => {
    res.json({ data: await getVehiculo(req.params.id) })
  })
)

// PATCH /api/vehiculos/:id - actualiza datos del vehiculo (solo oficial o admin)
vehiculosRoutes.patch(
  "/:id",
  requireRole("oficial", "admin"),
  asyncHandler(async (req, res) => {
    res.json({ data: await patchVehiculo(req.params.id, req.body) })
  })
)

// DELETE /api/vehiculos/:id - borra un vehiculo del registro (solo admin)
vehiculosRoutes.delete(
  "/:id",
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    await deleteVehiculo(req.params.id)
    res.status(204).end()
  })
)

// POST /api/vehiculos/:id/permitir - autoriza el acceso del vehiculo y registra el evento
vehiculosRoutes.post(
  "/:id/permitir",
  requireRole("oficial", "admin"),
  asyncHandler(async (req, res) => {
    res.json({ data: await permitirAcceso(req.params.id, String(req.user._id), req.body) })
  })
)

// POST /api/vehiculos/:id/denegar - bloquea el acceso del vehiculo y dispara alerta
vehiculosRoutes.post(
  "/:id/denegar",
  requireRole("oficial", "admin"),
  asyncHandler(async (req, res) => {
    res.json({ data: await denegarAcceso(req.params.id, String(req.user._id), req.body) })
  })
)

// POST /api/vehiculos/:id/autorizar-salida - levanta el bloqueo de salida y registra el evento
vehiculosRoutes.post(
  "/:id/autorizar-salida",
  requireRole("oficial", "admin"),
  asyncHandler(async (req, res) => {
    res.json({ data: await autorizarSalida(req.params.id, String(req.user._id)) })
  })
)

// ── Multas (montadas en el mismo módulo) ────────────────────────────────────

export const multasRoutes = Router()
multasRoutes.use(requireAuth)

// GET /api/multas - lista multas filtrando por vehiculoId o estado
multasRoutes.get(
  "/",
  asyncHandler(async (req, res) => {
    const vehiculoId = typeof req.query.vehiculoId === "string" ? req.query.vehiculoId : undefined
    const estado = typeof req.query.estado === "string" ? req.query.estado : undefined
    res.json({ data: await listMultas({ vehiculoId, estado }) })
  })
)

// POST /api/multas - crea una multa nueva levantada por el oficial autenticado
multasRoutes.post(
  "/",
  requireRole("oficial", "admin"),
  asyncHandler(async (req, res) => {
    const m = await createMulta(String(req.user._id), req.body)
    res.status(201).json({ data: m })
  })
)

// PATCH /api/multas/:id - cambia el estado de la multa a pagada o cancelada
multasRoutes.patch(
  "/:id",
  requireRole("oficial", "admin"),
  asyncHandler(async (req, res) => {
    res.json({ data: await patchMulta(req.params.id, req.body) })
  })
)

// ── Eventos ─────────────────────────────────────────────────────────────────

export const eventosRoutes = Router()
eventosRoutes.use(requireAuth)
// GET /api/eventos-acceso - lista eventos de acceso vehicular filtrando por vehiculo o rango
eventosRoutes.get(
  "/",
  asyncHandler(async (req, res) => {
    const vehiculoId = typeof req.query.vehiculoId === "string" ? req.query.vehiculoId : undefined
    const desde = typeof req.query.desde === "string" ? req.query.desde : undefined
    const hasta = typeof req.query.hasta === "string" ? req.query.hasta : undefined
    res.json({ data: await listEventos({ vehiculoId, desde, hasta }) })
  })
)

// ── Puntos de control ───────────────────────────────────────────────────────

export const puntosRoutes = Router()
puntosRoutes.use(requireAuth)
// GET /api/puntos-control - lista todos los puntos de control vehicular del campus
puntosRoutes.get(
  "/",
  asyncHandler(async (_req, res) => {
    const items = await PuntoControl.find().sort({ nombre: 1 }).lean()
    res.json({ data: items })
  })
)
