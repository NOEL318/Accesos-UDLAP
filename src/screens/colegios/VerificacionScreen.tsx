import { useMemo, useRef, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import {
  Globe,
  Bell,
  CheckCircle2,
  Ban,
  ClipboardCheck,
  Wine,
  Cigarette,
  ShieldCheck,
  MapPin,
  Camera,
  RefreshCw,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { useColegiosData } from "./context/ColegiosDataContext"
import { useColegiosSession } from "./context/ColegiosSessionContext"
import { CameraCapture } from "@/components/CameraCapture"

// pantalla de verificación e inspección antes de permitir acceso al campus residencial
export function VerificacionScreen() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { residentes, edificios, visitas, verificarVisita, registrarMovimientoResidente } =
    useColegiosData()
  const { officer } = useColegiosSession()

  const [ebriedad, setEbriedad] = useState(false)
  const [items, setItems] = useState(false)
  const [decision, setDecision] = useState<"pendiente" | "permitido" | "denegado">(
    "pendiente"
  )
  const [motivo, setMotivo] = useState("")
  const [cameraOpen, setCameraOpen] = useState(false)
  const [evidencia, setEvidencia] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const lastResultRef = useRef<"permitido" | "denegado" | null>(null)

  // resuelve si el id corresponde a una visita pendiente o a un residente
  const visitaSeleccionada = useMemo(
    () => (id ? visitas.find((v) => v.id === id) : null),
    [id, visitas]
  )

  const residenteSeleccionado = useMemo(
    () => (id ? residentes.find((r) => r.id === id) ?? null : null),
    [id, residentes]
  )

  const visitante = visitaSeleccionada
    ? {
        kind: "visita" as const,
        nombre: visitaSeleccionada.nombreCompleto,
        avatar: visitaSeleccionada.foto ?? "",
        idMostrar: visitaSeleccionada.tipoId || "INE / Credencial Oficial",
        edificioId: visitaSeleccionada.edificioDestinoId,
        sub:
          visitaSeleccionada.categoria === "comunidad_udlap"
            ? "Comunidad UDLAP"
            : visitaSeleccionada.categoria === "servicio"
            ? "Servicio / Proveedor"
            : "Visita personal",
      }
    : residenteSeleccionado
    ? {
        kind: "residente" as const,
        nombre: residenteSeleccionado.nombre,
        avatar: residenteSeleccionado.avatar,
        idMostrar: `ID: ${residenteSeleccionado.id}`,
        edificioId: residenteSeleccionado.edificioId,
        sub: `${residenteSeleccionado.carrera} · ${residenteSeleccionado.semestre}° Sem`,
      }
    : null

  const colegioEntrada =
    (visitante &&
      edificios.find((e) => e.id === visitante.edificioId)) ||
    edificios[0]
  const fecha = new Date()
  const fechaStr = fecha
    .toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" })
    .replace(",", "")
  const horaStr = fecha.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })

  // permite acceso registrando en backend (verificacion o movimiento de entrada)
  async function permitir() {
    if (!visitante) return
    setSubmitting(true)
    setError(null)
    try {
      if (visitante.kind === "visita" && visitaSeleccionada) {
        await verificarVisita(visitaSeleccionada.id, {
          resultado: "permitido",
          ebriedad,
          itemsProhibidos: items,
          motivo: motivo || undefined,
          puntoAcceso: officer.gate,
          fotoEvidencia: evidencia ?? undefined,
        })
      } else if (visitante.kind === "residente" && residenteSeleccionado) {
        await registrarMovimientoResidente({
          residenteStudentId: residenteSeleccionado.id,
          edificioId: residenteSeleccionado.edificioId || colegioEntrada.id,
          tipo: "entrada",
          estado: ebriedad ? "ebriedad" : items ? "alerta" : "normal",
        })
      }
      setDecision("permitido")
      lastResultRef.current = "permitido"
      setTimeout(() => navigate("/colegios/visitas/exitoso"), 600)
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo registrar")
    } finally {
      setSubmitting(false)
    }
  }

  // deniega acceso registrando en backend con motivo y/o foto
  async function denegar() {
    if (!visitante) return
    setSubmitting(true)
    setError(null)
    try {
      if (visitante.kind === "visita" && visitaSeleccionada) {
        await verificarVisita(visitaSeleccionada.id, {
          resultado: "denegado",
          ebriedad,
          itemsProhibidos: items,
          motivo: motivo || "Acceso denegado por el oficial de turno",
          puntoAcceso: officer.gate,
          fotoEvidencia: evidencia ?? undefined,
        })
      } else if (visitante.kind === "residente" && residenteSeleccionado) {
        await registrarMovimientoResidente({
          residenteStudentId: residenteSeleccionado.id,
          edificioId: residenteSeleccionado.edificioId || colegioEntrada.id,
          tipo: "entrada",
          estado: "alerta",
        })
      }
      setDecision("denegado")
      lastResultRef.current = "denegado"
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo registrar")
    } finally {
      setSubmitting(false)
    }
  }

  if (!visitante) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
        No se encontró la visita o residente con id <code>{id}</code>. Regresa a{" "}
        <button
          type="button"
          onClick={() => navigate("/colegios/visitas/bitacora")}
          className="font-bold underline"
        >
          Bitácora
        </button>{" "}
        o{" "}
        <button
          type="button"
          onClick={() => navigate("/colegios/residentes")}
          className="font-bold underline"
        >
          Residentes
        </button>
        .
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-black tracking-tight">Verificación de Visitantes</h1>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="gap-2 rounded-full">
            <Globe className="size-4" />
            Change Language (EN)
          </Button>
          <Button variant="ghost" size="icon" aria-label="Notificaciones">
            <Bell className="size-5" />
          </Button>
          <span className="text-xs text-muted-foreground">
            {fechaStr} | {horaStr}
          </span>
        </div>
      </header>

      <Card className="overflow-hidden p-0 gap-0">
        <CardContent className="flex flex-col gap-6 px-6 py-6 sm:flex-row sm:items-center">
          <div className="relative shrink-0">
            <Avatar className="size-24 rounded-2xl bg-amber-100">
              <AvatarImage src={visitante.avatar} alt={visitante.nombre} />
              <AvatarFallback className="rounded-2xl bg-amber-100 text-2xl">
                {visitante.nombre[0]}
              </AvatarFallback>
            </Avatar>
            <span className="absolute -bottom-1 -right-1 flex size-7 items-center justify-center rounded-full bg-emerald-500 ring-4 ring-white">
              <CheckCircle2 className="size-4 text-white" />
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-black tracking-tight">{visitante.nombre}</h2>
              <span className="rounded-md bg-orange-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-orange-700">
                {visitante.kind === "visita" ? "Visitante" : "Residente"}
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {visitante.idMostrar} · {visitante.sub}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                <CheckCircle2 className="size-3.5" />
                Identidad confirmada
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                <ShieldCheck className="size-3.5" />
                Inspección en curso
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-0 gap-0 lg:col-span-2">
          <div className="flex items-center gap-2 border-b border-border px-6 py-4">
            <span className="flex size-7 items-center justify-center rounded-md bg-orange-100 text-orange-600">
              <ClipboardCheck className="size-4" />
            </span>
            <h3 className="text-base font-bold tracking-tight">Inspección</h3>
          </div>
          <div className="space-y-3 px-6 py-5">
            <InspectionRow
              icon={<Wine className="size-4" />}
              title="Verificación de Ebriedad"
              subtitle="Inspección visual en caso de intoxicación"
              checked={ebriedad}
              onChange={setEbriedad}
              activeAccent="amber"
            />
            <InspectionRow
              icon={<Cigarette className="size-4" />}
              title="Items Prohibidos"
              subtitle="Si el visitante o residente trae artículos prohibidos"
              checked={items}
              onChange={setItems}
              activeAccent="emerald"
            />

            <div className="rounded-xl bg-slate-50 px-4 py-3">
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Comentarios / Motivo
              </div>
              <Textarea
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Notas, motivo de denegación, observaciones…"
                className="mt-2 min-h-20 bg-white"
              />
            </div>
          </div>
        </Card>

        <Card className="p-0 gap-0">
          <div className="border-b border-border px-5 py-4">
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Colegio de entrada
            </div>
            <div className="mt-1 flex items-center gap-2 text-base font-bold">
              <MapPin className="size-4 text-orange-600" />
              {colegioEntrada?.nombre.replace("Edificio ", "") ?? "—"}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setCameraOpen(true)}
            className={cn(
              "relative h-44 w-full overflow-hidden text-left transition-colors",
              evidencia
                ? "bg-emerald-50"
                : "bg-gradient-to-br from-slate-100 to-slate-200 hover:from-slate-200 hover:to-slate-300"
            )}
          >
            {evidencia ? (
              <img
                src={evidencia}
                alt="Evidencia capturada"
                className="absolute inset-0 size-full object-cover"
              />
            ) : (
              <>
                <div className="absolute inset-0 opacity-50"
                  style={{
                    backgroundImage:
                      "linear-gradient(to right, rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.05) 1px, transparent 1px)",
                    backgroundSize: "20px 20px",
                  }}
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-700">
                  <Camera className="size-8" />
                  <span className="text-xs font-bold uppercase tracking-widest">
                    Tomar evidencia
                  </span>
                </div>
              </>
            )}
          </button>

          <div className="flex items-center justify-between gap-2 border-t border-border px-5 py-3 text-xs">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 font-semibold",
                evidencia ? "text-emerald-600" : "text-slate-600"
              )}
            >
              <Camera className="size-3.5" />
              {evidencia ? "Evidencia capturada" : "Cámara: Lista"}
            </span>
            {evidencia && (
              <button
                type="button"
                onClick={() => setEvidencia(null)}
                className="inline-flex items-center gap-1 text-orange-600 hover:underline"
              >
                <RefreshCw className="size-3" />
                Repetir
              </button>
            )}
          </div>
        </Card>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <Button
          size="lg"
          onClick={permitir}
          disabled={submitting || decision === "denegado"}
          className={cn(
            "h-14 gap-2 text-base font-bold",
            decision === "permitido"
              ? "bg-emerald-700 hover:bg-emerald-700"
              : "bg-emerald-600 hover:bg-emerald-700"
          )}
        >
          <CheckCircle2 className="size-5" />
          {submitting && lastResultRef.current === null ? "Registrando…" : "Permitir Acceso"}
        </Button>
        <Button
          size="lg"
          variant="outline"
          onClick={denegar}
          disabled={submitting || decision === "permitido"}
          className={cn(
            "h-14 gap-2 border-2 border-red-200 text-base font-bold text-red-600 hover:bg-red-50",
            decision === "denegado" && "bg-red-50"
          )}
        >
          <Ban className="size-5" />
          Denegar Acceso
        </Button>
      </div>

      {decision === "denegado" && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Acceso denegado por <strong>{officer.nombre}</strong>. Se registró el evento en
          bitácora{ebriedad || items ? " y se levantó una alerta" : ""}.
        </div>
      )}

      <CameraCapture
        open={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onCapture={(b64) => setEvidencia(b64)}
        title="Evidencia de inspección"
        hint="Toma una foto del visitante, su INE o cualquier ítem relevante."
      />
    </div>
  )
}

interface RowProps {
  icon: React.ReactNode
  title: string
  subtitle: string
  checked: boolean
  onChange: (v: boolean) => void
  activeAccent: "amber" | "emerald"
}

// fila de inspección con switch para marcar ebriedad o ítems prohibidos
function InspectionRow({ icon, title, subtitle, checked, onChange, activeAccent }: RowProps) {
  const accentBar =
    activeAccent === "emerald" ? "before:bg-emerald-500" : "before:bg-orange-500"
  return (
    <div
      className={cn(
        "relative flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3 transition-colors",
        "before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1 before:rounded-r",
        checked ? accentBar : "before:bg-transparent"
      )}
    >
      <span className="flex size-9 items-center justify-center rounded-lg bg-white text-orange-600">
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-bold">{title}</div>
        <div className="text-xs text-muted-foreground">{subtitle}</div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  )
}
