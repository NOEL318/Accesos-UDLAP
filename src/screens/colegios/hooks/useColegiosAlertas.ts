import { useCallback, useEffect, useState } from "react"
import { api } from "@/lib/api"

// hook para traer y mantener la lista de alertas del scope residencial
export function useColegiosAlertas() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  // recarga las alertas residenciales desde el backend
  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      setData(await api.get<any[]>("/api/alertas", { scope: "residencial" }))
    } finally {
      setLoading(false)
    }
  }, [])
  // dispara la primera carga al montar
  useEffect(() => {
    void refresh()
  }, [refresh])
  return { data, loading, refresh }
}
