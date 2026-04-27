# Interfaz iPad Seguridad UDLAP — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir las 8 pantallas de la interfaz iPad (Login + Dashboard + Punto de Control + Salidas + Vehículos + Multas + Historial + Alertas) destinada a oficiales de seguridad UDLAP, con layout compartido, datos mock reactivos y responsivo completo.

**Architecture:** Espejo del patrón `src/screens/movil/`. Dos React Contexts separados (Session + Data) viven dentro de `IpadLayout`. Todas las pantallas consumen los contextos vía hooks `useIpadSession` / `useIpadData`. Sidebar jerárquico colapsable (Sheet en mobile, rail en tablet, completo en desktop). Sin backend, sin tests automatizados (el repo no tiene framework de tests).

**Tech Stack:** React 19 · Vite · TypeScript · Tailwind CSS 4 · shadcn/ui · radix-ui · lucide-react · react-router-dom 7.

**⚠️ Nota sobre commits:** El usuario pidió **NO hacer commits automáticos**. Cada tarea termina con una **verificación visual/type-check**, nunca con `git commit`. Dejar los cambios sin commitear — el usuario decide cuándo commitear.

---

## File Structure

### Nuevos archivos

```
src/screens/ipad/
├── IpadLayout.tsx
├── IpadSidebar.tsx
├── IpadHeader.tsx
├── LoginScreen.tsx
├── DashboardScreen.tsx
├── PuntoControlScreen.tsx
├── SalidasScreen.tsx
├── VehiculosScreen.tsx
├── MultasScreen.tsx
├── HistorialScreen.tsx
├── AlertasScreen.tsx
├── types.ts
├── data.ts
├── components/
│   ├── KpiCard.tsx
│   ├── StatusBadge.tsx
│   ├── SectionCard.tsx
│   ├── ActivityFeedItem.tsx
│   ├── PuntoControlCard.tsx
│   ├── VehiculoPreviewCard.tsx
│   ├── FlujoBarChart.tsx
│   ├── PinKeypad.tsx
│   └── NumericKey.tsx
└── context/
    ├── IpadSessionContext.tsx
    └── IpadDataContext.tsx
```

### Archivos existentes modificados

- `src/App.tsx` — reemplazar ruta `/ipad → ComingSoon` por rutas iPad anidadas
- `src/screens/InterfaceSelector.tsx` — marcar iPad como disponible (`available: true`, `screens: "8 pantallas"`)

### Componentes shadcn que posiblemente falten

- `table`, `dialog` — se instalan vía CLI si no existen

---

## Task 1: Setup inicial (shadcn + estructura de carpetas)

**Files:**
- Create dir: `src/screens/ipad/`
- Create dir: `src/screens/ipad/components/`
- Create dir: `src/screens/ipad/context/`
- Possibly create: `src/components/ui/table.tsx`, `src/components/ui/dialog.tsx` (via shadcn CLI)

- [ ] **Step 1: Verificar qué componentes shadcn faltan**

Run:
```bash
ls src/components/ui/
```

Expected: lista incluye `button.tsx`, `card.tsx`, `badge.tsx`, `input.tsx`, `textarea.tsx`, `select.tsx`, `combobox.tsx`, `tabs.tsx`, `avatar.tsx`, `separator.tsx`, `sheet.tsx`, `switch.tsx`, `label.tsx`, `field.tsx`, `skeleton.tsx`, `dropdown-menu.tsx`, `input-group.tsx`, `alert-dialog.tsx`, `progress.tsx`. **No hay `table.tsx` ni `dialog.tsx`**.

- [ ] **Step 2: Instalar el componente faltante**

Run:
```bash
npx shadcn@latest add table
```

Expected: el archivo `src/components/ui/table.tsx` aparece. Si la CLI pregunta por overwrite, responder No.

- [ ] **Step 3: Crear estructura de carpetas iPad**

Run:
```bash
mkdir -p src/screens/ipad/components src/screens/ipad/context
```

Expected: los directorios existen. Verificar con `ls src/screens/ipad/`.

- [ ] **Step 4: Verificar typecheck limpio**

Run:
```bash
npm run build
```

Expected: build pasa sin errores (los nuevos componentes shadcn deben compilar). Si hay conflictos de dependencias, resolver según output.

---

## Task 2: Tipos (`types.ts`)

**Files:**
- Create: `src/screens/ipad/types.ts`

- [ ] **Step 1: Crear `src/screens/ipad/types.ts` con todas las interfaces**

Contenido completo del archivo:

```ts
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
  nivelBajo: number
  nivelModerado: number
  vehiculosEnCampus: number
  capacidadPct: number
  visitasNocturnas: number
  pendientesCheckout: number
}
```

- [ ] **Step 2: Verificar typecheck**

Run:
```bash
npm run build
```

Expected: pasa sin errores.

---

## Task 3: Seed data (`data.ts`)

**Files:**
- Create: `src/screens/ipad/data.ts`

- [ ] **Step 1: Crear `src/screens/ipad/data.ts` con seeds iniciales**

Contenido completo del archivo:

```ts
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
    oficialOperadorId: "of-garcia",
  },
  {
    id: "pt-2",
    nombre: "Puerta 2 (Postgrado)",
    tipo: "postgrado",
    estado: "activa",
    oficialOperadorId: "of-perez",
  },
  {
    id: "pt-3",
    nombre: "Puerta 3 (Deportes)",
    tipo: "deportes",
    estado: "standby",
    oficialOperadorId: "of-programada",
  },
  {
    id: "pt-res",
    nombre: "Acceso Residencial",
    tipo: "residencial",
    estado: "activa",
    oficialOperadorId: "auto",
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
```

- [ ] **Step 2: Verificar typecheck**

Run:
```bash
npm run build
```

Expected: pasa sin errores.

---

## Task 4: `IpadSessionContext`

**Files:**
- Create: `src/screens/ipad/context/IpadSessionContext.tsx`

- [ ] **Step 1: Crear `IpadSessionContext.tsx`**

Contenido completo:

```tsx
import { createContext, useContext, useEffect, useMemo, useState } from "react"
import type { Officer } from "../types"
import { officersSeed } from "../data"

interface SessionValue {
  officer: Officer | null
  officers: Officer[]
  login(id: string, pin: string): boolean
  logout(): void
}

const Ctx = createContext<SessionValue | null>(null)

const STORAGE_KEY = "ipad-session-officer-id"

export function IpadSessionProvider({ children }: { children: React.ReactNode }) {
  const [officerId, setOfficerId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null
    return window.sessionStorage.getItem(STORAGE_KEY)
  })

  useEffect(() => {
    if (officerId) window.sessionStorage.setItem(STORAGE_KEY, officerId)
    else window.sessionStorage.removeItem(STORAGE_KEY)
  }, [officerId])

  const value = useMemo<SessionValue>(() => {
    const officer = officerId
      ? officersSeed.find((o) => o.id === officerId) ?? null
      : null
    return {
      officer,
      officers: officersSeed,
      login(id, pin) {
        const target = officersSeed.find((o) => o.id === id)
        if (!target || target.pin !== pin) return false
        setOfficerId(id)
        return true
      },
      logout() {
        setOfficerId(null)
      },
    }
  }, [officerId])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useIpadSession(): SessionValue {
  const v = useContext(Ctx)
  if (!v) throw new Error("useIpadSession fuera de IpadSessionProvider")
  return v
}
```

- [ ] **Step 2: Verificar typecheck**

Run:
```bash
npm run build
```

Expected: pasa sin errores.

---

## Task 5: `IpadDataContext`

**Files:**
- Create: `src/screens/ipad/context/IpadDataContext.tsx`

- [ ] **Step 1: Crear `IpadDataContext.tsx`**

Contenido completo:

```tsx
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
      entradasHoy: entradasHoy + 1284, // base mostrada en mockup
      deltaEntradas: 5,
      incidentesActivos: incidentes.length,
      nivelBajo: incidentes.filter((i) => i.severidad === "moderada").length,
      nivelModerado: incidentes.filter((i) => i.severidad === "critica").length,
      vehiculosEnCampus: vehiculos.filter((v) => v.estadoAcceso === "permitido").length + 450,
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

export function useIpadData(): DataValue {
  const v = useContext(Ctx)
  if (!v) throw new Error("useIpadData fuera de IpadDataProvider")
  return v
}
```

- [ ] **Step 2: Verificar typecheck**

Run:
```bash
npm run build
```

Expected: pasa sin errores.

---

## Task 6: Componentes compartidos simples

**Files:**
- Create: `src/screens/ipad/components/KpiCard.tsx`
- Create: `src/screens/ipad/components/StatusBadge.tsx`
- Create: `src/screens/ipad/components/SectionCard.tsx`
- Create: `src/screens/ipad/components/ActivityFeedItem.tsx`

- [ ] **Step 1: `KpiCard.tsx`**

```tsx
import type { ReactNode } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface Props {
  label: string
  value: ReactNode
  icon?: ReactNode
  accent?: "primary" | "danger" | "warning" | "info" | "success"
  subtitle?: ReactNode
  className?: string
}

const accentBg: Record<NonNullable<Props["accent"]>, string> = {
  primary: "bg-orange-50 text-orange-600",
  danger: "bg-red-50 text-red-600",
  warning: "bg-amber-50 text-amber-600",
  info: "bg-blue-50 text-blue-600",
  success: "bg-emerald-50 text-emerald-600",
}

export function KpiCard({ label, value, icon, accent = "primary", subtitle, className }: Props) {
  return (
    <Card className={cn("gap-3 py-5", className)}>
      <CardContent className="px-5">
        <div className="flex items-start justify-between">
          <span className="text-sm font-medium text-muted-foreground">{label}</span>
          {icon && (
            <span className={cn("flex size-9 items-center justify-center rounded-lg", accentBg[accent])}>
              {icon}
            </span>
          )}
        </div>
        <div className="mt-2 text-4xl font-black tabular-nums tracking-tight">{value}</div>
        {subtitle && <div className="mt-1 text-xs text-muted-foreground">{subtitle}</div>}
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 2: `StatusBadge.tsx`**

```tsx
import { cn } from "@/lib/utils"

type Variant = "success" | "warning" | "danger" | "info" | "neutral" | "purple"

interface Props {
  variant?: Variant
  dot?: boolean
  children: React.ReactNode
  className?: string
}

const styles: Record<Variant, string> = {
  success: "bg-emerald-50 text-emerald-700 border-emerald-200",
  warning: "bg-amber-50 text-amber-700 border-amber-200",
  danger: "bg-red-50 text-red-700 border-red-200",
  info: "bg-blue-50 text-blue-700 border-blue-200",
  purple: "bg-violet-50 text-violet-700 border-violet-200",
  neutral: "bg-slate-100 text-slate-700 border-slate-200",
}

const dotStyles: Record<Variant, string> = {
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-red-500",
  info: "bg-blue-500",
  purple: "bg-violet-500",
  neutral: "bg-slate-400",
}

export function StatusBadge({ variant = "neutral", dot, children, className }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        styles[variant],
        className
      )}
    >
      {dot && <span className={cn("size-1.5 rounded-full", dotStyles[variant])} />}
      {children}
    </span>
  )
}
```

- [ ] **Step 3: `SectionCard.tsx`**

```tsx
import type { ReactNode } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface Props {
  title?: ReactNode
  icon?: ReactNode
  action?: ReactNode
  children: ReactNode
  className?: string
  contentClassName?: string
}

