import { useNavigate } from "react-router-dom"
import { ArrowLeft, Wifi } from "lucide-react"
import { BottomNav } from "./BottomNav"
import { QRCodeSVG } from "qrcode.react"
import { useVisitas } from "./hooks/useVisitas"
import { useAuth } from "@/lib/auth-store"

// pantalla del id digital con el QR de la visita activa y la zona NFC
export function QrNfcScreen() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: visitas, loading } = useVisitas()
  const visitaActiva =
    visitas.find((v) => v.status === "activa") ??
    visitas.find((v) => v.status === "programada") ??
    null

  const nombre = user?.nombre ?? ""
  const apellido = user?.apellido ?? ""
  const studentId = user?.profile?.estudiante?.studentId ?? user?.id ?? ""
  const tipoLabel = user?.role === "estudiante" ? "Estudiante Licenciatura" : (user?.role ?? "")

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="px-5 pt-12 pb-4 flex items-center gap-3">
        <button onClick={() => navigate("/movil/dashboard")} className="text-gray-400">
          <ArrowLeft className="size-5" />
        </button>
        <h1 className="text-lg font-black text-gray-900">Código QR y NFC</h1>
      </div>

      <div className="flex flex-col items-center px-6 pt-4 gap-8">
        {/* Status pill */}
        <div
          className="flex items-center gap-2 px-4 py-1.5 rounded-full"
          style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}
        >
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs font-bold text-green-700">Activo</span>
        </div>

        {/* QR code */}
        {loading ? (
          <div className="text-sm text-gray-400">Cargando…</div>
        ) : visitaActiva ? (
          <div className="flex flex-col items-center gap-4">
            <QRCodeSVG
              value={visitaActiva.qrToken}
              size={240}
              level="M"
              bgColor="#ffffff"
              fgColor="#0a1528"
            />
            <div className="text-center">
              <p className="font-bold text-gray-900">{visitaActiva.invitado.nombre}</p>
              <p className="text-xs text-gray-500">{visitaActiva.puntoAcceso}</p>
              <p className="text-[10px] text-gray-400 mt-1 break-all max-w-[240px]">
                Token: {visitaActiva.qrToken.slice(0, 8)}…
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center p-6">
            <p className="text-gray-500 mb-3">No tienes visitas activas.</p>
          </div>
        )}

        {/* NFC section */}
        <div
          className="w-full rounded-2xl p-5 flex flex-col items-center gap-3"
          style={{ background: "#fff7ed", border: "1px solid #fed7aa" }}
        >
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{ background: "#ea580c" }}
          >
            <Wifi className="size-6 text-white rotate-90" />
          </div>
          <div className="text-center">
            <p className="text-sm font-black text-gray-800">Acercar al dispositivo</p>
            <p className="text-xs text-gray-500 mt-1">
              Pon la parte superior del dispositivo cerca del lector NFC del torniquete
            </p>
          </div>
        </div>

        {/* Student info */}
        <div className="w-full bg-gray-50 rounded-2xl p-4 flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center text-white font-black text-sm shrink-0"
            style={{ background: "linear-gradient(135deg,#1e3a5f,#0f2d5e)" }}
          >
            {nombre[0] ?? ""}{apellido[0] ?? ""}
          </div>
          <div>
            <p className="text-sm font-black text-gray-800">
              {nombre} {apellido}
            </p>
            <p className="text-xs text-gray-500">ID: {studentId} · {tipoLabel}</p>
          </div>
        </div>

        {/* Apple Wallet */}
        <button
          className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl text-white font-bold text-sm"
          style={{ background: "linear-gradient(135deg,#1c1c1e,#2c2c2e)" }}
        >
          <span className="text-lg leading-none">⊕</span>
          Añadir a Apple Wallet
        </button>
      </div>

      <div className="h-[68px]" />
      <BottomNav />
    </div>
  )
}
