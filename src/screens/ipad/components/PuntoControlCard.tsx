import { DoorClosed, Home } from "lucide-react"
import type { Punto } from "../types"
import { officersSeed } from "../data"
import { StatusBadge } from "./StatusBadge"

interface Props {
  punto: Punto
  onClick?: () => void
}

export function PuntoControlCard({ punto, onClick }: Props) {
  const isResidencial = punto.tipo === "residencial"
  const Icon = isResidencial ? Home : DoorClosed
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 text-left transition-all hover:border-orange-500 hover:shadow-md"
    >
      <span
        className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${
          punto.estado === "activa" ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"
        }`}
      >
        <Icon className="size-5" />
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <span className="text-sm font-bold leading-tight">{punto.nombre}</span>
          <StatusBadge
            variant={punto.estado === "activa" ? "success" : "neutral"}
            dot
          >
            {punto.estado === "activa" ? "ACTIVA" : "STANDBY"}
          </StatusBadge>
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          {isResidencial
            ? "Acceso Automatizado"
            : punto.estado === "activa"
            ? `Operada por: ${officersSeed.find((o) => o.id === punto.oficialOperadorId)?.nombre ?? "Oficial asignado"}`
            : "Apertura programada: 16:00"}
        </div>
      </div>
    </button>
  )
}
