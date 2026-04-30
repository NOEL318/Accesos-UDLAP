# Cleanup, Cypress E2E y GitHub Actions — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminar emojis del código (reemplazando con íconos lucide-react), agregar comentarios JR-style en funciones top-level y callbacks de hooks, crear suite Cypress E2E con 21 specs mockeando la API, y configurar GitHub Actions CI para `dev` (tests) y `master` (tests + build).

**Architecture:** Cuatro fases secuenciales con punto de validación entre cada una. Fases 1-2 son refactors mecánicos. Fase 3 instala infraestructura de tests (comandos custom + fixtures) antes de los specs. Fase 4 agrega un solo workflow YAML y crea la rama `dev`. Vercel ya maneja el deploy desde su integración con GitHub — no se involucra el workflow.

**Tech Stack:** React 19, Vite 7, TypeScript 5.9, Express 5, Mongoose 9, Cypress 15, lucide-react 0.577, GitHub Actions (`cypress-io/github-action@v6`).

**Important — commits:** El usuario hace los commits manualmente (per memoria del proyecto). Cada checkpoint termina con un mensaje sugerido pero NO auto-commitea. Tras cada checkpoint, el usuario revisa, commitea cuando esté listo, y avisa para arrancar la siguiente tarea/fase.

---

## File Structure (resumen)

**Nuevos archivos:**
- `src/lib/icon-map.tsx` — mapper centralizado emoji → componente lucide.
- `cypress/fixtures/**/*.json` — fixtures por módulo (auth, visitas, biblioteca, comedor, horario, ipad, colegios).
- `cypress/e2e/{kiosco,movil,ipad,colegios}/*.cy.ts` — 21 specs E2E.
- `.github/workflows/ci.yml` — un solo workflow con 2 jobs.

**Archivos modificados (alto nivel):**
- `server/{index,db,env,seed}.ts` — quitar emojis de logs, renombrar `emoji`→`icon` en seed.
- `src/screens/movil/{data.ts, BibliotecaScreen, ComedorScreen, NuevaVisitaScreen, DetallesVisitaScreen, VisitasScreen}.tsx` — quitar emojis, usar icon mapper.
- `src/screens/colegios/RegistrarVisitaScreen.tsx` — `📍` → `<MapPin />`.
- `src/screens/KioscoPrincipal.tsx` — `✓`/`✕` → `<CheckCircle2 />`/`<XCircle />`.
- ~110-130 archivos en `src/` y `server/` — agregar comentarios.
- `src/lib/types.ts` — renombrar `emoji: string` → `icon: string` en `MenuItem` y `cover: string` → `icon: string` en `Libro`.
- `cypress/support/commands.ts` — agregar comandos custom.
- `cypress/support/e2e.ts` — importar el archivo de comandos.
- `cypress.config.ts` — agregar `baseUrl`.
- `package.json` — scripts de Cypress + dependencia `start-server-and-test`.

**Archivos eliminados:**
- `cypress/e2e/evidencia_hu05.cy.ts` — test trivial que se reemplaza con la suite nueva.

---

## FASE 1 — Limpieza de emojis

### Task 1.1: Crear el mapper de íconos

**Files:**
- Create: `src/lib/icon-map.tsx`

- [ ] **Step 1: Crear el archivo `src/lib/icon-map.tsx` con el contenido completo**

```tsx
// devuelve el icono lucide con color para un platillo del comedor
import {
  Salad,
  Sandwich,
  Soup,
  Drumstick,
  CupSoda,
  Leaf,
  Beef,
  Milk,
  Book,
  Notebook,
  BookMarked,
  BookOpen,
  Library,
  UtensilsCrossed,
  type LucideProps,
} from "lucide-react"

// devuelve el icono lucide para un platillo del comedor segun su nombre
export function getComidaIcon(name: string | undefined, props?: LucideProps) {
  const size = props?.size ?? 24
  switch (name) {
    case "salad":
      return <Salad size={size} className="text-green-500" {...props} />
    case "sandwich":
      return <Sandwich size={size} className="text-amber-500" {...props} />
    case "soup":
      return <Soup size={size} className="text-red-500" {...props} />
    case "drumstick":
      return <Drumstick size={size} className="text-orange-500" {...props} />
    case "juice":
      return <CupSoda size={size} className="text-pink-500" {...props} />
    case "vegan":
      return <Leaf size={size} className="text-green-600" {...props} />
    case "burger":
      return <Beef size={size} className="text-amber-700" {...props} />
    case "smoothie":
      return <Milk size={size} className="text-green-400" {...props} />
    default:
      return <UtensilsCrossed size={size} className="text-gray-400" {...props} />
  }
}

// devuelve el icono lucide para una portada de libro segun su nombre
export function getLibroIcon(name: string | undefined, props?: LucideProps) {
  const size = props?.size ?? 24
  switch (name) {
    case "book-blue":
      return <Book size={size} className="text-blue-500" {...props} />
    case "book-green":
      return <Book size={size} className="text-green-500" {...props} />
    case "book-orange":
      return <Book size={size} className="text-orange-500" {...props} />
    case "book-red":
      return <Book size={size} className="text-red-500" {...props} />
    case "book-black":
      return <Notebook size={size} className="text-gray-700" {...props} />
    case "book-brown":
      return <BookMarked size={size} className="text-amber-700" {...props} />
    case "book-yellow":
      return <BookOpen size={size} className="text-yellow-500" {...props} />
    default:
      return <Library size={size} className="text-gray-400" {...props} />
  }
}
```

- [ ] **Step 2: Verificar que TypeScript no tenga errores en el nuevo archivo**

Run: `npx tsc --noEmit -p tsconfig.app.json`
Expected: sin errores. Si lucide-react no exporta `LucideProps`, cambiar import a `type ComponentProps` y usar `ComponentProps<typeof Salad>`.

---

### Task 1.2: Renombrar campo `emoji`/`cover` → `icon` en types

**Files:**
- Modify: `src/lib/types.ts`

- [ ] **Step 1: Leer el archivo y ubicar las interfaces `MenuItem` y `Libro`**

Run: `grep -n "emoji\|cover" src/lib/types.ts`
Expected: encontrar `emoji: string` en `MenuItem` y `cover: string` en `Libro`.

- [ ] **Step 2: Cambiar `emoji: string` → `icon: string` en `MenuItem`**

```ts
// antes
emoji: string

// después
icon: string
```

- [ ] **Step 3: Cambiar `cover: string` → `icon: string` en `Libro`**

```ts
// antes
cover: string

// después
icon: string
```

- [ ] **Step 4: Verificar typecheck (debe romper en archivos que usan los nombres viejos)**

Run: `npx tsc --noEmit -p tsconfig.app.json`
Expected: errores en `data.ts`, `BibliotecaScreen.tsx`, `ComedorScreen.tsx`, `seed.ts`. Esos errores se arreglan en las siguientes tasks.

---

### Task 1.3: Actualizar `src/screens/movil/data.ts`

**Files:**
- Modify: `src/screens/movil/data.ts:127-200`

- [ ] **Step 1: Reemplazar los 5 `emoji: "🥗"` (etc.) por `icon: "salad"` (etc.) en `menuMock`**

Mapeo exacto:
```
emoji: "🥗"  → icon: "salad"
emoji: "🥙"  → icon: "sandwich"
emoji: "🍲"  → icon: "soup"
emoji: "🍗"  → icon: "drumstick"
emoji: "🧃"  → icon: "juice"
```

- [ ] **Step 2: Reemplazar los 5 `cover: "📘"` (etc.) por `icon: "book-blue"` (etc.) en `librosMock`**

Mapeo exacto:
```
cover: "📘"  → icon: "book-blue"
cover: "📗"  → icon: "book-green"
cover: "📙"  → icon: "book-orange"
cover: "📕"  → icon: "book-red"
cover: "📓"  → icon: "book-black"
```

- [ ] **Step 3: Verificar typecheck**

Run: `npx tsc --noEmit -p tsconfig.app.json`
Expected: errores en `BibliotecaScreen.tsx`, `ComedorScreen.tsx` (esos se arreglan en las siguientes tasks). Si `data.ts` tiene errores, revisar que los strings coincidan con el tipo.

---

### Task 1.4: Actualizar `ComedorScreen.tsx`

**Files:**
- Modify: `src/screens/movil/ComedorScreen.tsx:217-245` (componente `MenuItemCard`)

- [ ] **Step 1: Importar `getComidaIcon` arriba del archivo**

Agregar al bloque de imports:
```tsx
import { getComidaIcon } from "@/lib/icon-map"
```

- [ ] **Step 2: Reemplazar `{item.emoji}` por la llamada al mapper**

Localizar la línea 225:
```tsx
// antes
{item.emoji}

// después
{getComidaIcon(item.icon, { size: 32 })}
```

- [ ] **Step 3: Verificar typecheck**

Run: `npx tsc --noEmit -p tsconfig.app.json`
Expected: el error en `ComedorScreen` desaparece.

---

### Task 1.5: Actualizar `BibliotecaScreen.tsx`

**Files:**
- Modify: `src/screens/movil/BibliotecaScreen.tsx` (3 ocurrencias de `cover`)

- [ ] **Step 1: Importar `getLibroIcon` arriba del archivo**

```tsx
import { getLibroIcon } from "@/lib/icon-map"
```

- [ ] **Step 2: Reemplazar las 3 ocurrencias de `{libro?.cover ?? "📚"}` y `{libro.cover ?? "📚"}` por el mapper**

```tsx
// antes (línea 220, 261, 305)
{libro?.cover ?? "📚"}    // o sin ?
{libro.cover ?? "📚"}

// después
{getLibroIcon(libro?.icon, { size: 32 })}
{getLibroIcon(libro.icon, { size: 32 })}
```

