import type { LucideIcon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface Props {
  title: string
  subtitle?: string
  description: string
  Icon: LucideIcon
  mockup: string
}

// placeholder visual para pantallas que aún no se implementan
export function ScreenPlaceholder({ title, subtitle, description, Icon, mockup }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight">{title}</h1>
        {subtitle && (
          <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
        )}
      </div>

      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
          <div className="flex size-14 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
            <Icon className="size-7" />
          </div>
          <div>
            <div className="text-base font-bold">Pantalla pendiente de implementar</div>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">{description}</p>
          </div>
          <div className="text-[10px] uppercase tracking-widest font-bold text-orange-600">
            Mockup base · {mockup}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