export function SectionCard({ title, icon, action, children, className, contentClassName }: Props) {
  return (
    <Card className={cn("gap-4", className)}>
      {(title || action) && (
        <CardHeader className="flex items-center justify-between gap-2 px-5 pt-5 pb-0">
          <div className="flex items-center gap-2">
            {icon && <span className="text-orange-600">{icon}</span>}
            {title && <h3 className="text-lg font-bold tracking-tight">{title}</h3>}
          </div>
          {action}
        </CardHeader>
      )}
      <CardContent className={cn("px-5 pb-5", contentClassName)}>{children}</CardContent>
    </Card>
  )
}
```

- [ ] **Step 4: `ActivityFeedItem.tsx`**

```tsx
import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

type Color = "info" | "warning" | "success" | "primary"

interface Props {
  icon: ReactNode
  title: ReactNode
  subtitle?: ReactNode
  timestamp?: string
  tag?: ReactNode
  color?: Color
  children?: ReactNode
}

const colors: Record<Color, string> = {
  info: "bg-blue-50 text-blue-600",
  warning: "bg-amber-50 text-amber-600",
  success: "bg-emerald-50 text-emerald-600",
  primary: "bg-orange-50 text-orange-600",
}

export function ActivityFeedItem({ icon, title, subtitle, timestamp, tag, color = "info", children }: Props) {
  return (
    <div className="flex gap-3 py-3">
      <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-full", colors[color])}>
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <span className="text-sm font-semibold text-foreground truncate">{title}</span>
          {timestamp && <span className="text-xs text-muted-foreground shrink-0">{timestamp}</span>}
        </div>
        {subtitle && <div className="mt-0.5 text-xs text-muted-foreground">{subtitle}</div>}
        {tag && <div className="mt-1">{tag}</div>}
        {children}
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Verificar typecheck**

Run:
```bash
npm run build
```

Expected: pasa sin errores.

---

## Task 7: `IpadHeader`

**Files:**
- Create: `src/screens/ipad/IpadHeader.tsx`

- [ ] **Step 1: Crear `IpadHeader.tsx`**

```tsx
import { Bell, Menu, Search } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useIpadSession } from "./context/IpadSessionContext"

interface Props {
  onMenuClick: () => void
  searchPlaceholder?: string
}

export function IpadHeader({ onMenuClick, searchPlaceholder = "Buscar vehículo, oficial o reporte..." }: Props) {
  const { officer } = useIpadSession()
  const now = new Date()
  const hora = now.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })
  const fecha = now.toLocaleDateString("es-MX", { month: "short", day: "2-digit", year: "numeric" }).toUpperCase()

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-white/90 backdrop-blur">
      <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          aria-label="Abrir menú"
          onClick={onMenuClick}
        >
          <Menu className="size-5" />
        </Button>

        <div className="relative flex-1 max-w-xl">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            className="h-10 rounded-full bg-slate-50 border-slate-200 pl-9"
          />
        </div>

        <Button variant="ghost" size="icon" className="hidden sm:inline-flex" aria-label="Notificaciones">
          <Bell className="size-5" />
        </Button>

        <div className="hidden md:block text-right">
          <div className="text-sm font-semibold leading-none">{hora}</div>
          <div className="text-xs text-muted-foreground mt-0.5">{fecha}</div>
        </div>

        {officer && (
          <div className="flex items-center gap-3 pl-2 border-l border-border">
            <div className="hidden sm:block text-right">
              <div className="text-sm font-semibold leading-none">{officer.nombre}</div>
              <div className="text-xs text-orange-600 mt-0.5">Turno {officer.turno}</div>
            </div>
            <Avatar className="size-9">
              <AvatarImage src={officer.avatar} alt={officer.nombre} />
              <AvatarFallback>{officer.nombre.split(" ").slice(-1)[0]?.[0] ?? "O"}</AvatarFallback>
            </Avatar>
          </div>
        )}
      </div>
    </header>
  )
}
```

- [ ] **Step 2: Verificar typecheck**

Run:
```bash
npm run build
```

Expected: pasa sin errores.

---

## Task 8: `IpadSidebar` (con Sheet responsivo)

**Files:**
- Create: `src/screens/ipad/IpadSidebar.tsx`

- [ ] **Step 1: Crear `IpadSidebar.tsx`**

```tsx
import { Link, useLocation } from "react-router-dom"
import {
  LayoutDashboard,
  DoorOpen,
  LogOut as LogOutIcon,
  Car,
  History,
  Bell,
  ChevronRight,
  ShieldCheck,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { useIpadSession } from "./context/IpadSessionContext"
import { cn } from "@/lib/utils"

interface NavItem {
  label: string
  path?: string
  icon: LucideIcon
  children?: { label: string; path: string }[]
}

const nav: NavItem[] = [
  { label: "Dashboard", path: "/ipad/dashboard", icon: LayoutDashboard },
  {
    label: "Accesos",
    icon: DoorOpen,
    children: [
      { label: "Punto de Control", path: "/ipad/acceso" },
      { label: "Salidas", path: "/ipad/salidas" },
    ],
  },
  {
    label: "Vehículos",
    icon: Car,
    children: [
      { label: "Listado", path: "/ipad/vehiculos" },
      { label: "Multas", path: "/ipad/multas" },
    ],
  },
  { label: "Historial", path: "/ipad/historial", icon: History },
  { label: "Alertas", path: "/ipad/alertas", icon: Bell },
]

interface Props {
  mobileOpen: boolean
  setMobileOpen: (v: boolean) => void
}

export function IpadSidebar({ mobileOpen, setMobileOpen }: Props) {
  return (
    <>
      <aside className="hidden lg:flex lg:w-64 shrink-0 flex-col border-r border-border bg-white">
        <SidebarContent onNavigate={() => {}} />
      </aside>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetTitle className="sr-only">Navegación</SheetTitle>
          <SidebarContent onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>
    </>
  )
}

function SidebarContent({ onNavigate }: { onNavigate: () => void }) {
  const { officer, logout } = useIpadSession()
  const { pathname } = useLocation()

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="flex size-10 items-center justify-center rounded-lg bg-orange-600">
          <ShieldCheck className="size-5 text-white" />
        </div>
        <div>
          <div className="text-sm font-black leading-none">UDLAP</div>
          <div className="text-[10px] font-bold tracking-wider text-orange-600 uppercase mt-0.5">
            Security Control
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 space-y-0.5">
        {nav.map((item) => {
          if (item.children) {
            const anyActive = item.children.some((c) => pathname.startsWith(c.path))
            return (
              <div key={item.label} className="mt-1">
                <div
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 text-xs font-bold uppercase tracking-wider",
                    anyActive ? "text-orange-600" : "text-muted-foreground"
                  )}
                >
                  <item.icon className="size-3.5" />
                  {item.label}
                </div>
                <div className="ml-2 border-l border-border pl-2 space-y-0.5">
                  {item.children.map((c) => {
                    const active = pathname === c.path
                    return (
                      <Link
                        key={c.path}
                        to={c.path}
                        onClick={onNavigate}
                        className={cn(
                          "flex items-center justify-between gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                          active
                            ? "bg-orange-600 text-white font-semibold"
                            : "text-foreground hover:bg-slate-50"
                        )}
                      >
                        <span>{c.label}</span>
                        {active && <ChevronRight className="size-3.5" />}
                      </Link>
                    )
                  })}
                </div>
              </div>
            )
          }
          const active = pathname === item.path
          return (
            <Link
              key={item.path}
              to={item.path!}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors",
                active
                  ? "bg-orange-600 text-white"
                  : "text-foreground hover:bg-slate-50"
              )}
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {officer && (
        <div className="border-t border-border p-3">
          <div className="flex items-center gap-3 rounded-lg p-2">
            <Avatar className="size-10">
              <AvatarImage src={officer.avatar} alt={officer.nombre} />
              <AvatarFallback>{officer.nombre.split(" ").slice(-1)[0]?.[0] ?? "O"}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold leading-none truncate">{officer.nombre}</div>
              <div className="text-xs text-muted-foreground mt-1">Turno {officer.turno}</div>
            </div>
          </div>
          <Button
            variant="outline"
            className="mt-2 w-full justify-start gap-2"
            onClick={() => {
              logout()
              onNavigate()
            }}
          >
            <LogOutIcon className="size-4" />
            Cerrar Sesión
          </Button>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verificar typecheck**

Run:
```bash
npm run build
```

Expected: pasa sin errores.

---

## Task 9: `IpadLayout` (gate + providers + outlet)

**Files:**
- Create: `src/screens/ipad/IpadLayout.tsx`

- [ ] **Step 1: Crear `IpadLayout.tsx`**

```tsx
import { useState } from "react"
import { Navigate, Outlet, useLocation } from "react-router-dom"
import { IpadSessionProvider, useIpadSession } from "./context/IpadSessionContext"
import { IpadDataProvider } from "./context/IpadDataContext"
import { IpadSidebar } from "./IpadSidebar"
import { IpadHeader } from "./IpadHeader"

export function IpadLayout() {
  return (
    <IpadSessionProvider>
      <IpadDataProvider>
        <IpadLayoutInner />
      </IpadDataProvider>
    </IpadSessionProvider>
  )
}

function IpadLayoutInner() {
  const { pathname } = useLocation()
  const { officer } = useIpadSession()
  const [mobileOpen, setMobileOpen] = useState(false)

  const isLogin = pathname === "/ipad/login"

  if (!officer && !isLogin) {
    return <Navigate to="/ipad/login" replace />
  }
  if (officer && isLogin) {
    return <Navigate to="/ipad/dashboard" replace />
  }

  if (isLogin) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Outlet />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <IpadSidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      <div className="flex-1 flex flex-col min-w-0">
        <IpadHeader onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verificar typecheck**

Run:
```bash
npm run build
```

Expected: pasa sin errores.

---

## Task 10: Rutas `App.tsx` + actualización del Selector

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/screens/InterfaceSelector.tsx:46-51` (el objeto del iPad)

- [ ] **Step 1: Crear pantallas placeholder mínimas para que las rutas compilen**

Antes de modificar `App.tsx` necesitamos que las 8 pantallas existan (aunque sean stubs que se reemplazarán en las tasks 11-18).

Crear ocho archivos placeholder. Cada uno con el siguiente patrón:

`src/screens/ipad/LoginScreen.tsx`:
```tsx
export function LoginScreen() {
  return <div className="p-6">Login (placeholder)</div>
}
```

`src/screens/ipad/DashboardScreen.tsx`:
```tsx
export function DashboardScreen() {
  return <div className="p-6">Dashboard (placeholder)</div>
}
```

`src/screens/ipad/PuntoControlScreen.tsx`:
```tsx
export function PuntoControlScreen() {
  return <div className="p-6">Punto de Control (placeholder)</div>
}
```

`src/screens/ipad/SalidasScreen.tsx`:
```tsx
export function SalidasScreen() {
  return <div className="p-6">Salidas (placeholder)</div>
}
```

`src/screens/ipad/VehiculosScreen.tsx`:
```tsx
export function VehiculosScreen() {
  return <div className="p-6">Vehículos (placeholder)</div>
}
```

`src/screens/ipad/MultasScreen.tsx`:
```tsx
export function MultasScreen() {
  return <div className="p-6">Multas (placeholder)</div>
}
```

`src/screens/ipad/HistorialScreen.tsx`:
```tsx
export function HistorialScreen() {
  return <div className="p-6">Historial (placeholder)</div>
}
```

`src/screens/ipad/AlertasScreen.tsx`:
```tsx
export function AlertasScreen() {
  return <div className="p-6">Alertas (placeholder)</div>
}
```

- [ ] **Step 2: Actualizar `src/App.tsx` con rutas iPad**

Reemplazar el bloque:
```tsx
        {/* ── Coming soon ─────────────────────────────── */}
        <Route
          path="/ipad"
          element={<ComingSoon title="iPad" subtitle="Tableta Operativa" type="ipad" />}
        />
```
por:
```tsx
        {/* ── iPad Seguridad ──────────────────────────── */}
        <Route path="/ipad" element={<IpadLayout />}>
          <Route index element={<Navigate to="/ipad/dashboard" replace />} />
          <Route path="login" element={<LoginScreen />} />
          <Route path="dashboard" element={<DashboardScreen />} />
          <Route path="acceso" element={<PuntoControlScreen />} />
          <Route path="salidas" element={<SalidasScreen />} />
          <Route path="vehiculos" element={<VehiculosScreen />} />
          <Route path="multas" element={<MultasScreen />} />
          <Route path="historial" element={<HistorialScreen />} />
          <Route path="alertas" element={<AlertasScreen />} />
        </Route>
```

Y agregar los imports arriba de `App.tsx` (después de los imports de móvil, antes del `export type Screen`):

```tsx
// ── iPad screens ───────────────────────────────────────────────────────────
import { IpadLayout } from "@/screens/ipad/IpadLayout"
import { LoginScreen as IpadLoginScreen } from "@/screens/ipad/LoginScreen"
import { DashboardScreen } from "@/screens/ipad/DashboardScreen"
import { PuntoControlScreen } from "@/screens/ipad/PuntoControlScreen"
import { SalidasScreen } from "@/screens/ipad/SalidasScreen"
import { VehiculosScreen } from "@/screens/ipad/VehiculosScreen"
import { MultasScreen } from "@/screens/ipad/MultasScreen"
import { HistorialScreen } from "@/screens/ipad/HistorialScreen"
import { AlertasScreen } from "@/screens/ipad/AlertasScreen"
```

**Nota importante:** `LoginScreen` ya existe en móvil. Importarlo como `IpadLoginScreen` (alias) y usar ese nombre en el `element`. Reemplazar `<LoginScreen />` por `<IpadLoginScreen />` en la nueva ruta `/ipad/login`.

- [ ] **Step 3: Actualizar `src/screens/InterfaceSelector.tsx`**

Reemplazar:
```tsx
  {
    id: "ipad",
    title: "iPad",
    subtitle: "Tableta Operativa",
    description: "Captura de visitas · Verificación de identidad",
    Icon: Tablet,
    path: "/ipad",
    available: false,
    accent: "#059669",
    glow: "rgba(5,150,105,0.4)",
    tag: "Próximamente",
    screens: "",
  },
```
por:
```tsx
  {
    id: "ipad",
    title: "iPad",
    subtitle: "Seguridad UDLAP",
    description: "Acceso vehicular · Multas · Salidas · Historial · Alertas",
    Icon: Tablet,
    path: "/ipad",
    available: true,
    accent: "#ea580c",
    glow: "rgba(234,88,12,0.4)",
    tag: "Disponible",
    screens: "8 pantallas",
  },
```

- [ ] **Step 4: Verificar typecheck y navegación básica**

Run:
```bash
npm run build
```

Expected: pasa sin errores.

Luego `npm run dev` (solo una vez para el resto del plan), abrir `http://localhost:5173/`. El selector debe mostrar iPad **naranja + disponible**. Clic en iPad navega a `/ipad` y redirige a `/ipad/login` mostrando "Login (placeholder)". La URL `/ipad/dashboard` redirige a `/ipad/login` porque aún no hay sesión. **Dejar `npm run dev` corriendo para el resto del plan.**

---

## Task 11: `LoginScreen` + `PinKeypad` + `NumericKey`

**Files:**
- Create: `src/screens/ipad/components/NumericKey.tsx`
- Create: `src/screens/ipad/components/PinKeypad.tsx`
- Modify: `src/screens/ipad/LoginScreen.tsx` (reemplazar placeholder)

- [ ] **Step 1: `NumericKey.tsx`**

```tsx
import { cn } from "@/lib/utils"

interface Props {
  label: React.ReactNode
  onClick: () => void
  variant?: "default" | "muted"
  disabled?: boolean
  className?: string
}

export function NumericKey({ label, onClick, variant = "default", disabled, className }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex h-16 items-center justify-center rounded-2xl text-2xl font-bold transition-all",
        "active:scale-95 disabled:opacity-40 disabled:pointer-events-none",
        variant === "default"
          ? "bg-white border border-slate-200 text-slate-900 hover:bg-slate-50 shadow-sm"
          : "bg-transparent text-slate-500 hover:bg-slate-100",
        className
      )}
    >
      {label}
    </button>
  )
}
```

- [ ] **Step 2: `PinKeypad.tsx`**

```tsx
import { Delete } from "lucide-react"
import { NumericKey } from "./NumericKey"

interface Props {
  onDigit: (d: string) => void
  onBackspace: () => void
  disabled?: boolean
}

export function PinKeypad({ onDigit, onBackspace, disabled }: Props) {
  const digits = ["1", "2", "3", "4", "5", "6", "7", "8", "9"]
  return (
    <div className="grid grid-cols-3 gap-3">
      {digits.map((d) => (
        <NumericKey key={d} label={d} onClick={() => onDigit(d)} disabled={disabled} />
      ))}
      <NumericKey variant="muted" label="" onClick={() => {}} disabled />
      <NumericKey label="0" onClick={() => onDigit("0")} disabled={disabled} />
      <NumericKey
        variant="muted"
        label={<Delete className="size-5" />}
        onClick={onBackspace}
        disabled={disabled}
      />
    </div>
  )
}
```

- [ ] **Step 3: `LoginScreen.tsx` completo (reemplazar placeholder)**

```tsx
import { useState } from "react"
import { ArrowLeft, ShieldCheck } from "lucide-react"
import { Link } from "react-router-dom"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { useIpadSession } from "./context/IpadSessionContext"
import { PinKeypad } from "./components/PinKeypad"
import { cn } from "@/lib/utils"

export function LoginScreen() {
  const { officers, login } = useIpadSession()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [pin, setPin] = useState("")
  const [error, setError] = useState(false)
  const [shake, setShake] = useState(false)

  const selected = officers.find((o) => o.id === selectedId) ?? null

  function handleDigit(d: string) {
    if (pin.length >= 4) return
    const next = pin + d
    setPin(next)
    setError(false)
    if (next.length === 4 && selected) {
      const ok = login(selected.id, next)
      if (!ok) {
        setError(true)
        setShake(true)
        setTimeout(() => {
          setShake(false)
          setPin("")
        }, 500)
      }
    }
  }

  function handleBackspace() {
    setPin((p) => p.slice(0, -1))
    setError(false)
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-10 relative overflow-hidden"
      style={{
        background:
          "radial-gradient(circle at 15% 15%, rgba(234,88,12,0.08) 0%, transparent 45%), radial-gradient(circle at 85% 85%, rgba(234,88,12,0.06) 0%, transparent 45%), #f8fafc",
      }}
    >
      <Link
        to="/"
        className="absolute top-6 left-6 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft className="size-4" />
        Volver al selector
      </Link>

      <div className="w-full max-w-md" style={{ animation: "fadeUp 0.5s ease both" }}>
        <div className="mb-8 flex items-center justify-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-xl bg-orange-600 shadow-lg shadow-orange-600/20">
            <ShieldCheck className="size-6 text-white" />
          </div>
          <div>
            <div className="text-xl font-black leading-none">UDLAP</div>
            <div className="text-[11px] font-bold tracking-widest text-orange-600 uppercase mt-0.5">
              Security Control
            </div>
          </div>
        </div>

        {!selected ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h1 className="text-center text-xl font-bold tracking-tight mb-1">Selecciona tu perfil</h1>
            <p className="text-center text-sm text-muted-foreground mb-6">
              Ingresa con tu PIN de oficial
            </p>
            <div className="grid grid-cols-2 gap-3">
              {officers.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => setSelectedId(o.id)}
                  className="group flex flex-col items-center gap-2 rounded-xl border border-slate-200 bg-white p-4 text-center transition-all hover:border-orange-500 hover:shadow-md"
                >
                  <Avatar className="size-14">
                    <AvatarImage src={o.avatar} alt={o.nombre} />
                    <AvatarFallback>{o.nombre[0]}</AvatarFallback>
                  </Avatar>
                  <div className="text-sm font-semibold leading-tight">{o.nombre}</div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-orange-600">
                    Turno {o.turno}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div
            className={cn(
              "rounded-2xl border border-slate-200 bg-white p-6 shadow-sm",
              shake && "animate-[shake_0.4s_ease]"
            )}
            style={{ animation: shake ? "shake 0.4s ease" : undefined }}
          >
            <div className="flex items-center gap-3 mb-6">
              <Avatar className="size-12">
                <AvatarImage src={selected.avatar} alt={selected.nombre} />
                <AvatarFallback>{selected.nombre[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold truncate">{selected.nombre}</div>
                <div className="text-xs text-orange-600 font-semibold">Turno {selected.turno}</div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => { setSelectedId(null); setPin(""); setError(false) }}>
                Cambiar
              </Button>
            </div>

            <div className="mb-6 flex justify-center gap-3">
              {[0, 1, 2, 3].map((i) => (
                <span
                  key={i}
                  className={cn(
                    "size-4 rounded-full transition-all",
                    pin.length > i
                      ? error
                        ? "bg-red-500"
                        : "bg-orange-600"
                      : "bg-slate-200"
                  )}
                />
              ))}
            </div>

            {error && (
              <p className="mb-4 text-center text-sm font-medium text-red-600">
                PIN incorrecto, inténtalo de nuevo.
              </p>
            )}

            <PinKeypad onDigit={handleDigit} onBackspace={handleBackspace} />

            <p className="mt-6 text-center text-xs text-muted-foreground">
              Demo — PIN de prueba: <span className="font-mono font-semibold">{selected.pin}</span>
            </p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-8px); }
          75% { transform: translateX(8px); }
        }
      `}</style>
    </div>
  )
}
```

- [ ] **Step 4: Verificar visualmente**

Con `npm run dev` corriendo, navegar a `http://localhost:5173/ipad/login`. Verificar:

