import { useMemo, useState } from "react"
import { Clock, Filter, History, Search } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useIpadData } from "./context/IpadDataContext"
import { KpiCard } from "./components/KpiCard"
import { SectionCard } from "./components/SectionCard"
import { StatusBadge } from "./components/StatusBadge"
import { officersSeed } from "./data"

export function HistorialScreen() {
  const { eventos, vehiculos, puntosControl } = useIpadData()
  const [query, setQuery] = useState("")
  const [resultadoFilter, setResultadoFilter] = useState<string>("todos")
  const [puntoFilter, setPuntoFilter] = useState<string>("todos")
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const officersById = Object.fromEntries(officersSeed.map((o) => [o.id, o]))

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    return eventos.filter((e) => {
      if (resultadoFilter !== "todos" && e.resultado !== resultadoFilter) return false
      if (puntoFilter !== "todos" && e.puntoId !== puntoFilter) return false
      if (!q) return true
      const v = vehiculos.find((x) => x.id === e.vehiculoId)
      return (
        v?.matricula.toLowerCase().includes(q) ||
        v?.propietario.nombre.toLowerCase().includes(q)
      )
    })
  }, [eventos, vehiculos, query, resultadoFilter, puntoFilter])

  const hoy = new Date().toDateString()
  const eventosHoy = eventos.filter((e) => new Date(e.timestamp).toDateString() === hoy).length
  const denegadosHoy = eventos.filter(
    (e) => e.resultado === "denegado" && new Date(e.timestamp).toDateString() === hoy
  ).length

  const selectedEvento = selectedId ? eventos.find((e) => e.id === selectedId) ?? null : null
  const selectedVehiculo = selectedEvento
    ? vehiculos.find((v) => v.id === selectedEvento.vehiculoId)
    : null

  return (
    <div className="space-y-5 max-w-[1400px] mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Historial de Accesos</h1>
        <p className="text-sm text-muted-foreground">
          Registro cronológico de todos los eventos de entrada y salida.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard label="Eventos Totales" value={eventos.length} icon={<History className="size-4" />} accent="info" />
        <KpiCard label="Registrados Hoy" value={eventosHoy} icon={<Clock className="size-4" />} accent="primary" />
        <KpiCard label="Denegados Hoy" value={denegadosHoy} icon={<Filter className="size-4" />} accent="danger" />
      </div>

      <SectionCard
        title="Registros"
        icon={<Filter className="size-4" />}
        contentClassName="px-0"
        action={
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Placa o nombre..."
                className="h-9 pl-9 w-48"
              />
            </div>
            <Select value={resultadoFilter} onValueChange={setResultadoFilter}>
              <SelectTrigger className="h-9 w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="permitido">Permitidos</SelectItem>
                <SelectItem value="denegado">Denegados</SelectItem>
              </SelectContent>
            </Select>
            <Select value={puntoFilter} onValueChange={setPuntoFilter}>
              <SelectTrigger className="h-9 w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los puntos</SelectItem>
                {puntosControl.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
      >
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>TIMESTAMP</TableHead>
                <TableHead>VEHÍCULO</TableHead>
                <TableHead>PUNTO</TableHead>
                <TableHead>OFICIAL</TableHead>
                <TableHead>RESULTADO</TableHead>
                <TableHead>MOTIVO</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((e) => {
                const v = vehiculos.find((x) => x.id === e.vehiculoId)
                const p = puntosControl.find((x) => x.id === e.puntoId)
                const o = officersById[e.oficialId]
                return (
                  <TableRow
                    key={e.id}
                    className="cursor-pointer hover:bg-slate-50"
                    onClick={() => setSelectedId(e.id)}
                  >
                    <TableCell className="tabular-nums text-xs">
                      {new Date(e.timestamp).toLocaleString("es-MX", {
                        month: "short",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </TableCell>
                    <TableCell>
                      <div className="font-mono font-bold text-orange-600">{v?.matricula ?? "—"}</div>
                      <div className="text-xs text-muted-foreground">{v?.propietario.nombre ?? ""}</div>
                    </TableCell>
                    <TableCell className="text-sm">{p?.nombre ?? "—"}</TableCell>
                    <TableCell className="text-sm">{o?.nombre ?? e.oficialId}</TableCell>
                    <TableCell>
                      <StatusBadge
                        variant={e.resultado === "permitido" ? "success" : "danger"}
                        dot
                      >
                        {e.resultado === "permitido" ? "Permitido" : "Denegado"}
                      </StatusBadge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {e.motivo ?? "—"}
                    </TableCell>
                  </TableRow>
                )
              })}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                    Sin eventos con esos filtros.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </SectionCard>

      <Sheet open={!!selectedId} onOpenChange={(v) => !v && setSelectedId(null)}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Detalle del evento</SheetTitle>
            <SheetDescription>
              {selectedEvento && new Date(selectedEvento.timestamp).toLocaleString("es-MX")}
            </SheetDescription>
          </SheetHeader>
          {selectedEvento && selectedVehiculo && (
            <div className="p-4 space-y-4">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Vehículo
                </div>
                <div className="font-mono text-lg font-black text-orange-600">
                  {selectedVehiculo.matricula}
                </div>
                <div className="text-sm">{selectedVehiculo.propietario.nombre}</div>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Resultado
                </div>
                <StatusBadge
                  variant={selectedEvento.resultado === "permitido" ? "success" : "danger"}
                  dot
                >
                  {selectedEvento.resultado === "permitido" ? "Permitido" : "Denegado"}
                </StatusBadge>
              </div>
              {selectedEvento.motivo && (
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    Motivo
                  </div>
                  <div className="text-sm">{selectedEvento.motivo}</div>
                </div>
              )}
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Oficial
                </div>
                <div className="text-sm">{officersById[selectedEvento.oficialId]?.nombre}</div>
                <Badge variant="outline" className="mt-1">
                  Turno {officersById[selectedEvento.oficialId]?.turno}
                </Badge>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
