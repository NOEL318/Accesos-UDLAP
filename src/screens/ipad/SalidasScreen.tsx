import { useState } from "react"
import {
  AlertTriangle,
  Camera,
  CarFront,
  Clock,
  Eye,
  FileWarning,
  LogOut as LogOutIcon,
  Radio,
  ShieldCheck,
  Siren,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { useIpadData } from "./context/IpadDataContext"
import { useIpadSession } from "./context/IpadSessionContext"
import { SectionCard } from "./components/SectionCard"
import { StatusBadge } from "./components/StatusBadge"
import type { Vehiculo } from "./types"

const motivoCopy: Record<NonNullable<Vehiculo["bloqueoSalida"]>["motivo"], { label: string; variant: "warning" | "danger" | "info" }> = {
  multa: { label: "Multa Pendiente", variant: "warning" },
  restriccion_academica: { label: "Restricción Académica", variant: "info" },
  incidente: { label: "Incidente Activo", variant: "danger" },
}

// pantalla de salidas bloqueadas con filtros por motivo y autorizacion especial
export function SalidasScreen() {
  const { vehiculos, autorizarSalida } = useIpadData()
  const { officer } = useIpadSession()
  const [filter, setFilter] = useState<"todos" | "multa" | "restriccion_academica" | "incidente">("todos")

  const bloqueados = vehiculos.filter((v) => v.bloqueoSalida)
  const filtrados = filter === "todos" ? bloqueados : bloqueados.filter((v) => v.bloqueoSalida?.motivo === filter)
  const destacado = bloqueados[0]

  // autoriza la salida especial de un vehiculo bloqueado
  function handleAutorizar(id: string) {
    if (!officer) return
    autorizarSalida(id, officer.id)
  }

  return (
    <div className="space-y-5 max-w-[1400px] mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Alertas de Salida y Restricciones</h1>
        <p className="text-sm text-muted-foreground">
          Control de vehículos bloqueados y autorización de salidas especiales
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
        {destacado && (
          <div className="rounded-2xl overflow-hidden border border-slate-200 bg-gradient-to-br from-slate-900 to-slate-800 text-white">
            <div className="relative h-56 bg-[linear-gradient(135deg,#1e293b,#0f172a)] flex items-center justify-center">
              <div className="absolute inset-0 opacity-20">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(234,88,12,0.4),transparent_55%)]" />
              </div>
              <CarFront className="size-24 text-white/15" />
              <div className="absolute top-4 left-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur">
                <Camera className="size-3.5" /> Cámara Principal · Caseta 1
              </div>
              <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                <div>
                  <div className="text-xs font-bold uppercase tracking-widest text-orange-400">
                    Vehículo detenido
                  </div>
                  <div className="mt-1 rounded-lg bg-white text-slate-900 px-3 py-1.5 font-black text-lg font-mono inline-block">
                    {destacado.matricula}
                  </div>
                </div>
                <StatusBadge variant="danger" dot className="bg-red-500/90 border-red-400 text-white">
                  PROTOCOLO ACTIVO
                </StatusBadge>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <SectionCard
            title={<span className="text-orange-600">Estatus de Salida</span>}
            icon={<Siren className="size-4" />}
          >
            <div className="rounded-xl bg-orange-50 border border-orange-200 p-4 text-center">
              <div className="text-xs font-bold uppercase tracking-widest text-orange-700 mb-1">
                Protocolo Activo
              </div>
              <div className="text-2xl font-black text-orange-700">
                {bloqueados.length} Bloqueados
              </div>
            </div>
            <Button className="mt-3 w-full gap-2 bg-orange-600 hover:bg-orange-700">
              <ShieldCheck className="size-4" /> Autorizar Salida Especial
            </Button>
          </SectionCard>
        </div>
      </div>

      <SectionCard
        title="Salidas Bloqueadas"
        icon={<FileWarning className="size-4" />}
        action={
          <div className="flex gap-1">
            {(["todos", "multa", "restriccion_academica", "incidente"] as const).map((f) => (
              <Button
                key={f}
                variant={filter === f ? "default" : "ghost"}
                size="sm"
                className={filter === f ? "bg-orange-600 hover:bg-orange-700" : ""}
                onClick={() => setFilter(f)}
              >
                {f === "todos" ? "Todos" : motivoCopy[f].label}
              </Button>
            ))}
          </div>
        }
      >
        {filtrados.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">
            No hay salidas bloqueadas con ese filtro.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {filtrados.map((v) => {
              const m = v.bloqueoSalida!
              const info = motivoCopy[m.motivo]
              return (
                <div
                  key={v.id}
                  className="rounded-xl border border-slate-200 bg-white p-4"
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="size-12">
                      <AvatarImage src={v.foto} alt={v.propietario.nombre} />
                      <AvatarFallback>{v.propietario.nombre[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold leading-tight truncate">{v.propietario.nombre}</div>
                      <div className="font-mono text-sm font-semibold text-orange-600 mt-0.5">
                        {v.matricula}
                      </div>
                      <StatusBadge variant={info.variant} className="mt-1.5">{info.label}</StatusBadge>
                    </div>
                  </div>
                  <div className="mt-3 rounded-lg bg-slate-50 p-3 text-xs text-slate-700 border-l-4 border-orange-500">
                    {m.descripcion}
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1 gap-1.5">
                      <Eye className="size-3.5" /> Ver Protocolo
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 gap-1.5 bg-orange-600 hover:bg-orange-700"
                      onClick={() => handleAutorizar(v.id)}
                    >
                      <ShieldCheck className="size-3.5" /> Autorizar
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </SectionCard>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white border border-slate-200 px-5 py-3">
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Radio className="size-3.5 text-emerald-500" /> UDLAP Security · conectado
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="size-3.5" /> Turno en curso: {officer?.turno ?? "—"}
          </span>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5">
            <AlertTriangle className="size-3.5" /> Reporte de Turno
          </Button>
          <Button size="sm" className="gap-1.5 bg-orange-600 hover:bg-orange-700">
            <LogOutIcon className="size-3.5" /> Autorizar Salida Especial
          </Button>
        </div>
      </div>
    </div>
  )
}
