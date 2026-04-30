import { cn } from "@/lib/utils"
import type { EstadoMovimiento, EstadoResidente } from "../types"

const movimientoMap: Record<EstadoMovimiento, { label: string; cls: string }> = {
  normal: { label: "Normal", cls: "bg-emerald-100 text-emerald-700" },
  ebriedad: { label: "Ebriedad detectada", cls: "bg-red-100 text-red-700" },
  autorizada: { label: "Autorizada", cls: "bg-slate-100 text-slate-600" },
  alerta: { label: "Alerta", cls: "bg-amber-100 text-amber-700" },
}

const residenteMap: Record<EstadoResidente, { label: string; dot: string; bg: string }> = {
  en_campus: { label: "En Campus", dot: "bg-emerald-500", bg: "bg-emerald-50 text-emerald-700" },
  fuera: { label: "Fuera", dot: "bg-slate-400", bg: "bg-slate-100 text-slate-600" },
  invitado: { label: "Invitado", dot: "bg-orange-500", bg: "bg-orange-50 text-orange-700" },
}

// badge con el estado de un movimiento (normal, ebriedad, autorizada, alerta)
export function EstadoMovimientoBadge({ estado }: { estado: EstadoMovimiento }) {
  const { label, cls } = movimientoMap[estado]
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
        cls
      )}
    >
      {label}
    </span>
  )
}

// badge con el estado del residente (en campus, fuera o invitado)
export function EstadoResidenteBadge({ estado }: { estado: EstadoResidente }) {
  const { label, dot, bg } = residenteMap[estado]
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        bg
      )}
    >
      <span className={cn("size-1.5 rounded-full", dot)} />
      {label}
    </span>
  )
}
