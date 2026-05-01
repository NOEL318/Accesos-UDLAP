import { useMemo, useRef, useState } from "react"
import { Link } from "react-router-dom"
import {
  Search,
  UserPlus,
  Eye,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Camera,
  X,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { useColegiosData } from "./context/ColegiosDataContext"
import { EstadoResidenteBadge } from "./components/EstadoBadge"
import type { EstadoResidente, Residente } from "./types"
import { CameraCapture } from "@/components/CameraCapture"
import { ApiError } from "@/lib/api"

type EstadoFilter = "todos" | EstadoResidente
const PAGE_SIZE = 4

// pantalla con el listado paginado de residentes con filtros por edificio y estado
export function ResidentesScreen() {
  const { residentes, reportarIncidente } = useColegiosData()
  const [query, setQuery] = useState("")
  const [edificio, setEdificio] = useState<string>("todos")
  const [estado, setEstado] = useState<EstadoFilter>("todos")
  const [page, setPage] = useState(1)
  const [reporting, setReporting] = useState<Residente | null>(null)

  // filtra residentes por búsqueda libre, edificio y estado seleccionado
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return residentes.filter((r) => {
      const matchQ =
        !q ||
        r.nombre.toLowerCase().includes(q) ||
        r.id.includes(q) ||
        r.habitacion.toLowerCase().includes(q)
      const matchE = edificio === "todos" || r.edificio === edificio
      const matchS = estado === "todos" || r.estado === estado
      return matchQ && matchE && matchS
    })
  }, [residentes, query, edificio, estado])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const visibles = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)
  const desde = filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1
  const hasta = Math.min(safePage * PAGE_SIZE, filtered.length)

  // saca la lista de edificios únicos para llenar el select de filtros
  const edificiosUnicos = useMemo(
    () => Array.from(new Set(residentes.map((r) => r.edificio))),
    [residentes]
  )

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Listado de Residentes</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gestión y monitoreo de estudiantes en campus universitario
          </p>
        </div>
        <Button
          onClick={() =>
            alert(
              "Alta de residentes se gestiona desde Servicios Escolares. Contacta al administrador."
            )
          }
          className="bg-orange-600 hover:bg-orange-700 gap-2"
        >
          <UserPlus className="size-4" />
          Nuevo Residente
        </Button>
      </header>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[280px] flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setPage(1)
            }}
            placeholder="Buscar por nombre, ID o habitación..."
            className="h-11 rounded-xl border-slate-200 pl-9"
          />
        </div>

        <Select
          value={edificio}
          onValueChange={(v) => {
            setEdificio(v)
            setPage(1)
          }}
        >
          <SelectTrigger className="h-11 min-w-[180px] rounded-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los Edificios</SelectItem>
            {edificiosUnicos.map((e) => (
              <SelectItem key={e} value={e}>
                {e}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="inline-flex items-center rounded-xl bg-slate-100 p-1">
          {(["todos", "en_campus", "fuera"] as EstadoFilter[]).map((f) => {
            const labels: Record<EstadoFilter, string> = {
              todos: "Todos",
              en_campus: "En Campus",
              fuera: "Fuera",
              invitado: "Invitado",
            }
            return (
              <button
                key={f}
                onClick={() => {
                  setEstado(f)
                  setPage(1)
                }}
                className={cn(
                  "rounded-lg px-3 py-2 text-xs font-semibold transition-colors",
                  estado === f
                    ? "bg-orange-500 text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {labels[f]}
              </button>
            )
          })}
        </div>
      </div>

      {/* Tabla */}
      <Card className="overflow-hidden p-0 gap-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                <th className="px-6 py-4 text-left">Residente</th>
                <th className="px-6 py-4 text-left">ID Estudiante</th>
                <th className="px-6 py-4 text-left">Ubicación</th>
                <th className="px-6 py-4 text-left">Estatus</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {visibles.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-sm text-muted-foreground"
                  >
                    Sin resultados para los filtros seleccionados
                  </td>
                </tr>
              )}
              {visibles.map((r) => (
                <tr key={r.id} className="border-b border-border last:border-0 hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="size-10">
                        <AvatarImage src={r.avatar} alt={r.nombre} />
                        <AvatarFallback>{r.nombre[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-bold leading-tight">{r.nombre}</div>
                        <div className="text-xs text-muted-foreground">{r.carrera}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 tabular-nums">{r.id}</td>
                  <td className="px-6 py-4">
                    <div className="font-semibold leading-tight">{r.edificio}</div>
                    <div className="text-xs text-muted-foreground">{r.habitacion}</div>
                  </td>
                  <td className="px-6 py-4">
                    <EstadoResidenteBadge estado={r.estado} />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link
                        to={`/colegios/visitas/verificacion/${r.id}`}
                        className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-slate-100 hover:text-foreground"
                        aria-label="Ver detalles"
                      >
                        <Eye className="size-4" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => setReporting(r)}
                        className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-amber-50 hover:text-amber-600"
                        aria-label="Reportar incidente"
                      >
                        <AlertTriangle className="size-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-border px-6 py-4 text-sm">
          <span className="text-muted-foreground">
            Mostrando {desde} a {hasta} de {filtered.length} residentes
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              disabled={safePage === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              aria-label="Página anterior"
            >
              <ChevronLeft className="size-4" />
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                onClick={() => setPage(n)}
                className={cn(
                  "size-8 rounded-md text-sm font-semibold transition-colors",
                  n === safePage
                    ? "bg-orange-500 text-white"
                    : "text-foreground hover:bg-slate-100"
                )}
              >
                {n}
              </button>
            ))}
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              disabled={safePage === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              aria-label="Página siguiente"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </Card>

      {reporting && (
        <ReportarIncidenteModal
          residente={reporting}
          onClose={() => setReporting(null)}
          onSubmit={async (payload) => {
            await reportarIncidente({
              residenteStudentId: reporting.id,
              edificioId: reporting.edificioId,
              ...payload,
            })
          }}
        />
      )}
    </div>
  )
}

interface ReportarProps {
  residente: Residente
  onClose: () => void
  onSubmit(payload: {
    descripcion: string
    severidad: "critica" | "alta" | "moderada" | "media" | "info"
    tipo: "ebriedad" | "items_prohibidos" | "incidente" | "ronda"
    fotoEvidencia?: string
  }): Promise<void>
}

// modal para reportar un incidente sobre un residente con foto opcional
function ReportarIncidenteModal({ residente, onClose, onSubmit }: ReportarProps) {
  const [descripcion, setDescripcion] = useState("")
  const [tipo, setTipo] =
    useState<"ebriedad" | "items_prohibidos" | "incidente" | "ronda">("incidente")
  const [severidad, setSeveridad] =
    useState<"critica" | "alta" | "moderada" | "media" | "info">("moderada")
  const [evidencia, setEvidencia] = useState<string | null>(null)
  const [cameraOpen, setCameraOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const lastFocus = useRef<HTMLTextAreaElement>(null)

  // envia el incidente al backend, cierra el modal en exito y muestra error si falla
  async function handleSubmit() {
    if (descripcion.trim().length < 5) {
      setError("Describe brevemente el incidente.")
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      await onSubmit({
        descripcion: descripcion.trim(),
        tipo,
        severidad,
        fotoEvidencia: evidencia ?? undefined,
      })
      onClose()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "No se pudo registrar el incidente")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <div className="text-base font-black tracking-tight">Reportar incidente</div>
            <div className="text-xs text-muted-foreground">
              Sobre {residente.nombre} (ID {residente.id})
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-500 hover:bg-slate-100"
            aria-label="Cerrar"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Tipo
              </Label>
              <Select value={tipo} onValueChange={(v) => setTipo(v as typeof tipo)}>
                <SelectTrigger className="mt-1 h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="incidente">Incidente</SelectItem>
                  <SelectItem value="ebriedad">Ebriedad</SelectItem>
                  <SelectItem value="items_prohibidos">Ítems prohibidos</SelectItem>
                  <SelectItem value="ronda">Ronda</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Severidad
              </Label>
              <Select
                value={severidad}
                onValueChange={(v) => setSeveridad(v as typeof severidad)}
              >
                <SelectTrigger className="mt-1 h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="critica">Crítica</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="moderada">Moderada</SelectItem>
                  <SelectItem value="info">Informativa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Descripción
            </Label>
            <Textarea
              ref={lastFocus}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Describe lo ocurrido…"
              className="mt-1 min-h-24"
            />
          </div>

          <div>
            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Foto de evidencia (opcional)
            </Label>
            <button
              type="button"
              onClick={() => setCameraOpen(true)}
              className={cn(
                "mt-1 flex w-full items-center justify-between rounded-xl border-2 border-dashed px-4 py-3 text-sm transition-colors",
                evidencia
                  ? "border-emerald-300 bg-emerald-50/50 text-emerald-700"
                  : "border-slate-200 bg-slate-50 hover:border-orange-300 hover:bg-orange-50/40"
              )}
            >
              <span className="flex items-center gap-2 font-semibold">
                <Camera className="size-4" />
                {evidencia ? "Evidencia capturada" : "Tomar foto con cámara"}
              </span>
              {evidencia && (
                <img
                  src={evidencia}
                  alt="evidencia"
                  className="size-12 rounded-md object-cover"
                />
              )}
            </button>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
              {error}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-5 py-3">
          <Button type="button" variant="ghost" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="gap-2 bg-orange-600 hover:bg-orange-700"
          >
            <AlertTriangle className="size-4" />
            {submitting ? "Registrando…" : "Reportar"}
          </Button>
        </div>
      </div>

      <CameraCapture
        open={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onCapture={(b64) => setEvidencia(b64)}
        title="Evidencia del incidente"
        hint="Toma una foto que respalde el reporte."
      />
    </div>
  )
}
