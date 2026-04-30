import { useCallback, useEffect, useState } from "react"
import { api } from "@/lib/api"
import type { Visita, VisitaStatus } from "@/lib/types"

interface NuevaVisitaInput {
  invitado: { nombre: string; tipoId?: string; categoria?: Visita["invitado"]["categoria"] }
  tipoAcceso: Visita["tipoAcceso"]
  puntoAcceso: string
  fechaHora: string
  multiplesEntradas: boolean
  comentarios?: string
}

// hook para administrar la lista de visitas del usuario y crear nuevas
export function useVisitas(params?: { status?: VisitaStatus }) {
  const [data, setData] = useState<Visita[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // pide al backend la lista de visitas filtradas por status si se indica
  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get<Visita[]>("/api/visitas", { status: params?.status })
      setData(res)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error")
    } finally {
      setLoading(false)
    }
  }, [params?.status])

  // recarga la lista cuando cambia el filtro de status
  useEffect(() => {
    void refresh()
  }, [refresh])

  // crea una visita nueva en el backend y refresca la lista
  const create = useCallback(
    async (input: NuevaVisitaInput) => {
      const created = await api.post<Visita>("/api/visitas", input)
      await refresh()
      return created
    },
    [refresh]
  )

  return { data, loading, error, refresh, create }
}
