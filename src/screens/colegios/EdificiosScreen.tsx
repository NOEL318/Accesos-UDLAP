import { Link } from "react-router-dom"
import { Building2, Users, ArrowRight, Activity } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { useColegiosData } from "./context/ColegiosDataContext"

// pantalla con la ocupación y estado de cada edificio residencial
export function EdificiosScreen() {
  const { edificios, residentes } = useColegiosData()

  const totalCapacidad = edificios.reduce((s, e) => s + e.capacidad, 0)
  const totalOcupacion = edificios.reduce((s, e) => s + e.ocupacion, 0)
  const ocupacionGlobal = Math.round((totalOcupacion / totalCapacidad) * 100)

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Edificios</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Ocupación y estado de los colegios residenciales
          </p>
        </div>
        <div className="rounded-xl bg-orange-50 px-4 py-3 text-right">
          <div className="text-[10px] font-bold uppercase tracking-widest text-orange-700">
            Ocupación Global
          </div>
          <div className="text-2xl font-black tabular-nums text-orange-600">
            {ocupacionGlobal}%
          </div>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {edificios.map((e) => {
          const pct = (e.ocupacion / e.capacidad) * 100
          const enEdificio = residentes.filter((r) =>
            e.nombre.includes(r.edificio)
          ).length
          const lleno = pct >= 90
          return (
            <Card key={e.id} className="overflow-hidden p-0 gap-0">
              <CardContent className="px-6 py-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex size-12 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
                      <Building2 className="size-6" />
                    </span>
                    <div>
                      <h3 className="text-lg font-black tracking-tight">{e.nombre}</h3>
                      <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Users className="size-3.5" />
                        {enEdificio} residentes registrados
                      </div>
                    </div>
                  </div>
                  <span
                    className={cn(
                      "rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-widest",
                      lleno
                        ? "bg-red-100 text-red-700"
                        : pct >= 70
                        ? "bg-amber-100 text-amber-700"
                        : "bg-emerald-100 text-emerald-700"
                    )}
                  >
                    {lleno ? "Saturado" : pct >= 70 ? "Alto" : "Disponible"}
                  </span>
                </div>

                <div className="mt-5 flex items-end justify-between">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Ocupación actual
                    </div>
                    <div className="mt-0.5 text-3xl font-black tabular-nums">
                      {e.ocupacion} <span className="text-base text-muted-foreground">/ {e.capacidad}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Porcentaje
                    </div>
                    <div className="mt-0.5 text-2xl font-black text-orange-600 tabular-nums">
                      {Math.round(pct)}%
                    </div>
                  </div>
                </div>

                <div className="mt-3 h-2 overflow-hidden rounded-full bg-orange-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-orange-400 to-orange-600"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </CardContent>
              <Link
                to="/colegios/residentes"
                className="flex items-center justify-between border-t border-border bg-slate-50 px-6 py-3 text-xs font-bold text-orange-600 transition-colors hover:bg-orange-50"
              >
                <span className="inline-flex items-center gap-1.5">
                  <Activity className="size-3.5" />
                  Ver residentes del edificio
                </span>
                <ArrowRight className="size-3.5" />
              </Link>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
