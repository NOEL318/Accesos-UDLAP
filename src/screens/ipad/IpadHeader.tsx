import { Bell, Menu, Search } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useIpadSession } from "./context/IpadSessionContext"

interface Props {
  onMenuClick: () => void
  searchPlaceholder?: string
}

// header superior del iPad con buscador, hora actual y datos del oficial logueado
export function IpadHeader({ onMenuClick, searchPlaceholder = "Buscar vehículo, oficial o reporte..." }: Props) {
  const { officer } = useIpadSession()
  const now = new Date()
  const hora = now.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })
  const fecha = now.toLocaleDateString("es-MX", { month: "short", day: "2-digit", year: "numeric" }).toUpperCase()

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-white/90 backdrop-blur">
      <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          aria-label="Abrir menú"
          onClick={onMenuClick}
        >
          <Menu className="size-5" />
        </Button>

        <div className="relative flex-1 max-w-xl">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            className="h-10 rounded-full bg-slate-50 border-slate-200 pl-9"
          />
        </div>

        <Button variant="ghost" size="icon" className="hidden sm:inline-flex" aria-label="Notificaciones">
          <Bell className="size-5" />
        </Button>

        <div className="hidden md:block text-right">
          <div className="text-sm font-semibold leading-none">{hora}</div>
          <div className="text-xs text-muted-foreground mt-0.5">{fecha}</div>
        </div>

        {officer && (
          <div className="flex items-center gap-3 pl-2 border-l border-border">
            <div className="hidden sm:block text-right">
              <div className="text-sm font-semibold leading-none">{officer.nombre}</div>
              <div className="text-xs text-orange-600 mt-0.5">Turno {officer.turno}</div>
            </div>
            <Avatar className="size-9">
              <AvatarImage src={officer.avatar} alt={officer.nombre} />
              <AvatarFallback>{officer.nombre.split(" ").slice(-1)[0]?.[0] ?? "O"}</AvatarFallback>
            </Avatar>
          </div>
        )}
      </div>
    </header>
  )
}
