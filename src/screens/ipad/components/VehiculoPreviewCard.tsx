import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { Vehiculo } from "../types"
import { StatusBadge } from "./StatusBadge"

// devuelve la etiqueta legible del tipo de propietario
function tipoLabel(tipo: Vehiculo["propietario"]["tipo"]): string {
  switch (tipo) {
    case "estudiante":
      return "Estudiante"
    case "empleado":
      return "Empleado"
    case "visita":
      return "Visitante"
    case "externo":
      return "Externo"
  }
}

interface Props {
  vehiculo: Vehiculo
  compact?: boolean
}

// card con la foto del propietario, placa y datos del vehiculo
export function VehiculoPreviewCard({ vehiculo, compact }: Props) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
      <div className="h-28 bg-gradient-to-br from-orange-100 to-orange-50" />
      <div className="p-4 -mt-10">
        <Avatar className="size-16 ring-4 ring-white">
          <AvatarImage src={vehiculo.foto} alt={vehiculo.propietario.nombre} />
          <AvatarFallback>{vehiculo.propietario.nombre[0]}</AvatarFallback>
        </Avatar>
        <div className="mt-3">
          <div className="text-base font-bold leading-tight">{vehiculo.propietario.nombre}</div>
          <div className="text-xs text-muted-foreground mt-0.5">
            ID {tipoLabel(vehiculo.propietario.tipo)}: {vehiculo.propietario.idUdlap}
          </div>
        </div>
        {!compact && (
          <div className="mt-4 space-y-2 text-sm">
            <Row label="PLACA" value={vehiculo.matricula} />
            <Row label="VEHÍCULO" value={`${vehiculo.modelo} · ${vehiculo.color}`} />
            <Row
              label="ESTATUS"
              value={
                <StatusBadge variant={vehiculo.sello.vigente ? "success" : "danger"} dot>
                  {vehiculo.sello.vigente ? "VIGENTE" : "VENCIDO"}
                </StatusBadge>
              }
            />
          </div>
        )}
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-t border-slate-100 pt-2">
      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <span className="text-sm font-semibold">{value}</span>
    </div>
  )
}
