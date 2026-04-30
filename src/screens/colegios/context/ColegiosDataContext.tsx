import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import type {
  AlertaColegio,
  Edificio,
  MovimientoResidente,
  Residente,
  Visita,
} from "../types"
import { useColegiosEdificios } from "../hooks/useColegiosEdificios"
import { useColegiosResidentes } from "../hooks/useColegiosResidentes"
import { useColegiosMovimientos } from "../hooks/useColegiosMovimientos"
import { useColegiosAlertas } from "../hooks/useColegiosAlertas"
import { useColegiosVisitas } from "../hooks/useColegiosVisitas"

interface DataValue {
  edificios: Edificio[]
  residentes: Residente[]
  movimientos: MovimientoResidente[]
  alertas: AlertaColegio[]
  visitas: Visita[]
  registrarVisita(input: Omit<Visita, "id">): Promise<Visita>
  ultimaVisita: Visita | null
  loading: boolean
}

const Ctx = createContext<DataValue | null>(null)

// convierte un edificio del backend al shape que usan las pantallas
function adaptEdificio(e: any): Edificio {
  return {
    id: String(e._id),
    nombre: e.nombre,
    ocupacion: e.ocupacion ?? 0,
    capacidad: e.capacidad ?? 0,
  }
}

// fábrica de adapter de residentes que resuelve el nombre del edificio por id mongo
function makeAdaptResidente(edificiosByMongoId: Map<string, string>) {
  return (u: any): Residente => {
    const edId = String(u.profile?.residente?.edificioId ?? "")
    return {
      id: u.profile?.residente?.studentId ?? String(u._id),
      nombre: `${u.nombre} ${u.apellido}`,
      carrera: u.profile?.residente?.programa ?? "",
      semestre: u.profile?.residente?.semestre ?? 1,
      // Importante: el screen usa `r.edificio` como NOMBRE legible (no el id)
      edificio: edificiosByMongoId.get(edId) ?? "",
      habitacion: u.profile?.residente?.habitacion ?? "",
      avatar: u.avatar ?? "",
      estado: u.profile?.residente?.estado ?? "fuera",
    }
  }
}

// fábrica de adapter de movimientos que mapea userId a studentId del residente
function makeAdaptMovimiento(userIdToStudentId: Map<string, string>) {
  return (m: any): MovimientoResidente => {
    const d = new Date(m.hora)
    const userIdStr = String(m.residenteUserId)
    return {
      id: String(m._id),
      // Importante: el screen busca `residentes.find(r => r.id === movimiento.residenteId)`
      // y `Residente.id` es studentId. Por eso resolvemos userId -> studentId.
      residenteId: userIdToStudentId.get(userIdStr) ?? userIdStr,
      edificioId: String(m.edificioId),
      hora: d.toLocaleTimeString("es-MX", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
      tipo: m.tipo,
      estado: m.estado,
    }
  }
}

// convierte una alerta del backend al shape legacy y normaliza la severidad
function adaptAlerta(a: any): AlertaColegio {
  // Map server severidad to legacy enum (alta/media/info)
  const severidadMap: Record<string, AlertaColegio["severidad"]> = {
    critica: "alta",
    alta: "alta",
    moderada: "media",
    media: "media",
    info: "info",
  }
  return {
    id: String(a._id),
    edificioId: a.refs?.edificioId ? String(a.refs.edificioId) : undefined,
    residenteId: a.refs?.residenteUserId ? String(a.refs.residenteUserId) : undefined,
    tipo: a.tipo as AlertaColegio["tipo"],
    severidad: severidadMap[a.severidad] ?? "info",
    descripcion: a.descripcion,
    timestamp: a.timestamp,
    estado: a.estado,
  }
}

// convierte una visita del backend al shape que esperan las pantallas
function adaptVisita(v: any): Visita {
  return {
    id: String(v._id),
    nombreCompleto: v.invitado?.nombre ?? "",
    categoria: v.invitado?.categoria ?? "comunidad_udlap",
    tipoAcceso: v.tipoAcceso,
    edificioDestinoId: String(v.edificioDestinoId ?? ""),
    fechaHora: v.fechaHora,
    multipleEntrada: v.multiplesEntradas ?? false,
    comentarios: v.comentarios,
    foto: v.invitado?.foto,
    tipoId: v.invitado?.tipoId ?? "",
    estatusVisitante: v.estatusVisitante ?? "sin_antecedentes",
    ubicacionEntrada: v.puntoAcceso ?? "",
  }
}

// provider con la data global de colegios: edificios, residentes, movimientos, alertas y visitas
export function ColegiosDataProvider({ children }: { children: ReactNode }) {
  const edHook = useColegiosEdificios()
  const resHook = useColegiosResidentes()
  const movHook = useColegiosMovimientos()
  const alHook = useColegiosAlertas()
  const visHook = useColegiosVisitas()

  const [ultima, setUltima] = useState<Visita | null>(null)

  // registra una visita nueva en el backend y guarda la última para mostrarla
  const registrar = useCallback(
    async (input: Omit<Visita, "id">): Promise<Visita> => {
      // Convertir el formato legacy al formato del backend
      const payload = {
        invitado: {
          nombre: input.nombreCompleto,
          categoria: input.categoria,
          tipoId: input.tipoId,
          foto: input.foto,
        },
        tipoAcceso: input.tipoAcceso,
        puntoAcceso: input.ubicacionEntrada,
        fechaHora: input.fechaHora,
        multiplesEntradas: input.multipleEntrada,
        comentarios: input.comentarios,
        edificioDestinoId: input.edificioDestinoId,
      }
      const created = await visHook.registrar(payload)
      const adapted = adaptVisita(created)
      setUltima(adapted)
      return adapted
    },
    [visHook]
  )

  // adapta toda la data del backend a los shapes legacy y arma el value del contexto
  const value = useMemo<DataValue>(() => {
    // Maps para resolver IDs entre dominios
    const edificiosByMongoId = new Map<string, string>(
      edHook.data.map((e: any) => [String(e._id), String(e.nombre ?? "")])
    )
    const userIdToStudentId = new Map<string, string>(
      resHook.data.map((u: any) => [
        String(u._id),
        String(u.profile?.residente?.studentId ?? u._id),
      ])
    )

    const adaptR = makeAdaptResidente(edificiosByMongoId)
    const adaptM = makeAdaptMovimiento(userIdToStudentId)

    return {
      edificios: edHook.data.map(adaptEdificio),
      residentes: resHook.data.map(adaptR),
      movimientos: movHook.data.map(adaptM),
      alertas: alHook.data.map(adaptAlerta),
      visitas: visHook.data.map(adaptVisita),
      ultimaVisita: ultima,
      registrarVisita: registrar,
      loading:
        edHook.loading || resHook.loading || movHook.loading || alHook.loading,
    }
  }, [edHook, resHook, movHook, alHook, visHook, ultima, registrar])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

// hook para acceder al contexto con la data global del módulo colegios
// eslint-disable-next-line react-refresh/only-export-components
export function useColegiosData(): DataValue {
  const v = useContext(Ctx)
  if (!v) throw new Error("useColegiosData fuera de ColegiosDataProvider")
  return v
}
