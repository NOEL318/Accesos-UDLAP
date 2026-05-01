import type { RequestHandler } from "express"
import { findUserBySessionToken } from "../modules/auth/auth.service.js"
import type { Role } from "../modules/users/user.model.js"
import { ApiError } from "../lib/errors.js"

declare module "express-serve-static-core" {
  interface Request {
    user?: any
    authToken?: string
  }
}

// lee el bearer token del header Authorization, o null si no hay
function readToken(req: Parameters<RequestHandler>[0]): string | null {
  const h = req.headers.authorization
  if (!h) return null
  const [scheme, token] = h.split(" ")
  if (scheme !== "Bearer" || !token) return null
  return token
}

// middleware que valida el token de sesion y adjunta el usuario al request
export const requireAuth: RequestHandler = async (req, _res, next) => {
  try {
    const token = readToken(req)
    if (!token) throw new ApiError("UNAUTHORIZED", "Falta token")
    const user = await findUserBySessionToken(token)
    if (!user) throw new ApiError("UNAUTHORIZED", "Token inválido o expirado")
    req.user = user
    req.authToken = token
    next()
  } catch (err) {
    next(err)
  }
}

// middleware que checa que el usuario autenticado tenga alguno de los roles permitidos
export const requireRole =
  (...roles: Role[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.user) return next(new ApiError("UNAUTHORIZED", "No autenticado"))
    if (!roles.includes(req.user.role)) {
      return next(new ApiError("FORBIDDEN", "No tienes permiso para esto"))
    }
    next()
  }
