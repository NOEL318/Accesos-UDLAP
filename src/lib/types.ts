export type Role =
  | "admin"
  | "estudiante"
  | "maestro"
  | "oficial"
  | "proveedor"
  | "exaudlap"
  | "residente"
  | "adminColegios"

export interface UserProfileEstudiante {
  studentId: string
  programa?: string
  semestre?: number
  saldoComedor?: number
  frecuentes?: { nombre: string; iniciales: string }[]
}

export interface User {
  id: string
  email: string
  role: Role
  nombre: string
  apellido: string
  telefono?: string | null
  avatar?: string | null
  profile?: {
    estudiante?: UserProfileEstudiante
    [k: string]: unknown
  }
}

export type VisitaStatus = "programada" | "activa" | "expirada" | "cancelada"
export type TipoAcceso = "vehicular" | "peatonal"
export type CategoriaVisita = "servicio" | "personal" | "comunidad_udlap" | "visita"

export interface Visita {
  _id: string
  anfitrionId: string
  invitado: {
    nombre: string
    tipoId?: string
    foto?: string | null
    categoria: CategoriaVisita
  }
  tipoAcceso: TipoAcceso
  puntoAcceso: string
  fechaHora: string
  multiplesEntradas: boolean
  status: VisitaStatus
  qrToken: string
  qrExpiraEn?: string
  comentarios?: string
  estatusVisitante?: "sin_antecedentes" | "con_antecedentes"
  scans?: {
    puntoId: string
    oficialId?: string
    timestamp: string
    resultado: "permitido" | "denegado"
    motivo?: string
  }[]
  createdAt: string
  updatedAt: string
}
