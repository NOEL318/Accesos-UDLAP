import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  AlertTriangle,
  Car,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  Plus,
  Search,
  ShieldAlert,
  Stamp,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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

const PAGE_SIZE = 4

const tipoVariant: Record<string, "info" | "purple" | "neutral"> = {
  estudiante: "info",
  empleado: "purple",
  visita: "neutral",
  externo: "neutral",
}

const accesoVariant: Record<string, "success" | "danger" | "warning"> = {
  permitido: "success",
  denegado: "danger",
  revision: "warning",
}

// escapa un valor para CSV: comillas dobles dentro y wrap si tiene coma/comilla/salto
function csvCell(val: string | number): string {
  const s = String(val ?? "")
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

// pantalla con el listado y gestion de vehiculos del campus
export function VehiculosScreen() {
  const navigate = useNavigate()
  const { vehiculos, kpis } = useIpadData()
  const [query, setQuery] = useState("")
  const [page, setPage] = useState(1)

  // filtra vehiculos por matricula, nombre o ID del propietario
  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    if (!q) return vehiculos
    return vehiculos.filter(
      (v) =>
        v.matricula.toLowerCase().includes(q) ||
        v.propietario.nombre.toLowerCase().includes(q) ||
        v.propietario.idUdlap.toLowerCase().includes(q)
    )
  }, [query, vehiculos])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const slice = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const vencidos = vehiculos.filter((v) => !v.sello.vigente).length
  const conMultas = vehiculos.filter((v) => v.multasPendientes > 0).length

  // genera y descarga un CSV con el listado actualmente filtrado
  function handleExportCsv() {
    if (filtered.length === 0) return
    const header = [
      "matricula",
      "propietario",
      "id_udlap",
      "tipo",
      "modelo",
      "color",
      "ubicacion",
      "ocupantes",
      "sello_vigente",
      "sello_vence",
      "multas_pendientes",
      "estado_acceso",
    ]
    const rows = filtered.map((v) => [
      v.matricula,
      v.propietario.nombre,
      v.propietario.idUdlap,
      v.propietario.tipo,
      v.modelo,
      v.color,
      v.ubicacion,
      v.ocupantes,
      v.sello.vigente ? "si" : "no",
      v.sello.vence,
      v.multasPendientes,
      v.estadoAcceso,
    ])
    const csv = [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\n")
    const blob = new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `vehiculos-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-5 max-w-[1400px] mx-auto">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setPage(1)
          }}
          placeholder="Buscar matrícula o ID de propietario..."
          className="h-11 rounded-full pl-9 bg-white border-slate-200"
        />
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Gestión y Listado de Vehículos</h1>
        <p className="text-sm text-muted-foreground">Supervisión en tiempo real de accesos al campus.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard
          label="Vehículos en Campus"
          value={kpis.vehiculosEnCampus.toLocaleString()}
          icon={<Car className="size-4" />}
          accent="info"
        />
        <KpiCard
          label="Con Multas Pendientes"
          value={conMultas}
          icon={<ShieldAlert className="size-4" />}
          accent="danger"
        />
        <KpiCard
          label="Sello Escolar Vencido"
          value={vencidos}
          icon={<Stamp className="size-4" />}
          accent="warning"
        />
      </div>

      <SectionCard
        title="Vehículos Registrados"
        action={
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={handleExportCsv}
              disabled={filtered.length === 0}
            >
              <Download className="size-3.5" /> Exportar CSV
            </Button>
            <Button size="sm" className="gap-1.5 bg-orange-600 hover:bg-orange-700" onClick={() => navigate("/ipad/multas")}>
              <Plus className="size-3.5" /> Registrar Nuevo
            </Button>
          </div>
        }
        contentClassName="px-0"
      >
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>MATRÍCULA</TableHead>
                <TableHead>PROPIETARIO</TableHead>
                <TableHead>TIPO</TableHead>
                <TableHead>MULTAS</TableHead>
                <TableHead>ACCESO</TableHead>
                <TableHead className="text-right">ACCIONES</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {slice.map((v) => (
                <TableRow key={v.id}>
                  <TableCell className="font-mono font-bold text-orange-600">
                    {v.matricula}
                  </TableCell>
                  <TableCell>
                    <div className="font-semibold">{v.propietario.nombre}</div>
                    <div className="text-xs text-muted-foreground">
                      {v.propietario.idUdlap === "Externo" ? "Ext: Externo" : `ID: ${v.propietario.idUdlap}`}
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge variant={tipoVariant[v.propietario.tipo]}>
                      {v.propietario.tipo.charAt(0).toUpperCase() + v.propietario.tipo.slice(1)}
                    </StatusBadge>
                  </TableCell>
                  <TableCell>
                    {v.multasPendientes === 0 ? (
                      <StatusBadge variant="success">Ninguna</StatusBadge>
                    ) : (
                      <StatusBadge variant="warning">
                        {v.multasPendientes} Pendiente{v.multasPendientes > 1 ? "s" : ""}
                      </StatusBadge>
                    )}
                  </TableCell>
                  <TableCell>
                    <StatusBadge variant={accesoVariant[v.estadoAcceso]} dot>
                      {v.estadoAcceso === "permitido"
                        ? "Permitido"
                        : v.estadoAcceso === "denegado"
                        ? "Denegado"
                        : "Revisión"}
                    </StatusBadge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex gap-1">
                      <Button variant="ghost" size="icon-sm" aria-label="Ver detalle">
                        <Eye className="size-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" aria-label="Reportar">
                        <AlertTriangle className="size-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {slice.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                    No hay resultados.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="mt-3 flex items-center justify-between px-5 py-1">
          <div className="text-xs text-muted-foreground">
            Mostrando {slice.length} de {filtered.length} registros
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon-sm"
              disabled={currentPage === 1}
              onClick={() => setPage(currentPage - 1)}
              aria-label="Anterior"
            >
              <ChevronLeft className="size-3.5" />
            </Button>
            {Array.from({ length: totalPages }).map((_, i) => (
              <Button
                key={i}
                variant={currentPage === i + 1 ? "default" : "outline"}
                size="icon-sm"
                className={currentPage === i + 1 ? "bg-orange-600 hover:bg-orange-700" : ""}
                onClick={() => setPage(i + 1)}
              >
                {i + 1}
              </Button>
            ))}
            <Button
              variant="outline"
              size="icon-sm"
              disabled={currentPage === totalPages}
              onClick={() => setPage(currentPage + 1)}
              aria-label="Siguiente"
            >
              <ChevronRight className="size-3.5" />
            </Button>
          </div>
        </div>
      </SectionCard>
    </div>
  )
}
