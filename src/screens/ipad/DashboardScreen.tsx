import { useNavigate } from "react-router-dom"
import {
  AlertCircle,
  Car,
  ChevronRight,
  DoorOpen,
  FileText,
  LogIn,
  MoonStar,
  Radio,
  ShieldAlert,
  TrendingUp,
  Zap,
  UserPlus,
  HelpCircle,
  Check,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { KpiCard } from "./components/KpiCard"
import { SectionCard } from "./components/SectionCard"
import { StatusBadge } from "./components/StatusBadge"
import { PuntoControlCard } from "./components/PuntoControlCard"
import { ActivityFeedItem } from "./components/ActivityFeedItem"
import { FlujoBarChart } from "./components/FlujoBarChart"
import { useIpadData } from "./context/IpadDataContext"
import { flujo24hSeed } from "./data"

// pantalla principal del iPad de seguridad con KPIs, puntos de control, flujo y feed
export function DashboardScreen() {
  const navigate = useNavigate()
  const { kpis, puntosControl, alertas, eventos, vehiculos } = useIpadData()

  const recent = [
    ...alertas.slice(0, 2).map((a) => ({
      kind: "alerta" as const,
      id: a.id,
      tipo: a.tipo,
      severidad: a.severidad,
      descripcion: a.descripcion,
      timestamp: a.timestamp,
    })),
    ...eventos.slice(0, 2).map((e) => {
      const v = vehiculos.find((x) => x.id === e.vehiculoId)
      return {
        kind: "evento" as const,
        id: e.id,
        resultado: e.resultado,
        descripcion: `${e.resultado === "permitido" ? "Ingreso" : "Denegado"}: ${v?.matricula ?? "—"}`,
        subtitle: `${e.resultado === "permitido" ? "Match: Registro" : e.motivo ?? ""} · ${v?.propietario.tipo ?? ""}`,
        timestamp: e.timestamp,
      }
    }),
  ]
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, 4)

  // formatea un ISO a hora corta en es-MX
  function fmtTime(iso: string) {
    return new Date(iso).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })
  }

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          label="Entradas Hoy"
          value={kpis.entradasHoy.toLocaleString()}
          icon={<LogIn className="size-4" />}
          accent="primary"
          subtitle={
            <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
              <TrendingUp className="size-3" /> +{kpis.deltaEntradas}% vs ayer
            </span>
          }
        />
        <KpiCard
          label="Incidentes Activos"
          value={String(kpis.incidentesActivos).padStart(2, "0")}
          icon={<ShieldAlert className="size-4" />}
          accent="danger"
          subtitle={`${kpis.incidentesModerados} Moderado${kpis.incidentesModerados === 1 ? "" : "s"}, ${kpis.incidentesCriticos} Crítico${kpis.incidentesCriticos === 1 ? "" : "s"}`}
        />
        <KpiCard
          label="Vehículos en Campus"
          value={kpis.vehiculosEnCampus.toLocaleString()}
          icon={<Car className="size-4" />}
          accent="info"
          subtitle={`Capacidad al ${kpis.capacidadPct}%`}
        />
        <KpiCard
          label="Visitas Nocturnas"
          value={String(kpis.visitasNocturnas).padStart(2, "0")}
          icon={<MoonStar className="size-4" />}
          accent="warning"
          subtitle={
            <span className="text-amber-600 font-bold uppercase tracking-wider text-[10px]">
              Pendientes de check-out
            </span>
          }
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 space-y-4">
          <SectionCard
            title="Puntos de Control"
            icon={<DoorOpen className="size-4" />}
            action={
              <Button variant="link" className="text-orange-600 h-auto p-0" onClick={() => navigate("/ipad/acceso")}>
                Ver Mapa Completo
              </Button>
            }
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {puntosControl.map((p) => (
                <PuntoControlCard key={p.id} punto={p} onClick={() => navigate("/ipad/acceso")} />
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Flujo Vehicular (24h)" icon={<Radio className="size-4" />}>
            <FlujoBarChart data={flujo24hSeed} />
          </SectionCard>
        </div>

        <div className="space-y-4">
          <SectionCard title="Acciones Rápidas" icon={<Zap className="size-4" />}>
            <div className="space-y-2">
              <Button
                className="w-full justify-between bg-orange-600 hover:bg-orange-700"
                onClick={() => navigate("/ipad/multas")}
              >
                <span className="inline-flex items-center gap-2">
                  <FileText className="size-4" /> Nuevo Reporte
                </span>
                <ChevronRight className="size-4" />
              </Button>
              <Button
                variant="outline"
                className="w-full justify-between border-orange-300 text-orange-700 hover:bg-orange-50"
                onClick={() => alert("Alerta general activada (demo)")}
              >
                <span className="inline-flex items-center gap-2">
                  <AlertCircle className="size-4" /> Activar Alerta General
                </span>
                <ChevronRight className="size-4" />
              </Button>
              <Button
                variant="outline"
                className="w-full justify-between"
                onClick={() => alert("Contactando soporte (demo)")}
              >
                <span className="inline-flex items-center gap-2">
                  <HelpCircle className="size-4" /> Contactar Soporte
                </span>
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </SectionCard>

          <SectionCard title="Actividad Reciente" icon={<Radio className="size-4" />}>
            <div className="divide-y divide-border">
              {recent.map((r) =>
                r.kind === "evento" ? (
                  <ActivityFeedItem
                    key={r.id}
                    icon={<Car className="size-4" />}
                    title={r.descripcion}
                    subtitle={r.subtitle}
                    timestamp={fmtTime(r.timestamp)}
                    color={r.resultado === "permitido" ? "info" : "warning"}
                  />
                ) : (
                  <ActivityFeedItem
                    key={r.id}
                    icon={r.tipo === "incidente" ? <AlertCircle className="size-4" /> : r.tipo === "ronda" ? <Check className="size-4" /> : <UserPlus className="size-4" />}
                    title={r.descripcion}
                    timestamp={fmtTime(r.timestamp)}
                    color={r.severidad === "critica" ? "warning" : r.severidad === "moderada" ? "warning" : r.tipo === "ronda" ? "success" : "primary"}
                    tag={
                      r.severidad === "critica" ? (
                        <StatusBadge variant="danger">PENDIENTE</StatusBadge>
                      ) : r.severidad === "moderada" ? (
                        <StatusBadge variant="warning">PENDIENTE</StatusBadge>
                      ) : null
                    }
                  />
                )
              )}
            </div>
            <Button
              variant="link"
              className="mt-3 w-full text-orange-600"
              onClick={() => navigate("/ipad/historial")}
            >
              Ver Todo el Historial
            </Button>
          </SectionCard>
        </div>
      </div>
    </div>
  )
}
