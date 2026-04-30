import { useCallback, useEffect, useState } from "react"
import { api } from "@/lib/api"
import { useAuth } from "@/lib/auth-store"

export interface MenuItem {
  _id: string
  nombre: string
  precio: number
  descripcion?: string
  categoria: "principal" | "economico" | "vegano"
  icon?: string
}

// hook para administrar el menu del comedor, el saldo y crear ordenes
export function useComedor() {
  const { refresh: refreshAuth, user } = useAuth()
  const [menu, setMenu] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // pide el menu actualizado al backend
  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get<MenuItem[]>("/api/comedor/menu")
      setMenu(res)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error")
    } finally {
      setLoading(false)
    }
  }, [])

  // carga el menu al montar el hook
  useEffect(() => { void refresh() }, [refresh])

  // manda la orden al backend y refresca al usuario para que el saldo se actualice
  const ordenar = useCallback(
    async (items: { menuItemId: string; cantidad: number }[]) => {
      const result = await api.post<{ orden: any; saldoRestante: number }>(
        "/api/comedor/ordenes",
        { items }
      )
      // Refrescar el user para que el saldo en el header se actualice
      await refreshAuth()
      return result
    },
    [refreshAuth]
  )

  const saldo = user?.profile?.estudiante?.saldoComedor ?? 0
  return { menu, loading, error, refresh, ordenar, saldo }
}
