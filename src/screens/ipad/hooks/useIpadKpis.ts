import { useCallback, useEffect, useState } from "react"
import { api } from "@/lib/api"

export interface IpadKpis {
  entradasHoy: number
  deltaEntradas: number
  incidentesActivos: number
  incidentesModerados: number
  incidentesCriticos: number
  vehiculosEnCampus: number
  capacidadPct: number
  visitasNocturnas: number
  pendientesCheckout: number
}

// administra los KPIs del dashboard del iPad
export function useIpadKpis() {
  const [data, setData] = useState<IpadKpis | null>(null)
  const [loading, setLoading] = useState(true)

  // pide al backend el resumen de KPIs
  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      setData(await api.get<IpadKpis>("/api/kpis/ipad"))
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
