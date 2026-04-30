import type { ReactNode } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface Props {
  label: string
  value: ReactNode
  icon: ReactNode
  trend?: { value: string; tone: "up" | "down" | "warning" }
  subtitle?: ReactNode
  accent?: "primary" | "success" | "danger" | "warning"
  className?: string
}

const accentStyles: Record<NonNullable<Props["accent"]>, string> = {
  primary: "bg-orange-50 text-orange-600",
  success: "bg-emerald-50 text-emerald-600",
  danger: "bg-red-50 text-red-600",
  warning: "bg-amber-50 text-amber-600",
}

const trendStyles: Record<NonNullable<Props["trend"]>["tone"], string> = {
  up: "text-emerald-600 bg-emerald-50",
  down: "text-slate-500 bg-slate-100",
  warning: "text-red-600 bg-red-50",
}

// tarjeta de KPI con icono, valor grande, label y badge de tendencia
export function KpiCard({
  label,
  value,
  icon,
  trend,
  subtitle,
  accent = "primary",
  className,
}: Props) {
  return (
    <Card className={cn("gap-3 py-5", className)}>
      <CardContent className="px-5">
        <div className="flex items-start justify-between">
          <span className={cn("flex size-9 items-center justify-center rounded-lg", accentStyles[accent])}>
            {icon}
          </span>
          {trend && (
            <span
              className={cn(
                "rounded-md px-2 py-0.5 text-[11px] font-semibold",
                trendStyles[trend.tone]
              )}
            >
              {trend.value}
            </span>
          )}
        </div>
        <div className="mt-3 text-sm font-medium text-muted-foreground">{label}</div>
        <div className="mt-1 text-3xl font-black tabular-nums tracking-tight">{value}</div>
        {subtitle && <div className="mt-1 text-xs text-muted-foreground">{subtitle}</div>}
      </CardContent>
    </Card>
  )
}