- Se muestran 4 tarjetas de oficiales con foto, nombre y turno.
- Al seleccionar un oficial, aparece pantalla de PIN con 4 puntos y teclado numérico 3×4.
- PIN correcto (1234 para Oficial Mendoza) redirige a `/ipad/dashboard`.
- PIN incorrecto hace shake, puntos se ponen rojos, muestra mensaje "PIN incorrecto".
- "Cambiar" regresa a selector de oficial.
- "Volver al selector" regresa al `InterfaceSelector`.
- Refresh tras login → mantiene sesión.

---

## Task 12: `DashboardScreen` + `FlujoBarChart` + `PuntoControlCard`

**Files:**
- Create: `src/screens/ipad/components/FlujoBarChart.tsx`
- Create: `src/screens/ipad/components/PuntoControlCard.tsx`
- Modify: `src/screens/ipad/DashboardScreen.tsx`

- [ ] **Step 1: `FlujoBarChart.tsx`**

```tsx
import { useMemo } from "react"

interface Bar {
  franja: string
  label: string
  valor: number
}

export function FlujoBarChart({ data }: { data: Bar[] }) {
  const max = useMemo(() => Math.max(...data.map((d) => d.valor), 1), [data])
  return (
    <div>
      <div className="flex items-end gap-2 h-48">
        {data.map((bar) => {
          const h = (bar.valor / max) * 100
          const intense = bar.valor / max > 0.7
          return (
            <div key={bar.franja} className="group flex-1 flex flex-col items-center gap-1.5 h-full">
              <div className="flex-1 w-full flex items-end">
                <div
                  className={`w-full rounded-t-md transition-all ${
                    intense ? "bg-orange-500" : "bg-orange-200"
                  } group-hover:bg-orange-600`}
                  style={{ height: `${h}%` }}
                  title={`${bar.valor} vehículos`}
                />
              </div>
            </div>
          )
        })}
      </div>
      <div className="mt-2 flex gap-2">
        {data.map((bar) => (
          <div key={bar.franja} className="flex-1 text-center">
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground truncate">
              {bar.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: `PuntoControlCard.tsx`**

```tsx
import { DoorClosed, Home } from "lucide-react"
import type { Punto } from "../types"
import { StatusBadge } from "./StatusBadge"

