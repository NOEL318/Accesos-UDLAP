# Plan 4 — Quiosco (Backend + cableado)

> **No git commits.**

**Goal:** El kiosco valida QRs contra el backend real (existente) y registra ingresos alternativos por INE creando documentos `RegistroAlternativo`. Requiere PIN de oficial al arrancar el kiosco.

**Architecture:** Reusa endpoints existentes de visitas. Añade módulo `quiosco` para registro alternativo. El kiosco se autentica como oficial (mismo flow que iPad).

**Spec:** `docs/superpowers/specs/2026-04-28-accesos-udlap-backend-design.md`

---

## File structure

### Backend nuevo

| Path | Responsabilidad |
|------|-----------------|
| `server/modules/quiosco/registro.model.ts` | Schema `RegistroAlternativo` |
| `server/modules/quiosco/quiosco.routes.ts` | `POST /api/quiosco/registro-alternativo`, `PATCH /:id/salida`, `GET /` |

### Frontend

Tres pantallas a refactorizar:
- `src/screens/KioscoPrincipal.tsx` — añadir input de QR token + valida vía `/api/visitas/qr/:token`
- `src/screens/RegistroAlternativo.tsx` — pasarela; sin cambios funcionales, navegación interna
- `src/screens/CapturaINE.tsx` — captura simulada; al finalizar manda POST con foto base64

`src/App.tsx` — proteger `/quiosco/*` con `RequireAuth role="oficial"`.

`src/lib/quiosco.ts` (nuevo) — helpers para validar QR y registrar INE.

---

## Phase A — Backend

### Task 1 — Modelo `RegistroAlternativo`

`server/modules/quiosco/registro.model.ts`:
```ts
import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose"

const registroSchema = new Schema(
  {
    nombre: { type: String, required: true },
    tipoId: String,            // "INE 1234..."
    motivo: String,
    fotoIne: String,           // base64
    vehiculoMatricula: String,
    oficialId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    ingreso: { type: Date, default: () => new Date() },
    salida: Date,
  },
  { timestamps: true }
)

export type RegistroDoc = InferSchemaType<typeof registroSchema> & { _id: unknown }
export const RegistroAlternativo: Model<RegistroDoc> =
  (mongoose.models.RegistroAlternativo as Model<RegistroDoc>) ||
  mongoose.model<RegistroDoc>("RegistroAlternativo", registroSchema)
```

### Task 2 — Rutas

`server/modules/quiosco/quiosco.routes.ts`:
```ts
import { Router } from "express"
import { z } from "zod"
import { asyncHandler } from "../../lib/asyncHandler"
import { ApiError } from "../../lib/errors"
import { requireAuth, requireRole } from "../../middlewares/auth"
import { RegistroAlternativo } from "./registro.model"

export const quioscoRoutes = Router()
quioscoRoutes.use(requireAuth, requireRole("oficial", "admin"))

const createInput = z.object({
  nombre: z.string().min(1),
  tipoId: z.string().optional(),
  motivo: z.string().optional(),
  fotoIne: z.string().optional(), // base64 dataURL
  vehiculoMatricula: z.string().optional(),
})

quioscoRoutes.post(
  "/registro-alternativo",
  asyncHandler(async (req, res) => {
    const input = createInput.parse(req.body)
    if (input.fotoIne && input.fotoIne.length > 600_000) {
      throw new ApiError("VALIDATION", "Foto INE muy grande (>450KB)")
    }
    const doc = await RegistroAlternativo.create({
      ...input,
      oficialId: req.user._id,
    })
    res.status(201).json({ data: doc.toObject() })
  })
)

quioscoRoutes.patch(
  "/registro-alternativo/:id/salida",
  asyncHandler(async (req, res) => {
    const r = await RegistroAlternativo.findById(req.params.id)
    if (!r) throw new ApiError("NOT_FOUND", "Registro no encontrado")
    r.salida = new Date()
    await r.save()
    res.json({ data: r.toObject() })
  })
)

quioscoRoutes.get(
  "/registro-alternativo",
  asyncHandler(async (_req, res) => {
    const items = await RegistroAlternativo.find()
      .sort({ ingreso: -1 })
      .limit(100)
      .lean()
    res.json({ data: items })
  })
)
```

