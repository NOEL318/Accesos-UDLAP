import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import type {
  Alerta,
  DashboardKpis,
  EventoAcceso,
  Multa,
  MultaInput,
  Punto,
  SeveridadAlerta,
  Vehiculo,
} from "../types"
import { useIpadVehiculos } from "../hooks/useIpadVehiculos"
import { useIpadMultas } from "../hooks/useIpadMultas"
import { useIpadEventos } from "../hooks/useIpadEventos"
import { useIpadAlertas } from "../hooks/useIpadAlertas"
import { useIpadKpis } from "../hooks/useIpadKpis"
import { api } from "@/lib/api"

interface DataValue {
  vehiculos: Vehiculo[]
  multas: Multa[]
  eventos: EventoAcceso[]
  alertas: Alerta[]
  puntosControl: Punto[]
  kpis: DashboardKpis
  loading: boolean

  permitirAcceso(vehiculoId: string, puntoId: string, oficialId: string): Promise<void>
  denegarAcceso(
    vehiculoId: string,
    puntoId: string,
    oficialId: string,
    motivo: string
  ): Promise<void>
  registrarMulta(input: MultaInput, oficialId: string): Promise<void>
  autorizarSalida(vehiculoId: string, oficialId: string): Promise<void>
  marcarAlertaAtendida(alertaId: string): Promise<void>
}

const Ctx = createContext<DataValue | null>(null)

// ── Adapters: Mongo docs → tipos legacy del frontend ──────────────────────

// convierte un doc de Mongo a un Vehiculo del frontend
function adaptVehiculo(v: any): Vehiculo {
  return {
    id: String(v._id ?? ""),
    matricula: v.matricula ?? "",
    propietario: {
      nombre: v.propietarioInfo?.nombre ?? "",
      idUdlap: v.propietarioInfo?.idUdlap ?? "",
      tipo: v.propietarioInfo?.tipo ?? "externo",
    },
    foto: v.foto ?? "",
    modelo: v.modelo ?? "",
    color: v.color ?? "",
    sello: {
      vigente: v.sello?.vigente ?? false,
      vence: v.sello?.vence
        ? String(new Date(v.sello.vence).getFullYear())
        : "",
    },
    ubicacion: v.ubicacion ?? "",
    multasPendientes: v.multasPendientes ?? 0,
    estadoAcceso: v.estadoAcceso ?? "permitido",
    ocupantes: v.ocupantes ?? 1,
    bloqueoSalida: v.bloqueoSalida,
  }
}

// convierte un doc de Mongo a una Multa del frontend
function adaptMulta(m: any): Multa {
  return {
    id: String(m._id ?? ""),
    vehiculoId: String(m.vehiculoId ?? ""),
    oficialId: String(m.oficialId ?? ""),
    tipo: m.tipo ?? "",
    montoMxn: m.montoMxn ?? 0,
    evidencia: m.evidencia ?? [],
    comentarios: m.comentarios ?? "",
    fecha: m.fecha
      ? typeof m.fecha === "string"
        ? m.fecha
        : new Date(m.fecha).toISOString()
      : "",
    estado: m.estado ?? "pendiente",
  }
}

// convierte un doc de Mongo a un EventoAcceso del frontend
function adaptEvento(e: any): EventoAcceso {
  return {
    id: String(e._id ?? ""),
    vehiculoId: String(e.vehiculoId ?? ""),
    puntoId: String(e.puntoId ?? ""),
    oficialId: String(e.oficialId ?? ""),
    resultado: e.resultado,
    motivo: e.motivo,
    timestamp: e.timestamp
      ? typeof e.timestamp === "string"
        ? e.timestamp
        : new Date(e.timestamp).toISOString()
      : "",
  }
}

