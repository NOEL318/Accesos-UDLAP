import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, QrCode, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { puntosAcceso } from "./data"
import { QrCode as QrCodeSvg } from "./QrCode"

type VisitaTipo = "visita" | "personal"
type ModoEntrada = "automovil" | "peatonal"

export function NuevaVisitaScreen() {
  const navigate = useNavigate()
  const [tipo, setTipo] = useState<VisitaTipo>("visita")
  const [nombre, setNombre] = useState("")
  const [fecha, setFecha] = useState("")
  const [hora, setHora] = useState("")
  const [multiplesEntradas, setMultiplesEntradas] = useState(false)
  const [puntoAcceso, setPuntoAcceso] = useState(puntosAcceso[0])
  const [modo, setModo] = useState<ModoEntrada>("automovil")
  const [showPuntos, setShowPuntos] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const handleGenerar = () => {
    setShowSuccess(true)
  }

  return (
    <>
      <div className="min-h-screen bg-[#f5f5f5]">
        {/* Header */}
        <div className="bg-white px-5 pt-12 pb-4 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-gray-400">
            <ArrowLeft className="size-5" />
          </button>
          <h1 className="text-lg font-black text-gray-900">Registrar Visita</h1>
        </div>

        <div className="px-5 py-5 space-y-5">
          {/* Detalles de la Visita */}
          <div className="bg-white rounded-2xl p-4 shadow-sm space-y-4">
            <h2 className="text-sm font-black text-gray-800">Detalles de la Visita</h2>

            {/* Tipo */}
            <div>
              <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">
                Tipo de visita
              </Label>
              <div className="flex rounded-xl overflow-hidden border border-gray-200">
                {(["visita", "personal"] as VisitaTipo[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTipo(t)}
                    className={cn(
                      "flex-1 py-2.5 text-sm font-bold transition-colors",
                      tipo === t
                        ? "text-white"
                        : "text-gray-500 bg-gray-50"
                    )}
                    style={tipo === t ? { background: "#ea580c" } : {}}
                  >
                    {t === "visita" ? "De visita" : "Personal"}
                  </button>
                ))}
              </div>
            </div>

            {/* Nombre */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Nombre del visitante
              </Label>
              <Input
                placeholder="Nombre Apellido"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="h-11 rounded-xl border-gray-200 text-sm"
              />
            </div>

            {/* Fecha + Hora */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Fecha</Label>
                <Input
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="h-11 rounded-xl border-gray-200 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Hora estimada
                </Label>
                <Input
                  type="time"
                  value={hora}
                  onChange={(e) => setHora(e.target.value)}
                  className="h-11 rounded-xl border-gray-200 text-sm"
                />
              </div>
            </div>

            {/* Múltiples entradas */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-gray-700">Múltiples entradas habilitadas</p>
                <p className="text-xs text-gray-400">El visitante puede entrar más de una vez</p>
              </div>
              <Switch
                checked={multiplesEntradas}
                onCheckedChange={setMultiplesEntradas}
                style={multiplesEntradas ? { background: "#ea580c" } : {}}
              />
            </div>
          </div>

          {/* Configuración de Acceso */}
          <div className="bg-white rounded-2xl p-4 shadow-sm space-y-4">
            <h2 className="text-sm font-black text-gray-800">Configuración de Acceso</h2>

            {/* Punto de acceso */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Punto de Acceso (Puerta)
              </Label>
              <button
                onClick={() => setShowPuntos((v) => !v)}
                className="w-full h-11 flex items-center justify-between px-4 rounded-xl border border-gray-200 bg-gray-50 text-sm font-medium text-gray-700"
              >
                <span className="flex items-center gap-2">
                  <MapPin className="size-4 text-gray-400" />
                  {puntoAcceso}
                </span>
                <span className="text-gray-400">{showPuntos ? "▲" : "▼"}</span>
              </button>

              {showPuntos && (
                <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-md">
                  {puntosAcceso.map((p) => (
                    <button
                      key={p}
                      onClick={() => { setPuntoAcceso(p); setShowPuntos(false) }}
                      className={cn(
                        "w-full text-left px-4 py-3 flex items-center gap-3 text-sm transition-colors",
                        p === puntoAcceso
                          ? "bg-orange-50 text-orange-700 font-bold"
                          : "text-gray-700 hover:bg-gray-50"
                      )}
                    >
                      <MapPin className="size-4 text-gray-400" />
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Modo entrada */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Modo de entrada
              </Label>
              <div className="flex rounded-xl overflow-hidden border border-gray-200">
                {([
                  { value: "automovil", label: "🚗 Automóvil" },
                  { value: "peatonal", label: "🚶 Peatonal" },
                ] as { value: ModoEntrada; label: string }[]).map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setModo(value)}
                    className={cn(
                      "flex-1 py-2.5 text-sm font-bold transition-colors",
                      modo === value ? "text-white" : "text-gray-500 bg-gray-50"
                    )}
                    style={modo === value ? { background: "#ea580c" } : {}}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Info note */}
            <p className="text-xs text-gray-400 leading-relaxed">
              ⓘ Tu equipo de cómputo, cámara u otros equipos de laboratorio deberán registrarse de forma adicional.
            </p>
          </div>

          {/* Generate button */}
          <Button
            onClick={handleGenerar}
            className="w-full h-13 rounded-xl text-white font-bold text-base gap-3"
            style={{ background: "linear-gradient(135deg,#ea580c,#c2410c)", border: "none", height: 52 }}
          >
            <QrCode className="size-5" />
            Generar Código de Acceso
          </Button>
        </div>
      </div>

      {/* Success Sheet */}
      <Sheet open={showSuccess} onOpenChange={setShowSuccess}>
        <SheetContent
          side="bottom"
          className="rounded-t-3xl border-0 px-6 pt-2 pb-10"
          style={{ background: "#f5f5f5" }}
        >
          <div className="w-10 h-1 rounded-full bg-gray-300 mx-auto mb-6" />
          <div className="flex flex-col items-center text-center">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
              style={{ background: "#f0fdf4" }}
            >
              <span className="text-3xl">👤</span>
            </div>
            <h2 className="text-lg font-black text-gray-900 mb-1">
              Visita registrada
              <br />
              correctamente
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              Comparte este código QR con tu visita para agilizar su acceso
            </p>

            <QrCodeSvg size={180} color="#ea580c" />

            <button
              onClick={() => { setShowSuccess(false); navigate("/movil/visitas") }}
              className="mt-6 w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center"
            >
              ✕
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
