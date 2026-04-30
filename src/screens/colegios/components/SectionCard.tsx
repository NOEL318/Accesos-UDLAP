import type { ReactNode } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface Props {
  title: ReactNode
  action?: ReactNode
  children: ReactNode
  className?: string
  bodyClassName?: string
}

// card con header (título y acción opcional) y cuerpo para secciones del dashboard
export function SectionCard({ title, action, children, className, bodyClassName }: Props) {
  return (
    <Card className={cn("gap-0 py-0 overflow-hidden", className)}>
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <h3 className="text-base font-bold tracking-tight">{title}</h3>
        {action}
      </div>
      <CardContent className={cn("px-5 py-5", bodyClassName)}>{children}</CardContent>
    </Card>
  )
}
