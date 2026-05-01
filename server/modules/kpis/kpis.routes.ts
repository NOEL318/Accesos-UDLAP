import { Router } from "express"
import { asyncHandler } from "../../lib/asyncHandler.js"
import { requireAuth, requireRole } from "../../middlewares/auth.js"
import { Vehiculo } from "../vehiculos/vehiculo.model.js"
import { EventoAcceso } from "../vehiculos/evento.model.js"
import { Alerta } from "../alertas/alerta.model.js"
import { Edificio } from "../colegios/edificio.model.js"
import { Movimiento } from "../colegios/movimiento.model.js"
import { User } from "../users/user.model.js"

export const kpisRoutes = Router()
kpisRoutes.use(requireAuth)

// GET /api/kpis/ipad - regresa los KPIs del dashboard de seguridad para el iPad
kpisRoutes.get(
  "/ipad",
  requireRole("oficial", "admin"),
  asyncHandler(async (_req, res) => {
    const startToday = new Date()
    startToday.setHours(0, 0, 0, 0)
    const startYesterday = new Date(startToday.getTime() - 86400000)

    const [entradasHoy, entradasAyer, vehiculosEnCampus, alertas] = await Promise.all([
      EventoAcceso.countDocuments({ resultado: "permitido", timestamp: { $gte: startToday } }),
      EventoAcceso.countDocuments({
        resultado: "permitido",
        timestamp: { $gte: startYesterday, $lt: startToday },
      }),
      Vehiculo.countDocuments({ estadoAcceso: "permitido" }),
      Alerta.find({ scope: "vehicular", estado: "activa" }).lean(),
    ])

    const moderadas = alertas.filter((a) => a.severidad === "moderada").length
    const criticas = alertas.filter((a) => a.severidad === "critica").length
    const deltaEntradas = entradasAyer === 0 ? 0 : Math.round(((entradasHoy - entradasAyer) / entradasAyer) * 100)

    res.json({
      data: {
        entradasHoy,
        deltaEntradas,
        incidentesActivos: alertas.length,
        incidentesModerados: moderadas,
        incidentesCriticos: criticas,
        vehiculosEnCampus,
        capacidadPct: Math.min(100, Math.round((vehiculosEnCampus / 600) * 100)),
        visitasNocturnas: 0, // a futuro
        pendientesCheckout: await Vehiculo.countDocuments({ "bloqueoSalida.motivo": { $exists: true } }),
      },
    })
  })
)

// GET /api/kpis/colegios - regresa los KPIs del dashboard de colegios residenciales
kpisRoutes.get(
  "/colegios",
  requireRole("adminColegios", "admin"),
  asyncHandler(async (_req, res) => {
    const startToday = new Date()
    startToday.setHours(0, 0, 0, 0)

    const [edificios, residentesTotal, residentesEnCampus, alertasActivas, movimientosHoy] = await Promise.all([
      Edificio.find().lean(),
      User.countDocuments({ role: "residente" }),
      User.countDocuments({ role: "residente", "profile.residente.estado": "en_campus" }),
      Alerta.countDocuments({ scope: "residencial", estado: "activa" }),
      Movimiento.countDocuments({ hora: { $gte: startToday } }),
    ])

    const capacidadTotal = edificios.reduce((acc, e) => acc + (e.capacidad ?? 0), 0)

    res.json({
      data: {
        residentesTotal,
        residentesEnCampus,
        residentesFuera: residentesTotal - residentesEnCampus,
        capacidadTotal,
        capacidadPct: capacidadTotal === 0 ? 0 : Math.round((residentesEnCampus / capacidadTotal) * 100),
        alertasActivas,
        movimientosHoy,
        edificios: edificios.length,
      },
    })
  })
)
