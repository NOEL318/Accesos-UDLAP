# Spec: Limpieza de emojis, comentarios JR-style, suite Cypress E2E y CI/CD

**Fecha:** 2026-04-29
**Autor:** Noel + Claude
**Estado:** Diseño aprobado por el usuario, pendiente plan de implementación

## Contexto

El proyecto `accesos-udlap-2026` es un monorepo full-stack (cliente Vite/React 19 + servidor Express/Mongoose) con cuatro interfaces principales: kiosco, móvil, iPad de seguridad, y colegios residenciales. Actualmente:

- Hay emojis dispersos en 11 archivos de código, algunos como decoración (logs del servidor) y otros como parte de la UI/datos (íconos de menú del comedor, portadas de libros, indicadores de estado).
- No hay comentarios consistentes en las funciones del código fuente.
- Cypress 15 está instalado pero sólo existe un test trivial (`cypress/e2e/evidencia_hu05.cy.ts`).
- No hay GitHub Actions configuradas. Sólo existe la rama `master`.
- Vercel ya tiene integración con el repo (existe `vercel.json`), por lo que el deploy se dispara automáticamente al hacer push a `master` desde la consola de Vercel — fuera del alcance de este trabajo.

## Objetivos

1. **Eliminar todos los emojis** del código fuente y reemplazar los que cumplen función visual con íconos de `lucide-react` (ya instalado).
2. **Agregar comentarios cortos estilo JR-dev** (una línea, en español, sin formato) en todas las funciones top-level con nombre y en los callbacks dentro de hooks de React.
3. **Crear una suite Cypress E2E** que cubra el happy path de las cuatro interfaces, mockeando todas las llamadas a la API con `cy.intercept()`.
4. **Configurar GitHub Actions** para correr la suite en `dev` (sólo tests) y en `master` (tests + build), sin auto-merge entre ramas.

## No-objetivos

- No tocar `src/components/ui/*` (componentes shadcn auto-generados).
- No agregar tests de unidad ni de integración del backend.
- No configurar deploy a Vercel desde GitHub Actions (Vercel ya lo hace solo).
- No agregar branch protection rules desde código (se documentan los pasos manuales para que el usuario los configure en GitHub).
- No reescribir la lógica del backend; sólo se quitan emojis de `console.log` y se renombra el campo `emoji` en `seed.ts` para mantener consistencia con el cliente.

## Diseño general

El trabajo se divide en cuatro fases secuenciales con punto de validación entre cada una:

```
Fase 1 → Limpieza de emojis              (src/** y server/**)
Fase 2 → Comentarios JR-style            (todas las funciones top-level + callbacks de hooks)
Fase 3 → Suite Cypress E2E               (cypress/e2e/**, fixtures, comandos custom)
Fase 4 → GitHub Actions CI/CD            (.github/workflows/ + creación rama dev)
```

Las fases son secuenciales porque la Fase 3 depende de los archivos modificados por las Fases 1-2, y la Fase 4 sólo tiene sentido cuando hay tests reales que correr.

## Fase 1 — Limpieza de emojis

### Mapeo emoji → reemplazo

**Logs del servidor** (eliminar el carácter, dejar el texto):

| Archivo | Antes | Después |
|---|---|---|
| `server/index.ts` | `🚀 Server escuchando` | `Server escuchando` |
| `server/db.ts` | `✅ MongoDB conectado` | `MongoDB conectado` |
| `server/env.ts` | `❌ Variables de entorno inválidas` | `Variables de entorno inválidas` |
| `server/seed.ts` | `✅ Seed completo`, `❌ Seed falló`, etc. | Sin emojis |

**Datos del comedor** (renombrar campo `emoji: string` → `icon: string`, mapear a componente lucide):

| Platillo | Antes (`emoji`) | Después (`icon`) | Componente lucide | Color |
|---|---|---|---|---|
| Bowl Mediterráneo | `🥗` | `"salad"` | `<Salad />` | `text-green-500` |
| Ensalada del Chef | `🥙` | `"sandwich"` | `<Sandwich />` | `text-amber-500` |
| Crema de Tomate | `🍲` | `"soup"` | `<Soup />` | `text-red-500` |
| Pollo a la Plancha | `🍗` | `"drumstick"` | `<Drumstick />` | `text-orange-500` |
| Agua de Jamaica | `🧃` | `"juice"` | `<CupSoda />` | `text-pink-500` |
| Tazón Vegano | `🥒` | `"vegan"` | `<Leaf />` | `text-green-600` |
| Hamburguesa UDLAP | `🍔` | `"burger"` | `<Beef />` | `text-amber-700` |
| Smoothie Verde | `🥤` | `"smoothie"` | `<Milk />` | `text-green-400` |

