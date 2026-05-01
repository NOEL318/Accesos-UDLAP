import { Router } from "express"
import { asyncHandler } from "../../lib/asyncHandler.js"
import { ApiError } from "../../lib/errors.js"
import { requireAuth } from "../../middlewares/auth.js"
import { login, loginPin, logoutByToken, serializeUser } from "./auth.service.js"
import { User } from "../users/user.model.js"

export const authRoutes = Router()

// POST /api/auth/login - login por email y password, regresa el usuario serializado y un token
authRoutes.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { user, token } = await login(req.body)
    res.json({ data: { user, token } })
  })
)

// POST /api/auth/login-pin - login para oficiales con su userId y PIN, regresa token de sesion
authRoutes.post(
  "/login-pin",
  asyncHandler(async (req, res) => {
    const { user, token } = await loginPin(req.body)
    res.json({ data: { user, token } })
  })
)

// GET /api/auth/oficiales - lista publica de oficiales para el selector de login con PIN
authRoutes.get(
  "/oficiales",
  asyncHandler(async (_req, res) => {
    const oficiales = await User.find({ role: "oficial" })
      .select("nombre apellido profile.oficial.turno avatar")
      .sort({ nombre: 1 })
      .lean()
    res.json({
      data: oficiales.map((o: any) => ({
        id: String(o._id),
        nombre: `${o.nombre} ${o.apellido}`,
        turno: o.profile?.oficial?.turno,
        avatar: o.avatar ?? null,
      })),
    })
  })
)

// POST /api/auth/logout - invalida el token de sesion del usuario actual
authRoutes.post(
  "/logout",
  requireAuth,
  asyncHandler(async (req, res) => {
    const token = req.authToken!
    await logoutByToken(token)
    res.status(204).end()
  })
)

// GET /api/auth/me - regresa el usuario autenticado actual
authRoutes.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    if (!req.user) throw new ApiError("UNAUTHORIZED", "No autenticado")
    res.json({ data: { user: serializeUser(req.user) } })
  })
)