// convierte un doc de Mongo a una Alerta y normaliza la severidad al enum legacy
function adaptAlerta(a: any): Alerta {
  // Backend admite "critica" | "alta" | "moderada" | "media" | "info"
  // Frontend legacy solo: "critica" | "moderada" | "info"
  let severidad: SeveridadAlerta = "info"
  switch (a.severidad) {
    case "critica":
      severidad = "critica"
      break
    case "alta":
    case "moderada":
    case "media":
      severidad = "moderada"
      break
    case "info":
    default:
      severidad = "info"
  }
  return {
    id: String(a._id ?? ""),
    tipo: a.tipo,
    severidad,
    descripcion: a.descripcion ?? "",
    vehiculoId: a.refs?.vehiculoId ? String(a.refs.vehiculoId) : undefined,
    timestamp: a.timestamp
      ? typeof a.timestamp === "string"
        ? a.timestamp
        : new Date(a.timestamp).toISOString()
      : "",
    estado: a.estado ?? "activa",
  }
}

// convierte un doc de Mongo a un Punto de control del frontend
function adaptPunto(p: any): Punto {
  return {
    id: String(p._id ?? ""),
    nombre: p.nombre ?? "",
    tipo: p.tipo ?? "principal",
    estado: p.estado ?? "activa",
    oficialOperadorId: String(p.oficialOperadorId ?? ""),
  }
}

const FALLBACK_KPIS: DashboardKpis = {
  entradasHoy: 0,
  deltaEntradas: 0,
  incidentesActivos: 0,
  incidentesModerados: 0,
  incidentesCriticos: 0,
  vehiculosEnCampus: 0,
  capacidadPct: 0,
  visitasNocturnas: 0,
  pendientesCheckout: 0,
}

// provider que mantiene la data global del iPad (vehiculos, multas, eventos, alertas, kpis, puntos)
export function IpadDataProvider({ children }: { children: ReactNode }) {
  const vehHook = useIpadVehiculos()
  const multHook = useIpadMultas()
  const evHook = useIpadEventos()
  const alHook = useIpadAlertas()
  const kpisHook = useIpadKpis()
  const [puntos, setPuntos] = useState<Punto[]>([])

  // carga los puntos de control una sola vez al montar
  useEffect(() => {
    void api
      .get<any[]>("/api/puntos-control")
      .then((items) => setPuntos(items.map(adaptPunto)))
      .catch(() => setPuntos([]))
  }, [])

  // arma el value del context combinando data adaptada y acciones de hooks
  const value = useMemo<DataValue>(
    () => ({
      vehiculos: vehHook.data.map(adaptVehiculo),
      multas: multHook.data.map(adaptMulta),
      eventos: evHook.data.map(adaptEvento),
      alertas: alHook.data.map(adaptAlerta),
      puntosControl: puntos,
      kpis: kpisHook.data ?? FALLBACK_KPIS,
      loading: vehHook.loading || kpisHook.loading,
      async permitirAcceso(vehiculoId, puntoId) {
        await vehHook.permitir(vehiculoId, puntoId)
        await Promise.all([evHook.refresh(), kpisHook.refresh()])
      },
      async denegarAcceso(vehiculoId, puntoId, _oficialId, motivo) {
        await vehHook.denegar(vehiculoId, motivo, puntoId)
        await Promise.all([evHook.refresh(), alHook.refresh(), kpisHook.refresh()])
      },
      async registrarMulta(input) {
        await multHook.crear(input)
        await Promise.all([vehHook.refresh(), alHook.refresh()])
      },
      async autorizarSalida(vehiculoId) {
        await vehHook.autorizarSalida(vehiculoId)
        await evHook.refresh()
      },
      async marcarAlertaAtendida(alertaId) {
        await alHook.atender(alertaId)
      },
    }),
    [vehHook, multHook, evHook, alHook, kpisHook, puntos]
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
// hook para consumir el IpadDataContext, lanza error si esta fuera del provider
export function useIpadData(): DataValue {
  const v = useContext(Ctx)
  if (!v) throw new Error("useIpadData fuera de IpadDataProvider")
  return v
}
