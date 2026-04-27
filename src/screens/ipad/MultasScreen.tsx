import { useMemo, useState } from "react"
import {
  Camera,
  FileCheck2,
  FileWarning,
  MapPin,
  Search,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useIpadData } from "./context/IpadDataContext"
import { useIpadSession } from "./context/IpadSessionContext"
import { SectionCard } from "./components/SectionCard"
import { StatusBadge } from "./components/StatusBadge"
import { VehiculoPreviewCard } from "./components/VehiculoPreviewCard"

const TIPOS_INFRACCION = [
  "Estacionamiento prohibido",
  "Exceso de velocidad",
  "No respetar alto",
  "Conducción imprudente",
  "Sello vencido",
  "Acceso a zona restringida",
]

export function MultasScreen() {
  const { vehiculos, multas, registrarMulta } = useIpadData()
  const { officer } = useIpadSession()

  const [placa, setPlaca] = useState("")
  const [tipo, setTipo] = useState("")
  const [monto, setMonto] = useState("850")
  const [comentarios, setComentarios] = useState("")
  const [evidencia, setEvidencia] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const vehiculo = useMemo(
    () => vehiculos.find((v) => v.matricula.toUpperCase().includes(placa.toUpperCase().trim())) ?? null,
    [placa, vehiculos]
  )

  const historial = vehiculo
    ? multas.filter((m) => m.vehiculoId === vehiculo.id).slice(0, 3)
    : []

  function handleAddEvidencia() {
    if (evidencia.length >= 3) return
    setEvidencia((prev) => [...prev, `foto-${prev.length + 1}.jpg`])
  }

  function handleReset() {
    setPlaca("")
    setTipo("")
    setMonto("850")
    setComentarios("")
    setEvidencia([])
    setError(null)
  }

  function handleConfirmar() {
    if (!vehiculo) return setError("Selecciona un vehículo válido buscando por placa.")
    if (!tipo) return setError("Selecciona el tipo de infracción.")
    const montoNum = Number(monto)
    if (!montoNum || montoNum <= 0) return setError("El monto debe ser mayor a 0.")
    if (!officer) return setError("Sesión inválida.")

    registrarMulta(
      {
        vehiculoId: vehiculo.id,
        tipo,
        montoMxn: montoNum,
        evidencia,
        comentarios,
      },
      officer.id
    )
    setSuccess(true)
    setTimeout(() => {
      setSuccess(false)
      handleReset()
    }, 1500)
  }

  return (
    <div className="max-w-[1400px] mx-auto">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Registrar Nueva Multa</h1>
          <p className="text-sm text-muted-foreground">
            Genera la infracción, adjunta evidencia y confirma con datos del vehículo.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5">
        <SectionCard title="Detalles de la Infracción" icon={<FileWarning className="size-4" />}>
          <div className="space-y-4">
            <div>
              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Buscar Vehículo por Placa
              </Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={placa}
                  onChange={(e) => setPlaca(e.target.value)}
                  placeholder="Ej. ABC-1234"
                  className="pl-9 h-11"
                />
              </div>
              {placa && !vehiculo && (
                <p className="mt-1 text-xs text-red-600">Sin coincidencias en el padrón.</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Tipo de Infracción
                </Label>
                <Select value={tipo} onValueChange={setTipo}>
                  <SelectTrigger className="mt-1 h-11">
                    <SelectValue placeholder="Seleccionar tipo..." />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_INFRACCION.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Monto (MXN)
                </Label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
                    $
                  </span>
                  <Input
                    type="number"
                    value={monto}
                    onChange={(e) => setMonto(e.target.value)}
                    className="pl-6 h-11 text-orange-700 font-bold tabular-nums"
                  />
                </div>
              </div>
            </div>

            <div>
              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Evidencia Fotográfica
              </Label>
              <button
                type="button"
                onClick={handleAddEvidencia}
                className="mt-1 w-full rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center transition-colors hover:border-orange-400 hover:bg-orange-50"
              >
                <Camera className="mx-auto size-6 text-muted-foreground" />
                <div className="mt-2 text-sm font-semibold">Tocar para capturar o subir imágenes</div>
                <div className="text-xs text-muted-foreground">Máximo 3 fotos (JPG, PNG)</div>
              </button>
              {evidencia.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {evidencia.map((file, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-2 rounded-full bg-orange-50 border border-orange-200 px-3 py-1 text-xs font-semibold text-orange-700"
                    >
                      {file}
                      <button
                        type="button"
                        aria-label={`Quitar ${file}`}
                        onClick={() => setEvidencia((e) => e.filter((_, x) => x !== i))}
                      >
                        <X className="size-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div>
              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Comentarios / Observaciones
              </Label>
              <Textarea
                value={comentarios}
                onChange={(e) => setComentarios(e.target.value)}
                placeholder="Describe brevemente la situación..."
                className="mt-1 min-h-[100px]"
              />
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
                {error}
              </div>
            )}
            {success && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-700">
                Multa registrada correctamente.
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={handleReset}>
                Cancelar
              </Button>
              <Button className="gap-2 bg-orange-600 hover:bg-orange-700" onClick={handleConfirmar}>
                <FileCheck2 className="size-4" /> Confirmar Multa
              </Button>
            </div>
          </div>
        </SectionCard>

        <div className="space-y-4">
          {vehiculo ? (
            <>
              <VehiculoPreviewCard vehiculo={vehiculo} />
              <SectionCard title="Historial Reciente">
                {historial.length === 0 ? (
                  <div className="text-xs text-muted-foreground">Sin multas previas pagadas.</div>
                ) : (
                  <ul className="space-y-2">
                    {historial.map((m) => (
                      <li key={m.id} className="flex items-center justify-between text-sm">
                        <div>
                          <div className="font-semibold">{m.tipo}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(m.fecha).toLocaleDateString("es-MX", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </div>
                        </div>
                        <StatusBadge variant={m.estado === "pendiente" ? "warning" : "neutral"}>
                          {m.estado}
                        </StatusBadge>
                      </li>
                    ))}
                  </ul>
                )}
              </SectionCard>
            </>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-muted-foreground">
              Busca una placa para ver los datos del vehículo.
            </div>
          )}

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 text-white overflow-hidden relative">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_20%_30%,rgba(234,88,12,0.6),transparent_60%)]" />
            <div className="relative">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Ubicación Actual
              </div>
              <div className="mt-1 text-lg font-black">Estacionamiento 2</div>
              <div className="text-xs text-slate-300">(Ingenierías)</div>
              <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-slate-800 px-3 py-1 text-xs">
                <MapPin className="size-3 text-orange-500" />
                19.0558° N, 98.2831° W
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
