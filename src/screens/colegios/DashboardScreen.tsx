import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import {
  Users,
  MapPin,
  LogOut,
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpFromLine,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { useColegiosData } from "./context/ColegiosDataContext"
import { KpiCard } from "./components/KpiCard"
import { SectionCard } from "./components/SectionCard"
import { EstadoMovimientoBadge } from "./components/EstadoBadge"

type MovFilter = "todos" | "entradas" | "salidas"

// pantalla del dashboard de colegios con KPIs, ocupación, alertas y movimientos
export function DashboardScreen() {
  const { edificios, residentes, movimientos, alertas } = useColegiosData()
  const [movFilter, setMovFilter] = useState<MovFilter>("todos")

  const total = residentes.length
  const enCampus = residentes.filter((r) => r.estado === "en_campus").length
  const fuera = residentes.filter((r) => r.estado !== "en_campus").length
  const alertasNocturnas = alertas.filter((a) => a.tipo === "ebriedad").length

  // filtra los movimientos según el tab (todos, entradas o salidas)
  const movsFiltrados = useMemo(() => {
    if (movFilter === "todos") return movimientos
    if (movFilter === "entradas") return movimientos.filter((m) => m.tipo === "entrada")
    return movimientos.filter((m) => m.tipo === "salida")
  }, [movFilter, movimientos])

  const residenteById = (id: string) => residentes.find((r) => r.id === id)
  const edificioById = (id: string) => edificios.find((e) => e.id === id)

  const ebriedadActiva = alertas.find((a) => a.tipo === "ebriedad" && a.estado === "activa")

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-black tracking-tight">Gestión de Residentes</h1>
      </header>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Total Residentes"
          value={total.toLocaleString("es-MX")}
          icon={<Users className="size-4" />}
          accent="primary"
          trend={{ value: "+2.5%", tone: "up" }}
        />
        <KpiCard
          label="En Campus"
          value={enCampus.toLocaleString("es-MX")}
          icon={<MapPin className="size-4" />}
          accent="success"
          trend={{ value: "69%", tone: "up" }}
        />
        <KpiCard
          label="Fuera de Campus"
          value={fuera.toLocaleString("es-MX")}
          icon={<LogOut className="size-4" />}
          accent="warning"
          trend={{ value: "31%", tone: "down" }}
        />
        <KpiCard
          label="Alertas Nocturnas"
          value={alertasNocturnas}
          icon={<AlertTriangle className="size-4" />}
          accent="danger"
          trend={{ value: "Alta Prioridad", tone: "warning" }}
          subtitle="Hoy"
        />
      </div>

      {/* Ocupación + Alertas circular */}
      <div className="grid gap-4 lg:grid-cols-3">
        <SectionCard
          className="lg:col-span-2"
          title="Ocupación por Edificio"
          action={
            <Select defaultValue="real">
              <SelectTrigger size="sm" className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="real">Tiempo Real</SelectItem>
                <SelectItem value="hoy">Hoy</SelectItem>
                <SelectItem value="semana">Esta Semana</SelectItem>
              </SelectContent>
            </Select>
          }
        >
          <div className="space-y-5">
            {edificios.map((e) => {
              const pct = (e.ocupacion / e.capacidad) * 100
              return (
                <div key={e.id}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold">{e.nombre}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {e.ocupacion} / {e.capacidad}
                    </span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-orange-100">
                    <div
                      className="h-full rounded-full bg-orange-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </SectionCard>

        <SectionCard title="Alertas de Estado">
          <div className="flex flex-col items-center text-center">
            <AlertasDonut value={alertasNocturnas} max={20} />
            <p className="mt-4 text-sm text-muted-foreground max-w-[220px]">
              {ebriedadActiva?.descripcion ?? "Sin alertas críticas activas"}
            </p>
            <Button asChild className="mt-5 w-full bg-slate-900 hover:bg-slate-800">
              <Link to="/colegios/alertas">Ver Protocolo de Acción</Link>
            </Button>
          </div>
        </SectionCard>
      </div>

      {/* Últimos movimientos */}
      <SectionCard
        title="Últimos Movimientos de Residentes"
        action={
          <div className="inline-flex items-center rounded-lg bg-slate-100 p-1">
            {(["todos", "entradas", "salidas"] as MovFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => setMovFilter(f)}
                className={cn(
                  "rounded-md px-3 py-1 text-xs font-semibold capitalize transition-colors",
                  movFilter === f
                    ? "bg-orange-500 text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {f}
              </button>
            ))}
          </div>
        }
        bodyClassName="px-0 py-0"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                <th className="px-5 py-3 text-left">Residente</th>
                <th className="px-5 py-3 text-left">Edificio</th>
                <th className="px-5 py-3 text-left">Hora</th>
                <th className="px-5 py-3 text-left">Tipo</th>
                <th className="px-5 py-3 text-left">Estado / Alerta</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {movsFiltrados.map((m) => {
                const r = residenteById(m.residenteId)
                const e = edificioById(m.edificioId)
                if (!r) return null
                const isAlerta = m.estado === "ebriedad"
                return (
                  <tr key={m.id} className="border-b border-border last:border-0">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="size-9">
                          <AvatarImage src={r.avatar} alt={r.nombre} />
                          <AvatarFallback>{r.nombre[0]}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="font-semibold leading-tight">{r.nombre}</div>
                          <div className="text-xs text-muted-foreground">ID: {r.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-foreground">
                      {e?.nombre.replace("Edificio ", "").replace("Residencias ", "") ?? "—"}
                    </td>
                    <td className="px-5 py-3 tabular-nums text-foreground">{m.hora}</td>
                    <td className="px-5 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 text-sm font-semibold",
                          m.tipo === "entrada" ? "text-emerald-600" : "text-slate-600"
                        )}
                      >
                        {m.tipo === "entrada" ? (
                          <ArrowDownToLine className="size-3.5" />
                        ) : (
                          <ArrowUpFromLine className="size-3.5" />
                        )}
                        {m.tipo === "entrada" ? "Entrada" : "Salida"}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <EstadoMovimientoBadge estado={m.estado} />
                    </td>
                    <td className="px-5 py-3 text-right">
                      {isAlerta && (
                        <span className="inline-flex size-6 items-center justify-center rounded-full bg-red-100 text-red-600">
                          <AlertTriangle className="size-3.5" />
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-border px-5 py-3 text-sm">
          <span className="text-muted-foreground">
            Mostrando últimos {movsFiltrados.length} movimientos
          </span>
          <Link
            to="/colegios/visitas/bitacora"
            className="font-semibold text-orange-600 hover:underline"
          >
            Ver registro completo
          </Link>
        </div>
      </SectionCard>
    </div>
  )
}

// gráfico tipo donut con el conteo de alertas críticas vs el máximo
function AlertasDonut({ value, max }: { value: number; max: number }) {
  const radius = 56
  const stroke = 10
  const circumference = 2 * Math.PI * radius
  const pct = Math.min(value / max, 1)
  const offset = circumference * (1 - pct)
  return (
    <div className="relative">
      <svg width={140} height={140}>
        <circle
          cx={70}
          cy={70}
          r={radius}
          stroke="rgb(255 237 213)"
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={70}
          cy={70}
          r={radius}
          stroke="rgb(234 88 12)"
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 70 70)"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-black tabular-nums text-orange-600">{value}</span>
        <span className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Positivos
        </span>
      </div>
    </div>
  )
}
