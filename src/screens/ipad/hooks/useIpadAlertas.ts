import { useCallback, useEffect, useState } from "react"
import { api } from "@/lib/api"

// administra las alertas del scope vehicular y permite atenderlas
export function useIpadAlertas() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // pide al backend la lista de alertas vehiculares
  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      setData(await api.get<any[]>("/api/alertas", { scope: "vehicular" }))
    } finally {
      setLoading(false)
    }
  }, [])

  // refresca al montar
  useEffect(() => {
    void refresh()
  }, [refresh])

  // marca una alerta como atendida y refresca la lista
  const atender = useCallback(
    async (id: string) => {
      await api.patch(`/api/alertas/${id}/atender`)
      await refresh()
    },
    [refresh]
  )

  return { data, loading, refresh, atender }
}
