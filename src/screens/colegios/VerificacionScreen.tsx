import { useMemo, useState } from "react"
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
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import { useColegiosData } from "./context/ColegiosDataContext"
import { useColegiosSession } from "./context/ColegiosSessionContext"

// pantalla de verificación e inspección del visitante antes de permitir acceso
export function VerificacionScreen() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { residentes, edificios } = useColegiosData()
  const { officer } = useColegiosSession()

  const [ebriedad, setEbriedad] = useState(false)
  const [items, setItems] = useState(true)
  const [decision, setDecision] = useState<"pendiente" | "permitido" | "denegado">(
    "pendiente"
  )

  // busca el residente por id de la URL o cae a uno de demo si no existe
  const visitante = useMemo(() => {
    return residentes.find((r) => r.id === id) ?? residentes[7] // Juan Pablo
  }, [id, residentes])

  const colegioEntrada = edificios[0]
  const fecha = new Date()
  const fechaStr = fecha
    .toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" })
    .replace(",", "")
  const horaStr = fecha.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })

  // marca acceso como permitido y navega a la pantalla de éxito
  function permitir() {
    setDecision("permitido")
    setTimeout(() => navigate("/colegios/visitas/exitoso"), 600)
  }
  // marca acceso como denegado y muestra mensaje de denegación
  function denegar() {
    setDecision("denegado")
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

      {/* Tarjeta principal del visitante */}
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
                Student
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              ID: {visitante.id} · Access Credential Active
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Field label="Carrera" value={visitante.carrera} />
              <Field label="Semestre" value={`${visitante.semestre}° Semestre`} />
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                <CheckCircle2 className="size-3.5" />
                Exa-UDLAP Active
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                <ShieldCheck className="size-3.5" />
                Last Check: 5d 3h 20s
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inspección + Mapa */}
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
              subtitle="Si el estudiante tiene artículos prohibidos (vape, alcohol, u otro)"
              checked={items}
              onChange={setItems}
              activeAccent="emerald"
            />
          </div>
        </Card>

        <Card className="p-0 gap-0">
          <div className="border-b border-border px-5 py-4">
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Colegio de entrada
            </div>
            <div className="mt-1 flex items-center gap-2 text-base font-bold">
              <MapPin className="size-4 text-orange-600" />
              {colegioEntrada.nombre.replace("Edificio ", "")}
            </div>
          </div>
          <div className="relative h-44 bg-gradient-to-br from-slate-100 to-slate-200">
            <div className="absolute inset-0 opacity-50"
              style={{
                backgroundImage:
                  "linear-gradient(to right, rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.05) 1px, transparent 1px)",
                backgroundSize: "20px 20px",
              }}
            />
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <span className="relative flex size-8 items-center justify-center">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-orange-400 opacity-60" />
                <span className="relative inline-flex size-4 rounded-full bg-orange-600" />
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 border-t border-border px-5 py-3 text-xs">
            <Camera className="size-3.5 text-emerald-600" />
            <span className="font-semibold">Cámara: Activa</span>
          </div>
        </Card>
      </div>

      {/* Acciones */}
      <div className="grid gap-3 sm:grid-cols-2">
        <Button
          size="lg"
          onClick={permitir}
          disabled={decision === "denegado"}
          className={cn(
            "h-14 gap-2 text-base font-bold",
            decision === "permitido"
              ? "bg-emerald-700 hover:bg-emerald-700"
              : "bg-emerald-600 hover:bg-emerald-700"
          )}
        >
          <CheckCircle2 className="size-5" />
          Permitir Acceso
        </Button>
        <Button
          size="lg"
          variant="outline"
          onClick={denegar}
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
          Acceso denegado por <strong>{officer.nombre}</strong>. El visitante ha sido
          notificado y se registró el evento en bitácora.
        </div>
      )}
    </div>
  )
}

// celda de información del visitante con label y valor
function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 px-4 py-3">
      <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-sm font-bold">{value}</div>
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
