import type {
  Officer,
  Vehiculo,
  Multa,
  EventoAcceso,
  Alerta,
  Punto,
} from "./types"

// ── Oficiales ──────────────────────────────────────────────────────────────

export const officersSeed: Officer[] = [
  {
    id: "of-mendoza",
    nombre: "Oficial Mendoza",
    turno: "Matutino",
    avatar: "https://i.pravatar.cc/120?img=12",
    pin: "1234",
  },
  {
    id: "of-ramirez",
    nombre: "Oficial G. Ramírez",
    turno: "Vespertino",
    avatar: "https://i.pravatar.cc/120?img=15",
    pin: "5678",
  },
  {
    id: "of-garza",
    nombre: "Oficial Garza",
    turno: "Nocturno",
    avatar: "https://i.pravatar.cc/120?img=33",
    pin: "9012",
  },
  {
    id: "of-dominguez",
    nombre: "Oficial Domínguez",
    turno: "Matutino",
    avatar: "https://i.pravatar.cc/120?img=52",
    pin: "3456",
  },
]

// ── Puntos de control ──────────────────────────────────────────────────────

export const puntosSeed: Punto[] = [
  {
    id: "pt-1",
    nombre: "Puerta 1 (Principal)",
    tipo: "principal",
    estado: "activa",
    oficialOperadorId: "of-mendoza",
  },
  {
    id: "pt-2",
    nombre: "Puerta 2 (Postgrado)",
    tipo: "postgrado",
    estado: "activa",
    oficialOperadorId: "of-ramirez",
  },
  {
    id: "pt-3",
    nombre: "Puerta 3 (Deportes)",
    tipo: "deportes",
    estado: "standby",
    oficialOperadorId: "",
  },
  {
    id: "pt-res",
    nombre: "Acceso Residencial",
    tipo: "residencial",
    estado: "activa",
    oficialOperadorId: "",
  },
]

// ── Vehículos ──────────────────────────────────────────────────────────────

export const vehiculosSeed: Vehiculo[] = [
  {
    id: "v1",
    matricula: "ABC-123-D",
    propietario: {
      nombre: "Juan Pérez Rodríguez",
      idUdlap: "154892",
      tipo: "estudiante",
    },
    foto: "https://i.pravatar.cc/160?img=8",
    modelo: "Mazda 3",
    color: "Rojo",
    sello: { vigente: true, vence: "2024" },
    ubicacion: "Puerta 1",
    multasPendientes: 1,
    estadoAcceso: "permitido",
    ocupantes: 2,
  },
  {
    id: "v2",
    matricula: "TXY-4521",
    propietario: {
      nombre: "Carlos Méndez Rivera",
      idUdlap: "156432",
      tipo: "estudiante",
    },
    foto: "https://i.pravatar.cc/160?img=11",
    modelo: "Nissan Versa",
    color: "Blanco",
    sello: { vigente: true, vence: "2024" },
    ubicacion: "Puerta 1",
    multasPendientes: 0,
    estadoAcceso: "permitido",
    ocupantes: 1,
  },
  {
    id: "v3",
    matricula: "UAL-9980",
    propietario: {
      nombre: "Dra. Elena García",
      idUdlap: "400192",
      tipo: "empleado",
    },
    foto: "https://i.pravatar.cc/160?img=47",
    modelo: "Honda Civic",
    color: "Negro",
    sello: { vigente: true, vence: "2024" },
    ubicacion: "Puerta 2",
    multasPendientes: 1,
    estadoAcceso: "permitido",
    ocupantes: 1,
  },
  {
    id: "v4",
    matricula: "MXZ-1122",
    propietario: {
      nombre: "Juan Pérez S.",
      idUdlap: "Externo",
      tipo: "visita",
    },
    foto: "https://i.pravatar.cc/160?img=22",
    modelo: "Toyota Corolla",
    color: "Gris",
    sello: { vigente: false, vence: "2023" },
    ubicacion: "Puerta 1",
    multasPendientes: 0,
    estadoAcceso: "denegado",
    ocupantes: 3,
  },
  {
    id: "v5",
    matricula: "PUE-6734",
    propietario: {
      nombre: "Mariana Torres",
      idUdlap: "158990",
      tipo: "estudiante",
    },
    foto: "https://i.pravatar.cc/160?img=44",
    modelo: "VW Jetta",
    color: "Azul",
    sello: { vigente: true, vence: "2024" },
    ubicacion: "Estacionamiento 2",
    multasPendientes: 3,
    estadoAcceso: "revision",
    ocupantes: 1,
    bloqueoSalida: {
      motivo: "multa",
      descripcion: "3 multas pendientes sin pagar",
    },
  },
  {
    id: "v6",
    matricula: "HGT-5521",
    propietario: {
      nombre: "Andrea S. Valerdi",
      idUdlap: "164082",
      tipo: "estudiante",
    },
    foto: "https://i.pravatar.cc/160?img=49",
    modelo: "Kia Río",
    color: "Blanco",
    sello: { vigente: true, vence: "2024" },
    ubicacion: "Estacionamiento 1",
    multasPendientes: 2,
    estadoAcceso: "revision",
    ocupantes: 1,
    bloqueoSalida: {
      motivo: "restriccion_academica",
      descripcion: "Estudiante con multas de $500",
    },
  },
  {
    id: "v7",
    matricula: "ROB-7788",
    propietario: {
      nombre: "Roberto G. Garza",
      idUdlap: "Empleado-021",
      tipo: "empleado",
    },
    foto: "https://i.pravatar.cc/160?img=68",
    modelo: "Ford Escape",
    color: "Plata",
    sello: { vigente: true, vence: "2024" },
    ubicacion: "Estacionamiento 3",
    multasPendientes: 1,
    estadoAcceso: "revision",
    ocupantes: 1,
    bloqueoSalida: {
      motivo: "incidente",
      descripcion: "Conducir en estado de ebriedad",
    },
  },
]

