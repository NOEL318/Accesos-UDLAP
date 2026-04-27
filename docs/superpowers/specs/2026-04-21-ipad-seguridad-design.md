# Spec — Interfaz iPad (Seguridad UDLAP)

**Fecha:** 2026-04-21
**Autor:** Noel + Claude
**Estado:** Aprobado por el usuario — listo para plan de implementación

---

## Contexto

El repositorio `accesos-udlap-2026` ya tiene dos interfaces vivas:
- **Quiosco** (`/quiosco`) — control de acceso con kiosco.
- **Móvil** (`/movil`) — app estudiantil con login, dashboard, visitas, QR/NFC, horario, perfil, comedor, biblioteca.

La ruta `/ipad` actualmente renderiza `<ComingSoon>` porque la interfaz aún no existía. Este spec define la **implementación completa de la interfaz iPad** destinada a oficiales de seguridad UDLAP, basada en 5 mockups entregados por el usuario en `base/controlvehicularynocturno(ipad)_and_4_others/`:

1. `dashboarddeseguridadudlap(naranja).png` — Dashboard operativo del oficial.
2. `controlvehicularynocturno(ipad).png` — Punto de Control (acceso principal).
3. `restriccionesdesalidaseguridad.png` — Alertas de salida y restricciones.
4. `gestióndevehículosseguridad.png` — Gestión y listado de vehículos.
5. `registrarmultaseguridad.png` — Registro de nuevas multas.

## Objetivo

Construir las 8 pantallas de la interfaz iPad (5 de los mockups + Login + Historial + Alertas, las dos últimas inferidas por el autor siguiendo la estética de los mockups), con un layout compartido, navegación entre ellas, datos mock reactivos (la app "se siente viva" al navegar), y responsivo completo usando shadcn.

## Decisiones de diseño aprobadas

| # | Pregunta | Respuesta |
|---|---|---|
| 1 | Alcance | 5 pantallas de mockups + Login + Historial + Alertas inferidas |
| 2 | Sidebar | Jerárquico con agrupaciones (Dashboard · Accesos › [Punto de Control, Salidas] · Vehículos › [Listado, Multas] · Historial · Alertas) |
| 3 | Historial y Alertas (sin mockup) | Inferidos por el autor, coherentes con el resto |
| 4 | Datos | Mock + estado local reactivo (se siente viva sin backend) |
| 5 | Login | PIN + selector de oficial |
| 6 | Responsive | Completo (mobile / tablet portrait / tablet landscape / desktop) con shadcn |
| 7 | Arquitectura | Espejo del patrón móvil (`src/screens/movil/`) con dos contextos separados |

## Arquitectura

### Estructura de archivos

```
src/screens/ipad/
├── IpadLayout.tsx           # Shell + gate de sesión + <Outlet/>
├── IpadSidebar.tsx          # Sidebar jerárquico, colapsable, Sheet en mobile
├── IpadHeader.tsx           # Search + bell + oficial + fecha/turno
├── LoginScreen.tsx          # Selector de oficial + PIN numérico
├── DashboardScreen.tsx      # 4 KPIs + puntos de control + flujo 24h + feed
├── PuntoControlScreen.tsx   # Acceso vehicular / entradas nocturnas
├── SalidasScreen.tsx        # Alertas de salida y restricciones
├── VehiculosScreen.tsx      # Gestión y listado
├── MultasScreen.tsx         # Registrar nueva multa
├── HistorialScreen.tsx      # Tabla cronológica de eventos (inferida)
├── AlertasScreen.tsx        # Feed de alertas por severidad (inferida)
├── components/
│   ├── KpiCard.tsx
│   ├── StatusBadge.tsx
│   ├── SectionCard.tsx
│   ├── PuntoControlCard.tsx
│   ├── ActivityFeedItem.tsx
│   ├── VehiculoPreviewCard.tsx
│   ├── FlujoBarChart.tsx
│   ├── PinKeypad.tsx
│   └── NumericKey.tsx
├── context/
│   ├── IpadSessionContext.tsx
│   └── IpadDataContext.tsx
└── data.ts                  # seed: oficiales, vehículos, multas, eventos, alertas, puntos
```

### Rutas (en `src/App.tsx`)

Reemplaza la ruta actual `/ipad → ComingSoon` por:

