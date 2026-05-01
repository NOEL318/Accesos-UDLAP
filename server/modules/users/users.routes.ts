import { Router } from "express"
import { z } from "zod"
import { asyncHandler } from "../../lib/asyncHandler.js"
import { requireAuth } from "../../middlewares/auth.js"
import { ApiError } from "../../lib/errors.js"
import { User } from "./user.model.js"
import { serializeUser } from "../auth/auth.service.js"

export const usersRoutes = Router()
usersRoutes.use(requireAuth)

const patchMeInput = z.object({
  nombre: z.string().min(1).optional(),
  apellido: z.string().min(1).optional(),
  telefono: z.string().optional().nullable(),
  profile: z.record(z.string(), z.any()).optional(),
})

// PATCH /api/users/me - actualiza nombre, apellido, telefono o profile del user actual
usersRoutes.patch(
  "/me",
  asyncHandler(async (req, res) => {
    const input = patchMeInput.parse(req.body)
    const updated = await User.findByIdAndUpdate(
      req.user._id,
      { $set: input },
      { new: true }
    )
    if (!updated) throw new ApiError("NOT_FOUND", "Usuario no encontrado")
    res.json({ data: { user: serializeUser(updated) } })
  })
)

const avatarInput = z.object({
  base64: z.string().startsWith("data:image/"),
})

// POST /api/users/me/avatar - guarda la foto de perfil del user en base64 con limite de tamaño
usersRoutes.post(
  "/me/avatar",
  asyncHandler(async (req, res) => {
    const { base64 } = avatarInput.parse(req.body)
    if (base64.length > 600_000) {
      throw new ApiError("VALIDATION", "Imagen muy grande (>450KB tras base64)")
    }
    const updated = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { avatar: base64 } },
      { new: true }
    )
    if (!updated) throw new ApiError("NOT_FOUND", "Usuario no encontrado")
    res.json({ data: { user: serializeUser(updated) } })
  })
)