- [ ] **Step 3: Verificar typecheck**

Run: `npx tsc --noEmit -p tsconfig.app.json`
Expected: los errores en `BibliotecaScreen` desaparecen.

---

### Task 1.6: Actualizar logs del servidor

**Files:**
- Modify: `server/index.ts:7`
- Modify: `server/db.ts:19`
- Modify: `server/env.ts:18`

- [ ] **Step 1: Quitar emoji de `server/index.ts:7`**

```ts
// antes
console.log(`🚀 Server escuchando en http://localhost:${env.PORT}`)

// después
console.log(`Server escuchando en http://localhost:${env.PORT}`)
```

- [ ] **Step 2: Quitar emoji de `server/db.ts:19`**

```ts
// antes
console.log("✅ MongoDB conectado")

// después
console.log("MongoDB conectado")
```

- [ ] **Step 3: Quitar emoji de `server/env.ts:18`**

```ts
// antes
console.error("❌ Variables de entorno inválidas:")

// después
console.error("Variables de entorno inválidas:")
```

---

### Task 1.7: Actualizar `server/seed.ts`

**Files:**
- Modify: `server/seed.ts` (logs + 8 items menu + 7 items libros)

- [ ] **Step 1: Quitar emojis de los `console.log` y `console.error`**

Buscar cada línea con `✅` o `❌`:
- Línea 67: `✅ Seed completo: ...` → `Seed completo: ...`
- Línea 142: `✅ Seed extendido: ...` → `Seed extendido: ...`
- Línea 392: `✅ Seed iPad: ...` → `Seed iPad: ...`
- Línea 471: `✅ Seed colegios: ...` → `Seed colegios: ...`
- Línea 477: `❌ Seed falló:` → `Seed falló:`

- [ ] **Step 2: Renombrar campo `emoji` → `icon` y reemplazar valores en los 8 items del menú**

Localizar el bloque entre líneas ~104-114. Mapeo:
```
emoji: "🥗"  → icon: "salad"
emoji: "🥙"  → icon: "sandwich"
emoji: "🍲"  → icon: "soup"
emoji: "🍗"  → icon: "drumstick"
emoji: "🧃"  → icon: "juice"
emoji: "🥒"  → icon: "vegan"
emoji: "🍔"  → icon: "burger"
emoji: "🥤"  → icon: "smoothie"
```

- [ ] **Step 3: Renombrar campo `cover` → `icon` y reemplazar valores en los 7 libros**

Localizar el bloque entre líneas ~117-123. Mapeo:
```
cover: "📘"  → icon: "book-blue"
cover: "📗"  → icon: "book-green"
cover: "📙"  → icon: "book-orange"
cover: "📕"  → icon: "book-red"
cover: "📓"  → icon: "book-black"
cover: "📔"  → icon: "book-brown"
cover: "📒"  → icon: "book-yellow"
```

- [ ] **Step 4: Verificar que el modelo en `server/modules/comedor/menuItem.model.ts` y `server/modules/biblioteca/libro.model.ts` permita `icon`**

Run: `grep -n "emoji\|cover\|icon" server/modules/comedor/menuItem.model.ts server/modules/biblioteca/libro.model.ts`

Si los modelos definen `emoji`/`cover`, renombrar a `icon` también ahí.

- [ ] **Step 5: Verificar typecheck del servidor**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: sin errores.

---

### Task 1.8: Actualizar `VisitasScreen.tsx`

**Files:**
- Modify: `src/screens/movil/VisitasScreen.tsx:18-21, 46`

- [ ] **Step 1: Importar `Car`, `PersonStanding`, `User`, `Clock`, `RefreshCw` de lucide-react**

Agregar a la línea 3 del archivo:
```tsx
import { ArrowLeft, Plus, QrCode, Car, PersonStanding, User, Clock, RefreshCw } from "lucide-react"
```

- [ ] **Step 2: Reemplazar el record `modeIcon` para que devuelva componentes en lugar de emojis**

```tsx
// antes (líneas 18-21)
const modeIcon: Record<string, string> = {
  vehicular: "🚗",
  peatonal: "🚶",
}

// después
const modeIcon: Record<string, JSX.Element> = {
  vehicular: <Car size={12} className="inline" />,
  peatonal: <PersonStanding size={12} className="inline" />,
}
```

- [ ] **Step 3: Reemplazar el bloque condicional de emojis en línea 46**

```tsx
// antes
{visita.status === "activa" ? "👤" : visita.status === "programada" ? "🕐" : "🔄"}

// después
{visita.status === "activa" ? (
  <User size={20} className="text-green-600" />
) : visita.status === "programada" ? (
  <Clock size={20} className="text-orange-600" />
) : (
  <RefreshCw size={20} className="text-gray-500" />
)}
```

- [ ] **Step 4: Verificar typecheck**

Run: `npx tsc --noEmit -p tsconfig.app.json`
Expected: sin errores en este archivo.

---

### Task 1.9: Actualizar `NuevaVisitaScreen.tsx` y `DetallesVisitaScreen.tsx`

**Files:**
- Modify: `src/screens/movil/NuevaVisitaScreen.tsx` (líneas ~205-282)
- Modify: `src/screens/movil/DetallesVisitaScreen.tsx` (líneas ~162-249)

- [ ] **Step 1: Importar `Car`, `PersonStanding`, `User`, `X` en ambos archivos**

Agregar a los imports de cada archivo:
```tsx
import { Car, PersonStanding, User, X } from "lucide-react"
```
(Combinar con cualquier import existente de `lucide-react`.)

- [ ] **Step 2: En las opciones del select de tipo de acceso, reemplazar emojis con componentes**

Si las opciones se construyen como objetos con `label` string, hay que cambiar la estructura O renderizar el icono donde se muestra. La forma más simple:

```tsx
// antes
{ value: "automovil", label: "🚗 Automóvil" },
{ value: "peatonal", label: "🚶 Peatonal" },

// después
{ value: "automovil", label: "Automóvil", icon: "car" },
{ value: "peatonal", label: "Peatonal", icon: "walk" },
```

Donde se rendericen las opciones, agregar antes del label:
```tsx
{opt.icon === "car" ? <Car size={16} className="inline mr-1.5" /> : <PersonStanding size={16} className="inline mr-1.5" />}
{opt.label}
```

(Si la estructura del select no acepta `icon`, ver paso 2b alternativo.)

- [ ] **Step 2b (alternativa si el select sólo acepta `label: string`): inyectar el ícono renderizando un componente personalizado en el option.**

Revisar cómo se renderiza el select. Si usa `<option>` HTML nativo, NO se pueden meter componentes JSX dentro. En ese caso: dejar `label: "Automóvil"` sin el emoji, y mostrar el ícono al lado del select según la selección actual.

- [ ] **Step 3: Reemplazar `<span className="text-3xl">👤</span>` con `<User />`**

```tsx
// antes
<span className="text-3xl">👤</span>

// después
<User size={32} />
```

- [ ] **Step 4: Reemplazar `✕` (carácter standalone, líneas 282 y 249) con `<X />`**

```tsx
// antes
✕

// después
<X size={16} />
```

- [ ] **Step 5: Verificar typecheck**

Run: `npx tsc --noEmit -p tsconfig.app.json`
Expected: sin errores.

---

### Task 1.10: Actualizar `RegistrarVisitaScreen.tsx` y `KioscoPrincipal.tsx`

**Files:**
- Modify: `src/screens/colegios/RegistrarVisitaScreen.tsx:260`
- Modify: `src/screens/KioscoPrincipal.tsx:280-281`

- [ ] **Step 1: En `RegistrarVisitaScreen.tsx`, importar `MapPin` y reemplazar `<span>📍</span>`**

```tsx
// agregar al import existente de lucide-react
import { ..., MapPin } from "lucide-react"

// antes (línea 260)
<span>📍</span>

// después
<MapPin size={16} className="inline" />
```

- [ ] **Step 2: En `KioscoPrincipal.tsx`, importar `CheckCircle2` y `XCircle`**

```tsx
import { CheckCircle2, XCircle } from "lucide-react"
```
(Combinar con imports existentes.)

- [ ] **Step 3: Reemplazar los caracteres `✓` y `✕` en líneas 280-281**

Primero leer el contexto completo del bloque para ver cómo se usa la expresión:

Run: `sed -n '270,290p' src/screens/KioscoPrincipal.tsx`

Caso A — si el resultado se usa dentro de un `{...}` en JSX (lo más probable en este componente):

```tsx
// antes
{scanResult.ok
  ? `✓ Acceso permitido — ${scanResult.visita.invitado.nombre}`
  : `✕ Acceso denegado — ${scanResult.motivo ?? "Validación fallida"}`}

