# Resumen final — Planes 1-5 ejecutados

**Fecha:** 2026-04-28
**Estado:** Las 4 interfaces (Móvil, iPad, Quiosco, Colegios) cableadas contra MongoDB Atlas real.
**Git commits:** 0 (preferencia explícita del usuario).

---

## Cuentas demo (todas con password `demo1234`)

| Email | Rol | Notas |
|-------|-----|-------|
| `admin@udlap.mx` | `admin` | Acceso completo |
| `estudiante@udlap.mx` | `estudiante` | Para móvil. studentId 181278, saldo $450, 2 préstamos activos, horario lleno |
| `seguridad@udlap.mx` | `oficial` | Para iPad / Quiosco. PIN `1234`. María González |
| `ramirez@udlap.mx` | `oficial` | Para iPad. PIN `5678`. Vespertino |
| `garza@udlap.mx` | `oficial` | Para iPad. PIN `9012`. Nocturno |
| `colegios@udlap.mx` | `adminColegios` | Para Colegios |
| `residente1@udlap.mx` … `residente10@udlap.mx` | `residente` | 10 residentes en 4 edificios |

---

## Endpoints implementados

### Auth
- `POST /api/auth/login` (email + password)
- `POST /api/auth/login-pin` (oficialUserId + pin)
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/auth/oficiales` (público — para login screens)

### Users
- `PATCH /api/users/me`
- `POST /api/users/me/avatar`

### Visitas
- `GET/POST/PATCH/DELETE /api/visitas`
- `GET /api/visitas/qr/:token` (público)
- `POST /api/visitas/qr/:token/scan` (oficial)

### Móvil — Comedor / Biblioteca / Horario
- `GET /api/comedor/menu`
- `POST/GET /api/comedor/ordenes` (descuenta saldo en POST)
- `GET /api/biblioteca/libros`
- `GET/POST/PATCH /api/biblioteca/prestamos`
- `GET/POST/DELETE /api/biblioteca/deseos`
- `GET /api/horario`

### iPad — Vehículos / Multas / Eventos / Alertas
- `GET/POST/PATCH/DELETE /api/vehiculos` y `POST /buscar`
- `POST /api/vehiculos/:id/{permitir,denegar,autorizar-salida}`
- `GET/POST/PATCH /api/multas`
- `GET /api/eventos-acceso`
- `GET /api/puntos-control`
- `GET/POST /api/alertas`, `PATCH /:id/atender`
- `GET /api/kpis/ipad`

### Colegios
- `GET /api/colegios/edificios` y `/:id` (con ocupación calculada)
- `GET/PATCH /api/colegios/residentes` y `/:id`
- `GET/POST /api/colegios/movimientos`
- `GET /api/kpis/colegios`

### Quiosco
- `POST /api/quiosco/registro-alternativo` (con foto INE base64 comprimida)
- `PATCH /api/quiosco/registro-alternativo/:id/salida`
- `GET /api/quiosco/registro-alternativo`

---

## Cómo correrlo

```bash
# 1. Sembrar la base de datos (idempotente — borra y recrea todo)
npm run seed

# 2. Levantar todo en paralelo
npm run dev
# → Frontend: http://localhost:5173
# → API:      http://localhost:4000
```

---

## Flujos demo recomendados

### Móvil (estudiante)
1. `http://localhost:5173/movil/login` con `estudiante@udlap.mx` / `demo1234`
2. Crear visita en "Visitas → Nueva". Llenar nombre, fecha, hora, punto de acceso.
3. Ver el QR generado en "QR" del bottom nav.
4. Pedir comida en "Comedor" — el saldo se descuenta en tiempo real.
5. Prestar libros en "Biblioteca".

### Quiosco
1. `http://localhost:5173/quiosco` → redirige a login
2. Login PIN del oficial (`seguridad@udlap.mx` PIN 1234, o el primer oficial listado)
3. En la pantalla principal, **copia el `qrToken`** que generó la móvil (visible en QrNfcScreen) y pégalo en el input "Validar QR". El backend valida y registra el evento.
4. Para registro alternativo: click "Registro Alternativo" → "Captura INE" → selecciona una foto cualquiera → ingresa nombre.

### iPad seguridad
1. `http://localhost:5173/ipad/login`
2. Click un oficial, PIN (1234 / 5678 / 9012 según turno)
3. Dashboard muestra KPIs computados, vehículos, alertas activas, eventos recientes.
4. En "Punto de Control" o "Vehículos" puedes permitir/denegar acceso, autorizar salida bloqueada, registrar multas.

### Colegios residenciales
1. `http://localhost:5173/colegios/login` con `colegios@udlap.mx` / `demo1234`
2. Dashboard con KPIs reales (10 residentes, 4 edificios, 4 alertas activas).
3. Residentes con filtros por edificio/estado.
4. Registrar visita a un edificio.

---

## Decisiones registradas

| Decisión | Rationale |
|----------|-----------|
| Passwords en texto plano | Solicitud explícita del usuario para escuela |
| Sesiones por UUID en `users.sessionToken` | Sin JWT, sin encriptación |
| Imágenes base64 (≤300KB) en MongoDB | Vercel serverless = FS read-only |
| Sin react-query | Hooks artesanales suficientes para escuela |
| Una colección `users` con `role` + `profile` | Estándar Mongo, simplifica auth |
| Sin WebSockets | No soportados en serverless; polling cuando aplique |
| Una colección `alertas` con `scope` | iPad y colegios comparten lógica de "atender" |
| No git commits automáticos | Preferencia del usuario, todos los cambios pendientes |

---

## Lo que NO está implementado (out of scope)

- bcrypt para passwords (recomendado antes de presentar)
- Tests automatizados (smoke con `node:test`, e2e con Cypress)
- Polling/refresh real en alertas (cargan al boot, refresh manual)
- Pagos reales (multas y comedor son simulados)
- Internacionalización (todo en español)
- Code splitting (bundle ~1.1MB minified, gzipped 282KB — aceptable)
- Cámara real para captura INE (input file con simulador)
- Lectura QR con cámara real (input de texto para token; oficial pega o escanea con app aparte)
- Endpoints DELETE / soft-delete fuera del CRUD básico

## Bugs conocidos / mejoras pendientes

1. **`RegistrarVisitaScreen` (colegios)** — usa `useState(edificios[0].id)` en init; si los edificios aún no han cargado puede dar undefined. Agregar guard.
2. **PIN en LoginScreen iPad** — había un texto "Demo — PIN: {selected.pin}" que ahora muestra vacío (porque el backend no expone PINs). Cosmético; quitar el texto.
3. **Error envelope** — los `Promise.all` en hooks que fallan por uno solo ponen toda la card en error. Granular sería mejor.
4. **Concurrencia de saldo de comedor** — `User.findById` + `.save()` sin transacción; race condition posible bajo carga real, no en demo.

---

## Si quieres seguir mejorando

1. **Antes de presentar:** añadir bcrypt en `auth.service.ts` (login/loginPin) + rehashear los seeds.
2. **Smoke tests automatizados:** crear `server/__tests__/auth.test.ts` con `node --test --import tsx`.
3. **Cypress e2e:** ya está configurado el `cypress.config.ts`. Agregar `cypress/e2e/login.cy.ts` con un flujo Móvil→QR→logout.
4. **Code splitting:** dividir por interfaz con `React.lazy()` para reducir bundle inicial.
5. **Subir foto perfil:** ya está cableado en PerfilScreen; falta probar end-to-end con compresión real.
