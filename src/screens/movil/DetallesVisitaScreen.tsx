import { useNavigate, useParams } from "react-router-dom"
import { useState } from "react"
import { ArrowLeft, MapPin, QrCode } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { visitasMock } from "./data"
import { cn } from "@/lib/utils"
import { QrCode as QrCodeSvg } from "./QrCode"

const statusConfig = {
  activo: { label: "ACTIVO", color: "#16a34a", bg: "#f0fdf4" },
  expirado: { label: "EXPIRADO", color: "#6b7280", bg: "#f9fafb" },
  programado: { label: "PROGRAMADO", color: "#ea580c", bg: "#fff7ed" },
}

export function DetallesVisitaScreen() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [showQr, setShowQr] = useState(false)

  const visita = visitasMock.find((v) => v.id === id) ?? visitasMock[0]
  const st = statusConfig[visita.status]

  return (
    <>
      <div className="min-h-screen bg-[#f5f5f5]">
        {/* Header */}
        <div className="bg-white px-5 pt-12 pb-4 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-gray-400">
            <ArrowLeft className="size-5" />
          </button>
          <h1 className="text-lg font-black text-gray-900">Detalles de la Visita</h1>
        </div>

        <div className="px-5 py-5 space-y-4">
          {/* Status badge */}
          <div className="flex justify-start">
            <span
              className="text-[11px] font-black px-3 py-1 rounded-full"
              style={{ color: st.color, background: st.bg }}
            >
              {st.label}
            </span>
          </div>

          {/* Detalles card */}
          <div className="bg-white rounded-2xl p-4 shadow-sm space-y-4">
            <h2 className="text-sm font-black text-gray-800">Detalles de la Visita</h2>

            {/* Tipo */}
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                Tipo de visita
              </p>
              <div className="flex rounded-xl overflow-hidden border border-gray-200">
                {(["visita", "personal"] as const).map((t) => (
                  <div
                    key={t}
                    className={cn(
                      "flex-1 py-2.5 text-sm font-bold text-center",
                      visita.tipo === t ? "text-white" : "text-gray-400 bg-gray-50"
                    )}
                    style={visita.tipo === t ? { background: "#ea580c" } : {}}
                  >
                    {t === "visita" ? "De visita" : "Personal"}
                  </div>
                ))}
              </div>
            </div>

            {/* Nombre */}
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                Nombre del visitante
              </p>
              <p className="text-sm font-semibold text-gray-800">{visita.nombre}</p>
            </div>

            {/* Fecha + Hora */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Fecha
                </p>
                <p className="text-sm font-semibold text-gray-800">{visita.fecha}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Hora estimada
                </p>
                <p className="text-sm font-semibold text-gray-800">{visita.hora}</p>
              </div>
            </div>

            {/* Múltiples entradas */}
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-gray-700">Múltiples entradas habilitadas</p>
              <div
                className="w-10 h-6 rounded-full flex items-center px-1"
                style={{ background: visita.multiplesEntradas ? "#ea580c" : "#e5e7eb" }}
              >
                <div
                  className="w-4 h-4 rounded-full bg-white shadow transition-transform"
                  style={{ transform: visita.multiplesEntradas ? "translateX(16px)" : "none" }}
                />
              </div>
            </div>
          </div>

          {/* Configuración de Acceso */}
          <div className="bg-white rounded-2xl p-4 shadow-sm space-y-4">
            <h2 className="text-sm font-black text-gray-800">Configuración de Acceso</h2>

            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                Punto de Acceso (Puerta)
              </p>
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <MapPin className="size-4 text-gray-400" />
                {visita.puntoAcceso}
              </div>
            </div>

            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                Modo de entrada
              </p>
              <div className="flex rounded-xl overflow-hidden border border-gray-200">
                {([
                  { value: "automovil", label: "🚗 Automóvil" },
                  { value: "peatonal", label: "🚶 Peatonal" },
                ] as const).map(({ value, label }) => (
                  <div
                    key={value}
                    className={cn(
                      "flex-1 py-2.5 text-sm font-bold text-center",
                      visita.modoEntrada === value ? "text-white" : "text-gray-400 bg-gray-50"
                    )}
                    style={visita.modoEntrada === value ? { background: "#ea580c" } : {}}
                  >
                    {label}
                  </div>
                ))}
              </div>
            </div>

            <p className="text-xs text-gray-400 leading-relaxed">
              ⓘ Tu equipo de cómputo, cámara u otros equipos de laboratorio deberán registrarse de forma adicional.
            </p>
          </div>

          {/* Action button */}
          <Button
            onClick={() => setShowQr(true)}
            className="w-full h-13 rounded-xl text-white font-bold text-base gap-3"
            style={{ background: "linear-gradient(135deg,#ea580c,#c2410c)", border: "none", height: 52 }}
          >
            <QrCode className="size-5" />
            Ver Código de Acceso
          </Button>
        </div>
      </div>

      {/* QR Sheet */}
      <Sheet open={showQr} onOpenChange={setShowQr}>
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
              onClick={() => setShowQr(false)}
              className="mt-6 w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600"
            >
              ✕
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
