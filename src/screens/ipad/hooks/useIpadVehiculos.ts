import { useCallback, useEffect, useState } from "react"
import { api } from "@/lib/api"

// administra el listado de vehiculos y las acciones de acceso/salida
export function useIpadVehiculos() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // pide al backend la lista de vehiculos
  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setData(await api.get<any[]>("/api/vehiculos"))
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error")
    } finally {
      setLoading(false)
    }
  }, [])

  // refresca al montar
  useEffect(() => {
    void refresh()
  }, [refresh])

  // busca un vehiculo por matricula contra el backend
  const buscarPorMatricula = useCallback(async (matricula: string) => {
    return api.post<any>("/api/vehiculos/buscar", { matricula })
  }, [])

  // permite el acceso de un vehiculo en un punto
  const permitir = useCallback(
    async (id: string, puntoId?: string) => {
      await api.post(`/api/vehiculos/${id}/permitir`, { puntoId })
      await refresh()
    },
    [refresh]
  )

  // deniega el acceso de un vehiculo con motivo
  const denegar = useCallback(
    async (id: string, motivo: string, puntoId?: string) => {
      await api.post(`/api/vehiculos/${id}/denegar`, { motivo, puntoId })
      await refresh()
    },
    [refresh]
  )

  // autoriza la salida especial de un vehiculo bloqueado
  const autorizarSalida = useCallback(
    async (id: string) => {
      await api.post(`/api/vehiculos/${id}/autorizar-salida`)
      await refresh()
    },
    [refresh]
  )

  return {
    data,
    loading,
    error,
    refresh,
    buscarPorMatricula,
    permitir,
    denegar,
    autorizarSalida,
  }
}
