import { useCallback, useEffect, useState } from "react"
import { api } from "@/lib/api"

// hook para traer la bitacora de visitas residenciales y registrar nuevas
export function useColegiosVisitas() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // recarga la bitacora completa de visitas con edificio destino
  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setData(await api.get<any[]>("/api/colegios/visitas"))
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar bitacora")
      setData([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  // registra una visita residencial nueva via el endpoint de colegios
  const registrar = useCallback(
    async (input: any) => {
      const visita = await api.post<any>("/api/colegios/visitas", input)
      await refresh()
      return visita
    },
    [refresh]
  )

  // registra el resultado de verificacion (permitir/denegar) sobre una visita
  const verificar = useCallback(
    async (
      visitaId: string,
      payload: {
        resultado: "permitido" | "denegado"
        ebriedad?: boolean
        itemsProhibidos?: boolean
        motivo?: string
        puntoAcceso?: string
        fotoEvidencia?: string
      }
    ) => {
      const v = await api.post<any>(
        `/api/colegios/visitas/${visitaId}/verificacion`,
        payload
      )
      await refresh()
      return v
    },
    [refresh]
  )

  return { data, loading, error, refresh, registrar, verificar }
}
