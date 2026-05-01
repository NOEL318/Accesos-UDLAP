import { useMemo, useState } from "react"
import {
  Car,
  CheckCircle2,
  MapPin,
  MoonStar,
  QrCode,
  UserCheck,
  UserX,
  Users,
  ChevronDown,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useIpadData } from "./context/IpadDataContext"
import { useIpadSession } from "./context/IpadSessionContext"
import { SectionCard } from "./components/SectionCard"
import { StatusBadge } from "./components/StatusBadge"

// pantalla del punto de control para registrar accesos vehiculares y nocturnos
export function PuntoControlScreen() {
  const { vehiculos, puntosControl, permitirAcceso, denegarAcceso } = useIpadData()
  const { officer } = useIpadSession()
  const [puntoId, setPuntoId] = useState("pt-1")
  const [query, setQuery] = useState("ABC-123-D")
  const [observaciones, setObservaciones] = useState("")
  const [counter, setCounter] = useState(142)
  const [indicadores, setIndicadores] = useState({
    detectable: false,
    etilico: false,
    dificultad: false,
    coordinacion: false,
  })
  const [feedback, setFeedback] = useState<null | { ok: boolean; msg: string }>(null)

  // localiza el vehiculo por matricula tecleada
  const vehiculo = useMemo(
    () => vehiculos.find((v) => v.matricula.toUpperCase() === query.toUpperCase()) ?? null,
    [query, vehiculos]
  )

  // permite el acceso del vehiculo y registra el evento
  function handlePermitir() {
    if (!vehiculo || !officer) return
    permitirAcceso(vehiculo.id, puntoId, officer.id)
    setFeedback({ ok: true, msg: "Acceso permitido. Evento registrado en historial." })
    setCounter((c) => c + 1)
    setObservaciones("")
    setIndicadores({ detectable: false, etilico: false, dificultad: false, coordinacion: false })
  }

  // deniega el acceso, integrando indicadores de riesgo activos al motivo
  function handleDenegar() {
    if (!vehiculo || !officer) return
    const labels: Record<keyof typeof indicadores, string> = {
      detectable: "Estado detectable",
      etilico: "Aliento etílico",
      dificultad: "Dificultad al hablar",
      coordinacion: "Coordinación motriz",
    }
    const indicadoresActivos = (Object.keys(indicadores) as Array<keyof typeof indicadores>)
      .filter((k) => indicadores[k])
      .map((k) => labels[k])
    const obs = observaciones.trim()
    const partes = [
      indicadoresActivos.length > 0 ? `Indicadores: ${indicadoresActivos.join(", ")}` : null,
      obs || null,
    ].filter(Boolean) as string[]
    const motivo = partes.length > 0 ? partes.join(" — ") : "Sin motivo especificado"
    denegarAcceso(vehiculo.id, puntoId, officer.id, motivo)
    setFeedback({ ok: false, msg: `Acceso denegado: ${motivo}` })
    setObservaciones("")
    setIndicadores({ detectable: false, etilico: false, dificultad: false, coordinacion: false })
  }

  // simula escaneo de ID/QR del padrón seleccionando un vehículo aleatorio
  function handleEscanearId() {
    if (vehiculos.length === 0) {
      setFeedback({ ok: false, msg: "Sin vehículos en el padrón para escanear." })
      return
    }
    const sample = vehiculos[Math.floor(Math.random() * vehiculos.length)]
    setQuery(sample.matricula)
    setFeedback({ ok: true, msg: `ID escaneado: ${sample.matricula} · ${sample.propietario.nombre}` })
  }

  // limpia el formulario para iniciar un nuevo registro de acceso
  function handleNuevoRegistro() {
    setQuery("")
    setObservaciones("")
    setIndicadores({ detectable: false, etilico: false, dificultad: false, coordinacion: false })
    setFeedback(null)
  }

  return (
    <div className="space-y-5 max-w-[1400px] mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Punto de Control: Acceso Principal</h1>
          <p className="text-sm text-muted-foreground">
            Registro de accesos y verificación de protocolos de seguridad
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={puntoId} onValueChange={setPuntoId}>
            <SelectTrigger className="min-w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {puntosControl.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" className="gap-2" onClick={handleEscanearId}>
            <QrCode className="size-4" /> Escanear ID
          </Button>
          <Button className="gap-2 bg-orange-600 hover:bg-orange-700" onClick={handleNuevoRegistro}>
            <Car className="size-4" /> Nuevo Registro
          </Button>
        </div>
      </div>

      <Tabs defaultValue="vehicular">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="vehicular" className="gap-2">
            <Car className="size-4" /> Acceso Vehicular
          </TabsTrigger>
          <TabsTrigger value="nocturna" className="gap-2">
            <MoonStar className="size-4" /> Entradas Nocturnas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="vehicular" className="mt-5">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
            <SectionCard
              title="Control de Vehículos"
              icon={<Car className="size-4" />}
              action={<StatusBadge variant="success" dot>CÁMARA ACTIVA</StatusBadge>}
            >
              <div className="flex flex-col md:flex-row gap-5">
                <div className="flex-1 space-y-4">
                  <div>
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Placa / Matrícula
                    </Label>
                    <Input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      className="mt-1 text-3xl font-black tracking-wider h-14 font-mono"
                    />
                    {query.trim() !== "" && !vehiculo && (
                      <p className="mt-1 text-xs text-red-600">Sin coincidencias en el padrón.</p>
                    )}
                  </div>
                  {vehiculo && (
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="gap-1.5 py-1">
                        <MapPin className="size-3 text-orange-600" />
                        {vehiculo.ubicacion}
                      </Badge>
                      {vehiculo.multasPendientes > 0 && (
                        <StatusBadge variant="warning">
                          {vehiculo.multasPendientes} Pendiente{vehiculo.multasPendientes > 1 ? "s" : ""}
                        </StatusBadge>
                      )}
                      <StatusBadge variant={vehiculo.sello.vigente ? "success" : "danger"} dot>
                        SELLO {vehiculo.sello.vigente ? `VÁLIDO ${vehiculo.sello.vence}` : "VENCIDO"}
                      </StatusBadge>
                      <Badge variant="outline" className="gap-1.5 py-1">
                        <Users className="size-3" />
                        {vehiculo.ocupantes} Persona{vehiculo.ocupantes !== 1 ? "s" : ""}
                      </Badge>
                    </div>
                  )}
                </div>
                {vehiculo && (
                  <div className="md:w-56 rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                      Conductor
                    </div>
                    <div className="flex items-center gap-3">
                      <Avatar className="size-12">
                        <AvatarImage src={vehiculo.foto} alt={vehiculo.propietario.nombre} />
                        <AvatarFallback>{vehiculo.propietario.nombre[0]}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="text-sm font-bold leading-tight truncate">
                          {vehiculo.propietario.nombre}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          ID {vehiculo.propietario.idUdlap}
                        </div>
                        <div className="text-[10px] text-orange-600 font-bold uppercase mt-1">
                          {vehiculo.propietario.tipo}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-5">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Observaciones Adicionales
                </Label>
                <Textarea
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Escribe observaciones..."
                  className="mt-1 min-h-[80px] resize-none"
                />
              </div>

              {feedback && (
                <div
                  className={`mt-4 rounded-lg px-4 py-2.5 text-sm font-medium ${
                    feedback.ok
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-amber-50 text-amber-700 border border-amber-200"
                  }`}
                >
                  {feedback.msg}
                </div>
              )}

              <div className="mt-5 flex items-center justify-between gap-3">
                <div className="rounded-xl bg-slate-900 text-white px-5 py-3">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Gestionados hoy
                  </div>
                  <div className="text-2xl font-black tabular-nums">
                    {counter} Vehículos
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="gap-2 border-red-300 text-red-700 hover:bg-red-50" onClick={handleDenegar} disabled={!vehiculo}>
                    <UserX className="size-4" /> Denegar Acceso
                  </Button>
                  <Button className="gap-2 bg-orange-600 hover:bg-orange-700" onClick={handlePermitir} disabled={!vehiculo}>
                    <UserCheck className="size-4" /> Permitir Paso
                  </Button>
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Indicadores de Riesgo" icon={<ChevronDown className="size-4" />}>
              <div className="space-y-3">
                {[
                  { key: "detectable", label: "Estado detectable" },
                  { key: "etilico", label: "Aliento etílico" },
                  { key: "dificultad", label: "Dificultad al hablar" },
                  { key: "coordinacion", label: "Coordinación motriz" },
                ].map((i) => (
                  <div key={i.key} className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                    <Label htmlFor={`risk-${i.key}`} className="text-sm">{i.label}</Label>
                    <Switch
                      id={`risk-${i.key}`}
                      checked={indicadores[i.key as keyof typeof indicadores]}
                      onCheckedChange={(v: boolean) =>
                        setIndicadores((prev) => ({ ...prev, [i.key]: v }))
                      }
                    />
                  </div>
                ))}
                {(() => {
                  const activos = Object.values(indicadores).filter(Boolean).length
                  const alerta = activos >= 2
                  return (
                    <div
                      className={`rounded-lg border p-3 text-xs ${
                        alerta
                          ? "border-red-300 bg-red-50 text-red-800"
                          : "border-amber-200 bg-amber-50 text-amber-800"
                      }`}
                    >
                      <CheckCircle2
                        className={`size-3.5 inline mr-1 ${
                          alerta ? "text-red-600" : "text-amber-600"
                        }`}
                      />
                      {alerta
                        ? `${activos} indicadores activos — protocolo de salida especial obligatorio.`
                        : "Nota: 2 o más indicadores → protocolo de salida especial obligatorio."}
                    </div>
                  )
                })()}
              </div>
            </SectionCard>
          </div>
        </TabsContent>

        <TabsContent value="nocturna" className="mt-5">
          <SectionCard title="Entradas Nocturnas" icon={<MoonStar className="size-4" />}>
            <p className="text-sm text-muted-foreground">
              Registro especializado para accesos entre 22:00 y 06:00. (Misma estructura que Acceso Vehicular con validaciones reforzadas.)
            </p>
          </SectionCard>
        </TabsContent>
      </Tabs>
    </div>
  )
}
