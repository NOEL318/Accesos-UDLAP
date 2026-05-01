import { useMemo, useState } from "react"
import {
  AlertTriangle,
  Wine,
  Cigarette,
  Footprints,
  ShieldAlert,
  CheckCircle2,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { useColegiosData } from "./context/ColegiosDataContext"
import type { AlertaColegio, SeveridadAlerta } from "./types"
import { ApiError } from "@/lib/api"

const tipoMeta: Record<AlertaColegio["tipo"], { label: string; icon: LucideIcon }> = {
  ebriedad: { label: "Ebriedad", icon: Wine },
  items_prohibidos: { label: "Ítems prohibidos", icon: Cigarette },
  incidente: { label: "Incidente", icon: ShieldAlert },
  ronda: { label: "Ronda", icon: Footprints },
}

const severidadMeta: Record<SeveridadAlerta, { label: string; cls: string }> = {
  alta: { label: "Alta prioridad", cls: "bg-red-100 text-red-700" },
  media: { label: "Media", cls: "bg-amber-100 text-amber-700" },
  info: { label: "Informativa", cls: "bg-slate-100 text-slate-600" },
}

type Filter = "todas" | "activas" | "atendidas"

// pantalla con la lista de alertas e incidentes detectados en colegios residenciales
export function AlertasScreen() {
  const { alertas, edificios, atenderAlerta } = useColegiosData()
  const [filter, setFilter] = useState<Filter>("activas")
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // marca una alerta como atendida y maneja el estado de carga
  async function onAtender(id: string) {
    setBusyId(id)
    setError(null)
    try {
      await atenderAlerta(id)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "No se pudo atender la alerta")
    } finally {
      setBusyId(null)
    }
  }

  // filtra las alertas según el tab seleccionado (activas, atendidas o todas)
  const visibles = useMemo(() => {
    if (filter === "todas") return alertas
    return alertas.filter((a) => a.estado === (filter === "activas" ? "activa" : "atendida"))
  }, [alertas, filter])

  const activas = alertas.filter((a) => a.estado === "activa").length
  const criticas = alertas.filter((a) => a.severidad === "alta" && a.estado === "activa").length

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Alertas</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Incidentes activos y casos detectados en colegios residenciales
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-red-50 px-4 py-2.5 text-center">
            <div className="text-[10px] font-bold uppercase tracking-widest text-red-700">
              Críticas
            </div>
            <div className="text-2xl font-black tabular-nums text-red-600">{criticas}</div>
          </div>
          <div className="rounded-xl bg-orange-50 px-4 py-2.5 text-center">
            <div className="text-[10px] font-bold uppercase tracking-widest text-orange-700">
              Activas
            </div>
            <div className="text-2xl font-black tabular-nums text-orange-600">{activas}</div>
          </div>
        </div>
      </header>

      {/* Filtro */}
      <div className="inline-flex items-center rounded-xl bg-slate-100 p-1">
        {(["activas", "atendidas", "todas"] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "rounded-lg px-4 py-2 text-xs font-semibold capitalize transition-colors",
              filter === f
                ? "bg-orange-500 text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-3">
        {visibles.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-sm text-muted-foreground">
              Sin alertas para este filtro
            </CardContent>
          </Card>
        )}

        {visibles.map((a) => {
          const meta = tipoMeta[a.tipo]
          const Icon = meta.icon
          const sev = severidadMeta[a.severidad]
          const edificio = edificios.find((e) => e.id === a.edificioId)
          const date = new Date(a.timestamp)
          const horaStr = date.toLocaleTimeString("es-MX", {
            hour: "2-digit",
            minute: "2-digit",
          })
          const minsAgo = Math.round((Date.now() - date.getTime()) / 60000)

          return (
            <Card key={a.id} className="overflow-hidden p-0 gap-0">
              <CardContent className="flex flex-wrap items-start gap-4 px-5 py-5">
                <span
                  className={cn(
                    "flex size-11 shrink-0 items-center justify-center rounded-xl",
                    a.severidad === "alta"
                      ? "bg-red-100 text-red-600"
                      : a.severidad === "media"
                      ? "bg-amber-100 text-amber-600"
                      : "bg-slate-100 text-slate-600"
                  )}
                >
                  <Icon className="size-5" />
                </span>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-bold tracking-tight">{meta.label}</h3>
                    <span
                      className={cn(
                        "rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest",
                        sev.cls
                      )}
                    >
                      {sev.label}
                    </span>
                    {a.estado === "atendida" && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-emerald-700">
                        <CheckCircle2 className="size-3" />
                        Atendida
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{a.descripcion}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    {edificio && (
                      <span className="font-semibold">{edificio.nombre}</span>
                    )}
                    <span>·</span>
                    <span className="tabular-nums">
                      {horaStr} · hace {minsAgo} min
                    </span>
                  </div>
                </div>

                {a.estado === "activa" && (
                  <Button
                    size="sm"
                    onClick={() => onAtender(a.id)}
                    disabled={busyId === a.id}
                    className="shrink-0 gap-1.5 bg-slate-900 hover:bg-slate-800"
                  >
                    <AlertTriangle className="size-3.5" />
                    {busyId === a.id ? "Procesando…" : "Atender"}
                  </Button>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
