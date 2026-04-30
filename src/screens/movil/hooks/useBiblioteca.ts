import { useCallback, useEffect, useState } from "react"
import { api } from "@/lib/api"

export interface Libro {
  _id: string
  titulo: string
  autor: string
  icon?: string
  totalCopias: number
  copiasDisponibles: number
}

export interface Prestamo {
  _id: string
  libroId: string
  fechaPrestamo: string
  fechaVencimiento: string
  fechaDevolucion?: string
  estado: "activo" | "devuelto" | "vencido"
  libro: Libro | null
}

export interface Deseo {
  _id: string
  libroId: string
  fechaAgregado: string
  libro: Libro | null
}

// hook para administrar libros, prestamos y deseos del estudiante en biblioteca
export function useBiblioteca() {
  const [libros, setLibros] = useState<Libro[]>([])
  const [prestamos, setPrestamos] = useState<Prestamo[]>([])
  const [deseos, setDeseos] = useState<Deseo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // pide al backend libros, prestamos y deseos en paralelo
  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [l, p, d] = await Promise.all([
        api.get<Libro[]>("/api/biblioteca/libros"),
        api.get<Prestamo[]>("/api/biblioteca/prestamos"),
        api.get<Deseo[]>("/api/biblioteca/deseos"),
      ])
      setLibros(l)
      setPrestamos(p)
      setDeseos(d)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error")
    } finally {
      setLoading(false)
    }
  }, [])

  // carga los datos al montar el hook
  useEffect(() => { void refresh() }, [refresh])

  // registra un prestamo nuevo y refresca el estado
  const prestar = useCallback(async (libroId: string) => {
    await api.post("/api/biblioteca/prestamos", { libroId })
    await refresh()
  }, [refresh])

  // marca un prestamo como devuelto y refresca el estado
  const devolver = useCallback(async (prestamoId: string) => {
    await api.patch(`/api/biblioteca/prestamos/${prestamoId}`, { estado: "devuelto" })
    await refresh()
  }, [refresh])

  // agrega un libro a la lista de deseos y refresca el estado
  const agregarDeseo = useCallback(async (libroId: string) => {
    await api.post("/api/biblioteca/deseos", { libroId })
    await refresh()
  }, [refresh])

  // quita un deseo de la lista y refresca el estado
  const quitarDeseo = useCallback(async (deseoId: string) => {
    await api.delete(`/api/biblioteca/deseos/${deseoId}`)
    await refresh()
  }, [refresh])

  return {
    libros, prestamos, deseos,
    loading, error, refresh,
    prestar, devolver, agregarDeseo, quitarDeseo,
  }
}
