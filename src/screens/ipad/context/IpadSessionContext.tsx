import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import type { Officer, Turno } from "../types"
import { useAuth } from "@/lib/auth-store"
import { api } from "@/lib/api"

interface SessionValue {
  officer: Officer | null
  officers: Officer[]
  login(id: string, pin: string): Promise<boolean>
  logout(): Promise<void>
}

const Ctx = createContext<SessionValue | null>(null)

// provider de sesion del iPad que expone el oficial actual y la lista de oficiales
export function IpadSessionProvider({ children }: { children: ReactNode }) {
  const auth = useAuth()
  const [officers, setOfficers] = useState<Officer[]>([])

  // trae la lista de oficiales disponibles para el login con PIN
  useEffect(() => {
    void api
      .get<any[]>("/api/auth/oficiales")
      .then((items) => {
        setOfficers(
          items.map((o) => ({
            id: String(o.id ?? ""),
            nombre: o.nombre ?? "",
            turno: ((o.turno as Turno) ?? "Matutino") as Turno,
            avatar: o.avatar ?? "",
            pin: "",
          }))
        )
      })
      .catch(() => setOfficers([]))
  }, [])

  // mapea el user del auth-store al tipo Officer del iPad
  const officer: Officer | null = useMemo(() => {
    const u = auth.user
    if (!u || u.role !== "oficial") return null
    return {
      id: u.id,
      nombre: `${u.nombre} ${u.apellido}`,
      turno: ((u.profile as any)?.oficial?.turno ?? "Matutino") as Turno,
      avatar: u.avatar ?? "",
      pin: "",
    }
  }, [auth.user])

  // expone officer/officers y wrappers de login/logout para el iPad
  const value = useMemo<SessionValue>(
    () => ({
      officer,
      officers,
      async login(id, pin) {
        try {
          await auth.loginPin(id, pin)
          return true
        } catch {
          return false
        }
      },
      async logout() {
        await auth.logout()
      },
    }),
    [officer, officers, auth]
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
// hook para consumir el IpadSessionContext, lanza error si esta fuera del provider
export function useIpadSession(): SessionValue {
  const v = useContext(Ctx)
  if (!v) throw new Error("useIpadSession fuera de IpadSessionProvider")
  return v
}
