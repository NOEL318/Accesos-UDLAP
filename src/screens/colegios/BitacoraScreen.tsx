import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { Search, Car, Footprints, ScrollText, RefreshCw, ShieldCheck } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useColegiosData } from "./context/ColegiosDataContext"

// pantalla con la bitácora histórica de visitas al campus residencial
export function BitacoraScreen() {
  const { visitas, edificios, refrescarTodo, loading } = useColegiosData()
  const [query, setQuery] = useState("")
  const [refreshing, setRefreshing] = useState(false)

  // refresca la bitacora pidiendo de nuevo al backend
  async function refresh() {
    setRefreshing(true)
    try {
      await refrescarTodo()
    } finally {
      setRefreshing(false)
    }
  }

  // filtra las visitas por nombre, tipo de ID o ubicación de entrada
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return visitas
    return visitas.filter(
      (v) =>
        v.nombreCompleto.toLowerCase().includes(q) ||
        v.tipoId.toLowerCase().includes(q) ||
        v.ubicacionEntrada.toLowerCase().includes(q)
    )
  }, [visitas, query])

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Bitácora de Visitas</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Histórico de accesos al campus residencial
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-slate-100 px-3 py-1.5 text-xs font-bold tabular-nums">
            {visitas.length} registros
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={refresh}
            disabled={refreshing || loading}
            className="gap-1.5"
          >
            <RefreshCw className={cn("size-3.5", (refreshing || loading) && "animate-spin")} />
            Refrescar
          </Button>
        </div>
      </header>

      <div className="relative max-w-xl">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nombre, ID, ubicación..."
          className="h-11 rounded-xl border-slate-200 pl-9"
        />
      </div>

      <Card className="overflow-hidden p-0 gap-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                <th className="px-6 py-4 text-left">Visitante</th>
                <th className="px-6 py-4 text-left">Categoría</th>
                <th className="px-6 py-4 text-left">Edificio destino</th>
                <th className="px-6 py-4 text-left">Acceso</th>
                <th className="px-6 py-4 text-left">Ubicación entrada</th>
                <th className="px-6 py-4 text-left">Fecha</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-sm text-muted-foreground">
                    Sin resultados
                  </td>
                </tr>
              )}
              {filtered.map((v) => {
                const edif = edificios.find((e) => e.id === v.edificioDestinoId)
                const fecha = new Date(v.fechaHora)
                return (
                  <tr
                    key={v.id}
                    className="border-b border-border last:border-0 hover:bg-slate-50"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="flex size-9 items-center justify-center rounded-full bg-orange-100 text-sm font-bold text-orange-700">
                          {v.nombreCompleto[0]}
                        </span>
                        <div>
                          <div className="font-bold leading-tight">{v.nombreCompleto}</div>
                          <div className="text-xs text-muted-foreground">{v.tipoId}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex rounded-md bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-700">
                        {v.categoria.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold">{edif?.nombre ?? "—"}</td>
                    <td className="px-6 py-4">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 text-sm font-semibold",
                          v.tipoAcceso === "vehicular" ? "text-blue-600" : "text-emerald-600"
                        )}
                      >
                        {v.tipoAcceso === "vehicular" ? (
                          <Car className="size-3.5" />
                        ) : (
                          <Footprints className="size-3.5" />
                        )}
                        {v.tipoAcceso === "vehicular" ? "Vehicular" : "Peatonal"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{v.ubicacionEntrada}</td>
                    <td className="px-6 py-4 tabular-nums text-muted-foreground">
                      {fecha.toLocaleDateString("es-MX", {
                        day: "2-digit",
                        month: "short",
                      })}{" "}
                      ·{" "}
                      {fecha.toLocaleTimeString("es-MX", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        to={`/colegios/visitas/verificacion/${v.id}`}
                        className="inline-flex items-center gap-1 rounded-md bg-orange-50 px-2.5 py-1 text-xs font-bold text-orange-700 hover:bg-orange-100"
                      >
                        <ShieldCheck className="size-3.5" />
                        Verificar
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="flex items-center gap-2 border-t border-border bg-slate-50 px-6 py-3 text-xs text-muted-foreground">
          <ScrollText className="size-3.5" />
          Mostrando {filtered.length} de {visitas.length} registros totales
        </div>
      </Card>
    </div>
  )
}
