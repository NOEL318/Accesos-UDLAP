import { useNavigate, useParams } from "react-router-dom"
import { useState } from "react"
import { ArrowLeft, MapPin, QrCode, Car, PersonStanding, User, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { QrCode as QrCodeSvg } from "./QrCode"
import { QRCodeSVG } from "qrcode.react"
import { useVisita } from "./hooks/useVisita"
import type { VisitaStatus } from "@/lib/types"

const statusConfig: Record<VisitaStatus, { label: string; color: string; bg: string }> = {
  activa: { label: "ACTIVA", color: "#16a34a", bg: "#f0fdf4" },
  programada: { label: "PROGRAMADA", color: "#ea580c", bg: "#fff7ed" },
  expirada: { label: "EXPIRADA", color: "#6b7280", bg: "#f9fafb" },
  cancelada: { label: "CANCELADA", color: "#9ca3af", bg: "#f3f4f6" },
}

// formatea una fecha ISO como fecha y hora corta para mostrar en UI
function formatFechaHora(iso: string): string {
  try {
    return new Date(iso).toLocaleString("es-MX", {
      dateStyle: "short",
      timeStyle: "short",
    })
  } catch {
    return iso
  }
}

// pantalla con el detalle de una visita y opcion de cancelar o ver el QR
export function DetallesVisitaScreen() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { data: visita, loading, error, cancel } = useVisita(id)
  const [showQr, setShowQr] = useState(false)

  if (loading) return <div className="p-6 text-sm text-gray-500">Cargando…</div>
  if (error || !visita) return <div className="p-6 text-sm text-red-600">{error ?? "No encontrada"}</div>

  const st = statusConfig[visita.status]
  const tipo = visita.invitado.categoria === "personal" ? "personal" : "visita"
  const modoEntrada = visita.tipoAcceso === "vehicular" ? "automovil" : "peatonal"
  const fechaStr = formatFechaHora(visita.fechaHora)
  const fechaParts = fechaStr.split(", ")
  const fechaSolo = fechaParts[0] ?? fechaStr
  const horaSolo = fechaParts[1] ?? ""

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
                      tipo === t ? "text-white" : "text-gray-400 bg-gray-50"
                    )}
                    style={tipo === t ? { background: "#ea580c" } : {}}
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
              <p className="text-sm font-semibold text-gray-800">{visita.invitado.nombre}</p>
            </div>

            {/* Fecha + Hora */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Fecha
                </p>
                <p className="text-sm font-semibold text-gray-800">{fechaSolo}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Hora estimada
                </p>
                <p className="text-sm font-semibold text-gray-800">{horaSolo}</p>
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

            {visita.comentarios && (
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Comentarios
                </p>
                <p className="text-sm text-gray-700">{visita.comentarios}</p>
              </div>
            )}
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
                  { value: "automovil", label: "Automóvil", icon: "car" },
                  { value: "peatonal", label: "Peatonal", icon: "walk" },
                ] as const).map(({ value, label, icon }) => (
                  <div
                    key={value}
                    className={cn(
                      "flex-1 py-2.5 text-sm font-bold text-center flex items-center justify-center gap-2",
                      modoEntrada === value ? "text-white" : "text-gray-400 bg-gray-50"
                    )}
                    style={modoEntrada === value ? { background: "#ea580c" } : {}}
                  >
                    {icon === "car" ? <Car size={16} /> : <PersonStanding size={16} />}
                    {label}
                  </div>
                ))}
              </div>
            </div>

            <p className="text-xs text-gray-400 leading-relaxed">
              ⓘ Tu equipo de cómputo, cámara u otros equipos de laboratorio deberán registrarse de forma adicional.
            </p>
          </div>

          {/* Action buttons */}
          <Button
            onClick={() => setShowQr(true)}
            className="w-full h-13 rounded-xl text-white font-bold text-base gap-3"
            style={{ background: "linear-gradient(135deg,#ea580c,#c2410c)", border: "none", height: 52 }}
          >
            <QrCode className="size-5" />
            Ver Código de Acceso
          </Button>

          <button
            onClick={async () => {
              if (window.confirm("¿Cancelar esta visita?")) {
                await cancel()
                navigate("/movil/visitas")
              }
            }}
            disabled={visita.status === "cancelada"}
            className="w-full px-4 py-2 rounded-lg bg-red-50 text-red-700 font-semibold border border-red-200 disabled:opacity-50"
          >
            {visita.status === "cancelada" ? "Cancelada" : "Cancelar visita"}
          </button>
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
              <User size={32} className="text-green-600" />
            </div>
            <h2 className="text-lg font-black text-gray-900 mb-1">
              Visita registrada
              <br />
              correctamente
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              Comparte este código QR con tu visita para agilizar su acceso
            </p>

            {visita.qrToken ? (
              <QRCodeSVG
                value={visita.qrToken}
                size={200}
                level="M"
                bgColor="#ffffff"
                fgColor="#0a1528"
              />
            ) : (
              <QrCodeSvg size={180} color="#ea580c" />
            )}

            <button
              onClick={() => setShowQr(false)}
              className="mt-6 w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600"
            >
              <X size={16} />
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
