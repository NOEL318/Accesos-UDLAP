import { useCallback, useEffect, useState } from "react"
import { api } from "@/lib/api"

export interface Clase {
  _id: string
  dia: number
  inicio: number
  fin: number
  materia: string
  salon: string
  periodo: string
}

// hook para administrar las clases del horario semanal del estudiante
export function useHorario() {
  const [data, setData] = useState<Clase[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // pide al backend las clases del horario actual
  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get<Clase[]>("/api/horario")
      setData(res)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error")
    } finally {
      setLoading(false)
    }
  }, [])

  // carga el horario al montar el hook
  useEffect(() => { void refresh() }, [refresh])

  return { data, loading, error, refresh }
}
