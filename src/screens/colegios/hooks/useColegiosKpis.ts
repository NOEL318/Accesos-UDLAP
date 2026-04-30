import { useCallback, useEffect, useState } from "react"
import { api } from "@/lib/api"

// hook para traer los KPIs agregados del módulo colegios
export function useColegiosKpis() {
  const [data, setData] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  // recarga los KPIs desde el backend
  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      setData(await api.get<any>("/api/kpis/colegios"))
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
