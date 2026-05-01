import { useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  Globe,
  Camera,
  Car,
  Footprints,
  ScanLine,
  CircleCheck,
  ArrowLeftRight,
  CheckCircle2,
  Siren,
  MapPin,
  RefreshCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { useColegiosData } from "./context/ColegiosDataContext"
import type { CategoriaVisita, TipoAcceso } from "./types"
import { CameraCapture } from "@/components/CameraCapture"
import { ApiError } from "@/lib/api"

// pantalla para registrar una nueva visita al campus residencial
export function RegistrarVisitaScreen() {
  const navigate = useNavigate()
  const { edificios, registrarVisita } = useColegiosData()

  const [categoria, setCategoria] = useState<CategoriaVisita>("servicio")
  const [nombre, setNombre] = useState("")
  const [fechaHora, setFechaHora] = useState("")
  const [edificioId, setEdificioId] = useState(edificios[0]?.id ?? "")
  const [multiple, setMultiple] = useState(false)
  const [tipoAcceso, setTipoAcceso] = useState<TipoAcceso>("vehicular")
  const [comentarios, setComentarios] = useState("")
  const [foto, setFoto] = useState<string | null>(null)
  const [cameraOpen, setCameraOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canSubmit = nombre.trim().length > 2 && edificioId

  // arma el payload de la visita y la registra antes de ir a la pantalla de éxito
  async function submit() {
    if (!canSubmit) return
    setSubmitting(true)
    setError(null)
    try {
      await registrarVisita({
        nombreCompleto: nombre.trim(),
        categoria,
        tipoAcceso,
        edificioDestinoId: edificioId,
        fechaHora: fechaHora ? new Date(fechaHora).toISOString() : new Date().toISOString(),
        multipleEntrada: multiple,
        comentarios,
        foto: foto ?? undefined,
        tipoId: "INE / Credencial Oficial",
        estatusVisitante: "sin_antecedentes",
        ubicacionEntrada: "Puerta Principal Sur",
      })
      navigate("/colegios/visitas/exitoso")
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "No se pudo registrar la visita")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-black tracking-tight">Registro de Visitantes</h1>
        <Button variant="outline" size="sm" className="gap-2 rounded-full">
          <Globe className="size-4" />
          Change Language (EN)
        </Button>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Formulario principal */}
        <Card className="p-0 gap-0">
          <CardContent className="px-6 py-6 sm:px-8 sm:py-8">
            <div>
              <h2 className="text-2xl font-black tracking-tight">Nueva Entrada</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Ingrese los datos para autorizar el acceso al campus.
              </p>
            </div>

            {/* Categoría tabs */}
            <div className="mt-6 grid grid-cols-2 rounded-xl bg-slate-50 p-1">
              {(
                [
                  { id: "servicio", label: "Servicio / Proveedor" },
                  { id: "personal", label: "Visita Personal" },
                ] as { id: CategoriaVisita; label: string }[]
              ).map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCategoria(c.id)}
                  className={cn(
                    "rounded-lg py-2.5 text-sm font-bold transition-all",
                    categoria === c.id
                      ? "bg-white text-orange-600 shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {c.label}
                </button>
              ))}
            </div>

            <div className="mt-6 space-y-5">
              <Field label="Nombre Completo">
                <Input
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej. Juan Pérez García"
                  className="h-11"
                />
              </Field>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Fecha y Hora">
                  <Input
                    type="datetime-local"
                    value={fechaHora}
                    onChange={(e) => setFechaHora(e.target.value)}
                    className="h-11"
                  />
                </Field>
                <Field label="Destino / Edificio">
                  <Select value={edificioId} onValueChange={setEdificioId}>
                    <SelectTrigger className="h-11 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {edificios.map((e) => (
                        <SelectItem key={e.id} value={e.id}>
                          {e.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3">
                <span className="flex size-8 items-center justify-center rounded-lg bg-white text-orange-600">
                  <ArrowLeftRight className="size-4" />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold">Múltiples Entradas / Salidas</div>
                  <div className="text-xs text-muted-foreground">
                    Permitir re-ingreso durante el día
                  </div>
                </div>
                <Switch checked={multiple} onCheckedChange={setMultiple} />
              </div>

              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Tipo de Acceso
                </div>
                <div className="mt-2 grid grid-cols-2 gap-3">
                  <AccesoOption
                    icon={<Car className="size-5" />}
                    label="Vehicular"
                    active={tipoAcceso === "vehicular"}
                    onClick={() => setTipoAcceso("vehicular")}
                  />
                  <AccesoOption
                    icon={<Footprints className="size-5" />}
                    label="Peatonal"
                    active={tipoAcceso === "peatonal"}
                    onClick={() => setTipoAcceso("peatonal")}
                  />
                </div>
              </div>

              <Field label="Comentarios / Observaciones">
                <Textarea
                  value={comentarios}
                  onChange={(e) => setComentarios(e.target.value)}
                  placeholder="Detalles adicionales del vehículo, material que ingresa, etc."
                  className="min-h-24"
                />
              </Field>

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
                  {error}
                </div>
              )}

              <Button
                size="lg"
                disabled={!canSubmit || submitting}
                onClick={submit}
                className="h-14 w-full gap-2 bg-orange-600 text-base font-bold hover:bg-orange-700"
              >
                <CheckCircle2 className="size-5" />
                {submitting ? "Registrando…" : "Confirmar Registro de Acceso"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Panel lateral */}
        <div className="space-y-4">
          <SidePanel title="Captura de Datos">
            <button
              type="button"
              onClick={() => setCameraOpen(true)}
              className={cn(
                "group flex aspect-[4/5] w-full flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all overflow-hidden",
                foto
                  ? "border-emerald-400 bg-emerald-50/30"
                  : "border-slate-200 bg-slate-50 hover:border-orange-300 hover:bg-orange-50/40"
              )}
            >
              {foto ? (
                <img
                  src={foto}
                  alt="Visitante"
                  className="size-full object-cover"
                />
              ) : (
                <>
                  <Camera className="size-8 text-muted-foreground transition-colors group-hover:text-orange-500" />
                  <span className="mt-3 text-xs font-semibold text-muted-foreground">
                    Tomar Fotografía
                  </span>
                </>
              )}
            </button>
            {foto && (
              <button
                type="button"
                onClick={() => setCameraOpen(true)}
                className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-orange-600 hover:underline"
              >
                <RefreshCw className="size-3" />
                Repetir foto
              </button>
            )}
          </SidePanel>

          <SidePanel title="Identificación">
            <button className="flex w-full items-center gap-3 rounded-lg bg-slate-50 px-3 py-3 text-left transition-colors hover:bg-orange-50/40">
              <span className="flex size-9 items-center justify-center rounded-lg bg-orange-100 text-orange-600">
                <ScanLine className="size-4" />
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Tipo de ID
                </div>
                <div className="text-sm font-bold">INE / Credencial Oficial</div>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-orange-600">
                Escanear
              </span>
            </button>

            <div className="mt-2 rounded-lg bg-slate-50 px-3 py-3">
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Estatus del Visitante
              </div>
              <div className="mt-1 flex items-center gap-1.5 text-sm font-bold text-emerald-600">
                <CircleCheck className="size-4" />
                Sin antecedentes
              </div>
            </div>
          </SidePanel>

          <Card className="overflow-hidden bg-slate-900 p-0 text-white gap-0">
            <div className="px-4 py-3">
              <div className="text-[10px] font-bold uppercase tracking-widest text-white/60">
                Información de Destino
              </div>
              <div className="mt-1 flex items-center gap-2 text-sm">
                <MapPin size={16} className="inline" />
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-white/60">
                    Ubicación Actual
                  </div>
                  <div className="font-bold">Puerta Principal Sur</div>
                </div>
              </div>
            </div>
            <div className="relative h-32 bg-slate-800">
              <div
                className="absolute inset-0 opacity-30"
                style={{
                  backgroundImage:
                    "linear-gradient(to right, rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.06) 1px, transparent 1px)",
                  backgroundSize: "16px 16px",
                }}
              />
              <span className="absolute left-1/2 top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-500 ring-4 ring-orange-500/30" />
            </div>
          </Card>

          <Button
            variant="outline"
            onClick={() =>
              alert(
                "Botón de pánico activado. Notificación enviada a Caseta Principal y oficial de turno."
              )
            }
            className="w-full border-2 border-red-200 bg-red-50/40 py-6 text-red-600 hover:bg-red-50"
          >
            <Siren className="size-4" />
            <span className="ml-2 font-black tracking-wider">PÁNICO / EMERGENCIA</span>
          </Button>
        </div>
      </div>

      <CameraCapture
        open={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onCapture={(b64) => setFoto(b64)}
        title="Foto del visitante"
        hint="Encuadra el rostro del visitante para registrarlo en la bitácora."
        facingMode="environment"
      />
    </div>
  )
}

// wrapper de campo del formulario con label en uppercase arriba
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  )
}

// sección lateral del registro con título en uppercase
function SidePanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {title}
      </div>
      {children}
    </div>
  )
}

interface AccesoOptionProps {
  icon: React.ReactNode
  label: string
  active: boolean
  onClick: () => void
}

// botón de opción para elegir tipo de acceso (vehicular o peatonal)
function AccesoOption({ icon, label, active, onClick }: AccesoOptionProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-bold transition-all",
        active
          ? "border-orange-500 bg-orange-50 text-orange-700"
          : "border-transparent bg-slate-50 text-muted-foreground hover:bg-slate-100"
      )}
    >
      {icon}
      {label}
    </button>
  )
}
