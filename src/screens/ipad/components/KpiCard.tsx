import type { ReactNode } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface Props {
  label: string
  value: ReactNode
  icon?: ReactNode
  accent?: "primary" | "danger" | "warning" | "info" | "success"
  subtitle?: ReactNode
  className?: string
}

const accentBg: Record<NonNullable<Props["accent"]>, string> = {
  primary: "bg-orange-50 text-orange-600",
  danger: "bg-red-50 text-red-600",
  warning: "bg-amber-50 text-amber-600",
  info: "bg-blue-50 text-blue-600",
  success: "bg-emerald-50 text-emerald-600",
}

// tarjeta de KPI con etiqueta, valor grande, icono y subtitulo opcional
export function KpiCard({ label, value, icon, accent = "primary", subtitle, className }: Props) {
  return (
    <Card className={cn("gap-3 py-5", className)}>
      <CardContent className="px-5">
        <div className="flex items-start justify-between">
          <span className="text-sm font-medium text-muted-foreground">{label}</span>
          {icon && (
            <span className={cn("flex size-9 items-center justify-center rounded-lg", accentBg[accent])}>
              {icon}
            </span>
          )}
        </div>
        <div className="mt-2 text-4xl font-black tabular-nums tracking-tight">{value}</div>
        {subtitle && <div className="mt-1 text-xs text-muted-foreground">{subtitle}</div>}
      </CardContent>
    </Card>
  )
}