**Datos de biblioteca** (renombrar `cover: string` → `icon: string`):

| Cover | Antes | Después | Componente | Color |
|---|---|---|---|---|
| Azul | `📘` | `"book-blue"` | `<Book />` | `text-blue-500` |
| Verde | `📗` | `"book-green"` | `<Book />` | `text-green-500` |
| Naranja | `📙` | `"book-orange"` | `<Book />` | `text-orange-500` |
| Rojo | `📕` | `"book-red"` | `<Book />` | `text-red-500` |
| Negro | `📓` | `"book-black"` | `<Notebook />` | `text-gray-700` |
| Café | `📔` | `"book-brown"` | `<BookMarked />` | `text-amber-700` |
| Amarillo | `📒` | `"book-yellow"` | `<BookOpen />` | `text-yellow-500` |

**Íconos UI sueltos en JSX** (reemplazo directo con `lucide-react`):

| Emoji | Reemplazo |
|---|---|
| `🚗` | `<Car size={16} />` |
| `🚶` | `<PersonStanding size={16} />` |
| `👤` | `<User />` |
| `🕐` | `<Clock />` |
| `🔄` | `<RefreshCw />` |
| `✕` | `<X />` |
| `✓` | `<CheckCircle2 />` |
| `📍` | `<MapPin />` |
| `📚` | `<Library />` (fallback de portadas) |

### Mapper centralizado

Se crea `src/lib/icon-map.tsx` con dos funciones que devuelven el componente lucide ya con su color aplicado:

```ts
// devuelve el icono lucide con color para un platillo del comedor
export function getComidaIcon(name: string, size = 24): JSX.Element { ... }

// devuelve el icono lucide con color para una portada de libro
export function getLibroIcon(name: string, size = 24): JSX.Element { ... }
```

El mapper se importa en `BibliotecaScreen.tsx`, `ComedorScreen.tsx` (y dondequiera que se rendericen los datos del menú/biblioteca).

### Archivos afectados (11)

```
server/index.ts
server/db.ts
server/env.ts
server/seed.ts
src/lib/icon-map.tsx               (nuevo)
src/screens/movil/data.ts
src/screens/movil/BibliotecaScreen.tsx
src/screens/movil/ComedorScreen.tsx       (verificar si renderiza el emoji)
src/screens/movil/NuevaVisitaScreen.tsx
src/screens/movil/DetallesVisitaScreen.tsx
src/screens/movil/VisitasScreen.tsx
src/screens/colegios/RegistrarVisitaScreen.tsx
src/screens/KioscoPrincipal.tsx
```

## Fase 2 — Comentarios JR-style

### Reglas de estilo

- Una línea `// ...` arriba de la función, en español informal.
- Sin JSDoc, sin formato multi-línea, sin alineación.
- Describe **qué hace** la función, no qué recibe ni qué retorna.
- Para componentes React: dice qué pantalla/sección renderiza.
- Para hooks custom: dice qué dato administra.
- Para callbacks dentro de `useEffect`/`useMemo`/`useCallback`: una línea explicando el efecto/cálculo.

### Alcance

Aplica a todos los `.ts`/`.tsx` en `src/` y `server/` excepto:

- `src/components/ui/*` (shadcn auto-generado).
- Archivos que sólo exportan tipos (`types.ts`).
- Archivos que sólo exportan datos (`data.ts`).
- `node_modules/`, `dist/`, `cypress/` (esos archivos llevan comentarios distintos por convención de pruebas).

### Casos donde NO se agrega comentario

- `function App()` que sólo monta `<RouterProvider />`.
- Re-exports (`export { default } from './X'`).
- Wrappers triviales de 3 líneas que sólo pasan props.
- Componentes shadcn re-exportados.

### Ejemplo

```ts
// hook para traer las visitas del usuario filtradas por estado
export function useVisitas(filtro: string) {
  const [data, setData] = useState([])
  // recarga las visitas cada vez que cambia el filtro
  useEffect(() => {
    fetchVisitas(filtro).then(setData)
  }, [filtro])
  return data
}
```

### Estimado de archivos modificados

~110-130 archivos (de los 165 totales).

## Fase 3 — Suite Cypress E2E

### Estructura