```
/ipad                   → IpadLayout (envuelve providers)
  index                 → redirect a /ipad/login o /ipad/dashboard según sesión
  /ipad/login
  /ipad/dashboard
  /ipad/acceso          ← Punto de Control
  /ipad/salidas
  /ipad/vehiculos
  /ipad/multas
  /ipad/historial
  /ipad/alertas
```

El `IpadLayout` monta ambos providers (Session + Data). Si la ruta no es `/login` y no hay oficial autenticado, redirige a `/ipad/login`.

### Cambio en el selector

`src/screens/InterfaceSelector.tsx`: el objeto `ipad` cambia a `available: true` y `screens: "8 pantallas"`. El tag pasa de "Próximamente" a "Disponible".

## Estado y flujo de datos

Dos contextos separados para aislar re-renders.

### `IpadSessionContext`

```ts
type Officer = {
  id: string
  nombre: string          // "Oficial Mendoza"
  turno: "Matutino" | "Vespertino" | "Nocturno"
  avatar: string
  pin: string             // mock, 4 dígitos
}

type SessionValue = {
  officer: Officer | null
  login(id: string, pin: string): boolean
  logout(): void
}
```

Persistencia en `sessionStorage` para sobrevivir refresh durante la demo.

### `IpadDataContext`

```ts
type DataValue = {
  vehiculos: Vehiculo[]
  multas: Multa[]
  eventos: EventoAcceso[]
  alertas: Alerta[]
  puntosControl: Punto[]
  kpis: DashboardKpis           // derivado

  permitirAcceso(vehiculoId: string, puntoId: string): void
  denegarAcceso(vehiculoId: string, puntoId: string, motivo: string): void
  registrarMulta(multa: MultaInput): void
  autorizarSalida(vehiculoId: string): void
  marcarAlertaAtendida(alertaId: string): void
}
```

### Modelo de datos

| Tipo | Campos clave |
|---|---|
| `Vehiculo` | `id`, `matricula`, `propietario { nombre, idUdlap, tipo: "estudiante" \| "empleado" \| "visita" \| "externo" }`, `foto`, `modelo`, `color`, `sello: { vigente, vence }`, `ubicacion`, `multasPendientes`, `estadoAcceso: "permitido" \| "denegado" \| "revision"` |
| `Multa` | `id`, `vehiculoId`, `oficialId`, `tipo`, `montoMxn`, `evidencia: string[]`, `comentarios`, `fecha`, `estado: "pendiente" \| "pagada" \| "cancelada"` |
| `EventoAcceso` | `id`, `vehiculoId`, `puntoId`, `oficialId`, `resultado: "permitido" \| "denegado"`, `motivo?`, `timestamp` |
| `Alerta` | `id`, `tipo: "placa_detectada" \| "incidente" \| "salida_bloqueada" \| "ronda" \| "visitante"`, `severidad: "critica" \| "moderada" \| "info"`, `descripcion`, `vehiculoId?`, `timestamp`, `estado: "activa" \| "atendida"` |
| `Punto` | `id`, `nombre`, `tipo: "principal" \| "postgrado" \| "deportes" \| "residencial"`, `estado: "activa" \| "standby"`, `oficialOperadorId` |

### Efectos de las acciones

- `permitirAcceso`/`denegarAcceso` → crea `EventoAcceso` + actualiza KPIs (`entradasHoy`, `vehiculosEnCampus`).
- `registrarMulta` → añade a `multas`, marca `vehiculo.multasPendientes++`, crea alerta moderada.
- `autorizarSalida` → pone `vehiculo.estadoAcceso = "permitido"`, crea evento de salida.
- `marcarAlertaAtendida` → cambia `alerta.estado` a `"atendida"`.

### Formularios

Estado local con `useState`. Validación inline sin librería externa. `shadcn/field` + `input` + `textarea` + `select` + `combobox`.

### Error handling

- `use*` hooks throw si se usan fuera de su provider (error de desarrollo).
- Rutas sin sesión → redirect a `/ipad/login`.
- Form inválido → mensaje inline debajo del campo.
- Imágenes/avatares con `onError` → fallback a iniciales (shadcn `Avatar`).
- Las acciones del contexto son síncronas; sin estados de carga falsos.

## Detalle de pantallas

### 1. `LoginScreen` — `/ipad/login`

Pantalla centrada, fondo naranja UDLAP degradado suave.
- **Paso 1:** grid de tarjetas con oficiales (foto + nombre + turno). Clic selecciona.
- **Paso 2:** teclado numérico táctil grande (4 dígitos) + botón "Ingresar". PIN correcto redirige a `/ipad/dashboard`. Errado: sacudida + mensaje inline.

