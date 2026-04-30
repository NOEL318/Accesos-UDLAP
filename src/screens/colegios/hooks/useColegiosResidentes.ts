import { useCallback, useEffect, useState } from "react"
import { api } from "@/lib/api"

// hook para traer y mantener la lista de residentes del campus
export function useColegiosResidentes() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  // recarga los residentes desde el backend
  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      setData(await api.get<any[]>("/api/colegios/residentes"))
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