### Task 3 — Mount en `app.ts`

```ts
import { quioscoRoutes } from "./modules/quiosco/quiosco.routes"
app.use("/api/quiosco", quioscoRoutes)
```

### Task 4 — Smoke

```bash
TOKEN=$(curl -sS -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"seguridad@udlap.mx","password":"demo1234"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['token'])")

# Crear registro
RESP=$(curl -sS -X POST http://localhost:4000/api/quiosco/registro-alternativo \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Visitante Test","tipoId":"INE 1234567","motivo":"Reunión académica"}')
echo $RESP

ID=$(echo $RESP | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['_id'])")

# Marcar salida
curl -sS -X PATCH http://localhost:4000/api/quiosco/registro-alternativo/$ID/salida \
  -H "Authorization: Bearer $TOKEN"
echo

# Listar
curl -sS http://localhost:4000/api/quiosco/registro-alternativo -H "Authorization: Bearer $TOKEN" \
  | python3 -c "import sys,json; print('total:', len(json.load(sys.stdin)['data']))"
```

Esperado: 201 con doc creado, salida actualizada, lista incluye el nuevo registro.

---

## Phase B — Frontend

### Task 5 — Helper `src/lib/quiosco.ts`

```ts
import { api } from "./api"
import type { Visita } from "./types"

export interface QrValidation {
  visita: Visita
  estado: "valido" | "expirado" | "no_encontrado"
}

export async function validarQrToken(token: string): Promise<Visita> {
  // Endpoint público (no requiere auth)
  return api.get<Visita>(`/api/visitas/qr/${encodeURIComponent(token)}`)
}

export async function registrarIngresoAlternativo(input: {
  nombre: string
  tipoId?: string
  motivo?: string
  fotoIne?: string
  vehiculoMatricula?: string
}) {
  return api.post<{ _id: string; nombre: string; ingreso: string }>(
    "/api/quiosco/registro-alternativo",
    input
  )
}
```

### Task 6 — Wrap `/quiosco/*` con `RequireAuth`

En `App.tsx`:
```tsx
import { RequireAuth } from "@/lib/auth-store"

<Route path="/quiosco" element={
  <RequireAuth role={["oficial", "admin"]} loginPath="/quiosco/login">
    <KioscoApp />
  </RequireAuth>
} />
<Route path="/quiosco/login" element={<KioscoLoginScreen />} />
```

### Task 7 — `KioscoLoginScreen`

Crear `src/screens/KioscoLoginScreen.tsx` reutilizando el mismo componente de PIN login del iPad (`PinKeypad`) y el listado de oficiales. Versión simplificada:

