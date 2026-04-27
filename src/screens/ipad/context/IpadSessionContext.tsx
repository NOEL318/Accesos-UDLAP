import { createContext, useContext, useEffect, useMemo, useState } from "react"
import type { Officer } from "../types"
import { officersSeed } from "../data"

interface SessionValue {
  officer: Officer | null
  officers: Officer[]
  login(id: string, pin: string): boolean
  logout(): void
}

const Ctx = createContext<SessionValue | null>(null)

const STORAGE_KEY = "ipad-session-officer-id"

export function IpadSessionProvider({ children }: { children: React.ReactNode }) {
  const [officerId, setOfficerId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null
    return window.sessionStorage.getItem(STORAGE_KEY)
  })

  useEffect(() => {
    if (officerId) window.sessionStorage.setItem(STORAGE_KEY, officerId)
    else window.sessionStorage.removeItem(STORAGE_KEY)
  }, [officerId])

  const value = useMemo<SessionValue>(() => {
    const officer = officerId
      ? officersSeed.find((o) => o.id === officerId) ?? null
      : null
    return {
      officer,
      officers: officersSeed,
      login(id, pin) {
        const target = officersSeed.find((o) => o.id === id)
        if (!target || target.pin !== pin) return false
        setOfficerId(id)
        return true
      },
      logout() {
        setOfficerId(null)
      },
    }
  }, [officerId])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useIpadSession(): SessionValue {
  const v = useContext(Ctx)
  if (!v) throw new Error("useIpadSession fuera de IpadSessionProvider")
  return v
}
