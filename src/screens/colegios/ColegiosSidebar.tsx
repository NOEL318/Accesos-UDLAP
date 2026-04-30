import { Link, useLocation, useNavigate } from "react-router-dom"
import {
  LayoutDashboard,
  Users,
  Building2,
  Bell,
  Map,
  UserPlus,
  ChevronRight,
  ShieldCheck,
  LogOut as LogOutIcon,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { useColegiosSession } from "./context/ColegiosSessionContext"
import { useAuth } from "@/lib/auth-store"
import { cn } from "@/lib/utils"

interface NavItem {
  label: string
  path?: string
  icon: LucideIcon
  children?: { label: string; path: string }[]
}

const nav: NavItem[] = [
  { label: "Dashboard", path: "/colegios/dashboard", icon: LayoutDashboard },
  { label: "Residentes", path: "/colegios/residentes", icon: Users },
  {
    label: "Visitas",
    icon: UserPlus,
    children: [
      { label: "Registrar Visita", path: "/colegios/visitas/registrar" },
      { label: "Verificación", path: "/colegios/visitas/verificacion" },
      { label: "Bitácora", path: "/colegios/visitas/bitacora" },
    ],
  },
  { label: "Edificios", path: "/colegios/edificios", icon: Building2 },
  { label: "Alertas", path: "/colegios/alertas", icon: Bell },
  { label: "Mapa Campus", path: "/colegios/mapa", icon: Map },
]

interface Props {
  mobileOpen: boolean
  setMobileOpen: (v: boolean) => void
}

// sidebar del módulo colegios con versión desktop fija y versión móvil en sheet
export function ColegiosSidebar({ mobileOpen, setMobileOpen }: Props) {
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

// contenido interno del sidebar con logo, items de navegación y botón de logout
function SidebarContent({ onNavigate }: { onNavigate: () => void }) {
  const { officer } = useColegiosSession()
  const { pathname } = useLocation()
  const { logout } = useAuth()
  const navigate = useNavigate()
  // cierra el sheet móvil, hace logout y manda al login de colegios
  const onLogout = async () => {
    onNavigate()
    await logout()
    navigate("/colegios/login", { replace: true })
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="flex size-10 items-center justify-center rounded-lg bg-orange-600">
          <ShieldCheck className="size-5 text-white" />
        </div>
        <div>
          <div className="text-base font-black leading-none text-orange-600">UDLAP</div>
          <div className="text-base font-black leading-none text-orange-600 mt-0.5">
            Colegios
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
                    const active = pathname === c.path || pathname.startsWith(c.path + "/")
                    return (
                      <Link
                        key={c.path}
                        to={c.path}
                        onClick={onNavigate}
                        className={cn(
                          "flex items-center justify-between gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                          active
                            ? "bg-orange-600 text-white font-semibold"
                            : "text-foreground hover:bg-orange-50"
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
                  ? "bg-orange-100 text-orange-700"
                  : "text-foreground hover:bg-orange-50"
              )}
            >
              <item.icon className={cn("size-4", active && "text-orange-600")} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-border p-3">
        <div className="flex items-center gap-3 rounded-lg p-2">
          <Avatar className="size-10">
            <AvatarImage src={officer.avatar} alt={officer.nombre} />
            <AvatarFallback>
              {officer.nombre.split(" ").slice(-1)[0]?.[0] ?? "O"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold leading-none truncate">{officer.nombre}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {officer.gate ?? `Turno ${officer.turno}`}
            </div>
          </div>
        </div>
        <Button
          variant="outline"
          className="mt-2 w-full justify-start gap-2"
          aria-label="Cerrar sesión"
          onClick={onLogout}
        >
          <LogOutIcon className="size-4" />
          Cerrar Sesión
        </Button>
      </div>
    </div>
  )
}

