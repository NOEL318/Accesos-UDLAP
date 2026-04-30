import { useCallback, useEffect, useState } from "react"
import { api } from "@/lib/api"

// hook para traer las visitas residenciales y registrar nuevas
export function useColegiosVisitas() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  // recarga las visitas y filtra solo las que tienen edificio destino
  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      // Todas las visitas (incluso las del estudiante normal); el frontend filtrará por edificioDestinoId
      const all = await api.get<any[]>("/api/visitas")
      setData(all.filter((v) => v.edificioDestinoId))
    } finally {
      setLoading(false)
    }
  }, [])
  // dispara la primera carga al montar
  useEffect(() => {
    void refresh()
  }, [refresh])

  // crea una visita nueva en el backend y refresca el listado
  const registrar = useCallback(
    async (input: any) => {
      const visita = await api.post<any>("/api/visitas", input)
      await refresh()
      return visita
    },
    [refresh]
  )

  return { data, loading, refresh, registrar }
}