interface Props {
  punto: Punto
  onClick?: () => void
}

export function PuntoControlCard({ punto, onClick }: Props) {
  const isResidencial = punto.tipo === "residencial"
  const Icon = isResidencial ? Home : DoorClosed
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 text-left transition-all hover:border-orange-500 hover:shadow-md"
    >
      <span
        className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${
          punto.estado === "activa" ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"
        }`}
      >
        <Icon className="size-5" />
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <span className="text-sm font-bold leading-tight">{punto.nombre}</span>
          <StatusBadge
            variant={punto.estado === "activa" ? "success" : "neutral"}
            dot
          >
            {punto.estado === "activa" ? "ACTIVA" : "STANDBY"}
          </StatusBadge>
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          {isResidencial
            ? "Acceso Automatizado"
            : punto.estado === "activa"
            ? `Operada por: Oficial ${punto.oficialOperadorId.replace("of-", "").replace(/^\w/, (c) => c.toUpperCase())}`
            : "Apertura programada: 16:00"}
        </div>
      </div>
    </button>
  )
}
```

- [ ] **Step 3: `DashboardScreen.tsx` completo**

```tsx
import { useNavigate } from "react-router-dom"
import {
  AlertCircle,
  Car,
  ChevronRight,
  DoorOpen,
  FileText,
  LogIn,
  MoonStar,
  Radio,
  ShieldAlert,
  TrendingUp,
  Zap,
  UserPlus,
  HelpCircle,
  Check,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { KpiCard } from "./components/KpiCard"
import { SectionCard } from "./components/SectionCard"
import { StatusBadge } from "./components/StatusBadge"
import { PuntoControlCard } from "./components/PuntoControlCard"
import { ActivityFeedItem } from "./components/ActivityFeedItem"
import { FlujoBarChart } from "./components/FlujoBarChart"
import { useIpadData } from "./context/IpadDataContext"
import { flujo24hSeed } from "./data"

export function DashboardScreen() {
  const navigate = useNavigate()
  const { kpis, puntosControl, alertas, eventos, vehiculos } = useIpadData()

  const recent = [
    ...alertas.slice(0, 2).map((a) => ({
      kind: "alerta" as const,
      id: a.id,
      tipo: a.tipo,
      severidad: a.severidad,
      descripcion: a.descripcion,
      timestamp: a.timestamp,
    })),
    ...eventos.slice(0, 2).map((e) => {
      const v = vehiculos.find((x) => x.id === e.vehiculoId)
      return {
        kind: "evento" as const,
        id: e.id,
        resultado: e.resultado,
        descripcion: `${e.resultado === "permitido" ? "Ingreso" : "Denegado"}: ${v?.matricula ?? "—"}`,
        subtitle: `${e.resultado === "permitido" ? "Match: Registro" : e.motivo ?? ""} · ${v?.propietario.tipo ?? ""}`,
        timestamp: e.timestamp,
      }
    }),
  ]
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, 4)

  function fmtTime(iso: string) {
    return new Date(iso).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })
  }

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          label="Entradas Hoy"
          value={kpis.entradasHoy.toLocaleString()}
          icon={<LogIn className="size-4" />}
          accent="primary"
          subtitle={
            <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
              <TrendingUp className="size-3" /> +{kpis.deltaEntradas}% vs ayer
            </span>
          }
        />
        <KpiCard
          label="Incidentes Activos"
          value={String(kpis.incidentesActivos).padStart(2, "0")}
          icon={<ShieldAlert className="size-4" />}
          accent="danger"
          subtitle={`${kpis.nivelBajo} Nivel Bajo, ${kpis.nivelModerado} Moderado`}
        />
        <KpiCard
          label="Vehículos en Campus"
          value={kpis.vehiculosEnCampus.toLocaleString()}
          icon={<Car className="size-4" />}
          accent="info"
          subtitle={`Capacidad al ${kpis.capacidadPct}%`}
        />
        <KpiCard
          label="Visitas Nocturnas"
          value={String(kpis.visitasNocturnas).padStart(2, "0")}
          icon={<MoonStar className="size-4" />}
          accent="warning"
          subtitle={
            <span className="text-amber-600 font-bold uppercase tracking-wider text-[10px]">
              Pendientes de check-out
            </span>
          }
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 space-y-4">
          <SectionCard
            title="Puntos de Control"
            icon={<DoorOpen className="size-4" />}
            action={
              <Button variant="link" className="text-orange-600 h-auto p-0" onClick={() => navigate("/ipad/acceso")}>
                Ver Mapa Completo
              </Button>
            }
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {puntosControl.map((p) => (
                <PuntoControlCard key={p.id} punto={p} onClick={() => navigate("/ipad/acceso")} />
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Flujo Vehicular (24h)" icon={<Radio className="size-4" />}>
            <FlujoBarChart data={flujo24hSeed} />
          </SectionCard>
        </div>

        <div className="space-y-4">
          <SectionCard title="Acciones Rápidas" icon={<Zap className="size-4" />}>
            <div className="space-y-2">
              <Button
                className="w-full justify-between bg-orange-600 hover:bg-orange-700"
                onClick={() => navigate("/ipad/multas")}
              >
                <span className="inline-flex items-center gap-2">
                  <FileText className="size-4" /> Nuevo Reporte
                </span>
                <ChevronRight className="size-4" />
              </Button>
              <Button
                variant="outline"
                className="w-full justify-between border-orange-300 text-orange-700 hover:bg-orange-50"
                onClick={() => alert("Alerta general activada (demo)")}
              >
                <span className="inline-flex items-center gap-2">
                  <AlertCircle className="size-4" /> Activar Alerta General
                </span>
                <ChevronRight className="size-4" />
              </Button>
              <Button
                variant="outline"
                className="w-full justify-between"
                onClick={() => alert("Contactando soporte (demo)")}
              >
                <span className="inline-flex items-center gap-2">
                  <HelpCircle className="size-4" /> Contactar Soporte
                </span>
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </SectionCard>

          <SectionCard title="Actividad Reciente" icon={<Radio className="size-4" />}>
            <div className="divide-y divide-border">
              {recent.map((r) =>
                r.kind === "evento" ? (
                  <ActivityFeedItem
                    key={r.id}
                    icon={<Car className="size-4" />}
                    title={r.descripcion}
                    subtitle={r.subtitle}
                    timestamp={fmtTime(r.timestamp)}
                    color={r.resultado === "permitido" ? "info" : "warning"}
                  />
                ) : (
                  <ActivityFeedItem
                    key={r.id}
                    icon={r.tipo === "incidente" ? <AlertCircle className="size-4" /> : r.tipo === "ronda" ? <Check className="size-4" /> : <UserPlus className="size-4" />}
                    title={r.descripcion}
                    timestamp={fmtTime(r.timestamp)}
                    color={r.severidad === "critica" ? "warning" : r.severidad === "moderada" ? "warning" : r.tipo === "ronda" ? "success" : "primary"}
                    tag={
                      r.severidad === "critica" ? (
                        <StatusBadge variant="danger">PENDIENTE</StatusBadge>
                      ) : r.severidad === "moderada" ? (
                        <StatusBadge variant="warning">PENDIENTE</StatusBadge>
                      ) : null
                    }
                  />
                )
              )}
            </div>
            <Button
              variant="link"
              className="mt-3 w-full text-orange-600"
              onClick={() => navigate("/ipad/historial")}
            >
              Ver Todo el Historial
            </Button>
          </SectionCard>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verificar visualmente**

En el navegador navegar a `/ipad/dashboard`. Debe mostrar:
- 4 KPIs arriba con íconos y deltas.
- Sección "Puntos de Control" con 4 tarjetas (Puerta 1, 2, 3 en standby, Residencial).
- Gráfico de barras "Flujo Vehicular (24h)".
- Sección lateral "Acciones Rápidas" con 3 botones (el naranja es el CTA).
- "Actividad Reciente" con 4 items y link "Ver Todo el Historial".

Clic en "Puertas" y "Nuevo Reporte" deben navegar a `/ipad/acceso` y `/ipad/multas`.

Responsive: reducir a ~820px y ~400px. KPIs deben colapsar (4→2→1), puntos de control también, el panel lateral se apila debajo.

---

## Task 13: `PuntoControlScreen` + `VehiculoPreviewCard`

**Files:**
- Create: `src/screens/ipad/components/VehiculoPreviewCard.tsx`
- Modify: `src/screens/ipad/PuntoControlScreen.tsx`

- [ ] **Step 1: `VehiculoPreviewCard.tsx`**

```tsx
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { Vehiculo } from "../types"
import { StatusBadge } from "./StatusBadge"

interface Props {
  vehiculo: Vehiculo
  compact?: boolean
}

export function VehiculoPreviewCard({ vehiculo, compact }: Props) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
      <div className="h-28 bg-gradient-to-br from-orange-100 to-orange-50" />
      <div className="p-4 -mt-10">
        <Avatar className="size-16 ring-4 ring-white">
          <AvatarImage src={vehiculo.foto} alt={vehiculo.propietario.nombre} />
          <AvatarFallback>{vehiculo.propietario.nombre[0]}</AvatarFallback>
        </Avatar>
        <div className="mt-3">
          <div className="text-base font-bold leading-tight">{vehiculo.propietario.nombre}</div>
          <div className="text-xs text-muted-foreground mt-0.5">
            ID {vehiculo.propietario.tipo === "visita" ? "Visitante" : "Estudiante"}: {vehiculo.propietario.idUdlap}
          </div>
        </div>
        {!compact && (
          <div className="mt-4 space-y-2 text-sm">
            <Row label="PLACA" value={vehiculo.matricula} />
            <Row label="VEHÍCULO" value={`${vehiculo.modelo} · ${vehiculo.color}`} />
            <Row
              label="ESTATUS"
              value={
                <StatusBadge variant={vehiculo.sello.vigente ? "success" : "danger"} dot>
                  {vehiculo.sello.vigente ? "VIGENTE" : "VENCIDO"}
                </StatusBadge>
              }
            />
          </div>
        )}
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-t border-slate-100 pt-2">
      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <span className="text-sm font-semibold">{value}</span>
    </div>
  )
}
```

- [ ] **Step 2: `PuntoControlScreen.tsx` completo**

```tsx
import { useMemo, useState } from "react"
import {
  Car,
  CheckCircle2,
  MapPin,
  MoonStar,
  QrCode,
  UserCheck,
  UserX,
  Users,
  ChevronDown,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useIpadData } from "./context/IpadDataContext"
import { useIpadSession } from "./context/IpadSessionContext"
import { SectionCard } from "./components/SectionCard"
import { StatusBadge } from "./components/StatusBadge"