// ── Multas ─────────────────────────────────────────────────────────────────

export const multasSeed: Multa[] = [
  {
    id: "mu1",
    vehiculoId: "v1",
    oficialId: "of-ramirez",
    tipo: "Estacionamiento prohibido",
    montoMxn: 450,
    evidencia: [],
    comentarios: "Estacionado en zona roja",
    fecha: "2026-04-19T10:30:00Z",
    estado: "pendiente",
  },
  {
    id: "mu2",
    vehiculoId: "v3",
    oficialId: "of-mendoza",
    tipo: "Exceso de velocidad",
    montoMxn: 850,
    evidencia: [],
    comentarios: "45 km/h en zona escolar",
    fecha: "2026-04-15T08:15:00Z",
    estado: "pendiente",
  },
  {
    id: "mu3",
    vehiculoId: "v5",
    oficialId: "of-ramirez",
    tipo: "No respetar alto",
    montoMxn: 600,
    evidencia: [],
    comentarios: "",
    fecha: "2026-04-10T17:45:00Z",
    estado: "pendiente",
  },
]

// ── Eventos (historial) ────────────────────────────────────────────────────

export const eventosSeed: EventoAcceso[] = [
  {
    id: "ev1",
    vehiculoId: "v2",
    puntoId: "pt-1",
    oficialId: "of-mendoza",
    resultado: "permitido",
    timestamp: "2026-04-21T14:22:00Z",
  },
  {
    id: "ev2",
    vehiculoId: "v1",
    puntoId: "pt-1",
    oficialId: "of-mendoza",
    resultado: "permitido",
    timestamp: "2026-04-21T13:58:00Z",
  },
  {
    id: "ev3",
    vehiculoId: "v4",
    puntoId: "pt-1",
    oficialId: "of-mendoza",
    resultado: "denegado",
    motivo: "Sello vencido",
    timestamp: "2026-04-21T13:12:00Z",
  },
  {
    id: "ev4",
    vehiculoId: "v3",
    puntoId: "pt-2",
    oficialId: "of-ramirez",
    resultado: "permitido",
    timestamp: "2026-04-21T12:40:00Z",
  },
]

// ── Alertas ────────────────────────────────────────────────────────────────

export const alertasSeed: Alerta[] = [
  {
    id: "al1",
    tipo: "placa_detectada",
    severidad: "info",
    descripcion: "Placa Detectada: ABC-1234 · Ingreso por Puerta 1",
    vehiculoId: "v1",
    timestamp: "2026-04-21T14:22:00Z",
    estado: "activa",
  },
  {
    id: "al2",
    tipo: "incidente",
    severidad: "moderada",
    descripcion: "Objetos perdidos en Biblioteca",
    timestamp: "2026-04-21T14:05:00Z",
    estado: "activa",
  },
  {
    id: "al3",
    tipo: "ronda",
    severidad: "info",
    descripcion: "Ronda Perimetral Completada · Sector 4 (Residencias)",
    timestamp: "2026-04-21T13:45:00Z",
    estado: "atendida",
  },
  {
    id: "al4",
    tipo: "visitante",
    severidad: "info",
    descripcion: "Nuevo Visitante: Juan Pérez · Destino: Edificio Administrativo",
    timestamp: "2026-04-21T13:30:00Z",
    estado: "activa",
  },
  {
    id: "al5",
    tipo: "salida_bloqueada",
    severidad: "critica",
    descripcion: "Salida bloqueada · Roberto G. Garza · Estado de ebriedad",
    vehiculoId: "v7",
    timestamp: "2026-04-21T12:55:00Z",
    estado: "activa",
  },
]

// ── Constantes de demo para KPIs (baselines del mockup) ────────────────────

/**
 * Offset sumado al conteo reactivo de entradas para que el KPI arranque
 * en cifras plausibles del mockup. Removerlo al conectar backend real.
 */
export const KPI_BASELINE_ENTRADAS_HOY = 1284

/** Offset para que "Vehículos en Campus" arranque en cifras del mockup. */
export const KPI_BASELINE_VEHICULOS_EN_CAMPUS = 450

// ── Flujo vehicular 24h (para el gráfico) ──────────────────────────────────

export const flujo24hSeed = [
  { franja: "00h", label: "MEDIA NOCHE", valor: 42 },
  { franja: "03h", label: "MADRUGADA", valor: 28 },
  { franja: "06h", label: "AMANECER", valor: 95 },
  { franja: "09h", label: "MAÑANA PEAK", valor: 180 },
  { franja: "12h", label: "MEDIO DÍA", valor: 140 },
  { franja: "15h", label: "TARDE", valor: 110 },
  { franja: "18h", label: "SALIDA", valor: 165 },
  { franja: "21h", label: "NOCHE", valor: 55 },
]