// después
{scanResult.ok ? (
  <span className="inline-flex items-center gap-1.5">
    <CheckCircle2 size={20} />
    Acceso permitido — {scanResult.visita.invitado.nombre}
  </span>
) : (
  <span className="inline-flex items-center gap-1.5">
    <XCircle size={20} />
    Acceso denegado — {scanResult.motivo ?? "Validación fallida"}
  </span>
)}
```

Caso B — si el ternario se asigna a una variable string (`const msg = scanResult.ok ? ... : ...`), entonces NO se puede meter JSX. En ese caso: quitar el carácter del template y pintar el ícono donde se renderiza la variable:

```tsx
// donde se renderiza
{scanResult.ok ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
{msg}
```

- [ ] **Step 4: Verificar visualmente en el navegador que el ícono aparece junto al mensaje**

- [ ] **Step 5: Verificar que no quedan emojis en src/ ni server/**

Run:
```bash
grep -rP "[\x{1F300}-\x{1F9FF}]|[\x{2600}-\x{27BF}]|[\x{1F000}-\x{1F02F}]|[\x{1F0A0}-\x{1F0FF}]|[\x{1F100}-\x{1F1FF}]|[\x{1F200}-\x{1F2FF}]|[\x{1FA00}-\x{1FAFF}]" --include="*.ts" --include="*.tsx" src/ server/
```
Expected: sin output (ningún emoji restante).

---

### Task 1.11: Verificación visual de Fase 1

- [ ] **Step 1: Levantar el dev server**

Run: `npm run dev:client`

- [ ] **Step 2: Abrir cada pantalla afectada y verificar que los íconos se ven bien**

Pantallas a verificar manualmente:
- `/movil/comedor` — íconos de comida (Salad, Sandwich, Soup, Drumstick, CupSoda) con sus colores.
- `/movil/biblioteca` — íconos de libros (Book azul/verde/naranja/rojo, Notebook, BookMarked, BookOpen).
- `/movil/visitas` — íconos de status (User, Clock, RefreshCw) y de tipo de acceso (Car, PersonStanding).
- `/movil/visitas/nueva` — opciones de tipo de acceso con íconos.
- `/movil/visitas/{id}` — mismo que la nueva visita.
- `/colegios/visitas/registrar` — pin de ubicación (MapPin).
- `/kiosco` — mensajes de "Acceso permitido"/"Acceso denegado" con CheckCircle2/XCircle.

- [ ] **Step 3: Lint pasa**

Run: `npm run lint`
Expected: sin errores nuevos (puede haber warnings pre-existentes).

---

### CHECKPOINT FASE 1

Mensaje de commit sugerido:

```
chore: reemplaza emojis con iconos lucide-react

- Renombra campo emoji/cover a icon en MenuItem y Libro
- Crea src/lib/icon-map.tsx con mappers getComidaIcon y getLibroIcon
- Quita emojis de logs del servidor (index, db, env, seed)
- Reemplaza iconos de UI sueltos con componentes lucide
```

**Stop here for user review.** Pedir al usuario que revise visualmente las pantallas y commitee si está conforme antes de seguir con Fase 2.

---

## FASE 2 — Comentarios JR-style

### Reglas (recordatorio antes de empezar)

- Una línea `// ...` arriba de la función, en español informal, sin formato.
- Aplica a:
  - **Top-level con nombre**: `function X()`, `export function X()`, `const X = () => {}` cuando es asignada a constante.
  - **Componentes React**: dice qué pantalla/sección renderiza.
  - **Hooks custom**: dice qué dato administra.
  - **Callbacks dentro de** `useEffect`/`useMemo`/`useCallback`: una línea explicando.
- NO aplica a:
  - Callbacks inline en JSX (`onClick={() => ...}`).
  - Re-exports.
  - Wrappers triviales de 3 líneas.
  - `function App()` que sólo monta el router.
  - Archivos `types.ts`, `data.ts` puros.
  - `src/components/ui/*` (shadcn).
  - `cypress/**` (los tests llevan `describe`/`it` con su propia descripción).
  - `node_modules/`, `dist/`.

### Estilo del comentario (ejemplos buenos vs malos)

```ts
// ✓ BUENO
// hook para traer las visitas del usuario filtradas por estado
export function useVisitas(filtro: string) { ... }

// ✗ MALO (demasiado formal/JSDoc)
/**
 * Hook que retorna las visitas filtradas.
 * @param filtro - estado a filtrar
 * @returns lista de visitas
 */

// ✓ BUENO
// pantalla principal del kiosco con escaneo QR
export function KioscoPrincipal() { ... }

// ✗ MALO (describe lo que retorna en lugar de qué hace)
// retorna un componente React que renderiza la pantalla
```

### Task 2.1: Comentar `src/App.tsx`, `src/main.tsx`, `src/lib/*`

**Files:**
- Modify: `src/App.tsx`, `src/main.tsx`, `src/lib/api.ts`, `src/lib/auth-store.tsx`, `src/lib/utils.ts`, `src/lib/quiosco.ts`, `src/lib/image.ts`

- [ ] **Step 1: Para cada archivo, listar sus funciones top-level**

Run para cada archivo:
```bash
grep -nE "^(export )?(async )?function |^(export )?const \w+ = (\(|async \()" src/lib/*.ts src/App.tsx src/main.tsx
```

- [ ] **Step 2: Agregar un comentario de una línea arriba de cada función top-level con nombre**

Ejemplo en `src/lib/api.ts`:
```ts
// arma la url completa con query params, relativa al baseUrl configurado
function buildUrl(path: string, query?: Record<string, unknown>): string { ... }

// devuelve el token JWT guardado en localStorage o null si no hay sesion
function getToken(): string | null { ... }

// guarda o limpia el token JWT en localStorage
export function setStoredToken(token: string | null): void { ... }

// hace una peticion HTTP genérica con auth y manejo de errores
async function request<T>(...) { ... }
```

Ejemplo en `src/lib/auth-store.tsx`:
```ts
// provider de autenticacion: maneja sesion, login y logout
export function AuthProvider({ children }: { children: ReactNode }) {
  // carga el usuario actual al montar si hay token guardado
  useEffect(() => { ... }, [])
  ...
}

// hook para acceder al estado de autenticacion desde cualquier componente
export function useAuth() { ... }
```

- [ ] **Step 3: Agregar comentarios a callbacks de `useEffect`/`useMemo`/`useCallback` en estos archivos**

Para cada `useEffect((....)` agregar arriba un comentario que describa el efecto.

- [ ] **Step 4: Verificar que `App.tsx`, si sólo monta el router, NO se comenta** (regla de wrapper trivial).

- [ ] **Step 5: Verificar lint**

Run: `npm run lint -- src/App.tsx src/main.tsx src/lib`
Expected: sin nuevos errores.

---

### Task 2.2: Comentar `src/screens/*.tsx` (raíz, no subcarpetas)

**Files:**
- Modify: `src/screens/CapturaINE.tsx`, `src/screens/ComingSoon.tsx`, `src/screens/InterfaceSelector.tsx`, `src/screens/KioscoLoginScreen.tsx`, `src/screens/KioscoPrincipal.tsx`, `src/screens/MovilGallery.tsx`, `src/screens/RegistroAlternativo.tsx`

- [ ] **Step 1: Para cada archivo, identificar componentes y funciones top-level**

Run:
```bash
grep -nE "^(export )?(async )?function |^(export )?const \w+ = " src/screens/*.tsx
```

- [ ] **Step 2: Agregar comentario a cada componente top-level**

Ejemplos:
```tsx
// pantalla principal del kiosco con escaneo QR y registro alternativo
export function KioscoPrincipal() { ... }

// selector inicial: el usuario elige entre movil, ipad, kiosco o colegios
export function InterfaceSelector() { ... }

// pantalla de captura de INE para visitantes sin invitacion previa
export function CapturaINE() { ... }
```

- [ ] **Step 3: Comentar funciones helper internas y callbacks de hooks**

Ejemplo:
```tsx
// formatea una fecha ISO al formato local mexicano
function formatFechaHora(iso: string): string { ... }

// resetea el estado del formulario al cambiar de modo
useEffect(() => { ... }, [modo])
```

- [ ] **Step 4: Lint**

Run: `npm run lint -- src/screens/*.tsx`
Expected: sin errores.

---

### Task 2.3: Comentar `src/screens/movil/**/*.tsx` y hooks

**Files:**
- Modify: `src/screens/movil/*.tsx` (BibliotecaScreen, BottomNav, ComedorScreen, DashboardScreen, DetallesVisitaScreen, HorarioScreen, LoginScreen, MovilLayout, NuevaVisitaScreen, PerfilScreen, QrCode, QrNfcScreen, VisitasScreen)
- Modify: `src/screens/movil/hooks/*.ts` (useBiblioteca, useComedor, useHorario, usePerfil, useVisita, useVisitas)
- **NO modificar:** `src/screens/movil/data.ts` (es archivo de datos puros).

- [ ] **Step 1: Para cada archivo `.tsx` y hook, agregar comentarios siguiendo las reglas**

Patrón general por tipo:

**Componentes screen:**
```tsx
// pantalla del dashboard movil con saludo, KPIs y acciones rápidas
export function DashboardScreen() { ... }
```

**Subcomponentes:**
```tsx
// tarjeta que muestra un platillo del menu con icono, precio y boton de agregar
function MenuItemCard({ item, onAdd }) { ... }
```

**Layout:**
```tsx
// layout movil con BottomNav fijo y outlet para las pantallas
export function MovilLayout() { ... }
```

**Hooks:**
```tsx
// hook para traer libros, prestamos y deseos del usuario
export function useBiblioteca() {
  // refresca los datos al cambiar de pestaña
  useEffect(() => { ... }, [tab])
  // memoriza los libros disponibles para evitar recalcular en cada render
  const disponibles = useMemo(() => ..., [libros])
}
```

**Helpers:**
```tsx
// formatea una fecha en formato corto local
function formatFecha(iso: string): string { ... }
```

- [ ] **Step 2: Verificar que NO se comentaron callbacks inline de JSX**

Run: `grep -B1 "onClick={() =>" src/screens/movil/*.tsx | head -20`
Verificar manualmente que no aparezcan `// ...` antes de los `onClick={() => ...}`.

- [ ] **Step 3: Lint**

Run: `npm run lint -- src/screens/movil`
Expected: sin errores nuevos.

---

### Task 2.4: Comentar `src/screens/ipad/**`

**Files:**
- Modify: `src/screens/ipad/*.tsx` (12 archivos: AlertasScreen, DashboardScreen, HistorialScreen, IpadHeader, IpadLayout, IpadSidebar, LoginScreen, MultasScreen, PuntoControlScreen, SalidasScreen, VehiculosScreen)
- Modify: `src/screens/ipad/components/*.tsx` (8 componentes: ActivityFeedItem, FlujoBarChart, KpiCard, NumericKey, PinKeypad, PuntoControlCard, SectionCard, StatusBadge, VehiculoPreviewCard)
- Modify: `src/screens/ipad/context/*.tsx` (IpadDataContext, IpadSessionContext)
- Modify: `src/screens/ipad/hooks/*.ts` (useIpadAlertas, useIpadEventos, useIpadKpis, useIpadMultas, useIpadVehiculos)
- **NO modificar:** `src/screens/ipad/data.ts` y `src/screens/ipad/types.ts`.

- [ ] **Step 1: Aplicar el mismo patrón de Task 2.3 a estos archivos**

Componentes UI reutilizables:
```tsx
// tarjeta de KPI con titulo, valor grande y delta opcional
export function KpiCard({ titulo, valor, delta }) { ... }

// teclado numérico para ingreso de PIN del oficial
export function PinKeypad({ onChange, onSubmit }) { ... }
```

Pantallas:
```tsx
// pantalla principal del iPad de seguridad con KPIs y feed de actividad
export function DashboardScreen() { ... }
```

Contexts:
```tsx
// provider que mantiene la data global del iPad (vehiculos, alertas, multas, kpis)
export function IpadDataProvider({ children }) { ... }
```

- [ ] **Step 2: Lint**

Run: `npm run lint -- src/screens/ipad`
Expected: sin errores.

---

### Task 2.5: Comentar `src/screens/colegios/**`

**Files:**
- Modify: `src/screens/colegios/*.tsx` (12 archivos: AlertasScreen, BitacoraScreen, ColegiosHeader, ColegiosLayout, ColegiosSidebar, DashboardScreen, EdificiosScreen, LoginScreen, MapaScreen, RegistrarVisitaScreen, RegistroExitosoScreen, ResidentesScreen, VerificacionScreen)
- Modify: `src/screens/colegios/components/*.tsx` (4 componentes: EstadoBadge, KpiCard, ScreenPlaceholder, SectionCard)
- Modify: `src/screens/colegios/context/*.tsx` (ColegiosDataContext, ColegiosSessionContext)
- Modify: `src/screens/colegios/hooks/*.ts` (useColegiosAlertas, useColegiosEdificios, useColegiosKpis, useColegiosMovimientos, useColegiosResidentes, useColegiosVisitas)
- **NO modificar:** `src/screens/colegios/data.ts` y `src/screens/colegios/types.ts`.

- [ ] **Step 1: Aplicar el mismo patrón a estos archivos**

- [ ] **Step 2: Lint**

Run: `npm run lint -- src/screens/colegios`
Expected: sin errores.

---

### Task 2.6: Comentar `server/**`

**Files:**
- Modify: `server/{app,db,env,index,seed}.ts`
- Modify: `server/lib/{asyncHandler,errors}.ts`
- Modify: `server/middlewares/{auth,error}.ts`
- Modify: `server/modules/**/*.ts` (rutas, servicios, modelos)

- [ ] **Step 1: Comentar funciones top-level**

Patrones:

**Routes (Express handlers):**
```ts
// GET /api/visitas - lista las visitas del usuario autenticado con filtro opcional
router.get("/", asyncHandler(async (req, res) => { ... }))
```

**Services:**
```ts
// crea una visita nueva validando el rol y devolviendo el doc creado
export async function crearVisita(usuario: User, input: VisitaInput) { ... }
```

**Models:**
```ts
// schema de mongoose para la coleccion de visitas
export const visitaSchema = new Schema({ ... })
```

**Middlewares:**
```ts
// middleware de autenticacion: valida JWT y adjunta el usuario al request
export function authMiddleware(req, res, next) { ... }
```

- [ ] **Step 2: NO comentar definiciones de schemas inline ni archivos puros de tipos**

- [ ] **Step 3: Verificar typecheck del servidor**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: sin errores nuevos.

- [ ] **Step 4: Verificar que el servidor sigue arrancando**

Run: `npm run dev:api` (en otro terminal)
Expected: log "Server escuchando en http://localhost:..." sin errores.

---

### CHECKPOINT FASE 2

Mensaje de commit sugerido:

```
docs: agrega comentarios JR-style en funciones del proyecto

- Una linea por funcion top-level, en español informal
- Aplica a componentes, hooks, helpers y callbacks de hooks React
- Excluye types.ts, data.ts, src/components/ui (shadcn) y cypress
```

**Stop here for user review.** Pedir al usuario que revise el diff y commitee.

---

## FASE 3 — Suite Cypress E2E

### Task 3.1: Configurar Cypress y agregar dependencia

**Files:**
- Modify: `cypress.config.ts`
- Modify: `package.json`

- [ ] **Step 1: Instalar `start-server-and-test`**

Run:
```bash
npm install --save-dev start-server-and-test
```

- [ ] **Step 2: Actualizar `cypress.config.ts` con `baseUrl`**

```ts
import { defineConfig } from "cypress"

export default defineConfig({
  allowCypressEnv: false,

  e2e: {
    baseUrl: "http://localhost:5173",
    setupNodeEvents() {
      // sin event listeners por ahora
    },
  },

  component: {
    devServer: {
      framework: "react",
      bundler: "vite",
    },
  },
})
```

- [ ] **Step 3: Agregar scripts a `package.json`**

En la sección `scripts`, agregar:
```json
"cypress:open": "cypress open",
"cypress:run": "cypress run",
"test:e2e": "start-server-and-test \"vite preview --port 5173\" http://localhost:5173 \"cypress run\""
```

- [ ] **Step 4: Eliminar el test viejo**

Run:
```bash
rm cypress/e2e/evidencia_hu05.cy.ts
```

- [ ] **Step 5: Verificar que Cypress puede abrirse**

Run: `npx cypress verify`
Expected: "✔ Verified Cypress!"

---

### Task 3.2: Crear comandos custom de Cypress

**Files:**
- Modify: `cypress/support/commands.ts`
- Modify: `cypress/support/e2e.ts`

- [ ] **Step 1: Reescribir `cypress/support/commands.ts` con los comandos custom**

```ts
/// <reference types="cypress" />

declare global {
  namespace Cypress {
    interface Chainable {
      mockApiBase(): Chainable<void>
      mockApi(method: string, url: string, fixture: string, alias?: string): Chainable<null>
      loginAs(rol: "residente" | "oficial" | "colegio-admin"): Chainable<void>
      visitAs(rol: "residente" | "oficial" | "colegio-admin", ruta: string): Chainable<void>
    }
  }
}

// monta intercepts base para auth y endpoints comunes en todas las pruebas
Cypress.Commands.add("mockApiBase", () => {
  cy.intercept("GET", "/api/auth/me", { fixture: "auth/me-residente.json" }).as("authMe")
  cy.intercept("POST", "/api/auth/logout", { statusCode: 204 }).as("logout")
  cy.intercept("GET", "/api/auth/oficiales", { fixture: "auth/oficiales.json" }).as("oficiales")
})

// intercepta una ruta con su fixture y registra alias para esperarla
Cypress.Commands.add("mockApi", (method, url, fixture, alias) => {
  return cy.intercept(method, url, { fixture }).as(alias ?? fixture.replace(/[^a-z0-9]/gi, "_"))
})

// hace login simulado seteando el token en localStorage
Cypress.Commands.add("loginAs", (rol) => {
  const token = `fake-token-${rol}`
  cy.intercept("GET", "/api/auth/me", {
    fixture: rol === "residente" ? "auth/me-residente.json"
      : rol === "oficial" ? "auth/me-oficial.json"
      : "auth/me-colegio-admin.json",
  }).as("authMe")
  cy.window().then((w) => w.localStorage.setItem("accesos_udlap_token", token))
})

// shortcut: hace login y navega a la ruta indicada
Cypress.Commands.add("visitAs", (rol, ruta) => {
  cy.loginAs(rol)
  cy.visit(ruta)
})

export {}
```

- [ ] **Step 2: Importar los comandos en `cypress/support/e2e.ts`**

```ts
import "./commands"
```

- [ ] **Step 3: Verificar tipado**

Run: `npx tsc --noEmit -p cypress/tsconfig.json 2>/dev/null || npx tsc --noEmit cypress/support/commands.ts`

Si no existe `cypress/tsconfig.json`, Cypress usa el del proyecto. Verificar que el archivo no tenga errores de tipos.

---

### Task 3.3: Crear fixtures de auth

**Files:**
- Create: `cypress/fixtures/auth/me-residente.json`
- Create: `cypress/fixtures/auth/me-oficial.json`
- Create: `cypress/fixtures/auth/me-colegio-admin.json`
- Create: `cypress/fixtures/auth/login-residente.json`
- Create: `cypress/fixtures/auth/login-oficial.json`
- Create: `cypress/fixtures/auth/login-colegio-admin.json`
- Create: `cypress/fixtures/auth/oficiales.json`

- [ ] **Step 1: Crear `cypress/fixtures/auth/me-residente.json`**

```json
{
  "user": {
    "id": "u-res-1",
    "nombre": "Ana Pérez",
    "email": "ana@udlap.mx",
    "rol": "residente",
    "matricula": "169800",
    "colegioId": "col-1"
  }
}
```

- [ ] **Step 2: Crear `cypress/fixtures/auth/me-oficial.json`**

```json
{
  "user": {
    "id": "u-of-1",
    "nombre": "Carlos Ramírez",
    "email": "carlos@udlap.mx",
    "rol": "oficial",
    "puntoAccesoId": "pa-1"
  }
}
```

- [ ] **Step 3: Crear `cypress/fixtures/auth/me-colegio-admin.json`**

```json
{
  "user": {
    "id": "u-ca-1",
    "nombre": "María Hernández",
    "email": "maria@udlap.mx",
    "rol": "colegio-admin",
    "colegioId": "col-1"
  }
}
```

- [ ] **Step 4: Crear las 3 fixtures de login (response del POST /api/auth/login)**

`cypress/fixtures/auth/login-residente.json`:
```json
{
  "token": "fake-jwt-residente",
  "user": {
    "id": "u-res-1",
    "nombre": "Ana Pérez",
    "email": "ana@udlap.mx",
    "rol": "residente",
    "matricula": "169800",
    "colegioId": "col-1"
  }
}
```

(Análogos para `login-oficial.json` y `login-colegio-admin.json` usando los datos de las fixtures `me-*.json`.)

- [ ] **Step 5: Crear `cypress/fixtures/auth/oficiales.json`** (lista para `KioscoLoginScreen`)

```json
[
  { "id": "u-of-1", "nombre": "Carlos Ramírez", "puntoAcceso": "Acceso Principal" },
  { "id": "u-of-2", "nombre": "Lucía Torres", "puntoAcceso": "Acceso Sur" }
]
```

---

### Task 3.4: Crear fixtures de visitas, biblioteca, comedor, horario, perfil

**Files:**
- Create: `cypress/fixtures/visitas/{lista,detalle,creada}.json`
- Create: `cypress/fixtures/biblioteca/{libros,prestamos,deseos}.json`
- Create: `cypress/fixtures/comedor/{menu,orden-creada}.json`
- Create: `cypress/fixtures/horario/clases.json`

- [ ] **Step 1: `cypress/fixtures/visitas/lista.json`**

```json
[
  {
    "id": "v1",
    "invitado": { "nombre": "Juan Pérez", "identificacion": "PERJ950101" },
    "tipoAcceso": "vehicular",
    "puntoAcceso": "Principal",
    "fechaHora": "2026-04-29T10:00:00Z",
    "status": "programada"
  },
  {
    "id": "v2",
    "invitado": { "nombre": "Marta Gómez", "identificacion": "GOMA920303" },
    "tipoAcceso": "peatonal",
    "puntoAcceso": "Sur",
    "fechaHora": "2026-04-28T15:30:00Z",
    "status": "activa"
  }
]
```

- [ ] **Step 2: `cypress/fixtures/visitas/detalle.json`**

```json
{
  "id": "v1",
  "invitado": { "nombre": "Juan Pérez", "identificacion": "PERJ950101", "telefono": "2221234567" },
  "tipoAcceso": "vehicular",
  "vehiculo": { "placa": "ABC123", "marca": "Toyota", "modelo": "Corolla" },
  "puntoAcceso": "Principal",
  "fechaHora": "2026-04-29T10:00:00Z",
  "status": "programada",
  "qrToken": "qr-fake-12345"
}
```

- [ ] **Step 3: `cypress/fixtures/visitas/creada.json`**

```json
{
  "id": "v3",
  "invitado": { "nombre": "Juan Pérez", "identificacion": "PERJ950101" },
  "tipoAcceso": "vehicular",
  "puntoAcceso": "Principal",
  "fechaHora": "2026-04-30T09:00:00Z",
  "status": "programada",
  "qrToken": "qr-fake-99999"
}
```

- [ ] **Step 4: `cypress/fixtures/biblioteca/libros.json`**

```json
[
  { "id": "b1", "titulo": "Sistemas Operativos Modernos", "autor": "Andrew S. Tanenbaum", "icon": "book-blue", "totalCopias": 3, "copiasDisponibles": 2 },
  { "id": "b2", "titulo": "Cálculo Integral", "autor": "James Stewart", "icon": "book-green", "totalCopias": 2, "copiasDisponibles": 1 },
  { "id": "b3", "titulo": "Clean Code", "autor": "Robert C. Martin", "icon": "book-brown", "totalCopias": 3, "copiasDisponibles": 3 }
]
```

- [ ] **Step 5: `cypress/fixtures/biblioteca/prestamos.json`** y **`deseos.json`**

`prestamos.json`:
```json
[
  {
    "id": "p1",
    "libroId": "b1",
    "libro": { "id": "b1", "titulo": "Sistemas Operativos Modernos", "autor": "Andrew S. Tanenbaum", "icon": "book-blue" },
    "fechaPrestamo": "2026-04-15T10:00:00Z",
    "fechaVencimiento": "2026-04-29T23:59:59Z",
    "estado": "activo"
  }
]
```

`deseos.json`:
```json
[
  {
    "id": "d1",
    "libroId": "b2",
    "libro": { "id": "b2", "titulo": "Cálculo Integral", "autor": "James Stewart", "icon": "book-green" }
  }
]
```

- [ ] **Step 6: `cypress/fixtures/comedor/menu.json`**

```json
[
  { "id": "m1", "nombre": "Bowl Mediterráneo", "precio": 95, "descripcion": "Quinoa, garbanzos, pepino, tomate cherry", "categoria": "principal", "icon": "salad" },
  { "id": "m2", "nombre": "Hamburguesa UDLAP", "precio": 110, "descripcion": "Carne 150g, queso, papas", "categoria": "principal", "icon": "burger" },
  { "id": "m3", "nombre": "Smoothie Verde", "precio": 55, "descripcion": "Espinaca, plátano, manzana", "categoria": "vegano", "icon": "smoothie" }
]
```

- [ ] **Step 7: `cypress/fixtures/comedor/orden-creada.json`**

```json
{
  "id": "o1",
  "items": [{ "menuItemId": "m1", "cantidad": 1 }],
  "total": 95,
  "estado": "pagada",
  "fecha": "2026-04-29T12:00:00Z"
}
```

- [ ] **Step 8: `cypress/fixtures/horario/clases.json`**

```json
[
  { "id": "c1", "dia": 1, "inicio": 9, "fin": 10, "materia": "Cálculo Integral", "salon": "CF301" },
  { "id": "c2", "dia": 1, "inicio": 11, "fin": 12.5, "materia": "Programación", "salon": "CH105" },
  { "id": "c3", "dia": 2, "inicio": 13, "fin": 14, "materia": "Estadística", "salon": "CF402" }
]
```

---

### Task 3.5: Crear fixtures de iPad y Colegios

**Files:**
- Create: `cypress/fixtures/ipad/{kpis,vehiculos,multas,puntos,alertas,eventos}.json`
- Create: `cypress/fixtures/colegios/{kpis,edificios,residentes,movimientos,alertas}.json`

- [ ] **Step 1: `cypress/fixtures/ipad/kpis.json`**

```json
{
  "vehiculosDentro": 47,
  "ingresosHoy": 132,
  "salidasHoy": 89,
  "alertasActivas": 3
}
```

- [ ] **Step 2: `cypress/fixtures/ipad/vehiculos.json`**

```json
[
  { "id": "veh1", "placa": "ABC123", "marca": "Toyota", "modelo": "Corolla", "color": "blanco", "duenio": "Juan Pérez", "estado": "dentro" },
  { "id": "veh2", "placa": "XYZ789", "marca": "Honda", "modelo": "Civic", "color": "negro", "duenio": "Marta Gómez", "estado": "fuera" }
]
```

- [ ] **Step 3: `cypress/fixtures/ipad/multas.json`**

```json
[
  { "id": "mu1", "placa": "ABC123", "motivo": "Estacionamiento prohibido", "monto": 500, "fecha": "2026-04-28T10:00:00Z", "estado": "pendiente" }
]
```

- [ ] **Step 4: `cypress/fixtures/ipad/puntos.json`**

```json
[
  { "id": "pa1", "nombre": "Acceso Principal", "tipo": "vehicular", "estado": "activo" },
  { "id": "pa2", "nombre": "Acceso Sur", "tipo": "peatonal", "estado": "activo" }
]
```

- [ ] **Step 5: `cypress/fixtures/ipad/alertas.json`** y **`eventos.json`**

`alertas.json`:
```json
[
  { "id": "a1", "tipo": "vehiculo-no-autorizado", "severidad": "alta", "mensaje": "Vehículo sin registro intentando ingresar", "fecha": "2026-04-29T08:00:00Z" }
]
```

`eventos.json`:
```json
[
  { "id": "e1", "tipo": "ingreso", "vehiculoId": "veh1", "puntoId": "pa1", "fecha": "2026-04-29T07:30:00Z" }
]
```

- [ ] **Step 6: `cypress/fixtures/colegios/kpis.json`**

```json
{
  "residentesActivos": 245,
  "visitasHoy": 18,
  "alertasActivas": 2,
  "movimientosHoy": 120
}
```

- [ ] **Step 7: `cypress/fixtures/colegios/edificios.json`** y **`residentes.json`**

`edificios.json`:
```json
[
  { "id": "ed1", "nombre": "Edificio A", "ocupacion": 78, "capacidad": 80 },
  { "id": "ed2", "nombre": "Edificio B", "ocupacion": 42, "capacidad": 60 }
]
```

`residentes.json`:
```json
[
  { "id": "r1", "nombre": "Ana Pérez", "matricula": "169800", "edificioId": "ed1", "habitacion": "101A" },
  { "id": "r2", "nombre": "Luis Gómez", "matricula": "169801", "edificioId": "ed1", "habitacion": "102A" }
]
```

- [ ] **Step 8: `cypress/fixtures/colegios/movimientos.json`** y **`alertas.json`**

`movimientos.json`:
```json
[
  { "id": "mov1", "residenteId": "r1", "tipo": "ingreso", "fecha": "2026-04-29T07:00:00Z", "edificioId": "ed1" }
]
```

`alertas.json`:
```json
[
  { "id": "ca1", "tipo": "visita-prolongada", "mensaje": "Visita activa más de 8 horas", "fecha": "2026-04-29T06:00:00Z" }
]
```

---

### Task 3.6: Crear specs de kiosco (3 specs)

**Files:**
- Create: `cypress/e2e/kiosco/login.cy.ts`
- Create: `cypress/e2e/kiosco/escaneo-acceso.cy.ts`
- Create: `cypress/e2e/kiosco/registro-alternativo.cy.ts`

- [ ] **Step 1: Crear `cypress/e2e/kiosco/login.cy.ts`**

```ts
// pruebas del login del kiosco con seleccion de oficial
describe("Kiosco - Login de oficial", () => {
  beforeEach(() => {
    cy.mockApiBase()
    cy.intercept("POST", "/api/auth/login-pin", { fixture: "auth/login-oficial.json" }).as("loginPin")
  })

  it("muestra la lista de oficiales y permite seleccionar uno", () => {
    cy.visit("/kiosco/login")
    cy.wait("@oficiales")
    cy.contains("Carlos Ramírez").should("be.visible")
    cy.contains("Lucía Torres").should("be.visible")
  })

  it("ingresa con PIN correcto y avanza al kiosco principal", () => {
    cy.visit("/kiosco/login")
    cy.wait("@oficiales")
    cy.contains("Carlos Ramírez").click()
    cy.get("button").contains("1").click()
    cy.get("button").contains("2").click()
    cy.get("button").contains("3").click()
    cy.get("button").contains("4").click()
    cy.wait("@loginPin")
    cy.url().should("include", "/kiosco")
    cy.url().should("not.include", "/login")
  })
})
```

- [ ] **Step 2: Crear `cypress/e2e/kiosco/escaneo-acceso.cy.ts`**

```ts
// pruebas del flujo de escaneo QR en el kiosco
describe("Kiosco - Escaneo de acceso", () => {
  beforeEach(() => {
    cy.mockApiBase()
    cy.loginAs("oficial")
  })

  it("escanea un QR válido y muestra acceso permitido", () => {
    cy.intercept("POST", "/api/visitas/qr/*/scan", {
      statusCode: 200,
      body: {
        ok: true,
        visita: {
          id: "v1",
          invitado: { nombre: "Juan Pérez" },
          puntoAcceso: "Principal",
        },
      },
    }).as("scan")

    cy.visit("/kiosco")
    cy.get("input[placeholder*='QR']").type("qr-valido-123")
    cy.contains("Validar").click()
    cy.wait("@scan")
    cy.contains("Acceso permitido").should("be.visible")
    cy.contains("Juan Pérez").should("be.visible")
  })

  it("escanea un QR inválido y muestra acceso denegado", () => {
    cy.intercept("POST", "/api/visitas/qr/*/scan", {
      statusCode: 400,
      body: { ok: false, motivo: "QR expirado" },
    }).as("scanFail")

    cy.visit("/kiosco")
    cy.get("input[placeholder*='QR']").type("qr-expirado-456")
    cy.contains("Validar").click()
    cy.wait("@scanFail")
    cy.contains("Acceso denegado").should("be.visible")
  })
})
```

- [ ] **Step 3: Crear `cypress/e2e/kiosco/registro-alternativo.cy.ts`**

```ts
// pruebas de registro de visitante sin invitacion previa
describe("Kiosco - Registro alternativo", () => {
  beforeEach(() => {
    cy.mockApiBase()
    cy.loginAs("oficial")
  })

  it("captura datos manualmente y registra una visita", () => {
    cy.intercept("POST", "/api/visitas/walkin", {
      fixture: "visitas/creada.json",
    }).as("walkin")

    cy.visit("/kiosco/registro-alternativo")
    cy.get("input[name=nombre]").type("Carlos Mendoza")
    cy.get("input[name=identificacion]").type("MENC880712")
    cy.get("input[name=motivo]").type("Visita personal")
    cy.contains("Registrar").click()
    cy.wait("@walkin")
    cy.contains(/registrad|exitos/i).should("be.visible")
  })
})
```

- [ ] **Step 4: Correr los 3 specs localmente**

Run (en otro terminal con la app corriendo):
```bash
npm run cypress:run -- --spec "cypress/e2e/kiosco/*.cy.ts"
```

Expected: los 3 specs pasan. Si fallan por selectores, ajustar los `cy.get()`/`cy.contains()` para que coincidan con los textos/atributos reales de los componentes (ver `KioscoPrincipal.tsx`, `KioscoLoginScreen.tsx`, `RegistroAlternativo.tsx`).

---

### Task 3.7: Crear specs móvil (7 specs)

**Files:**
- Create: `cypress/e2e/movil/login.cy.ts`
- Create: `cypress/e2e/movil/nueva-visita.cy.ts`
- Create: `cypress/e2e/movil/visitas-listado.cy.ts`
- Create: `cypress/e2e/movil/horario.cy.ts`
- Create: `cypress/e2e/movil/biblioteca.cy.ts`
- Create: `cypress/e2e/movil/comedor.cy.ts`
- Create: `cypress/e2e/movil/perfil.cy.ts`

- [ ] **Step 1: `cypress/e2e/movil/login.cy.ts`**

```ts
// pruebas de login del residente en la version movil
describe("Movil - Login residente", () => {
  beforeEach(() => {
    cy.intercept("POST", "/api/auth/login", { fixture: "auth/login-residente.json" }).as("login")
  })

  it("ingresa con email y password validos", () => {
    cy.visit("/movil/login")
    cy.get("input[type=email]").type("ana@udlap.mx")
    cy.get("input[type=password]").type("password123")
    cy.contains("Ingresar").click()
    cy.wait("@login")
    cy.url().should("include", "/movil")
    cy.url().should("not.include", "/login")
  })
})
```

- [ ] **Step 2: `cypress/e2e/movil/nueva-visita.cy.ts`**

```ts
// pruebas del flujo de creacion de visita programada
describe("Movil - Nueva visita", () => {
  beforeEach(() => {
    cy.mockApiBase()
    cy.intercept("POST", "/api/visitas", { fixture: "visitas/creada.json" }).as("crear")
    cy.visitAs("residente", "/movil/visitas/nueva")
  })

  it("crea una visita con datos validos", () => {
    cy.get("input[name=nombre]").type("Juan Pérez")
    cy.get("input[name=identificacion]").type("PERJ950101")
    cy.contains("Automóvil").click()
    cy.contains("Guardar").click()
    cy.wait("@crear").its("request.body.invitado.nombre").should("eq", "Juan Pérez")
    cy.contains(/registrad|creada/i).should("be.visible")
  })
})
```

- [ ] **Step 3: `cypress/e2e/movil/visitas-listado.cy.ts`**

```ts
// pruebas del listado y detalle de visitas
describe("Movil - Listado de visitas", () => {
  beforeEach(() => {
    cy.mockApiBase()
    cy.intercept("GET", "/api/visitas*", { fixture: "visitas/lista.json" }).as("lista")
    cy.intercept("GET", "/api/visitas/v1", { fixture: "visitas/detalle.json" }).as("detalle")
    cy.visitAs("residente", "/movil/visitas")
  })

  it("muestra las visitas y abre el detalle", () => {
    cy.wait("@lista")
    cy.contains("Juan Pérez").should("be.visible")
    cy.contains("Marta Gómez").should("be.visible")
    cy.contains("Juan Pérez").click()
    cy.wait("@detalle")
    cy.contains("PERJ950101").should("be.visible")
  })
})
```

- [ ] **Step 4: `cypress/e2e/movil/horario.cy.ts`**

```ts
// pruebas de la pantalla de horario academico
describe("Movil - Horario", () => {
  beforeEach(() => {
    cy.mockApiBase()
    cy.intercept("GET", "/api/horario", { fixture: "horario/clases.json" }).as("horario")
    cy.visitAs("residente", "/movil/horario")
  })

  it("muestra las clases del horario", () => {
    cy.wait("@horario")
    cy.contains("Cálculo Integral").should("be.visible")
    cy.contains("CF301").should("be.visible")
    cy.contains("Programación").should("be.visible")
  })
})
```

- [ ] **Step 5: `cypress/e2e/movil/biblioteca.cy.ts`**

```ts
// pruebas del flujo de busqueda y prestamo en biblioteca
describe("Movil - Biblioteca", () => {
  beforeEach(() => {
    cy.mockApiBase()
    cy.intercept("GET", "/api/biblioteca/libros", { fixture: "biblioteca/libros.json" }).as("libros")
    cy.intercept("GET", "/api/biblioteca/prestamos", { fixture: "biblioteca/prestamos.json" }).as("prestamos")
    cy.intercept("GET", "/api/biblioteca/deseos", { fixture: "biblioteca/deseos.json" }).as("deseos")
    cy.intercept("POST", "/api/biblioteca/prestamos", { statusCode: 201, body: { id: "p2" } }).as("prestar")
    cy.visitAs("residente", "/movil/biblioteca")
  })

  it("muestra libros y solicita un prestamo", () => {
    cy.wait(["@libros", "@prestamos", "@deseos"])
    cy.contains("Sistemas Operativos Modernos").should("be.visible")
    cy.contains("Clean Code").should("be.visible")
    cy.contains("Clean Code").parents("[class*='rounded']").contains(/prestar|solicitar/i).click()
    cy.wait("@prestar")
  })
})
```

- [ ] **Step 6: `cypress/e2e/movil/comedor.cy.ts`**

```ts
// pruebas del flujo de pedido en el comedor
describe("Movil - Comedor", () => {
  beforeEach(() => {
    cy.mockApiBase()
    cy.intercept("GET", "/api/comedor/menu", { fixture: "comedor/menu.json" }).as("menu")
    cy.intercept("POST", "/api/comedor/ordenes", { fixture: "comedor/orden-creada.json" }).as("ordenar")
    cy.visitAs("residente", "/movil/comedor")
  })

  it("muestra el menu y agrega un platillo al carrito", () => {
    cy.wait("@menu")
    cy.contains("Bowl Mediterráneo").should("be.visible")
    cy.contains("Hamburguesa UDLAP").should("be.visible")
    cy.contains("Bowl Mediterráneo").parents("[class*='rounded']").find("button").contains("+").click()
    cy.contains("Pagar").click()
    cy.wait("@ordenar")
  })
})
```

- [ ] **Step 7: `cypress/e2e/movil/perfil.cy.ts`**

```ts
// pruebas de la pantalla de perfil del residente
describe("Movil - Perfil", () => {
  beforeEach(() => {
    cy.mockApiBase()
    cy.visitAs("residente", "/movil/perfil")
  })

  it("muestra los datos del usuario y permite cerrar sesion", () => {
    cy.contains("Ana Pérez").should("be.visible")
    cy.contains("ana@udlap.mx").should("be.visible")
    cy.contains(/cerrar sesion|logout/i).click()
    cy.url().should("include", "/login")
  })
})
```

- [ ] **Step 8: Correr los 7 specs móvil**

Run:
```bash
npm run cypress:run -- --spec "cypress/e2e/movil/*.cy.ts"
```

Expected: los 7 pasan. Ajustar selectores si es necesario.

---

### Task 3.8: Crear specs iPad (5 specs)

**Files:**
- Create: `cypress/e2e/ipad/login.cy.ts`
- Create: `cypress/e2e/ipad/dashboard.cy.ts`
- Create: `cypress/e2e/ipad/vehiculos.cy.ts`
- Create: `cypress/e2e/ipad/multas.cy.ts`
- Create: `cypress/e2e/ipad/punto-control.cy.ts`

- [ ] **Step 1: `cypress/e2e/ipad/login.cy.ts`**

```ts
// pruebas de login del oficial en el iPad con PIN
describe("iPad - Login oficial", () => {
  beforeEach(() => {
    cy.mockApiBase()
    cy.intercept("POST", "/api/auth/login-pin", { fixture: "auth/login-oficial.json" }).as("loginPin")
  })

  it("ingresa con PIN correcto", () => {
    cy.visit("/ipad/login")
    cy.wait("@oficiales")
    cy.contains("Carlos Ramírez").click()
    ;["1", "2", "3", "4"].forEach((d) => cy.get("button").contains(new RegExp(`^${d}$`)).click())
    cy.wait("@loginPin")
    cy.url().should("include", "/ipad")
    cy.url().should("not.include", "/login")
  })
})
```

- [ ] **Step 2: `cypress/e2e/ipad/dashboard.cy.ts`**

```ts
// pruebas del dashboard del iPad de seguridad
describe("iPad - Dashboard", () => {
  beforeEach(() => {
    cy.mockApiBase()
    cy.intercept("GET", "/api/ipad/kpis", { fixture: "ipad/kpis.json" }).as("kpis")
    cy.intercept("GET", "/api/ipad/eventos*", { fixture: "ipad/eventos.json" }).as("eventos")
    cy.visitAs("oficial", "/ipad/dashboard")
  })

  it("muestra los KPIs principales", () => {
    cy.wait("@kpis")
    cy.contains("47").should("be.visible")
    cy.contains("132").should("be.visible")
    cy.contains(/vehiculos dentro/i).should("be.visible")
  })
})
```

- [ ] **Step 3: `cypress/e2e/ipad/vehiculos.cy.ts`**

```ts
// pruebas de gestion de vehiculos
describe("iPad - Vehiculos", () => {
  beforeEach(() => {
    cy.mockApiBase()
    cy.intercept("GET", "/api/ipad/vehiculos*", { fixture: "ipad/vehiculos.json" }).as("vehiculos")
    cy.intercept("POST", "/api/ipad/eventos", { statusCode: 201, body: { id: "e2" } }).as("evento")
    cy.visitAs("oficial", "/ipad/vehiculos")
  })

  it("lista vehiculos y registra entrada", () => {
    cy.wait("@vehiculos")
    cy.contains("ABC123").should("be.visible")
    cy.contains("XYZ789").should("be.visible")
    cy.contains("XYZ789").parents("[class*='rounded']").contains(/ingresar|entrada/i).click()
    cy.wait("@evento")
  })
})
```

- [ ] **Step 4: `cypress/e2e/ipad/multas.cy.ts`**

```ts
// pruebas de emision de multas
describe("iPad - Multas", () => {
  beforeEach(() => {
    cy.mockApiBase()
    cy.intercept("GET", "/api/ipad/multas*", { fixture: "ipad/multas.json" }).as("multas")
    cy.intercept("POST", "/api/ipad/multas", { statusCode: 201, body: { id: "mu2" } }).as("crear")
    cy.visitAs("oficial", "/ipad/multas")
  })

  it("muestra multas existentes y emite una nueva", () => {
    cy.wait("@multas")
    cy.contains("ABC123").should("be.visible")
    cy.contains(/nueva|emitir|registrar/i).click()
    cy.get("input[name=placa]").type("DEF456")
    cy.get("input[name=motivo],textarea[name=motivo]").type("Velocidad excesiva")
    cy.get("input[name=monto]").type("750")
    cy.contains(/guardar|emitir/i).click()
    cy.wait("@crear")
  })
})
```

- [ ] **Step 5: `cypress/e2e/ipad/punto-control.cy.ts`**

```ts
// pruebas de validacion de paso en punto de control
describe("iPad - Punto de control", () => {
  beforeEach(() => {
    cy.mockApiBase()
    cy.intercept("GET", "/api/ipad/puntos*", { fixture: "ipad/puntos.json" }).as("puntos")
    cy.intercept("POST", "/api/ipad/eventos", { statusCode: 201, body: { id: "e3" } }).as("evento")
    cy.visitAs("oficial", "/ipad/punto-control")
  })

  it("registra el paso de un vehiculo en el punto", () => {
    cy.wait("@puntos")
    cy.contains("Acceso Principal").should("be.visible")
    cy.contains(/validar|registrar/i).click()
    cy.wait("@evento")
  })
})
```

- [ ] **Step 6: Correr los 5 specs iPad**

Run:
```bash
npm run cypress:run -- --spec "cypress/e2e/ipad/*.cy.ts"
```

Expected: los 5 pasan. Ajustar selectores según las pantallas reales.

---

### Task 3.9: Crear specs Colegios (5 specs)

**Files:**
- Create: `cypress/e2e/colegios/login.cy.ts`
- Create: `cypress/e2e/colegios/registrar-visita.cy.ts`
- Create: `cypress/e2e/colegios/verificacion.cy.ts`
- Create: `cypress/e2e/colegios/bitacora.cy.ts`
- Create: `cypress/e2e/colegios/residentes.cy.ts`

- [ ] **Step 1: `cypress/e2e/colegios/login.cy.ts`**

```ts
// pruebas de login del admin de colegio
describe("Colegios - Login admin", () => {
  beforeEach(() => {
    cy.intercept("POST", "/api/auth/login", { fixture: "auth/login-colegio-admin.json" }).as("login")
  })

  it("ingresa con credenciales validas", () => {
    cy.visit("/colegios/login")
    cy.get("input[type=email]").type("maria@udlap.mx")
    cy.get("input[type=password]").type("password123")
    cy.contains("Ingresar").click()
    cy.wait("@login")
    cy.url().should("include", "/colegios")
    cy.url().should("not.include", "/login")
  })
})
```

- [ ] **Step 2: `cypress/e2e/colegios/registrar-visita.cy.ts`**

```ts
// pruebas del registro de visita externa por el admin
describe("Colegios - Registrar visita", () => {
  beforeEach(() => {
    cy.mockApiBase()
    cy.intercept("POST", "/api/visitas", { fixture: "visitas/creada.json" }).as("crear")
    cy.visitAs("colegio-admin", "/colegios/visitas/registrar")
  })

  it("captura datos del visitante y registra", () => {
    cy.get("input[name=nombre]").type("Pedro Hernández")
    cy.get("input[name=identificacion]").type("HERP800505")
    // selecciona el primer edificio disponible (el componente de seleccion puede ser un dropdown
    // custom o un select nativo; ajustar segun el DOM real al correr la prueba)
    cy.get("body").then(($body) => {
      if ($body.find("select").length) {
        cy.get("select").first().select("ed1")
      } else {
        cy.contains("Edificio A").click()
      }
    })
    cy.contains(/registrar|guardar/i).click()
    cy.wait("@crear")
  })
})
```

- [ ] **Step 3: `cypress/e2e/colegios/verificacion.cy.ts`**

```ts
// pruebas del flujo de verificacion de identidad
describe("Colegios - Verificacion", () => {
  beforeEach(() => {
    cy.mockApiBase()
    cy.intercept("POST", "/api/visitas/verificar", {
      statusCode: 200,
      body: { ok: true, residente: { nombre: "Ana Pérez" } },
    }).as("verificar")
    cy.visitAs("colegio-admin", "/colegios/visitas/verificacion")
  })

  it("verifica identidad y muestra exito", () => {
    cy.get("input[name=identificacion]").type("PERJ950101")
    cy.contains(/verificar|validar/i).click()
    cy.wait("@verificar")
    cy.contains(/correcto|exito|registrad/i).should("be.visible")
  })
})
```

- [ ] **Step 4: `cypress/e2e/colegios/bitacora.cy.ts`**

```ts
// pruebas de la bitacora de movimientos
describe("Colegios - Bitacora", () => {
  beforeEach(() => {
    cy.mockApiBase()
    cy.intercept("GET", "/api/colegios/movimientos*", { fixture: "colegios/movimientos.json" }).as("movs")
    cy.visitAs("colegio-admin", "/colegios/bitacora")
  })

  it("muestra los movimientos del dia", () => {
    cy.wait("@movs")
    cy.contains("ingreso", { matchCase: false }).should("be.visible")
  })
})
```

- [ ] **Step 5: `cypress/e2e/colegios/residentes.cy.ts`**

```ts
// pruebas de gestion de residentes
describe("Colegios - Residentes", () => {
  beforeEach(() => {
    cy.mockApiBase()
    cy.intercept("GET", "/api/colegios/residentes*", { fixture: "colegios/residentes.json" }).as("res")
    cy.intercept("GET", "/api/colegios/edificios*", { fixture: "colegios/edificios.json" }).as("ed")
    cy.visitAs("colegio-admin", "/colegios/residentes")
  })

  it("lista los residentes con su matricula", () => {
    cy.wait("@res")
    cy.contains("Ana Pérez").should("be.visible")
    cy.contains("169800").should("be.visible")
    cy.contains("Luis Gómez").should("be.visible")
  })
})
```

- [ ] **Step 6: Correr los 5 specs colegios**

Run:
```bash
npm run cypress:run -- --spec "cypress/e2e/colegios/*.cy.ts"
```

Expected: los 5 pasan.

---

### Task 3.10: Crear spec del selector de interfaz

**Files:**
- Create: `cypress/e2e/interface-selector.cy.ts`

- [ ] **Step 1: Crear el spec**

```ts
// pruebas del selector inicial de interfaz
describe("Interface Selector", () => {
  it("muestra las 4 opciones y navega a movil", () => {
    cy.visit("/")
    cy.contains(/m[oó]vil/i).should("be.visible")
    cy.contains(/iPad/i).should("be.visible")
    cy.contains(/kiosco/i).should("be.visible")
    cy.contains(/colegios/i).should("be.visible")
    cy.contains(/m[oó]vil/i).click()
    cy.url().should("include", "/movil")
  })
})
```

- [ ] **Step 2: Correr el spec**

Run: `npm run cypress:run -- --spec "cypress/e2e/interface-selector.cy.ts"`

---

### Task 3.11: Correr la suite completa local

- [ ] **Step 1: Build de la app**

Run: `npm run build`
Expected: build completo sin errores en `dist/`.

- [ ] **Step 2: Correr `test:e2e` (script que levanta vite preview + cypress)**

Run: `npm run test:e2e`
Expected: los 21 specs pasan.

Si algunos fallan por selectores que no coinciden con el DOM real, ajustar hasta que pasen. Reportar cuáles fallaron y por qué antes de seguir.

- [ ] **Step 3: Documentar specs que necesitaron ajuste**

Si hubo ajustes manuales (ej. textos en pantalla diferentes), anotar la lista para validar en el siguiente CI.

---

### CHECKPOINT FASE 3

Mensaje de commit sugerido:

```
test: agrega suite Cypress E2E con 21 specs y mocks

- Comandos custom: mockApiBase, mockApi, loginAs, visitAs
- Fixtures por modulo (auth, visitas, biblioteca, comedor, horario, ipad, colegios)
- Specs por interfaz: kiosco (3), movil (7), ipad (5), colegios (5), selector (1)
- Configura cypress.config con baseUrl http://localhost:5173
- Agrega scripts cypress:open/run/test:e2e en package.json
- Elimina test trivial evidencia_hu05.cy.ts
```

**Stop here for user review.**

---

## FASE 4 — GitHub Actions CI/CD

### Task 4.1: Crear el workflow de GitHub Actions

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Crear directorio `.github/workflows/` si no existe**

Run: `mkdir -p .github/workflows`

- [ ] **Step 2: Crear `.github/workflows/ci.yml` con el contenido completo**

```yaml
name: CI

on:
  push:
    branches: [dev, master]

jobs:
  cypress:
    name: Cypress E2E
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Build app
        run: npm run build

      - name: Run Cypress
        uses: cypress-io/github-action@v6
        with:
          start: npx vite preview --port 5173
          wait-on: "http://localhost:5173"
          wait-on-timeout: 60
          install: false

      - name: Upload artifacts on failure
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: cypress-failure
          path: |
            cypress/screenshots
            cypress/videos
          if-no-files-found: ignore

  build:
    name: Build (solo en master)
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/master'
    needs: cypress
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build
```

- [ ] **Step 3: Validar la sintaxis del YAML localmente**

Run:
```bash
npx --yes @action-validator/cli .github/workflows/ci.yml || \
  python3 -c "import yaml; yaml.safe_load(open('.github/workflows/ci.yml'))"
```
Expected: sin errores de sintaxis.

---

### Task 4.2: Documentar pasos manuales de configuración (opcional, no automatizable)

**Files:**
- Create: `.github/CI-SETUP.md`

- [ ] **Step 1: Crear `.github/CI-SETUP.md` con los pasos para el usuario**

```markdown
# Configuracion del CI

## Pasos para activar el workflow

1. Hacer push a `master` con el archivo `.github/workflows/ci.yml`. Eso registra el workflow en GitHub.
2. Crear la rama `dev` (ver task 4.3 abajo).
3. Verificar en la pestaña Actions del repo que aparece "CI" como workflow.

## Branch protection (opcional, recomendado)

GitHub > Settings > Branches > Add branch protection rule:

### Para `master`:
- Branch name pattern: `master`
- Require pull request reviews before merging (opcional)
- Require status checks to pass: marcar "Cypress E2E" y "Build (solo en master)"

### Para `dev`:
- Branch name pattern: `dev`
- Require status checks to pass: marcar "Cypress E2E"

## Flujo de trabajo

1. Trabajo se hace en `dev`. Cada push corre Cypress.
2. Cuando `dev` esta verde, el usuario hace merge manual a `master` (con `git merge` o un PR en GitHub).
3. El push a `master` dispara: Cypress + build. Si pasa, Vercel deploya automaticamente desde su integracion.
```

---

### Task 4.3: Crear la rama `dev`

- [ ] **Step 1: Verificar que el árbol esta limpio (todos los cambios de Fases 1-3 commiteados)**

Run: `git status`
Expected: "nothing to commit, working tree clean".

Si hay cambios sin commitear, parar y avisar al usuario para que commitee primero.

- [ ] **Step 2: Sincronizar master con remoto**

Run:
```bash
git checkout master
git pull origin master
```
Expected: "Already up to date." o pull exitoso.

- [ ] **Step 3: Crear y pushear la rama `dev`**

Run:
```bash
git checkout -b dev
git push -u origin dev
```
Expected: la rama `dev` aparece en GitHub. Esto debe disparar el workflow `cypress` automáticamente.

- [ ] **Step 4: Verificar en GitHub que el workflow corrió**

Abrir https://github.com/<owner>/<repo>/actions y verificar que el workflow "CI" se ejecutó en el push a `dev` y que el job `cypress` fue el único que corrió (no `build`).

---

### Task 4.4: Verificar el workflow en master

- [ ] **Step 1: Hacer un commit pequeño en master para disparar el workflow**

Opciones:
- Si las Fases 1-3 ya fueron commiteadas a `master`, el workflow ya corrió cuando se pusheó `.github/workflows/ci.yml`.
- Si no, hacer un cambio trivial (ej. ajustar un comentario), commitear y pushear:
  ```bash
  git checkout master
  # hacer cambio trivial
  git push origin master
  ```

- [ ] **Step 2: Verificar en GitHub que ambos jobs corrieron**

Abrir la pestaña Actions y confirmar:
- `cypress` corrió.
- `build` corrió DESPUÉS de `cypress` (gracias a `needs: cypress`).
- Ambos en verde.

- [ ] **Step 3: Verificar que Vercel deployó**

Abrir el dashboard de Vercel y confirmar que el deploy del último push a `master` está en estado "Ready". Si Vercel no deployó, verificar la integración GitHub-Vercel.

---

### CHECKPOINT FASE 4

Mensaje de commit sugerido:

```
ci: agrega workflow GitHub Actions para dev y master

- Job cypress corre en push a dev y master
- Job build corre solo en master, depende de cypress
- Sube screenshots/videos como artifact si Cypress falla
- Documenta pasos manuales en .github/CI-SETUP.md
```

**Stop here for user review.** Verificar visualmente en GitHub Actions que todo esté funcionando.

---

## Verificación final

- [ ] Todos los emojis del código fueron eliminados (`grep -rP "[\x{1F300}-\x{1F9FF}]" src/ server/` retorna vacío).
- [ ] Todas las funciones top-level relevantes tienen comentario.
- [ ] `npm run lint` pasa sin errores nuevos.
- [ ] `npm run build` pasa sin errores.
- [ ] `npm run test:e2e` pasa con los 21 specs verdes localmente.
- [ ] El workflow `CI` aparece en GitHub Actions y corre en push a `dev` y `master`.
- [ ] La rama `dev` existe en el remoto.
- [ ] Vercel deploya cuando hay push a `master`.

---

## Riesgos y mitigaciones

- **Selectores Cypress fallan por textos diferentes**: Cada spec se corre localmente antes de pasar a Fase 4. Si el DOM real no coincide, se ajustan los selectores en la Task correspondiente.
- **`vite preview` no arranca en CI**: `wait-on-timeout: 60` da margen. Si falla, revisar logs y aumentar timeout.
- **Comentarios masivos rompen lint**: La regla `react/jsx-no-useless-fragment` y similares no se afectan por comentarios. Si lint se rompe, revisar si hay otra regla afectada.
- **Auto-merge no automatizado**: El usuario hace `git merge` manual de dev a master. Vercel deploya automáticamente al ver el push a master. No hay "auto-promote" desde CI.
