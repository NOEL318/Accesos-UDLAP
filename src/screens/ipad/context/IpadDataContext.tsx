import { createContext, useCallback, useContext, useMemo, useState } from "react"
import type {
  Alerta,
  DashboardKpis,
  EventoAcceso,
  Multa,
  MultaInput,
  Punto,
  Vehiculo,
} from "../types"
import {
  alertasSeed,
  eventosSeed,
  KPI_BASELINE_ENTRADAS_HOY,
  KPI_BASELINE_VEHICULOS_EN_CAMPUS,
  multasSeed,
  puntosSeed,
  vehiculosSeed,
} from "../data"

interface DataValue {
  vehiculos: Vehiculo[]
  multas: Multa[]
  eventos: EventoAcceso[]
  alertas: Alerta[]
  puntosControl: Punto[]
  kpis: DashboardKpis

  permitirAcceso(vehiculoId: string, puntoId: string, oficialId: string): void
  denegarAcceso(
    vehiculoId: string,
    puntoId: string,
    oficialId: string,
    motivo: string
  ): void
  registrarMulta(input: MultaInput, oficialId: string): void
  autorizarSalida(vehiculoId: string, oficialId: string): void
  marcarAlertaAtendida(alertaId: string): void
}

const Ctx = createContext<DataValue | null>(null)

let seq = 1000
const nextId = (prefix: string) => `${prefix}-${++seq}`

export function IpadDataProvider({ children }: { children: React.ReactNode }) {
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>(vehiculosSeed)
  const [multas, setMultas] = useState<Multa[]>(multasSeed)
  const [eventos, setEventos] = useState<EventoAcceso[]>(eventosSeed)
  const [alertas, setAlertas] = useState<Alerta[]>(alertasSeed)

  const permitirAcceso = useCallback(
    (vehiculoId: string, puntoId: string, oficialId: string) => {
      setEventos((prev) => [
        {
          id: nextId("ev"),
          vehiculoId,
          puntoId,
          oficialId,
          resultado: "permitido",
          timestamp: new Date().toISOString(),
        },
        ...prev,
      ])
    },
    []
  )

  const denegarAcceso = useCallback(
    (vehiculoId: string, puntoId: string, oficialId: string, motivo: string) => {
      setEventos((prev) => [
        {
          id: nextId("ev"),
          vehiculoId,
          puntoId,
          oficialId,
          resultado: "denegado",
          motivo,
          timestamp: new Date().toISOString(),
        },
        ...prev,
      ])
      setAlertas((prev) => [
        {
          id: nextId("al"),
          tipo: "incidente",
          severidad: "moderada",
          descripcion: `Acceso denegado · ${motivo}`,
          vehiculoId,
          timestamp: new Date().toISOString(),
          estado: "activa",
        },
        ...prev,
      ])
    },
    []
  )

  const registrarMulta = useCallback(
    (input: MultaInput, oficialId: string) => {
      const nueva: Multa = {
        id: nextId("mu"),
        vehiculoId: input.vehiculoId,
        oficialId,
        tipo: input.tipo,
        montoMxn: input.montoMxn,
        evidencia: input.evidencia,
        comentarios: input.comentarios,
        fecha: new Date().toISOString(),
        estado: "pendiente",
      }
      setMultas((prev) => [nueva, ...prev])
      setVehiculos((prev) =>
        prev.map((v) =>
          v.id === input.vehiculoId
            ? { ...v, multasPendientes: v.multasPendientes + 1 }
            : v
        )
      )
      setAlertas((prev) => [
        {
          id: nextId("al"),
          tipo: "incidente",
          severidad: "moderada",
          descripcion: `Nueva multa registrada: ${input.tipo} · $${input.montoMxn}`,
          vehiculoId: input.vehiculoId,
          timestamp: new Date().toISOString(),
          estado: "activa",
        },
        ...prev,
      ])
    },
    []
  )

  const autorizarSalida = useCallback(
    (vehiculoId: string, oficialId: string) => {
      setVehiculos((prev) =>
        prev.map((v) =>
          v.id === vehiculoId
            ? { ...v, bloqueoSalida: undefined, estadoAcceso: "permitido" }
            : v
        )
      )
      setEventos((prev) => [
        {
          id: nextId("ev"),
          vehiculoId,
          puntoId: "pt-1",
          oficialId,
          resultado: "permitido",
          motivo: "Salida autorizada manualmente",
          timestamp: new Date().toISOString(),
        },
        ...prev,
      ])
    },
    []
  )

  const marcarAlertaAtendida = useCallback((alertaId: string) => {
    setAlertas((prev) =>
      prev.map((a) => (a.id === alertaId ? { ...a, estado: "atendida" } : a))
    )
  }, [])

  const kpis = useMemo<DashboardKpis>(() => {
    const hoy = new Date().toDateString()
    const entradasHoy = eventos.filter(
      (e) => e.resultado === "permitido" && new Date(e.timestamp).toDateString() === hoy
    ).length
    const incidentes = alertas.filter(
      (a) => a.estado === "activa" && (a.severidad === "critica" || a.severidad === "moderada")
    )
    return {
      entradasHoy: entradasHoy + KPI_BASELINE_ENTRADAS_HOY,
      deltaEntradas: 5,
      incidentesActivos: incidentes.length,
      incidentesModerados: incidentes.filter((i) => i.severidad === "moderada").length,
      incidentesCriticos: incidentes.filter((i) => i.severidad === "critica").length,
      vehiculosEnCampus: vehiculos.filter((v) => v.estadoAcceso === "permitido").length + KPI_BASELINE_VEHICULOS_EN_CAMPUS,
      capacidadPct: 64,
      visitasNocturnas: 12,
      pendientesCheckout: 12,
    }
  }, [eventos, alertas, vehiculos])

  const value = useMemo<DataValue>(
    () => ({
      vehiculos,
      multas,
      eventos,
      alertas,
      puntosControl: puntosSeed,
      kpis,
      permitirAcceso,
      denegarAcceso,
      registrarMulta,
      autorizarSalida,
      marcarAlertaAtendida,
    }),
    [
      vehiculos,
      multas,
      eventos,
      alertas,
      kpis,
      permitirAcceso,
      denegarAcceso,
      registrarMulta,
      autorizarSalida,
      marcarAlertaAtendida,
    ]
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useIpadData(): DataValue {
  const v = useContext(Ctx)
  if (!v) throw new Error("useIpadData fuera de IpadDataProvider")
  return v
}
