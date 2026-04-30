import { createContext, useContext, useMemo, type ReactNode } from "react"
import type { Officer } from "../types"
import { useAuth } from "@/lib/auth-store"

interface SessionValue {
  officer: Officer
  officers: Officer[]
  setOfficer(id: string): void
}

const Ctx = createContext<SessionValue | null>(null)

const FALLBACK_OFFICER: Officer = {
  id: "OF-COL-FALLBACK",
  nombre: "Operador Colegios",
  turno: "Nocturno",
  avatar: "",
  gate: "Caseta Principal",
}

// provider con la sesión del oficial logueado en el módulo colegios
export function ColegiosSessionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()

  // arma el oficial actual a partir del usuario autenticado o usa fallback
  const officer: Officer = useMemo(() => {
    if (!user) return FALLBACK_OFFICER
    return {
      id: user.id,
      nombre: `${user.nombre} ${user.apellido}`,
      turno: "Nocturno",
      avatar: user.avatar ? user.avatar : "",
      gate: "Caseta Principal",
    }
  }, [user])

  // arma el value del contexto con el oficial y un setter no-op (solo hay uno)
  const value = useMemo<SessionValue>(
    () => ({
      officer,
      officers: [officer],
      setOfficer: () => {
        /* no-op: solo hay uno */
      },
    }),
    [officer]
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

// hook para acceder a la sesión actual del oficial de colegios
// eslint-disable-next-line react-refresh/only-export-components
export function useColegiosSession(): SessionValue {
  const v = useContext(Ctx)
  if (!v) throw new Error("useColegiosSession fuera de ColegiosSessionProvider")
  return v
}
