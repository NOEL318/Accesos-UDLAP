import { Building2, Activity, AlertTriangle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { useColegiosData } from "./context/ColegiosDataContext"

interface Pin {
  edificioId: string
  x: number
  y: number
}

const pins: Pin[] = [
  { edificioId: "ed-cain", x: 25, y: 35 },
  { edificioId: "ed-ray", x: 65, y: 25 },
  { edificioId: "ed-bernal", x: 50, y: 60 },
  { edificioId: "ed-gaos", x: 80, y: 70 },
]

// pantalla con el mapa del campus y pins por edificio con sus alertas activas
export function MapaScreen() {
  const { edificios, alertas } = useColegiosData()

  const alertasPorEdificio = alertas.reduce<Record<string, number>>((acc, a) => {
    if (a.edificioId && a.estado === "activa")
      acc[a.edificioId] = (acc[a.edificioId] ?? 0) + 1
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-black tracking-tight">Mapa del Campus</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Vista geográfica de los colegios residenciales en tiempo real
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        {/* Mapa */}
        <Card className="overflow-hidden p-0 gap-0">
          <div
            className="relative h-[480px] w-full bg-gradient-to-br from-emerald-50 via-slate-50 to-orange-50"
            style={{
              backgroundImage:
                "linear-gradient(to right, rgba(0,0,0,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.04) 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }}
          >
            {/* Caminos */}
            <svg className="absolute inset-0 size-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <line x1="25" y1="35" x2="65" y2="25" stroke="rgba(15,23,42,0.08)" strokeWidth="0.6" />
              <line x1="25" y1="35" x2="50" y2="60" stroke="rgba(15,23,42,0.08)" strokeWidth="0.6" />
              <line x1="65" y1="25" x2="80" y2="70" stroke="rgba(15,23,42,0.08)" strokeWidth="0.6" />
              <line x1="50" y1="60" x2="80" y2="70" stroke="rgba(15,23,42,0.08)" strokeWidth="0.6" />
            </svg>

            {pins.map((p) => {
              const edif = edificios.find((e) => e.id === p.edificioId)
              if (!edif) return null
              const alertasN = alertasPorEdificio[p.edificioId] ?? 0
              return (
                <div
                  key={p.edificioId}
                  className="absolute -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${p.x}%`, top: `${p.y}%` }}
                >
                  {alertasN > 0 && (
                    <span className="absolute inset-0 -m-2 animate-ping rounded-full bg-red-400/40" />
                  )}
                  <div
                    className={cn(
                      "relative flex flex-col items-center gap-1 rounded-xl bg-white p-2 shadow-lg ring-1 transition-transform hover:scale-105",
                      alertasN > 0 ? "ring-red-200" : "ring-slate-200"
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-9 items-center justify-center rounded-lg",
                        alertasN > 0
                          ? "bg-red-100 text-red-600"
                          : "bg-orange-100 text-orange-600"
                      )}
                    >
                      <Building2 className="size-5" />
                    </span>
                    <div className="px-1 pb-0.5 text-center">
                      <div className="text-[10px] font-black leading-none">
                        {edif.nombre.replace("Edificio ", "").replace("Residencias ", "")}
                      </div>
                      <div className="mt-0.5 text-[9px] tabular-nums text-muted-foreground">
                        {edif.ocupacion}/{edif.capacidad}
                      </div>
                    </div>
                    {alertasN > 0 && (
                      <span className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">
                        {alertasN}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        {/* Panel lateral */}
        <div className="space-y-4">
          <Card className="p-0 gap-0">
            <div className="flex items-center gap-2 border-b border-border px-5 py-4">
              <Activity className="size-4 text-orange-600" />
              <h3 className="text-base font-bold">Estado en Tiempo Real</h3>
            </div>
            <CardContent className="space-y-3 px-5 py-5">
              <Stat
                label="Colegios activos"
                value={edificios.length}
                accent="emerald"
              />
              <Stat
                label="Alertas activas"
                value={Object.values(alertasPorEdificio).reduce((s, n) => s + n, 0)}
                accent="red"
              />
              <Stat
                label="Casetas operativas"
                value="4 / 4"
                accent="emerald"
              />
            </CardContent>
          </Card>

          <Card className="p-0 gap-0">
            <div className="flex items-center gap-2 border-b border-border px-5 py-4">
              <AlertTriangle className="size-4 text-amber-600" />
              <h3 className="text-base font-bold">Leyenda</h3>
            </div>
            <CardContent className="space-y-2 px-5 py-5 text-sm">
              <Legend color="bg-orange-500" label="Edificio normal" />
              <Legend color="bg-red-500" label="Con alertas activas" />
              <Legend color="bg-slate-300" label="Caseta de control" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

// fila con un label y un valor numérico coloreado según el accent
function Stat({
  label,
  value,
  accent,
}: {
  label: string
  value: React.ReactNode
  accent: "emerald" | "red" | "orange"
}) {
  const cls: Record<typeof accent, string> = {
    emerald: "text-emerald-600",
    red: "text-red-600",
    orange: "text-orange-600",
  }
  return (
    <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={cn("text-base font-black tabular-nums", cls[accent])}>{value}</span>
    </div>
  )
}

// item de la leyenda del mapa con un punto de color y su descripción
function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={cn("size-3 rounded-full", color)} />
      <span className="text-muted-foreground">{label}</span>
    </div>
  )
}
