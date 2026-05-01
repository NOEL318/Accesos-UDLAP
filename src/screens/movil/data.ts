// ── Types ─────────────────────────────────────────────────────────────────

export type VisitaStatus = "activo" | "expirado" | "programado"
export type VisitaTipo = "visita" | "personal"
export type ModoEntrada = "automovil" | "peatonal"

export interface Visita {
  id: string
  nombre: string
  tipo: VisitaTipo
  fecha: string
  hora: string
  status: VisitaStatus
  puntoAcceso: string
  modoEntrada: ModoEntrada
  multiplesEntradas: boolean
  avatar?: string
}

// ── Mock data ──────────────────────────────────────────────────────────────

export const currentUser = {
  nombre: "Juan",
  apellido: "Perez",
  id: "123456",
  studentId: "181278",
  email: "juan.perezml@udlap.mx",
  tipo: "Estudiante Licenciatura",
  saldo: 450.0,
}

export const puntosAcceso = [
  "Acceso Gaos",
  "Canchas de Tenis / Proveedores",
  "Hacienda",
  "Periférico",
  "Recta",
]

export const visitasMock: Visita[] = [
  {
    id: "1",
    nombre: "Ricardo Montiel",
    tipo: "visita",
    fecha: "Hoy",
    hora: "10:15 AM",
    status: "activo",
    puntoAcceso: "Acceso Gaos",
    modoEntrada: "automovil",
    multiplesEntradas: false,
  },
  {
    id: "2",
    nombre: "Servicio de Internet (TotalPlay)",
    tipo: "personal",
    fecha: "12 Oct 2023",
    hora: "03:00 PM",
    status: "expirado",
    puntoAcceso: "Acceso Gaos",
    modoEntrada: "peatonal",
    multiplesEntradas: false,
  },
  {
    id: "3",
    nombre: "Sofía Villaseñor",
    tipo: "visita",
    fecha: "Mañana",
    hora: "09:00 AM",
    status: "programado",
    puntoAcceso: "Recta",
    modoEntrada: "automovil",
    multiplesEntradas: true,
  },
  {
    id: "4",
    nombre: "Uber Eats – Entrega",
    tipo: "personal",
    fecha: "11 Oct 2023",
    hora: "08:45 PM",
    status: "expirado",
    puntoAcceso: "Periférico",
    modoEntrada: "automovil",
    multiplesEntradas: false,
  },
]

export const frecuentesMock = [
  { id: "f1", nombre: "Juan López", iniciales: "JL" },
  { id: "f2", nombre: "Ana S.", iniciales: "AS" },
  { id: "f3", nombre: "Carlos B.", iniciales: "CB" },
  { id: "f4", nombre: "Elena S.", iniciales: "ES" },
]