```tsx
import { useEffect, useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { api } from "@/lib/api"
import { useAuth } from "@/lib/auth-store"
import { PinKeypad } from "./ipad/components/PinKeypad"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface OficialItem {
  id: string
  nombre: string
  turno: string
  avatar?: string | null
}

export function KioscoLoginScreen() {
  const navigate = useNavigate()
  const { loginPin, user } = useAuth()
  const [oficiales, setOficiales] = useState<OficialItem[]>([])
  const [selected, setSelected] = useState<OficialItem | null>(null)
  const [pin, setPin] = useState("")
  const [error, setError] = useState(false)
  const [shake, setShake] = useState(false)

  useEffect(() => {
    void api.get<OficialItem[]>("/api/auth/oficiales").then(setOficiales).catch(() => setOficiales([]))
  }, [])

  useEffect(() => {
    if (user?.role === "oficial" || user?.role === "admin") {
      navigate("/quiosco", { replace: true })
    }
  }, [user, navigate])

  async function handleDigit(d: string) {
    if (!selected || pin.length >= 4) return
    const next = pin + d
    setPin(next)
    setError(false)
    if (next.length === 4) {
      try {
        await loginPin(selected.id, next)
        navigate("/quiosco", { replace: true })
      } catch {
        setError(true)
        setShake(true)
        setTimeout(() => { setShake(false); setPin("") }, 500)
      }
    }
  }

  function handleBackspace() {
    setPin((p) => p.slice(0, -1))
    setError(false)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10 bg-slate-50 relative">
      <Link to="/" className="absolute top-6 left-6 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900">
        <ArrowLeft className="size-4" /> Volver al selector
      </Link>

      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="text-2xl font-black text-[#0f2d5e]">Quiosco UDLAP</div>
          <p className="text-sm text-slate-500 mt-1">Ingreso de operador</p>
        </div>

        {!selected ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h1 className="text-center text-lg font-bold mb-4">Selecciona oficial operador</h1>
            <div className="grid grid-cols-2 gap-3">
              {oficiales.map((o) => (
                <button
                  key={o.id}
                  onClick={() => setSelected(o)}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl border border-slate-200 hover:bg-slate-50"
                >
                  <Avatar className="size-12">
                    {o.avatar ? <AvatarImage src={o.avatar} alt={o.nombre} /> : null}
                    <AvatarFallback>{o.nombre.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="text-sm font-bold">{o.nombre}</div>
                  <div className="text-[11px] text-slate-500">{o.turno}</div>
                </button>
              ))}
              {oficiales.length === 0 && (
                <p className="col-span-2 text-center text-sm text-slate-400">No hay oficiales disponibles</p>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <button
              onClick={() => { setSelected(null); setPin(""); setError(false) }}
              className="text-xs text-slate-500 mb-4 hover:text-slate-900"
            >
              ← Cambiar oficial
            </button>
            <div className="flex flex-col items-center mb-4">
              <Avatar className="size-16 mb-2">
                {selected.avatar ? <AvatarImage src={selected.avatar} alt={selected.nombre} /> : null}
                <AvatarFallback>{selected.nombre.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="font-bold">{selected.nombre}</div>
              <div className="text-[11px] text-slate-500">{selected.turno}</div>
            </div>

            <div className={"flex justify-center gap-3 mb-4 " + (shake ? "animate-shake" : "")}>
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={
                    "size-3 rounded-full transition-colors " +
                    (i < pin.length
                      ? error ? "bg-red-500" : "bg-orange-600"
                      : "bg-slate-300")
                  }
                />
              ))}
            </div>

            {error && <div className="text-center text-xs text-red-600 mb-3">PIN incorrecto</div>}

            <PinKeypad onDigit={handleDigit} onBackspace={handleBackspace} />
          </div>
        )}
      </div>
    </div>
  )
}
```

> Importar `KioscoLoginScreen` en `App.tsx`. Asegurar que `App.tsx` use el path `loginPath="/quiosco/login"` en `RequireAuth`.

### Task 8 — `KioscoPrincipal`: validación de QR real

El componente actual recibe `onNavigate: (screen: Screen) => void`. Lo dejamos, pero añadimos:

```tsx
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/lib/auth-store"
import { validarQrToken } from "@/lib/quiosco"
import { api } from "@/lib/api"
import type { Visita } from "@/lib/types"
```

Reemplazar `handleScanDemo` por:
```tsx
const [qrToken, setQrToken] = useState("")
const [scanResult, setScanResult] = useState<{ visita: Visita; resultado: "permitido" | "denegado"; motivo?: string } | null>(null)
const [scanError, setScanError] = useState<string | null>(null)
const [scanning, setScanning] = useState(false)

const handleValidateQr = async () => {
  if (!qrToken.trim()) return
  setScanning(true); setScanError(null); setScanResult(null)
  try {
    const visita = await validarQrToken(qrToken.trim())
    // Auto-permitir si la visita está activa o programada
    const resultado: "permitido" | "denegado" =
      visita.status === "cancelada" || visita.status === "expirada" ? "denegado" : "permitido"
    const motivo = resultado === "denegado" ? `Visita ${visita.status}` : undefined

    // Registrar el scan en el backend
    await api.post(`/api/visitas/qr/${qrToken.trim()}/scan`, {
      puntoId: "kiosco-principal",
      resultado,
      motivo,
    })
    setScanResult({ visita, resultado, motivo })
    setScanStatus(resultado === "permitido" ? "authorized" : "denied")
    setTimeout(() => {
      setScanStatus("idle")
      setScanResult(null)
      setQrToken("")
    }, 5000)
  } catch (e: any) {
    setScanError(e?.message ?? "QR inválido")
    setScanStatus("denied")
    setTimeout(() => { setScanStatus("idle"); setScanError(null); setQrToken("") }, 4000)
  } finally {
    setScanning(false)
  }
}
```