export function PuntoControlScreen() {
  const { vehiculos, puntosControl, permitirAcceso, denegarAcceso } = useIpadData()
  const { officer } = useIpadSession()
  const [puntoId, setPuntoId] = useState("pt-1")
  const [query, setQuery] = useState("ABC-123-D")
  const [observaciones, setObservaciones] = useState("")
  const [counter, setCounter] = useState(142)
  const [indicadores, setIndicadores] = useState({
    detectable: false,
    etilico: false,
    dificultad: false,
    coordinacion: false,
  })
  const [feedback, setFeedback] = useState<null | { ok: boolean; msg: string }>(null)

  const vehiculo = useMemo(
    () => vehiculos.find((v) => v.matricula.toUpperCase() === query.toUpperCase()) ?? vehiculos[0],
    [query, vehiculos]
  )

  function handlePermitir() {
    if (!vehiculo || !officer) return
    permitirAcceso(vehiculo.id, puntoId, officer.id)
    setFeedback({ ok: true, msg: "Acceso permitido. Evento registrado en historial." })
    setCounter((c) => c + 1)
    setObservaciones("")
  }

  function handleDenegar() {
    if (!vehiculo || !officer) return
    const motivo = observaciones.trim() || "Sin motivo especificado"
    denegarAcceso(vehiculo.id, puntoId, officer.id, motivo)
    setFeedback({ ok: false, msg: `Acceso denegado: ${motivo}` })
    setObservaciones("")
  }

  return (
    <div className="space-y-5 max-w-[1400px] mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Punto de Control: Acceso Principal</h1>
          <p className="text-sm text-muted-foreground">
            Registro de accesos y verificación de protocolos de seguridad
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={puntoId} onValueChange={setPuntoId}>
            <SelectTrigger className="min-w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {puntosControl.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" className="gap-2">
            <QrCode className="size-4" /> Escanear ID
          </Button>
          <Button className="gap-2 bg-orange-600 hover:bg-orange-700">
            <Car className="size-4" /> Nuevo Registro
          </Button>
        </div>
      </div>

      <Tabs defaultValue="vehicular">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="vehicular" className="gap-2">
            <Car className="size-4" /> Acceso Vehicular
          </TabsTrigger>
          <TabsTrigger value="nocturna" className="gap-2">
            <MoonStar className="size-4" /> Entradas Nocturnas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="vehicular" className="mt-5">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
            <SectionCard
              title="Control de Vehículos"
              icon={<Car className="size-4" />}
              action={<StatusBadge variant="success" dot>CÁMARA ACTIVA</StatusBadge>}
            >
              <div className="flex flex-col md:flex-row gap-5">
                <div className="flex-1 space-y-4">
                  <div>
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Placa / Matrícula
                    </Label>
                    <Input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      className="mt-1 text-3xl font-black tracking-wider h-14 font-mono"
                    />
                  </div>
                  {vehiculo && (
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="gap-1.5 py-1">
                        <MapPin className="size-3 text-orange-600" />
                        {vehiculo.ubicacion}
                      </Badge>
                      {vehiculo.multasPendientes > 0 && (
                        <StatusBadge variant="warning">
                          {vehiculo.multasPendientes} Pendiente{vehiculo.multasPendientes > 1 ? "s" : ""}
                        </StatusBadge>
                      )}
                      <StatusBadge variant={vehiculo.sello.vigente ? "success" : "danger"} dot>
                        SELLO {vehiculo.sello.vigente ? `VÁLIDO ${vehiculo.sello.vence}` : "VENCIDO"}
                      </StatusBadge>
                      <Badge variant="outline" className="gap-1.5 py-1">
                        <Users className="size-3" />
                        {vehiculo.ocupantes} Persona{vehiculo.ocupantes !== 1 ? "s" : ""}
                      </Badge>
                    </div>
                  )}
                </div>
                {vehiculo && (
                  <div className="md:w-56 rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                      Conductor
                    </div>
                    <div className="flex items-center gap-3">
                      <Avatar className="size-12">
                        <AvatarImage src={vehiculo.foto} alt={vehiculo.propietario.nombre} />
                        <AvatarFallback>{vehiculo.propietario.nombre[0]}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="text-sm font-bold leading-tight truncate">
                          {vehiculo.propietario.nombre}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          ID {vehiculo.propietario.idUdlap}
                        </div>
                        <div className="text-[10px] text-orange-600 font-bold uppercase mt-1">
                          {vehiculo.propietario.tipo}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-5">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Observaciones Adicionales
                </Label>
                <Textarea
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Escribe observaciones..."
                  className="mt-1 min-h-[80px] resize-none"
                />
              </div>

              {feedback && (
                <div
                  className={`mt-4 rounded-lg px-4 py-2.5 text-sm font-medium ${
                    feedback.ok
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-amber-50 text-amber-700 border border-amber-200"
                  }`}
                >
                  {feedback.msg}
                </div>
              )}

              <div className="mt-5 flex items-center justify-between gap-3">
                <div className="rounded-xl bg-slate-900 text-white px-5 py-3">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Gestionados hoy
                  </div>
                  <div className="text-2xl font-black tabular-nums">
                    {counter} Vehículos
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="gap-2 border-red-300 text-red-700 hover:bg-red-50" onClick={handleDenegar}>
                    <UserX className="size-4" /> Denegar Acceso
                  </Button>
                  <Button className="gap-2 bg-orange-600 hover:bg-orange-700" onClick={handlePermitir}>
                    <UserCheck className="size-4" /> Permitir Paso
                  </Button>
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Indicadores de Riesgo" icon={<ChevronDown className="size-4" />}>
              <div className="space-y-3">
                {[
                  { key: "detectable", label: "Estado detectable" },
                  { key: "etilico", label: "Aliento etílico" },
                  { key: "dificultad", label: "Dificultad al hablar" },
                  { key: "coordinacion", label: "Coordinación motriz" },
                ].map((i) => (
                  <div key={i.key} className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                    <Label htmlFor={`risk-${i.key}`} className="text-sm">{i.label}</Label>
                    <Switch
                      id={`risk-${i.key}`}
                      checked={indicadores[i.key as keyof typeof indicadores]}
                      onCheckedChange={(v: boolean) =>
                        setIndicadores((prev) => ({ ...prev, [i.key]: v }))
                      }
                    />
                  </div>
                ))}
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                  <CheckCircle2 className="size-3.5 inline mr-1 text-amber-600" />
                  Nota: 2 o más indicadores → protocolo de salida especial obligatorio.
                </div>
              </div>
            </SectionCard>
          </div>
        </TabsContent>

        <TabsContent value="nocturna" className="mt-5">
          <SectionCard title="Entradas Nocturnas" icon={<MoonStar className="size-4" />}>
            <p className="text-sm text-muted-foreground">
              Registro especializado para accesos entre 22:00 y 06:00. (Misma estructura que Acceso Vehicular con validaciones reforzadas.)
            </p>
          </SectionCard>
        </TabsContent>
      </Tabs>
    </div>
  )
}
```

- [ ] **Step 3: Verificar visualmente**

Navegar a `/ipad/acceso`. Debe mostrar:
- Título + descripción + selector de punto + botones "Escanear ID" / "Nuevo Registro".
- Tabs "Acceso Vehicular" / "Entradas Nocturnas".
- Tarjeta central con placa editable (ABC-123-D por default), badges (ubicación, multas, sello, personas), tarjeta de conductor (foto, nombre, ID, tipo), textarea observaciones.
- Panel lateral "Indicadores de Riesgo" con 4 switches.
- Botones "Denegar" / "Permitir".
- Contador "142 Vehículos" abajo a la izquierda.

Permitir acceso → aumenta contador, muestra mensaje verde, limpia observaciones. Denegar → muestra mensaje amarillo con el motivo.

Volver al Dashboard → la actividad reciente debe reflejar el nuevo evento.

Responsive: en `< lg` el panel de riesgo se apila debajo; en `< md` el conductor se apila debajo de la placa.

---

## Task 14: `SalidasScreen`

**Files:**
- Modify: `src/screens/ipad/SalidasScreen.tsx`

- [ ] **Step 1: `SalidasScreen.tsx` completo**

```tsx
import { useState } from "react"
import {
  AlertTriangle,
  Camera,
  CarFront,
  Clock,
  Eye,
  FileWarning,
  LogOut as LogOutIcon,
  Radio,
  ShieldCheck,
  Siren,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { useIpadData } from "./context/IpadDataContext"
import { useIpadSession } from "./context/IpadSessionContext"
import { SectionCard } from "./components/SectionCard"
import { StatusBadge } from "./components/StatusBadge"
import type { Vehiculo } from "./types"

const motivoCopy: Record<NonNullable<Vehiculo["bloqueoSalida"]>["motivo"], { label: string; variant: "warning" | "danger" | "info" }> = {
  multa: { label: "Multa Pendiente", variant: "warning" },
  restriccion_academica: { label: "Restricción Académica", variant: "info" },
  incidente: { label: "Incidente Activo", variant: "danger" },
}

export function SalidasScreen() {
  const { vehiculos, autorizarSalida } = useIpadData()
  const { officer } = useIpadSession()
  const [filter, setFilter] = useState<"todos" | "multa" | "restriccion_academica" | "incidente">("todos")

  const bloqueados = vehiculos.filter((v) => v.bloqueoSalida)
  const filtrados = filter === "todos" ? bloqueados : bloqueados.filter((v) => v.bloqueoSalida?.motivo === filter)
  const destacado = bloqueados[0]

  function handleAutorizar(id: string) {
    if (!officer) return
    autorizarSalida(id, officer.id)
  }

  return (
    <div className="space-y-5 max-w-[1400px] mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Alertas de Salida y Restricciones</h1>
        <p className="text-sm text-muted-foreground">
          Control de vehículos bloqueados y autorización de salidas especiales
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
        {destacado && (
          <div className="rounded-2xl overflow-hidden border border-slate-200 bg-gradient-to-br from-slate-900 to-slate-800 text-white">
            <div className="relative h-56 bg-[linear-gradient(135deg,#1e293b,#0f172a)] flex items-center justify-center">
              <div className="absolute inset-0 opacity-20">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(234,88,12,0.4),transparent_55%)]" />
              </div>
              <CarFront className="size-24 text-white/15" />
              <div className="absolute top-4 left-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur">
                <Camera className="size-3.5" /> Cámara Principal · Caseta 1
              </div>
              <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                <div>
                  <div className="text-xs font-bold uppercase tracking-widest text-orange-400">
                    Vehículo detenido
                  </div>
                  <div className="mt-1 rounded-lg bg-white text-slate-900 px-3 py-1.5 font-black text-lg font-mono inline-block">
                    {destacado.matricula}
                  </div>
                </div>
                <StatusBadge variant="danger" dot className="bg-red-500/90 border-red-400 text-white">
                  PROTOCOLO ACTIVO
                </StatusBadge>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <SectionCard
            title={<span className="text-orange-600">Estatus de Salida</span>}
            icon={<Siren className="size-4" />}
          >
            <div className="rounded-xl bg-orange-50 border border-orange-200 p-4 text-center">
              <div className="text-xs font-bold uppercase tracking-widest text-orange-700 mb-1">
                Protocolo Activo
              </div>
              <div className="text-2xl font-black text-orange-700">
                {bloqueados.length} Bloqueados
              </div>
            </div>
            <Button className="mt-3 w-full gap-2 bg-orange-600 hover:bg-orange-700">
              <ShieldCheck className="size-4" /> Autorizar Salida Especial
            </Button>
          </SectionCard>
        </div>
      </div>

      <SectionCard
        title="Salidas Bloqueadas"
        icon={<FileWarning className="size-4" />}
        action={
          <div className="flex gap-1">
            {(["todos", "multa", "restriccion_academica", "incidente"] as const).map((f) => (
              <Button
                key={f}
                variant={filter === f ? "default" : "ghost"}
                size="sm"
                className={filter === f ? "bg-orange-600 hover:bg-orange-700" : ""}
                onClick={() => setFilter(f)}
              >
                {f === "todos" ? "Todos" : motivoCopy[f].label}
              </Button>
            ))}
          </div>
        }
      >
        {filtrados.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">
            No hay salidas bloqueadas con ese filtro.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {filtrados.map((v) => {
              const m = v.bloqueoSalida!
              const info = motivoCopy[m.motivo]
              return (
                <div
                  key={v.id}
                  className="rounded-xl border border-slate-200 bg-white p-4"
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="size-12">
                      <AvatarImage src={v.foto} alt={v.propietario.nombre} />
                      <AvatarFallback>{v.propietario.nombre[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold leading-tight truncate">{v.propietario.nombre}</div>
                      <div className="font-mono text-sm font-semibold text-orange-600 mt-0.5">
                        {v.matricula}
                      </div>
                      <StatusBadge variant={info.variant} className="mt-1.5">{info.label}</StatusBadge>
                    </div>
                  </div>
                  <div className="mt-3 rounded-lg bg-slate-50 p-3 text-xs text-slate-700 border-l-4 border-orange-500">
                    {m.descripcion}
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1 gap-1.5">
                      <Eye className="size-3.5" /> Ver Protocolo
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 gap-1.5 bg-orange-600 hover:bg-orange-700"
                      onClick={() => handleAutorizar(v.id)}
                    >
                      <ShieldCheck className="size-3.5" /> Autorizar
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </SectionCard>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white border border-slate-200 px-5 py-3">
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Radio className="size-3.5 text-emerald-500" /> UDLAP Security · conectado
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="size-3.5" /> Turno en curso: {officer?.turno ?? "—"}
          </span>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5">
            <AlertTriangle className="size-3.5" /> Reporte de Turno
          </Button>
          <Button size="sm" className="gap-1.5 bg-orange-600 hover:bg-orange-700">
            <LogOutIcon className="size-3.5" /> Autorizar Salida Especial
          </Button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verificar visualmente**

Navegar a `/ipad/salidas`. Debe mostrar:
- Título + subtítulo.
- Banner del vehículo destacado (fondo oscuro, foto ícono, placa grande, badge "PROTOCOLO ACTIVO").
- Panel lateral "Estatus de Salida" con contador de bloqueados y CTA "Autorizar Salida Especial".
- Grid de tarjetas con los vehículos bloqueados (debe haber 3 iniciales: v5 multa, v6 restriccion_academica, v7 incidente).
- Filtros por motivo funcionan.
- Clic en "Autorizar" quita la tarjeta del listado.
- Barra inferior con info de conexión y botones.

Responsive: grid pasa a 2/1 columnas según tamaño; panel lateral se apila abajo en `< lg`.

---

## Task 15: `VehiculosScreen`

**Files:**
- Modify: `src/screens/ipad/VehiculosScreen.tsx`

- [ ] **Step 1: `VehiculosScreen.tsx` completo**

```tsx
import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  AlertTriangle,
  Car,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  Plus,
  Search,
  ShieldAlert,
  Stamp,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useIpadData } from "./context/IpadDataContext"
import { KpiCard } from "./components/KpiCard"
import { SectionCard } from "./components/SectionCard"
import { StatusBadge } from "./components/StatusBadge"

const PAGE_SIZE = 4

const tipoVariant: Record<string, "info" | "purple" | "neutral"> = {
  estudiante: "info",
  empleado: "purple",
  visita: "neutral",
  externo: "neutral",
}

const accesoVariant: Record<string, "success" | "danger" | "warning"> = {
  permitido: "success",
  denegado: "danger",
  revision: "warning",
}

export function VehiculosScreen() {
  const navigate = useNavigate()
  const { vehiculos, kpis } = useIpadData()
  const [query, setQuery] = useState("")
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    if (!q) return vehiculos
    return vehiculos.filter(
      (v) =>
        v.matricula.toLowerCase().includes(q) ||
        v.propietario.nombre.toLowerCase().includes(q) ||
        v.propietario.idUdlap.toLowerCase().includes(q)
    )
  }, [query, vehiculos])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const slice = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const vencidos = vehiculos.filter((v) => !v.sello.vigente).length
  const conMultas = vehiculos.filter((v) => v.multasPendientes > 0).length

  return (
    <div className="space-y-5 max-w-[1400px] mx-auto">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setPage(1)
          }}
          placeholder="Buscar matrícula o ID de propietario..."
          className="h-11 rounded-full pl-9 bg-white border-slate-200"
        />
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Gestión y Listado de Vehículos</h1>
        <p className="text-sm text-muted-foreground">Supervisión en tiempo real de accesos al campus.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard
          label="Vehículos en Campus"
          value={kpis.vehiculosEnCampus.toLocaleString()}
          icon={<Car className="size-4" />}
          accent="info"
        />
        <KpiCard
          label="Con Multas Pendientes"
          value={conMultas}
          icon={<ShieldAlert className="size-4" />}
          accent="danger"
        />
        <KpiCard
          label="Sello Escolar Vencido"
          value={vencidos}
          icon={<Stamp className="size-4" />}
          accent="warning"
        />
      </div>

      <SectionCard
        title="Vehículos Registrados"
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-1.5">
              <Download className="size-3.5" /> Exportar CSV
            </Button>
            <Button size="sm" className="gap-1.5 bg-orange-600 hover:bg-orange-700" onClick={() => navigate("/ipad/multas")}>
              <Plus className="size-3.5" /> Registrar Nuevo
            </Button>
          </div>
        }
        contentClassName="px-0"
      >
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>MATRÍCULA</TableHead>
                <TableHead>PROPIETARIO</TableHead>
                <TableHead>TIPO</TableHead>
                <TableHead>MULTAS</TableHead>
                <TableHead>ACCESO</TableHead>
                <TableHead className="text-right">ACCIONES</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {slice.map((v) => (
                <TableRow key={v.id}>
                  <TableCell className="font-mono font-bold text-orange-600">
                    {v.matricula}
                  </TableCell>
                  <TableCell>
                    <div className="font-semibold">{v.propietario.nombre}</div>
                    <div className="text-xs text-muted-foreground">
                      {v.propietario.idUdlap === "Externo" ? "Ext: Externo" : `ID: ${v.propietario.idUdlap}`}
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge variant={tipoVariant[v.propietario.tipo]}>
                      {v.propietario.tipo.charAt(0).toUpperCase() + v.propietario.tipo.slice(1)}
                    </StatusBadge>
                  </TableCell>
                  <TableCell>
                    {v.multasPendientes === 0 ? (
                      <StatusBadge variant="success">Ninguna</StatusBadge>
                    ) : (
                      <StatusBadge variant="warning">
                        {v.multasPendientes} Pendiente{v.multasPendientes > 1 ? "s" : ""}
                      </StatusBadge>
                    )}
                  </TableCell>
                  <TableCell>
                    <StatusBadge variant={accesoVariant[v.estadoAcceso]} dot>
                      {v.estadoAcceso === "permitido"
                        ? "Permitido"
                        : v.estadoAcceso === "denegado"
                        ? "Denegado"
                        : "Revisión"}
                    </StatusBadge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex gap-1">
                      <Button variant="ghost" size="icon-sm" aria-label="Ver detalle">
                        <Eye className="size-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" aria-label="Reportar">
                        <AlertTriangle className="size-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {slice.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                    No hay resultados.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="mt-3 flex items-center justify-between px-5 py-1">
          <div className="text-xs text-muted-foreground">
            Mostrando {slice.length} de {filtered.length} registros
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon-sm"
              disabled={currentPage === 1}
              onClick={() => setPage(currentPage - 1)}
              aria-label="Anterior"
            >
              <ChevronLeft className="size-3.5" />
            </Button>
            {Array.from({ length: totalPages }).map((_, i) => (
              <Button
                key={i}
                variant={currentPage === i + 1 ? "default" : "outline"}
                size="icon-sm"
                className={currentPage === i + 1 ? "bg-orange-600 hover:bg-orange-700" : ""}
                onClick={() => setPage(i + 1)}
              >
                {i + 1}
              </Button>
            ))}
            <Button
              variant="outline"
              size="icon-sm"
              disabled={currentPage === totalPages}
              onClick={() => setPage(currentPage + 1)}
              aria-label="Siguiente"
            >
              <ChevronRight className="size-3.5" />
            </Button>
          </div>
        </div>
      </SectionCard>
    </div>
  )
}
```

- [ ] **Step 2: Verificar visualmente**

Navegar a `/ipad/vehiculos`. Debe mostrar:
- Buscador arriba (filtra por matrícula/nombre/ID).
- Título "Gestión y Listado de Vehículos" + subtítulo.
- 3 KPIs (Vehículos en Campus, Con Multas Pendientes, Sello Vencido).
- Tabla con columnas: Matrícula, Propietario, Tipo, Multas, Acceso, Acciones.
- Paginación de 4/página con los 7 vehículos seed (2 páginas).
- Botones "Exportar CSV" (sin acción real) y "Registrar Nuevo" (→ `/ipad/multas`).

Responsive: en `< md` la tabla hace scroll horizontal; los KPIs pasan a 1 columna.

---

## Task 16: `MultasScreen`

**Files:**
- Modify: `src/screens/ipad/MultasScreen.tsx`

- [ ] **Step 1: `MultasScreen.tsx` completo**

```tsx
import { useMemo, useState } from "react"
import {
  Camera,
  FileCheck2,
  FileWarning,
  MapPin,
  Search,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useIpadData } from "./context/IpadDataContext"
import { useIpadSession } from "./context/IpadSessionContext"
import { SectionCard } from "./components/SectionCard"
import { StatusBadge } from "./components/StatusBadge"
import { VehiculoPreviewCard } from "./components/VehiculoPreviewCard"

const TIPOS_INFRACCION = [
  "Estacionamiento prohibido",
  "Exceso de velocidad",
  "No respetar alto",
  "Conducción imprudente",
  "Sello vencido",
  "Acceso a zona restringida",
]

export function MultasScreen() {
  const { vehiculos, multas, registrarMulta } = useIpadData()
  const { officer } = useIpadSession()

  const [placa, setPlaca] = useState("")
  const [tipo, setTipo] = useState("")
  const [monto, setMonto] = useState("850")
  const [comentarios, setComentarios] = useState("")
  const [evidencia, setEvidencia] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const vehiculo = useMemo(
    () => vehiculos.find((v) => v.matricula.toUpperCase().includes(placa.toUpperCase().trim())) ?? null,
    [placa, vehiculos]
  )

  const historial = vehiculo
    ? multas.filter((m) => m.vehiculoId === vehiculo.id).slice(0, 3)
    : []

  function handleAddEvidencia() {
    if (evidencia.length >= 3) return
    setEvidencia((prev) => [...prev, `foto-${prev.length + 1}.jpg`])
  }

  function handleReset() {
    setPlaca("")
    setTipo("")
    setMonto("850")
    setComentarios("")
    setEvidencia([])
    setError(null)
  }

  function handleConfirmar() {
    if (!vehiculo) return setError("Selecciona un vehículo válido buscando por placa.")
    if (!tipo) return setError("Selecciona el tipo de infracción.")
    const montoNum = Number(monto)
    if (!montoNum || montoNum <= 0) return setError("El monto debe ser mayor a 0.")
    if (!officer) return setError("Sesión inválida.")

    registrarMulta(
      {
        vehiculoId: vehiculo.id,
        tipo,
        montoMxn: montoNum,
        evidencia,
        comentarios,
      },
      officer.id
    )
    setSuccess(true)
    setTimeout(() => {
      setSuccess(false)
      handleReset()
    }, 1500)
  }

  return (
    <div className="max-w-[1400px] mx-auto">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Registrar Nueva Multa</h1>
          <p className="text-sm text-muted-foreground">
            Genera la infracción, adjunta evidencia y confirma con datos del vehículo.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5">
        <SectionCard title="Detalles de la Infracción" icon={<FileWarning className="size-4" />}>
          <div className="space-y-4">
            <div>
              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Buscar Vehículo por Placa
              </Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={placa}
                  onChange={(e) => setPlaca(e.target.value)}
                  placeholder="Ej. ABC-1234"
                  className="pl-9 h-11"
                />
              </div>
              {placa && !vehiculo && (
                <p className="mt-1 text-xs text-red-600">Sin coincidencias en el padrón.</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Tipo de Infracción
                </Label>
                <Select value={tipo} onValueChange={setTipo}>
                  <SelectTrigger className="mt-1 h-11">
                    <SelectValue placeholder="Seleccionar tipo..." />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_INFRACCION.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Monto (MXN)
                </Label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
                    $
                  </span>
                  <Input
                    type="number"
                    value={monto}
                    onChange={(e) => setMonto(e.target.value)}
                    className="pl-6 h-11 text-orange-700 font-bold tabular-nums"
                  />
                </div>
              </div>
            </div>

            <div>
              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Evidencia Fotográfica
              </Label>
              <button
                type="button"
                onClick={handleAddEvidencia}
                className="mt-1 w-full rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center transition-colors hover:border-orange-400 hover:bg-orange-50"
              >
                <Camera className="mx-auto size-6 text-muted-foreground" />
                <div className="mt-2 text-sm font-semibold">Tocar para capturar o subir imágenes</div>
                <div className="text-xs text-muted-foreground">Máximo 3 fotos (JPG, PNG)</div>
              </button>
              {evidencia.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {evidencia.map((file, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-2 rounded-full bg-orange-50 border border-orange-200 px-3 py-1 text-xs font-semibold text-orange-700"
                    >
                      {file}
                      <button
                        type="button"
                        aria-label={`Quitar ${file}`}
                        onClick={() => setEvidencia((e) => e.filter((_, x) => x !== i))}
                      >
                        <X className="size-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div>
              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Comentarios / Observaciones
              </Label>
              <Textarea
                value={comentarios}
                onChange={(e) => setComentarios(e.target.value)}
                placeholder="Describe brevemente la situación..."
                className="mt-1 min-h-[100px]"
              />
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
                {error}
              </div>
            )}
            {success && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-700">
                Multa registrada correctamente.
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={handleReset}>
                Cancelar
              </Button>
              <Button className="gap-2 bg-orange-600 hover:bg-orange-700" onClick={handleConfirmar}>
                <FileCheck2 className="size-4" /> Confirmar Multa
              </Button>
            </div>
          </div>
        </SectionCard>

        <div className="space-y-4">
          {vehiculo ? (
            <>
              <VehiculoPreviewCard vehiculo={vehiculo} />
              <SectionCard title="Historial Reciente">
                {historial.length === 0 ? (
                  <div className="text-xs text-muted-foreground">Sin multas previas pagadas.</div>
                ) : (
                  <ul className="space-y-2">
                    {historial.map((m) => (
                      <li key={m.id} className="flex items-center justify-between text-sm">
                        <div>
                          <div className="font-semibold">{m.tipo}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(m.fecha).toLocaleDateString("es-MX", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </div>
                        </div>
                        <StatusBadge variant={m.estado === "pendiente" ? "warning" : "neutral"}>
                          {m.estado}
                        </StatusBadge>
                      </li>
                    ))}
                  </ul>
                )}
              </SectionCard>
            </>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-muted-foreground">
              Busca una placa para ver los datos del vehículo.
            </div>
          )}

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 text-white overflow-hidden relative">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_20%_30%,rgba(234,88,12,0.6),transparent_60%)]" />
            <div className="relative">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Ubicación Actual
              </div>
              <div className="mt-1 text-lg font-black">Estacionamiento 2</div>
              <div className="text-xs text-slate-300">(Ingenierías)</div>
              <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-slate-800 px-3 py-1 text-xs">
                <MapPin className="size-3 text-orange-500" />
                19.0558° N, 98.2831° W
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verificar visualmente**

Navegar a `/ipad/multas`. Debe mostrar:
- Título + subtítulo.
- Formulario izquierdo: buscador de placa, tipo, monto, evidencia (botón para agregar fotos mock), comentarios.
- Panel derecho vacío hasta que se ingrese una placa válida (ej. "ABC-123-D" → muestra `VehiculoPreviewCard` con Juan Pérez).
- Historial reciente muestra la multa pendiente del vehículo.
- Al final, mapa mock oscuro con ubicación.

Confirmar multa con tipo + monto válido → mensaje verde + reset del formulario. Ir a `/ipad/vehiculos` → el vehículo tiene 1 multa más pendiente. Ir a `/ipad/alertas` → aparece una alerta moderada con "Nueva multa registrada".

Responsive: en `< lg` el panel lateral se apila debajo.

---

## Task 17: `HistorialScreen`

**Files:**
- Modify: `src/screens/ipad/HistorialScreen.tsx`

- [ ] **Step 1: `HistorialScreen.tsx` completo**

```tsx
import { useMemo, useState } from "react"
import { Clock, Filter, History, Search } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useIpadData } from "./context/IpadDataContext"
import { KpiCard } from "./components/KpiCard"
import { SectionCard } from "./components/SectionCard"
import { StatusBadge } from "./components/StatusBadge"
import { officersSeed } from "./data"

export function HistorialScreen() {
  const { eventos, vehiculos, puntosControl } = useIpadData()
  const [query, setQuery] = useState("")
  const [resultadoFilter, setResultadoFilter] = useState<string>("todos")
  const [puntoFilter, setPuntoFilter] = useState<string>("todos")
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const officersById = Object.fromEntries(officersSeed.map((o) => [o.id, o]))

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    return eventos.filter((e) => {
      if (resultadoFilter !== "todos" && e.resultado !== resultadoFilter) return false
      if (puntoFilter !== "todos" && e.puntoId !== puntoFilter) return false
      if (!q) return true
      const v = vehiculos.find((x) => x.id === e.vehiculoId)
      return (
        v?.matricula.toLowerCase().includes(q) ||
        v?.propietario.nombre.toLowerCase().includes(q)
      )
    })
  }, [eventos, vehiculos, query, resultadoFilter, puntoFilter])

  const hoy = new Date().toDateString()
  const eventosHoy = eventos.filter((e) => new Date(e.timestamp).toDateString() === hoy).length
  const denegadosHoy = eventos.filter(
    (e) => e.resultado === "denegado" && new Date(e.timestamp).toDateString() === hoy
  ).length

  const selectedEvento = selectedId ? eventos.find((e) => e.id === selectedId) ?? null : null
  const selectedVehiculo = selectedEvento
    ? vehiculos.find((v) => v.id === selectedEvento.vehiculoId)
    : null

  return (
    <div className="space-y-5 max-w-[1400px] mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Historial de Accesos</h1>
        <p className="text-sm text-muted-foreground">
          Registro cronológico de todos los eventos de entrada y salida.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard label="Eventos Totales" value={eventos.length} icon={<History className="size-4" />} accent="info" />
        <KpiCard label="Registrados Hoy" value={eventosHoy} icon={<Clock className="size-4" />} accent="primary" />
        <KpiCard label="Denegados Hoy" value={denegadosHoy} icon={<Filter className="size-4" />} accent="danger" />
      </div>

      <SectionCard
        title="Registros"
        icon={<Filter className="size-4" />}
        contentClassName="px-0"
        action={
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Placa o nombre..."
                className="h-9 pl-9 w-48"
              />
            </div>
            <Select value={resultadoFilter} onValueChange={setResultadoFilter}>
              <SelectTrigger className="h-9 w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="permitido">Permitidos</SelectItem>
                <SelectItem value="denegado">Denegados</SelectItem>
              </SelectContent>
            </Select>
            <Select value={puntoFilter} onValueChange={setPuntoFilter}>
              <SelectTrigger className="h-9 w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los puntos</SelectItem>
                {puntosControl.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
      >
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>TIMESTAMP</TableHead>
                <TableHead>VEHÍCULO</TableHead>
                <TableHead>PUNTO</TableHead>
                <TableHead>OFICIAL</TableHead>
                <TableHead>RESULTADO</TableHead>
                <TableHead>MOTIVO</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((e) => {
                const v = vehiculos.find((x) => x.id === e.vehiculoId)
                const p = puntosControl.find((x) => x.id === e.puntoId)
                const o = officersById[e.oficialId]
                return (
                  <TableRow
                    key={e.id}
                    className="cursor-pointer hover:bg-slate-50"
                    onClick={() => setSelectedId(e.id)}
                  >
                    <TableCell className="tabular-nums text-xs">
                      {new Date(e.timestamp).toLocaleString("es-MX", {
                        month: "short",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </TableCell>
                    <TableCell>
                      <div className="font-mono font-bold text-orange-600">{v?.matricula ?? "—"}</div>
                      <div className="text-xs text-muted-foreground">{v?.propietario.nombre ?? ""}</div>
                    </TableCell>
                    <TableCell className="text-sm">{p?.nombre ?? "—"}</TableCell>
                    <TableCell className="text-sm">{o?.nombre ?? e.oficialId}</TableCell>
                    <TableCell>
                      <StatusBadge
                        variant={e.resultado === "permitido" ? "success" : "danger"}
                        dot
                      >
                        {e.resultado === "permitido" ? "Permitido" : "Denegado"}
                      </StatusBadge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {e.motivo ?? "—"}
                    </TableCell>
                  </TableRow>
                )
              })}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                    Sin eventos con esos filtros.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </SectionCard>

      <Sheet open={!!selectedId} onOpenChange={(v) => !v && setSelectedId(null)}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Detalle del evento</SheetTitle>
            <SheetDescription>
              {selectedEvento && new Date(selectedEvento.timestamp).toLocaleString("es-MX")}
            </SheetDescription>
          </SheetHeader>
          {selectedEvento && selectedVehiculo && (
            <div className="p-4 space-y-4">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Vehículo
                </div>
                <div className="font-mono text-lg font-black text-orange-600">
                  {selectedVehiculo.matricula}
                </div>
                <div className="text-sm">{selectedVehiculo.propietario.nombre}</div>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Resultado
                </div>
                <StatusBadge
                  variant={selectedEvento.resultado === "permitido" ? "success" : "danger"}
                  dot
                >
                  {selectedEvento.resultado === "permitido" ? "Permitido" : "Denegado"}
                </StatusBadge>
              </div>
              {selectedEvento.motivo && (
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    Motivo
                  </div>
                  <div className="text-sm">{selectedEvento.motivo}</div>
                </div>
              )}
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Oficial
                </div>
                <div className="text-sm">{officersById[selectedEvento.oficialId]?.nombre}</div>
                <Badge variant="outline" className="mt-1">
                  Turno {officersById[selectedEvento.oficialId]?.turno}
                </Badge>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
```

- [ ] **Step 2: Verificar visualmente**

Navegar a `/ipad/historial`. Debe mostrar:
- Título + subtítulo.
- 3 KPIs (Eventos Totales, Registrados Hoy, Denegados Hoy).
- Filtros: buscador, resultado, punto.
- Tabla con columnas: Timestamp, Vehículo, Punto, Oficial, Resultado, Motivo.
- Clic en fila → abre Sheet lateral con detalle completo.

Después de registrar permitir/denegar en `/ipad/acceso`, el evento aparece aquí en la parte superior.

---

## Task 18: `AlertasScreen`

**Files:**
- Modify: `src/screens/ipad/AlertasScreen.tsx`

- [ ] **Step 1: `AlertasScreen.tsx` completo**

```tsx
import { useMemo } from "react"
import {
  AlertCircle,
  AlertTriangle,
  Bell,
  Check,
  CheckCircle2,
  Info,
  Siren,
  UserPlus,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useIpadData } from "./context/IpadDataContext"
import { KpiCard } from "./components/KpiCard"
import { SectionCard } from "./components/SectionCard"
import { StatusBadge } from "./components/StatusBadge"
import type { Alerta, SeveridadAlerta, TipoAlerta } from "./types"

const iconoPorTipo: Record<TipoAlerta, LucideIcon> = {
  placa_detectada: Bell,
  incidente: AlertCircle,
  salida_bloqueada: Siren,
  ronda: CheckCircle2,
  visitante: UserPlus,
}

const severidadCopy: Record<SeveridadAlerta, { label: string; variant: "danger" | "warning" | "info"; color: "warning" | "primary" | "info" | "success" }> = {
  critica: { label: "Críticas", variant: "danger", color: "warning" },
  moderada: { label: "Moderadas", variant: "warning", color: "primary" },
  info: { label: "Informativas", variant: "info", color: "info" },
}

export function AlertasScreen() {
  const { alertas, marcarAlertaAtendida } = useIpadData()

  const { critica, moderada, info, activasHoy, atendidasHoy, criticasPendientes } = useMemo(() => {
    const hoy = new Date().toDateString()
    const activas = alertas.filter((a) => a.estado === "activa")
    const atendidas = alertas.filter((a) => a.estado === "atendida")
    return {
      critica: activas.filter((a) => a.severidad === "critica"),
      moderada: activas.filter((a) => a.severidad === "moderada"),
      info: activas.filter((a) => a.severidad === "info"),
      activasHoy: activas.filter((a) => new Date(a.timestamp).toDateString() === hoy).length,
      atendidasHoy: atendidas.filter((a) => new Date(a.timestamp).toDateString() === hoy).length,
      criticasPendientes: activas.filter((a) => a.severidad === "critica").length,
    }
  }, [alertas])

  return (
    <div className="space-y-5 max-w-[1400px] mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Centro de Alertas</h1>
        <p className="text-sm text-muted-foreground">
          Feed en vivo de incidentes, rondas y detecciones del campus.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard label="Activas" value={activasHoy} icon={<Bell className="size-4" />} accent="primary" />
        <KpiCard label="Atendidas Hoy" value={atendidasHoy} icon={<Check className="size-4" />} accent="success" />
        <KpiCard label="Críticas Pendientes" value={criticasPendientes} icon={<AlertTriangle className="size-4" />} accent="danger" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <AlertaColumn
          titulo="Críticas"
          icon={<Siren className="size-4" />}
          alertas={critica}
          severidad="critica"
          onAtender={marcarAlertaAtendida}
        />
        <AlertaColumn
          titulo="Moderadas"
          icon={<AlertCircle className="size-4" />}
          alertas={moderada}
          severidad="moderada"
          onAtender={marcarAlertaAtendida}
        />
        <AlertaColumn
          titulo="Informativas"
          icon={<Info className="size-4" />}
          alertas={info}
          severidad="info"
          onAtender={marcarAlertaAtendida}
        />
      </div>
    </div>
  )
}

function AlertaColumn({
  titulo,
  icon,
  alertas,
  severidad,
  onAtender,
}: {
  titulo: string
  icon: React.ReactNode
  alertas: Alerta[]
  severidad: SeveridadAlerta
  onAtender: (id: string) => void
}) {
  const sev = severidadCopy[severidad]
  return (
    <SectionCard title={titulo} icon={icon}>
      {alertas.length === 0 ? (
        <div className="py-10 text-center text-xs text-muted-foreground">Sin alertas.</div>
      ) : (
        <div className="space-y-3">
          {alertas.map((a) => {
            const Icon = iconoPorTipo[a.tipo]
            return (
              <div key={a.id} className="rounded-xl border border-slate-200 bg-white p-3">
                <div className="flex items-start gap-3">
                  <span className={`flex size-9 shrink-0 items-center justify-center rounded-full ${sev.variant === "danger" ? "bg-red-50 text-red-600" : sev.variant === "warning" ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600"}`}>
                    <Icon className="size-4" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold leading-tight">{a.descripcion}</div>
                    <div className="mt-1 flex items-center gap-2">
                      <StatusBadge variant={sev.variant}>{sev.label.slice(0, -1)}</StatusBadge>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(a.timestamp).toLocaleTimeString("es-MX", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 w-full gap-1.5"
                  onClick={() => onAtender(a.id)}
                >
                  <Check className="size-3.5" /> Marcar atendida
                </Button>
              </div>
            )
          })}
        </div>
      )}
    </SectionCard>
  )
}
```

- [ ] **Step 2: Verificar visualmente**

Navegar a `/ipad/alertas`. Debe mostrar:
- Título + subtítulo.
- 3 KPIs (Activas, Atendidas Hoy, Críticas Pendientes).
- 3 columnas por severidad (Críticas, Moderadas, Informativas) con tarjetas de alerta.
- Debe haber al menos 1 crítica (salida_bloqueada del seed), 1 moderada (incidente), 2 informativas (placa_detectada + visitante).
- Clic en "Marcar atendida" → alerta desaparece del listado y baja el KPI correspondiente.

Después de registrar una multa en `/ipad/multas` → aparece nueva alerta moderada.
Después de denegar un acceso en `/ipad/acceso` → aparece nueva alerta moderada.

Responsive: en `< lg` las 3 columnas se apilan en 1.

---

## Task 19: Verificación final

**Files:**
- None (solo verifica).

- [ ] **Step 1: Ejecutar type-check completo**

Run:
```bash
npm run build
```

Expected: build pasa sin errores y sin warnings de TypeScript.

- [ ] **Step 2: Ejecutar lint**

Run:
```bash
npm run lint
```

Expected: sin errores nuevos. Si aparecen warnings sobre `fast-refresh` en archivos de contexto (exportan hook + provider), está bien (patrón estándar) — solo fallar si hay errores, no warnings.

- [ ] **Step 3: Checklist manual completo**

Con `npm run dev` corriendo, verificar en el navegador:

**Selector y navegación:**
- [ ] `/` muestra 4 tarjetas. La de iPad está **naranja**, dice "Disponible · 8 pantallas".
- [ ] Clic en iPad navega a `/ipad` y redirige a `/ipad/login`.

**Login:**
- [ ] Se muestran 4 tarjetas de oficiales con foto, nombre, turno.
- [ ] Clic en oficial muestra teclado numérico con 4 puntos.
- [ ] PIN **1234** + Oficial Mendoza → entra al dashboard.
- [ ] PIN incorrecto → shake + puntos rojos + mensaje de error.
- [ ] "Cambiar" regresa al selector de oficiales.
- [ ] Refresh mantiene sesión (sessionStorage funciona).

**Layout y navegación entre pantallas:**
- [ ] Sidebar muestra jerarquía: Dashboard | Accesos (Punto de Control, Salidas) | Vehículos (Listado, Multas) | Historial | Alertas.
- [ ] Footer del sidebar muestra oficial con avatar + botón "Cerrar Sesión" → limpia sesión y vuelve al login.
- [ ] Ítem activo del sidebar resalta en naranja.
- [ ] Header muestra hora, fecha, oficial con avatar y turno.
- [ ] En `< lg` el sidebar se oculta y aparece botón hamburguesa; abre el Sheet.

**Reactividad de los datos:**
- [ ] Permitir acceso en `/ipad/acceso` → aparece en `/ipad/historial` (nueva fila arriba) y contador del dashboard sube.
- [ ] Denegar acceso en `/ipad/acceso` → aparece evento denegado + alerta moderada en `/ipad/alertas`.
- [ ] Registrar multa válida en `/ipad/multas` → vehículo tiene 1 multa más en `/ipad/vehiculos`, aparece alerta moderada en `/ipad/alertas`, KPI "Con Multas Pendientes" sube.
- [ ] Autorizar salida en `/ipad/salidas` → vehículo desaparece del listado de bloqueados.
- [ ] Marcar alerta atendida en `/ipad/alertas` → desaparece del listado, baja KPI.

**Responsive:**
- [ ] Ancho ~1280 (landscape desktop): layout completo como mockups, sidebar abierto, grids 3-col.
- [ ] Ancho ~820 (tablet portrait): sidebar colapsado a drawer; grids 2-col o 3-col según sección.
- [ ] Ancho ~390 (mobile): sidebar drawer; grids 1-col; tablas con scroll-x.

**Visual spot check:**
- [ ] Todas las pantallas usan paleta naranja UDLAP (sin azules del selector).
- [ ] Sin errores en la consola del navegador.

- [ ] **Step 4: Reportar estado al usuario**

Reportar al usuario:
- Cantidad de archivos creados/modificados.
- Resultado de `npm run build` y `npm run lint`.
- Qué partes del checklist pasaron / fallaron.
- Ningún commit — todos los cambios quedan en el working tree para que el usuario decida cuándo commitear (preferencia explícita: `feedback_no_commits.md` en memoria).

---

## Self-Review (hecho por autor del plan)

**Spec coverage:**
- ✅ 8 pantallas cubiertas (Tasks 11-18: Login, Dashboard, PuntoControl, Salidas, Vehiculos, Multas, Historial, Alertas).
- ✅ Layout compartido (Task 9), sidebar jerárquico (Task 8), header (Task 7).
- ✅ Dos contextos separados (Tasks 4-5), modelo de datos completo (Task 2-3).
- ✅ Componentes reutilizables: KpiCard, StatusBadge, SectionCard, ActivityFeedItem (Task 6), PuntoControlCard (Task 12), VehiculoPreviewCard (Task 13), FlujoBarChart (Task 12), PinKeypad, NumericKey (Task 11). 9 componentes ≡ spec.
- ✅ Sistema visual (naranja UDLAP, Inter, Tailwind, responsive con Sheet).
- ✅ Cambio en InterfaceSelector (Task 10).
- ✅ Rutas en App.tsx (Task 10).
- ✅ shadcn table + dialog (Task 1).
- ✅ sessionStorage persist (Task 4).
- ✅ Acciones reactivas (permitir, denegar, registrar multa, autorizar salida, marcar alerta) (Task 5).
- ✅ Verificación final (Task 19).

**Placeholder scan:** sin TBD/TODO. Cada step tiene código o comandos concretos. Los stubs temporales de Task 10 son intencionales (para que App.tsx compile) y se reemplazan en Tasks 11-18.

**Type consistency:**
- `Officer`, `Vehiculo`, `Multa`, `EventoAcceso`, `Alerta`, `Punto`, `DashboardKpis`, `MultaInput` consistentes entre types.ts, data.ts, contexts y screens.
- `login(id, pin)`, `logout()`, `permitirAcceso/denegarAcceso/registrarMulta/autorizarSalida/marcarAlertaAtendida` con firmas consistentes entre contexto y consumidores.
- `StatusBadge` variant set consistente (success/warning/danger/info/neutral/purple).
- `KpiCard` accent enum consistente.

**Commit steps:** No hay steps de commit (preferencia explícita del usuario). Cada task termina con verificación de build/visual.
