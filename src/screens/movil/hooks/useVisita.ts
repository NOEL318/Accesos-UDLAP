import { useCallback, useEffect, useState } from "react"
import { api } from "@/lib/api"
import type { Visita } from "@/lib/types"

// hook para administrar el detalle de una visita y permitir cancelarla
export function useVisita(id: string | undefined) {
  const [data, setData] = useState<Visita | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // pide al backend el detalle de la visita por id
  const refresh = useCallback(async () => {
    if (!id) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await api.get<Visita>(`/api/visitas/${id}`)
      setData(res)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error")
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [id])

  // carga la visita cuando cambia el id
  useEffect(() => {
    void refresh()
  }, [refresh])

  // cambia el status de la visita a cancelada
  const cancel = useCallback(async () => {
    if (!id) return
    const updated = await api.patch<Visita>(`/api/visitas/${id}`, { status: "cancelada" })
    setData(updated)
  }, [id])

  return { data, loading, error, refresh, cancel }
}