### 2. `DashboardScreen` — `/ipad/dashboard`

Basado en `dashboarddeseguridadudlap(naranja).png`.
- **4 KPIs arriba:** Entradas Hoy, Incidentes Activos, Vehículos en Campus, Visitas Nocturnas.
- **Puntos de Control:** 4 tarjetas (Puerta 1 Principal, Puerta 2 Postgrado, Puerta 3 Deportes standby, Acceso Residencial). Clic → `/ipad/acceso` con punto preseleccionado.
- **Flujo Vehicular 24h:** gráfico de barras CSS (sin librería) con 8 franjas horarias.
- **Acciones Rápidas:** Nuevo Reporte (→ Multas), Activar Alerta General (toast), Contactar Soporte (dialog).
- **Actividad Reciente:** últimos 4 eventos derivados de `eventos` + `alertas`.

### 3. `PuntoControlScreen` — `/ipad/acceso`

Basado en `controlvehicularynocturno(ipad).png`.
- **Tabs:** Acceso Vehicular (default) / Entradas Nocturnas.
- **Selector de punto** arriba (Puerta 1 por default).
- **Tarjeta central "Control de Vehículos":** placa (buscar/escanear), foto conductor, nombre, ID, tipo (badge), sello vigente/vencido, multas pendientes, # personas.
- **Textarea** observaciones adicionales.
- **Panel lateral "Indicadores de Riesgo":** switches para estado detectable, aliento etílico, dificultad al hablar, coordinación motriz.
- **Botones Denegar / Permitir** → llaman al contexto + toast + limpian formulario.
- **Contador** de vehículos gestionados en el punto (KPI local).

### 4. `SalidasScreen` — `/ipad/salidas`

Basado en `restriccionesdesalidaseguridad.png`.
- **Banner "Protocolo Activo"** con botón Autorizar Salida Especial.
- **Vehículo destacado** arriba (el más reciente bloqueado).
- **Grid de tarjetas "Salidas Bloqueadas":** foto, placa, conductor, motivo (multa/restricción académica/incidente). Acciones: Ver Protocolo, Ver Multas, Autorizar.
- **Filtros** por motivo y sección.

### 5. `VehiculosScreen` — `/ipad/vehiculos`

Basado en `gestióndevehículosseguridad.png`.
- **Título** y **3 KPIs** (Vehículos en Campus, Con Multas Pendientes, Sello Escolar Vencido).
- **Tabla:** matrícula, propietario, tipo, multas, acceso, acciones. Paginación 4/página.
- **Exportar CSV** (mock descarga) + **Registrar Nuevo** (→ Multas).

### 6. `MultasScreen` — `/ipad/multas`

Basado en `registrarmultaseguridad.png`.
- **2 columnas** en desktop, apiladas en mobile.
- **Izquierda:** buscar vehículo por placa (combobox), tipo infracción (select), monto, evidencia fotográfica (mock), comentarios.
- **Derecha:** `VehiculoPreviewCard` con foto, conductor, ID, placa, modelo, estatus, historial reciente.
- **Mapa mock** con ubicación abajo (SVG estilizado, sin librería).
- **Cancelar / Confirmar Multa** → contexto + toast + reset.

### 7. `HistorialScreen` — `/ipad/historial`

Inferida, estética coherente.
- **Tabla cronológica** de `eventos`.
- Columnas: timestamp, tipo, vehículo, punto, oficial, resultado.
- **Filtros:** rango de fechas, tipo, punto, oficial, resultado.
- **Buscador** por placa/nombre.
- Clic en fila → `Sheet` lateral con detalle completo.

### 8. `AlertasScreen` — `/ipad/alertas`

Inferida, estética coherente.
- **Feed vertical** agrupado por severidad (Críticas / Moderadas / Informativas).
- Tarjetas con icono, timestamp, descripción, vehículo relacionado, "Marcar atendida".
- **KPIs arriba:** Activas, Atendidas hoy, Críticas pendientes.

## Sistema visual

### Paleta

Usa la paleta UDLAP naranja ya presente en `src/index.css` (`--primary` en oklch naranja).

