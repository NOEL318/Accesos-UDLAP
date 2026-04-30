import { Router } from "express"
import { asyncHandler } from "../../lib/asyncHandler"
import { requireAuth } from "../../middlewares/auth"
import {
  agregarDeseo,
  crearPrestamo,
  devolverPrestamo,
  eliminarDeseo,
  listDeseos,
  listLibros,
  listPrestamos,
} from "./biblioteca.service"

export const bibliotecaRoutes = Router()
bibliotecaRoutes.use(requireAuth)

// GET /api/biblioteca/libros - lista los libros del catalogo con busqueda y filtro de disponibles
bibliotecaRoutes.get(
  "/libros",
  asyncHandler(async (req, res) => {
    const search = typeof req.query.search === "string" ? req.query.search : undefined
    const disponibles = req.query.disponibles === "true"
    const items = await listLibros({ search, disponibles })
    res.json({ data: items })
  })
)

// POST /api/biblioteca/prestamos - crea un prestamo nuevo descontando una copia del libro
bibliotecaRoutes.post(
  "/prestamos",
  asyncHandler(async (req, res) => {
    const p = await crearPrestamo(String(req.user._id), req.body)
    res.status(201).json({ data: p })
  })
)

// PATCH /api/biblioteca/prestamos/:id - marca un prestamo como devuelto y libera la copia
bibliotecaRoutes.patch(
  "/prestamos/:id",
  asyncHandler(async (req, res) => {
    const p = await devolverPrestamo(String(req.user._id), req.params.id)
    res.json({ data: p })
  })
)

// GET /api/biblioteca/prestamos - lista los prestamos del usuario autenticado
bibliotecaRoutes.get(
  "/prestamos",
  asyncHandler(async (req, res) => {
    const items = await listPrestamos(String(req.user._id))
    res.json({ data: items })
  })
)

// POST /api/biblioteca/deseos - agrega un libro a la lista de deseos del usuario
bibliotecaRoutes.post(
  "/deseos",
  asyncHandler(async (req, res) => {
    const d = await agregarDeseo(String(req.user._id), req.body)
    res.status(201).json({ data: d })
  })
)

// DELETE /api/biblioteca/deseos/:id - elimina un deseo de la lista del usuario
bibliotecaRoutes.delete(
  "/deseos/:id",
  asyncHandler(async (req, res) => {
    await eliminarDeseo(String(req.user._id), req.params.id)
    res.status(204).end()
  })
)

// GET /api/biblioteca/deseos - lista los deseos del usuario autenticado con info del libro
bibliotecaRoutes.get(
  "/deseos",
  asyncHandler(async (req, res) => {
    const items = await listDeseos(String(req.user._id))
    res.json({ data: items })
  })
)
