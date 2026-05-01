import express from "express"
import cors from "cors"
import { env } from "./env.js"
import { connectDb } from "./db.js"
import { errorHandler, notFoundHandler } from "./middlewares/error.js"
import { authRoutes } from "./modules/auth/auth.routes.js"
import { visitasRoutes } from "./modules/visitas/visitas.routes.js"
import { usersRoutes } from "./modules/users/users.routes.js"
import {
  vehiculosRoutes,
  multasRoutes,
  eventosRoutes,
  puntosRoutes,
} from "./modules/vehiculos/vehiculos.routes.js"
import { alertasRoutes } from "./modules/alertas/alertas.routes.js"
import { kpisRoutes } from "./modules/kpis/kpis.routes.js"
import { quioscoRoutes } from "./modules/quiosco/quiosco.routes.js"
import { colegiosRoutes } from "./modules/colegios/colegios.routes.js"

// arma la app de express con cors, json, conexion a mongo y todas las rutas montadas
export function createApp() {
  const app = express()

  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
    })
  )
  app.use(express.json({ limit: "10mb" }))

  app.use(async (_req, _res, next) => {
    try {
      await connectDb()
      next()
    } catch (err) {
      next(err)
    }
  })

  app.get("/api/health", (_req, res) => {
    res.json({ data: { ok: true, ts: new Date().toISOString() } })
  })

  app.use("/api/auth", authRoutes)
  app.use("/api/users", usersRoutes)
  app.use("/api/visitas", visitasRoutes)
  app.use("/api/vehiculos", vehiculosRoutes)
  app.use("/api/multas", multasRoutes)
  app.use("/api/eventos-acceso", eventosRoutes)
  app.use("/api/puntos-control", puntosRoutes)
  app.use("/api/alertas", alertasRoutes)
  app.use("/api/kpis", kpisRoutes)
  app.use("/api/quiosco", quioscoRoutes)
  app.use("/api/colegios", colegiosRoutes)

  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}