| Rol | Valor | Uso |
|---|---|---|
| Primary | `#ea580c` (ya en tokens) | Logo, sidebar activo, CTAs, KPIs destacados |
| Primary-hover | `#c2410c` | Hover |
| Bg page | `bg-slate-50` | Workspace |
| Bg surface | `#ffffff` (`--card`) | Cards, sidebar, header |
| Border | `#e5e7eb` (`--border`) | Divisores |
| Text primary | `#0f172a` | Títulos |
| Text muted | `#64748b` | Subtítulos |
| Success | `#10b981` | Permitido, Vigente, Activa |
| Warning | `#f59e0b` | Revisión, Pendiente, Standby |
| Danger | `#ef4444` | Denegado, Crítico |
| Info | `#3b82f6` | Estudiante, info |
| Purple | `#8b5cf6` | Empleado |

No se añaden nuevas CSS variables. Se usa lo existente + clases Tailwind directas.

### Tipografía

Inter Variable (ya cargada).
- Títulos: `text-2xl font-bold tracking-tight`
- KPI: `text-4xl font-black tabular-nums`
- Labels: `text-xs font-semibold uppercase tracking-wider text-muted-foreground`
- Body: `text-sm`

### Componentes shadcn

Ya instalados: `card`, `button`, `badge`, `input`, `textarea`, `select`, `combobox`, `tabs`, `avatar`, `separator`, `sheet`, `switch`, `label`, `field`, `skeleton`, `dropdown-menu`.

A instalar si faltan: `table`, `dialog`.

### Responsive

| Breakpoint | Comportamiento |
|---|---|
| `< md` (< 768) | Sidebar oculto → drawer `Sheet`. Header colapsa search. Tablas → cards apiladas. Formularios en una columna. |
| `md`–`lg` (768–1024) | Sidebar en modo rail (solo iconos). Layouts 2-col siguen 2-col. |
| `≥ lg` (≥ 1024) | Layout completo como mockups. |

### Animación

- Tailwind `transition-colors` / `transition-transform`.
- `fadeUp` ya existe en `index.css`, se reutiliza para cards.
- Toasts: mini componente propio en `IpadLayout` (portal + `useState`). No se instala `sonner` salvo que el usuario lo pida.

## Verificación

Proyecto sin suite de tests (`package.json` no tiene `test` script). Verificación = checks automáticos + checklist manual.

### Checks automáticos (obligatorios)

- `npm run build` — `tsc -b` valida tipos.
- `npm run lint` — ESLint sin errores nuevos.

### Checklist manual

- Selector muestra iPad como disponible y navega a `/ipad`.
- `/ipad` sin sesión redirige a `/ipad/login`.
- Login con oficial + PIN correcto entra al dashboard; PIN errado muestra error.
- Logout (footer del sidebar) limpia sesión y vuelve al login.
- Las 7 pantallas internas renderizan sin error de consola.
- Sidebar resalta ruta activa.
- Permitir/denegar en Punto de Control → aparece en Historial y KPI "Entradas Hoy" sube.
- Registrar multa → aparece en Vehículos, Alertas, y KPI "Con Multas Pendientes" sube.
- Autorizar salida → vehículo sale de "Salidas Bloqueadas", queda en Historial.
- Marcar alerta atendida → baja KPI crítico.
- Responsive en ~1280, ~820, ~390 px. Sidebar colapsa correctamente.
- Refresh preserva sesión (sessionStorage).

## Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Layouts densos se ven mal en mobile | Responsive explícito por breakpoint, probar en ancho real |
| Gráfico CSS se ve pobre | Si queda feo considerar `recharts`; primero intentar CSS limpio |
| `data.ts` grande | Mantener archivo único como patrón de `movil/data.ts` |
| Context re-render excesivo | Dos contextos separados + memoización de acciones |
| Integrar mapas real | Fuera de alcance, usar placeholder SVG |

## YAGNI — no incluido

- `sonner`, `recharts`, `zustand`, `date-fns`, libs de forms — no se instalan salvo necesidad.
- Dark mode — mockups son light, consistencia con el resto.
- Tests automatizados — no hay framework en el proyecto.
- Cambios en `movil/` o `quiosco/`.
- Backend real.
- Portrait-only o landscape-only — responsive cubre todo.

## Deliverables

1. Este spec en `docs/superpowers/specs/2026-04-21-ipad-seguridad-design.md` (commit).
2. 8 pantallas, layout, sidebar, header, 2 contextos, 9 componentes reutilizables, data mock.
3. Cambio en `InterfaceSelector.tsx` (iPad disponible).
4. Rutas en `App.tsx` reemplazando `ComingSoon`.
5. `npm run build` y `npm run lint` limpios.
6. (Condicional) `npx shadcn@latest add table dialog` si faltan.