Añadir un input + botón a la UI del `KioscoPrincipal`. Ubicación: dentro del bloque "scanner" actual o cerca de él. El input acepta el `qrToken` (UUID o cualquier string) que un visitante "muestra" desde su móvil.

```tsx
{/* Scanner / input de QR — sección debajo del título */}
<div className="w-full max-w-md flex gap-2">
  <input
    value={qrToken}
    onChange={(e) => setQrToken(e.target.value)}
    placeholder="Pega el token del QR (o úsalo con scanner)"
    className="flex-1 h-12 px-4 rounded-xl border border-gray-300 bg-white text-sm"
  />
  <Button onClick={handleValidateQr} disabled={scanning || !qrToken.trim()} className="h-12">
    {scanning ? "Validando…" : "Validar"}
  </Button>
</div>
{scanResult && (
  <div className={"mt-3 p-3 rounded-lg text-sm " + (scanResult.resultado === "permitido" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800")}>
    {scanResult.resultado === "permitido"
      ? `✓ Acceso permitido — ${scanResult.visita.invitado.nombre}`
      : `✕ Acceso denegado — ${scanResult.motivo ?? "Validación fallida"}`}
  </div>
)}
{scanError && (
  <div className="mt-3 p-3 rounded-lg bg-red-50 text-red-800 text-sm">{scanError}</div>
)}
```

> El botón "Registro alternativo" (que ya existe y llama `onNavigate("registro-alternativo")`) se mantiene.

### Task 9 — `RegistroAlternativo` (pantalla)

Las dos opciones grandes son: "Escanear INE" → `onNavigate("captura-ine")`, "Otra opción" → de momento alert. Sin cambios funcionales requeridos en este plan más allá de mantener el flujo existente.

### Task 10 — `CapturaINE`: POST real con base64

Modificar el handler `handleCapture`:

```tsx
import { compressToBase64 } from "@/lib/image"
import { registrarIngresoAlternativo } from "@/lib/quiosco"

const [error, setError] = useState<string | null>(null)
const fileRef = useRef<HTMLInputElement>(null)

const handleCapture = async () => {
  // Para demo: dispara el input de archivo (no hay cámara real disponible en muchos entornos)
  fileRef.current?.click()
}

const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0]
  if (!file) return
  setState("capturing"); setError(null)
  try {
    const base64 = await compressToBase64(file, { maxKB: 250, maxPx: 800 })
    // Por demo: nombre extraído visualmente (input modal). Aquí un prompt simple:
    const nombre = window.prompt("Nombre completo del visitante:") || "Visitante INE"
    const tipoId = window.prompt("Número de identificación (opcional):") || undefined
    await registrarIngresoAlternativo({ nombre, tipoId, fotoIne: base64, motivo: "Sin credencial" })
    setState("captured")
    setTimeout(() => onNavigate("principal"), 2500)
  } catch (e: any) {
    setState("ready")
    setError(e?.message ?? "Error al subir foto")
  }
}
```

Añadir el input oculto al JSX:
```tsx
<input
  ref={fileRef}
  type="file"
  accept="image/*"
  capture="environment"
  hidden
  onChange={handleFile}
/>
{error && <div className="text-sm text-red-600">{error}</div>}
```

> El botón principal de "Capturar" sigue llamando `handleCapture()` (que ahora dispara el input de archivo).

### Task 11 — `npm run build` + smoke

Build debe pasar. Levantar `npm run dev` y verificar que `/quiosco/login` carga, y tras login se redirige a `/quiosco`.

---

## Self-Review

- ✅ Sección 4.16 (RegistroAlternativo): Task 1
- ✅ Sección 5.10 (Quiosco endpoints): Tasks 2-3
- ✅ Cableado QR contra `/api/visitas/qr/:token` (público): Task 8
- ✅ POST scan a `/api/visitas/qr/:token/scan`: Task 8
- ✅ POST registro alternativo con base64 INE: Task 10
- ✅ Auth requerido (oficial) para POSTs: Tasks 2, 6
- ✅ KioscoLoginScreen reusa `PinKeypad` del iPad: Task 7

Type consistency: `Visita` shape consistente con frontend types (`_id`, `qrToken`, `invitado.nombre`, `status`).
