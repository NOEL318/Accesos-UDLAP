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
