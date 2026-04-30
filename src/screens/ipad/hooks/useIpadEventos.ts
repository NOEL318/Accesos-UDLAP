import { useCallback, useEffect, useState } from "react"
import { api } from "@/lib/api"

// administra el listado de eventos de acceso del iPad
export function useIpadEventos() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // pide al backend los eventos de acceso
  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      setData(await api.get<any[]>("/api/eventos-acceso"))
    } finally {
      setLoading(false)
    }
  }, [])

  // refresca al montar
  useEffect(() => {
    void refresh()
  }, [refresh])

  return { data, loading, refresh }
}
