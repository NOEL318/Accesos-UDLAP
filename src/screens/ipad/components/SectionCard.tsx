import type { ReactNode } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface Props {
  title?: ReactNode
  icon?: ReactNode
  action?: ReactNode
  children: ReactNode
  className?: string
  contentClassName?: string
}

// card contenedora con titulo, icono y accion opcional para secciones del iPad
export function SectionCard({ title, icon, action, children, className, contentClassName }: Props) {
  return (
    <Card className={cn("gap-4", className)}>
      {(title || action) && (
        <CardHeader className="flex items-center justify-between gap-2 px-5 pt-5 pb-0">
          <div className="flex items-center gap-2">
            {icon && <span className="text-orange-600">{icon}</span>}
            {title && <h3 className="text-lg font-bold tracking-tight">{title}</h3>}
          </div>
          {action}
        </CardHeader>
      )}
      <CardContent className={cn("px-5 pb-5", contentClassName)}>{children}</CardContent>
    </Card>
  )
}
