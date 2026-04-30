import { useCallback, useEffect, useState } from "react"
import { api } from "@/lib/api"

// hook para traer y mantener la lista de edificios residenciales
export function useColegiosEdificios() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  // recarga los edificios desde el backend
  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      setData(await api.get<any[]>("/api/colegios/edificios"))
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
