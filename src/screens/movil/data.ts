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

export interface MenuItem {
  id: string
  nombre: string
  precio: number
  descripcion: string
  categoria: "principal" | "economico" | "vegano"
  emoji: string
}

export interface Libro {
  id: string
  titulo: string
  autor: string
  estado: "prestamo" | "deseo" | "disponible"
  dueDate?: string
  cover: string
}

export interface ClaseHorario {
  dia: number // 0=Lu 1=Ma 2=Mi 3=Ju 4=Vi 5=Sá
  inicio: number // hora decimal, ej: 7.5 = 7:30
  fin: number
  materia: string
  salon: string
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

export const menuMock: MenuItem[] = [
  {
    id: "m1",
    nombre: "Bowl Mediterráneo",
    precio: 95,
    descripcion: "Quinoa, garbanzos, pepino, tomate cherry",
    categoria: "principal",
    emoji: "🥗",
  },
  {
    id: "m2",
    nombre: "Ensalada del Chef",
    precio: 63,
    descripcion: "Lechuga mixta, pollo a la plancha, aderezo cesar",
    categoria: "economico",
    emoji: "🥙",
  },
  {
    id: "m3",
    nombre: "Crema de Tomate",
    precio: 45,
    descripcion: "Sopa crema con crutones y albahaca fresca",
    categoria: "vegano",
    emoji: "🍲",
  },
  {
    id: "m4",
    nombre: "Pollo a la Plancha",
    precio: 85,
    descripcion: "Con arroz integral y verduras al vapor",
    categoria: "principal",
    emoji: "🍗",
  },
  {
    id: "m5",
    nombre: "Agua de Jamaica",
    precio: 25,
    descripcion: "500 ml, sin azúcar añadida",
    categoria: "economico",
    emoji: "🧃",
  },
]

export const librosMock: Libro[] = [
  {
    id: "b1",
    titulo: "Sistemas Operativos Modernos",
    autor: "Andrew S. Tanenbaum",
    estado: "prestamo",
    dueDate: "28 Oct 2023",
    cover: "📘",
  },
  {
    id: "b2",
    titulo: "Cálculo Integral",
    autor: "James Stewart",
    estado: "prestamo",
    dueDate: "02 Nov 2023",
    cover: "📗",
  },
  {
    id: "b3",
    titulo: "Artificial Intelligence",
    autor: "Stuart Russell",
    estado: "deseo",
    cover: "📙",
  },
  {
    id: "b4",
    titulo: "Architecture Design Patterns",
    autor: "Martin Fowler",
    estado: "deseo",
    cover: "📕",
  },
  {
    id: "b5",
    titulo: "Class C++ Design",
    autor: "Bjarne Stroustrup",
    estado: "deseo",
    cover: "📓",
  },
]

export const horarioMock: ClaseHorario[] = [
  { dia: 0, inicio: 7, fin: 8.5, materia: "Cálculo Integral", salon: "CF301" },
  { dia: 0, inicio: 9, fin: 10, materia: "Física II", salon: "CF201" },
  { dia: 0, inicio: 11, fin: 12.5, materia: "Programación", salon: "CH105" },
  { dia: 0, inicio: 14, fin: 15, materia: "Inglés B2", salon: "EI201" },
  { dia: 1, inicio: 13, fin: 14, materia: "Ética Prof.", salon: "HM302" },
  { dia: 1, inicio: 14, fin: 15, materia: "Estadística", salon: "CF402" },
  { dia: 1, inicio: 16, fin: 17.5, materia: "Lab Física", salon: "LF101" },
  { dia: 2, inicio: 7, fin: 8, materia: "Cálculo Integral", salon: "CF301" },
  { dia: 2, inicio: 9, fin: 10, materia: "Física II", salon: "CF201" },
  { dia: 2, inicio: 11, fin: 12.5, materia: "Programación", salon: "CH105" },
  { dia: 2, inicio: 14, fin: 15, materia: "Inglés B2", salon: "EI201" },
  { dia: 3, inicio: 13, fin: 14.5, materia: "Ética Prof.", salon: "HM302" },
  { dia: 3, inicio: 16, fin: 17.5, materia: "Estadística", salon: "CF402" },
  { dia: 4, inicio: 8, fin: 9.5, materia: "Lab Programación", salon: "CH102" },
  { dia: 5, inicio: 8, fin: 9.5, materia: "Tutoría", salon: "DF201" },
]
