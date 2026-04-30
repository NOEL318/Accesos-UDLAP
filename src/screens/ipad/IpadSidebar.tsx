import { Link, useLocation, useNavigate } from "react-router-dom"
import {
  LayoutDashboard,
  DoorOpen,
  LogOut as LogOutIcon,
  Car,
  History,
  Bell,
  ChevronRight,
  ShieldCheck,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { useIpadSession } from "./context/IpadSessionContext"
import { cn } from "@/lib/utils"

interface NavItem {
  label: string
  path?: string
  icon: LucideIcon
  children?: { label: string; path: string }[]
}

const nav: NavItem[] = [
  { label: "Dashboard", path: "/ipad/dashboard", icon: LayoutDashboard },
  {
    label: "Accesos",
    icon: DoorOpen,
    children: [
      { label: "Punto de Control", path: "/ipad/acceso" },
      { label: "Salidas", path: "/ipad/salidas" },
    ],
  },
  {
    label: "Vehículos",
    icon: Car,
    children: [
      { label: "Listado", path: "/ipad/vehiculos" },
      { label: "Multas", path: "/ipad/multas" },
    ],
  },
  { label: "Historial", path: "/ipad/historial", icon: History },
  { label: "Alertas", path: "/ipad/alertas", icon: Bell },
]

interface Props {
  mobileOpen: boolean
  setMobileOpen: (v: boolean) => void
}

// sidebar del iPad con version desktop fija y version mobile en sheet
export function IpadSidebar({ mobileOpen, setMobileOpen }: Props) {
  return (
    <>
      <aside className="hidden lg:flex lg:w-64 shrink-0 flex-col border-r border-border bg-white">
        <SidebarContent onNavigate={() => {}} />
      </aside>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetTitle className="sr-only">Navegación</SheetTitle>
          <SidebarContent onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>
    </>
  )
}

// contenido del sidebar con logo, navegacion y bloque de oficial/logout
function SidebarContent({ onNavigate }: { onNavigate: () => void }) {
  const { officer, logout } = useIpadSession()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  // cierra sesion del oficial y manda a la pantalla de login
  const handleLogout = async () => {
    onNavigate()
    await logout()
    navigate("/ipad/login", { replace: true })
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="flex size-10 items-center justify-center rounded-lg bg-orange-600">
          <ShieldCheck className="size-5 text-white" />
        </div>
        <div>
          <div className="text-sm font-black leading-none">UDLAP</div>
          <div className="text-[10px] font-bold tracking-wider text-orange-600 uppercase mt-0.5">
            Security Control
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 space-y-0.5">
        {nav.map((item) => {
          if (item.children) {
            const anyActive = item.children.some((c) => pathname.startsWith(c.path))
            return (
              <div key={item.label} className="mt-1">
                <div
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 text-xs font-bold uppercase tracking-wider",
                    anyActive ? "text-orange-600" : "text-muted-foreground"
                  )}
                >
                  <item.icon className="size-3.5" />
                  {item.label}
                </div>
                <div className="ml-2 border-l border-border pl-2 space-y-0.5">
                  {item.children.map((c) => {
                    const active = pathname === c.path
                    return (
                      <Link
                        key={c.path}
                        to={c.path}
                        onClick={onNavigate}
                        className={cn(
                          "flex items-center justify-between gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                          active
                            ? "bg-orange-600 text-white font-semibold"
                            : "text-foreground hover:bg-slate-50"
                        )}
                      >
                        <span>{c.label}</span>
                        {active && <ChevronRight className="size-3.5" />}
                      </Link>
                    )
                  })}
                </div>
              </div>
            )
          }
          const active = pathname === item.path
          return (
            <Link
              key={item.path}
              to={item.path!}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors",
                active
                  ? "bg-orange-600 text-white"
                  : "text-foreground hover:bg-slate-50"
              )}
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {officer && (
        <div className="border-t border-border p-3">
          <div className="flex items-center gap-3 rounded-lg p-2">
            <Avatar className="size-10">
              <AvatarImage src={officer.avatar} alt={officer.nombre} />
              <AvatarFallback>{officer.nombre.split(" ").slice(-1)[0]?.[0] ?? "O"}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold leading-none truncate">{officer.nombre}</div>
              <div className="text-xs text-muted-foreground mt-1">Turno {officer.turno}</div>
            </div>
          </div>
          <Button
            variant="outline"
            className="mt-2 w-full justify-start gap-2"
            onClick={handleLogout}
          >
            <LogOutIcon className="size-4" />
            Cerrar Sesión
          </Button>
        </div>
      )}
    </div>
  )
}
