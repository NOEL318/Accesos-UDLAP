// ── Oficiales ──────────────────────────────────────────────────────────────

export type Turno = "Matutino" | "Vespertino" | "Nocturno"

export interface Officer {
  id: string
  nombre: string
  turno: Turno
  avatar: string
  pin: string
}

// ── Vehículos ──────────────────────────────────────────────────────────────

export type TipoPropietario = "estudiante" | "empleado" | "visita" | "externo"
export type EstadoAcceso = "permitido" | "denegado" | "revision"

export interface Propietario {
  nombre: string
  idUdlap: string
  tipo: TipoPropietario
}

export interface Sello {
  vigente: boolean
  vence: string // "2024"
}

export interface Vehiculo {
  id: string
  matricula: string
  propietario: Propietario
  foto: string
  modelo: string
  color: string
  sello: Sello
  ubicacion: string
  multasPendientes: number
  estadoAcceso: EstadoAcceso
  ocupantes: number
  bloqueoSalida?: {
    motivo: "multa" | "restriccion_academica" | "incidente"
    descripcion: string
  }
}

// ── Multas ─────────────────────────────────────────────────────────────────

export type EstadoMulta = "pendiente" | "pagada" | "cancelada"

export interface Multa {
  id: string
  vehiculoId: string
  oficialId: string
  tipo: string
  montoMxn: number
  evidencia: string[]
  comentarios: string
  fecha: string // ISO
  estado: EstadoMulta
}

// Input to registrarMulta (id y fecha los pone el contexto)
export interface MultaInput {
  vehiculoId: string
  tipo: string
  montoMxn: number
  evidencia: string[]
  comentarios: string
}

// ── Eventos de acceso (historial) ──────────────────────────────────────────

export type ResultadoEvento = "permitido" | "denegado"

export interface EventoAcceso {
  id: string
  vehiculoId: string
  puntoId: string
  oficialId: string
  resultado: ResultadoEvento
  motivo?: string
  timestamp: string // ISO
}

// ── Alertas ────────────────────────────────────────────────────────────────

export type TipoAlerta =
  | "placa_detectada"
  | "incidente"
  | "salida_bloqueada"
  | "ronda"
  | "visitante"

export type SeveridadAlerta = "critica" | "moderada" | "info"

export type EstadoAlerta = "activa" | "atendida"

export interface Alerta {
  id: string
  tipo: TipoAlerta
  severidad: SeveridadAlerta
  descripcion: string
  vehiculoId?: string
  timestamp: string // ISO
  estado: EstadoAlerta
}

// ── Puntos de control ──────────────────────────────────────────────────────

export type TipoPunto = "principal" | "postgrado" | "deportes" | "residencial"
export type EstadoPunto = "activa" | "standby"

export interface Punto {
  id: string
  nombre: string
  tipo: TipoPunto
  estado: EstadoPunto
  oficialOperadorId: string
}

// ── KPIs derivados ─────────────────────────────────────────────────────────

export interface DashboardKpis {
  entradasHoy: number
  deltaEntradas: number // % vs ayer
  incidentesActivos: number
  incidentesModerados: number
  incidentesCriticos: number
  vehiculosEnCampus: number
  capacidadPct: number
  visitasNocturnas: number
  pendientesCheckout: number
}
