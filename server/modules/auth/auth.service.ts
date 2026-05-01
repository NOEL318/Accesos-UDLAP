import crypto from "node:crypto"
import { z } from "zod"
import { User } from "../users/user.model.js"
import { ApiError } from "../../lib/errors.js"

const loginInput = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7 // 7 días

// valida email/password, genera un token de sesion y lo guarda en el user
export async function login(rawInput: unknown) {
  const { email, password } = loginInput.parse(rawInput)
  const user = await User.findOne({ email: email.toLowerCase().trim() })
  if (!user) throw new ApiError("UNAUTHORIZED", "Credenciales inválidas")
  if (user.password !== password) {
    throw new ApiError("UNAUTHORIZED", "Credenciales inválidas")
  }
  const token = crypto.randomUUID()
  user.sessionToken = token
  user.sessionExpiresAt = new Date(Date.now() + SESSION_TTL_MS)
  await user.save()
  return { user: serializeUser(user), token }
}

// limpia el sessionToken del user que tiene ese token
export async function logoutByToken(token: string) {
  await User.updateOne(
    { sessionToken: token },
    { $unset: { sessionToken: 1, sessionExpiresAt: 1 } }
  )
}

// busca un user por su sessionToken y verifica que no haya expirado
export async function findUserBySessionToken(token: string) {
  const user = await User.findOne({ sessionToken: token })
  if (!user) return null
  if (user.sessionExpiresAt && user.sessionExpiresAt.getTime() < Date.now()) {
    return null
  }
  return user
}

// arma el payload publico del user, sin password ni session token
export function serializeUser(user: any) {
  return {
    id: String(user._id),
    email: user.email,
    role: user.role,
    nombre: user.nombre,
    apellido: user.apellido,
    telefono: user.telefono ?? null,
    avatar: user.avatar ?? null,
    profile: user.profile ?? {},
  }
}

const loginPinInput = z.object({
  oficialUserId: z.string().min(1),
  pin: z.string().min(1),
})

// valida PIN de un oficial y le abre sesion regresando token nuevo
export async function loginPin(rawInput: unknown) {
  const { oficialUserId, pin } = loginPinInput.parse(rawInput)
  const user = await User.findById(oficialUserId)
  if (!user || user.role !== "oficial") {
    throw new ApiError("UNAUTHORIZED", "Credenciales inválidas")
  }
  const expected = user.profile?.oficial?.pin
  if (!expected || expected !== pin) {
    throw new ApiError("UNAUTHORIZED", "Credenciales inválidas")
  }
  const token = crypto.randomUUID()
  user.sessionToken = token
  user.sessionExpiresAt = new Date(Date.now() + SESSION_TTL_MS)
  await user.save()
  return { user: serializeUser(user), token }
}