```
cypress/
├── e2e/
│   ├── kiosco/
│   │   ├── login.cy.ts
│   │   ├── escaneo-acceso.cy.ts
│   │   └── registro-alternativo.cy.ts
│   ├── movil/
│   │   ├── login.cy.ts
│   │   ├── nueva-visita.cy.ts
│   │   ├── visitas-listado.cy.ts
│   │   ├── horario.cy.ts
│   │   ├── biblioteca.cy.ts
│   │   ├── comedor.cy.ts
│   │   └── perfil.cy.ts
│   ├── ipad/
│   │   ├── login.cy.ts
│   │   ├── dashboard.cy.ts
│   │   ├── vehiculos.cy.ts
│   │   ├── multas.cy.ts
│   │   └── punto-control.cy.ts
│   ├── colegios/
│   │   ├── login.cy.ts
│   │   ├── registrar-visita.cy.ts
│   │   ├── verificacion.cy.ts
│   │   ├── bitacora.cy.ts
│   │   └── residentes.cy.ts
│   └── interface-selector.cy.ts
├── fixtures/
│   ├── auth/
│   │   ├── login-residente.json
│   │   ├── login-oficial.json
│   │   └── login-colegio-admin.json
│   ├── visitas/{lista,detalle,creada}.json
│   ├── biblioteca/libros.json
│   ├── comedor/menu.json
│   ├── horario/clases.json
│   ├── ipad/{kpis,vehiculos,multas,puntos,alertas}.json
│   └── colegios/{kpis,edificios,residentes,movimientos,alertas}.json
└── support/
    ├── commands.ts
    ├── e2e.ts
    └── component.ts
```

**Total de specs: 21** (debajo del rango 25-30 sugerido inicialmente, pero 21 cubre cada flujo crítico de happy path sin redundancia. El rango se puede crecer dividiendo specs si un flujo grande conviene partirlo, pero no se inventan tests para llenar el conteo).

### Comandos custom (`cypress/support/commands.ts`)

```ts
declare global {
  namespace Cypress {
    interface Chainable {
      mockApiBase(): Chainable<void>
      mockApi(method: string, url: string, fixture: string, alias?: string): Chainable<null>
      loginAs(rol: 'residente' | 'oficial' | 'colegio-admin'): Chainable<void>
      visitAs(rol: 'residente' | 'oficial' | 'colegio-admin', ruta: string): Chainable<void>
    }
  }
}

// monta intercepts base para todas las APIs comunes (perfil, sesión, healthcheck)
Cypress.Commands.add('mockApiBase', () => { ... })

// intercepta una ruta con su fixture y registra alias para esperar
Cypress.Commands.add('mockApi', (method, url, fixture, alias) => { ... })

// hace login simulado y deja al usuario en su pantalla principal
Cypress.Commands.add('loginAs', (rol) => { ... })

// shortcut para ir a una ruta preautenticado
Cypress.Commands.add('visitAs', (rol, ruta) => {
  cy.loginAs(rol)
  cy.visit(ruta)
})
```

### Política de mocks

- Todos los tests inician con `cy.mockApiBase()` que cubre rutas comunes.
- Las rutas específicas del flujo se interceptan en el `beforeEach` con alias usando `cy.mockApi(...)`.
- Las fixtures viven en `cypress/fixtures/` separadas por módulo, sin lógica.
- Toda la app pasa por `cy.intercept()`, por lo que **CI no necesita levantar el backend**.

### Configuración de Cypress

`cypress.config.ts` se actualiza con:

```ts
e2e: {
  baseUrl: 'http://localhost:5173',
  setupNodeEvents(on, config) { return config },
}
```

### Scripts en `package.json`

Se agregan:

```json
"cypress:open": "cypress open",
"cypress:run": "cypress run",
"test:e2e": "start-server-and-test 'vite preview --port 5173' http://localhost:5173 'cypress run'"
```

Se agrega `start-server-and-test` como `devDependency`.

### Eliminación del test viejo

`cypress/e2e/evidencia_hu05.cy.ts` se elimina (era trivial, lo reemplaza el conjunto nuevo).

## Fase 4 — GitHub Actions CI/CD

