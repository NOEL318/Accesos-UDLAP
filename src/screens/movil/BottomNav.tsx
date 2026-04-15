import { Link, useLocation } from "react-router-dom"
import { Home, Users, CreditCard, Calendar, User } from "lucide-react"
import { cn } from "@/lib/utils"

const tabs = [
  { label: "Inicio", icon: Home, path: "/movil/dashboard" },
  { label: "Visitas", icon: Users, path: "/movil/visitas" },
  { label: "ID Digital", icon: CreditCard, path: "/movil/qr-nfc" },
  { label: "Horario", icon: Calendar, path: "/movil/horario" },
  { label: "Perfil", icon: User, path: "/movil/perfil" },
]

export function BottomNav() {
  const { pathname } = useLocation()

  return (
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[390px] bg-white z-50"
      style={{ borderTop: "1px solid #f0f0f0" }}
    >
      <div className="flex items-center justify-around h-[68px] px-2">
        {tabs.map(({ label, icon: Icon, path }) => {
          const active = pathname === path || (path !== "/movil/dashboard" && pathname.startsWith(path))
          return (
            <Link
              key={path}
              to={path}
              className="flex flex-col items-center gap-0.5 min-w-[56px] py-2 transition-colors duration-150"
            >
              <Icon
                className={cn("size-5 transition-colors duration-150", active ? "text-[#ea580c]" : "text-gray-400")}
                strokeWidth={active ? 2.2 : 1.8}
              />
              <span
                className={cn(
                  "text-[10px] font-semibold transition-colors duration-150",
                  active ? "text-[#ea580c]" : "text-gray-400"
                )}
              >
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
