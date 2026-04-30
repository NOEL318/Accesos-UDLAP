import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

type Color = "info" | "warning" | "success" | "primary"

interface Props {
  icon: ReactNode
  title: ReactNode
  subtitle?: ReactNode
  timestamp?: string
  tag?: ReactNode
  color?: Color
  children?: ReactNode
}

const colors: Record<Color, string> = {
  info: "bg-blue-50 text-blue-600",
  warning: "bg-amber-50 text-amber-600",
  success: "bg-emerald-50 text-emerald-600",
  primary: "bg-orange-50 text-orange-600",
}

// item del feed de actividad con icono coloreado, titulo, subtitulo y timestamp
export function ActivityFeedItem({ icon, title, subtitle, timestamp, tag, color = "info", children }: Props) {
  return (
    <div className="flex gap-3 py-3">
      <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-full", colors[color])}>
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <span className="text-sm font-semibold text-foreground truncate">{title}</span>
          {timestamp && <span className="text-xs text-muted-foreground shrink-0">{timestamp}</span>}
        </div>
        {subtitle && <div className="mt-0.5 text-xs text-muted-foreground">{subtitle}</div>}
        {tag && <div className="mt-1">{tag}</div>}
        {children}
      </div>
    </div>
  )
}