### Workflow único: `.github/workflows/ci.yml`

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
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run build
      - name: Run Cypress
        uses: cypress-io/github-action@v6
        with:
          start: npx vite preview --port 5173
          wait-on: 'http://localhost:5173'
          wait-on-timeout: 60
      - name: Upload artifacts on failure
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: cypress-failure
          path: |
            cypress/screenshots
            cypress/videos

  build:
    name: Build (sólo en master)
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/master'
    needs: cypress
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run build
```

### Comportamiento

| Push a... | Job `cypress` | Job `build` |
|---|---|---|
| `dev` | Corre | No corre |
| `master` | Corre | Corre (sólo si `cypress` pasa) |
| Otra rama | No corre | No corre |

### Por qué Vite preview funciona sin backend

Como TODOS los `fetch` de la app van a la API y Cypress los intercepta antes de salir del navegador con `cy.intercept()`, no necesitamos levantar el servidor Express ni MongoDB en CI. Vite preview sólo sirve el bundle estático de `dist/`.

### Deploy a Vercel

Vercel tiene integración propia con GitHub que se dispara automáticamente al hacer push a `master`. **El workflow de GitHub Actions no se involucra en el deploy.**

### Creación de la rama `dev`

Al final de la Fase 4, se ejecuta:

```bash
git checkout master
git checkout -b dev
git push -u origin dev
```

(La rama `dev` arranca limpia desde el estado final de `master` después de que las Fases 1-3 estén mergeadas.)

### Pasos manuales para el usuario (documentados, no automatizables)

Configurar branch protection en GitHub web (Settings → Branches):

1. **Master:** require pull request reviews, require `cypress` y `build` checks to pass.
2. **Dev:** require `cypress` check to pass.

(Estas reglas son opcionales — si el usuario sólo quiere CI sin protección, puede saltarse este paso.)

## Manejo de errores

- **Tests Cypress fallan en CI:** El job falla, se suben los videos/screenshots como artifacts. Vercel no se entera (Vercel sólo mira el push a master, no el estado del CI).
- **Build falla en master:** El job falla. El usuario ve el error en la pestaña Actions.
- **Conflicto al mergear `dev` → `master` localmente:** Es responsabilidad del usuario resolverlo. CI no se involucra.
- **Test flaky:** Cypress reintenta automáticamente con su retry policy default. Si sigue fallando, se reporta.

## Pruebas del propio sistema

- **Fase 1:** Verificación visual manual de cada pantalla afectada en el navegador (`npm run dev:client`).
- **Fase 2:** Lint pasa (`npm run lint`), typecheck pasa (`npx tsc -b`).
- **Fase 3:** `npm run cypress:run` localmente con Vite preview corriendo. Todos los specs verdes.
- **Fase 4:** Push a `dev` debe ejecutar sólo `cypress`. Push a `master` debe ejecutar `cypress` y `build`.

## Consideraciones de seguridad

- El workflow usa `GITHUB_TOKEN` por defecto con permisos de lectura. No se necesitan secretos.
- Las fixtures de auth contienen tokens **fake** (no son JWT reales). Documentado en cada fixture.
- No se exponen variables de entorno sensibles en el workflow.

## Riesgos conocidos

- **`cypress-io/github-action@v6` requiere que el `start` script sea bloqueante**. Si `vite preview` no arranca, el job se queda colgado hasta el timeout. Mitigación: `wait-on-timeout: 60` y verificación manual antes de mergear el workflow.
- **Cobertura no es exhaustiva**: 21 specs de happy path no cubren errores de validación ni edge cases. Es una decisión consciente del usuario.
- **Si la suite crece mucho**, los tiempos de CI aumentan. Mitigación: `cypress run --parallel` requiere Cypress Cloud (de pago) — fuera de alcance.

## Migración / rollout

- Las modificaciones se hacen en el árbol de trabajo del repo. Claude **no hace commits automáticamente** (per memoria del usuario: nunca ejecutar `git commit` sin pedir).
- Cada fase termina con el árbol modificado. El usuario decide cuándo y cómo hacer commit/push (a `master` directo o a una rama feature antes de mergear).
- Punto de validación entre cada fase: usuario revisa los cambios, hace commit cuando esté satisfecho, y avisa a Claude para arrancar la siguiente fase.
- La rama `dev` se crea al final de la Fase 4, después de que `master` ya tenga todo el código nuevo. Comando exacto:
  ```bash
  git checkout master && git pull
  git checkout -b dev
  git push -u origin dev
  ```

## Referencias

- `package.json` — `lucide-react@0.577.0`, `cypress@15.14.1` ya instalados.
- `cypress.config.ts` — config base existente, sólo se extiende.
- `vercel.json` — deploy a Vercel ya configurado, fuera del alcance del workflow.
