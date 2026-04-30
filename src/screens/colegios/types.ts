export type Turno = "Matutino" | "Vespertino" | "Nocturno"

export interface Officer {
  id: string
  nombre: string
  turno: Turno
  avatar: string
  gate?: string
}

export type EstadoResidente = "en_campus" | "fuera" | "invitado"

export interface Residente {
  id: string
  nombre: string
  carrera: string
  semestre: number
  edificio: string
  habitacion: string
  avatar: string
  estado: EstadoResidente
}

export interface Edificio {
  id: string
  nombre: string
  ocupacion: number
  capacidad: number
}

export type TipoMovimiento = "entrada" | "salida"
export type EstadoMovimiento = "normal" | "ebriedad" | "autorizada" | "alerta"

export interface MovimientoResidente {
  id: string
  residenteId: string
  edificioId: string
  hora: string
  tipo: TipoMovimiento
  estado: EstadoMovimiento
}

export type TipoAcceso = "vehicular" | "peatonal"
export type CategoriaVisita = "servicio" | "personal" | "comunidad_udlap"

export interface Visita {
  id: string
  nombreCompleto: string
  categoria: CategoriaVisita
  tipoAcceso: TipoAcceso
  edificioDestinoId: string
  fechaHora: string
  multipleEntrada: boolean
  comentarios?: string
  foto?: string
  tipoId: string
  estatusVisitante: "sin_antecedentes" | "con_antecedentes"
  ubicacionEntrada: string
}

export type SeveridadAlerta = "alta" | "media" | "info"

export interface AlertaColegio {
  id: string
  edificioId?: string
  residenteId?: string
  tipo: "ebriedad" | "items_prohibidos" | "incidente" | "ronda"
  severidad: SeveridadAlerta
  descripcion: string
  timestamp: string
  estado: "activa" | "atendida"
}
