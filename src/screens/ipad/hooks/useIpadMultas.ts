import { useCallback, useEffect, useState } from "react"
import { api } from "@/lib/api"

// administra el listado de multas y permite crear o cambiar su estado
export function useIpadMultas() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // pide al backend las multas registradas
  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      setData(await api.get<any[]>("/api/multas"))
    } finally {
      setLoading(false)
    }
  }, [])

  // refresca al montar
  useEffect(() => {
    void refresh()
  }, [refresh])

  // crea una multa nueva en el backend y refresca la lista
  const crear = useCallback(
    async (input: {
      vehiculoId: string
      tipo: string
      montoMxn: number
      evidencia?: string[]
      comentarios?: string
    }) => {
      await api.post("/api/multas", input)
      await refresh()
    },
    [refresh]
  )

  // marca una multa como pagada o cancelada y refresca
  const cambiarEstado = useCallback(
    async (id: string, estado: "pagada" | "cancelada") => {
      await api.patch(`/api/multas/${id}`, { estado })
      await refresh()
    },
    [refresh]
  )

  return { data, loading, refresh, crear, cambiarEstado }
}
