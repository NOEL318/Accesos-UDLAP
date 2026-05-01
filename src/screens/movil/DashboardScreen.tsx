import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { QrCode as QrCodeIcon, Users, ChevronRight, Bell, CheckCircle2 } from "lucide-react"
import { BottomNav } from "./BottomNav"
import { QrCode } from "./QrCode"
import { useAuth } from "@/lib/auth-store"
import { useVisitas } from "./hooks/useVisitas"

const quickActions = [
  { label: "Código QR", icon: QrCodeIcon, path: "/movil/qr-nfc", color: "#ea580c" },
  { label: "Visitas", icon: Users, path: "/movil/visitas", color: "#059669" },
]

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

// pantalla del dashboard movil con saludo, accesos rapidos, proxima visita y servicios
export function DashboardScreen() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: visitas, loading } = useVisitas()
  const [walletToast, setWalletToast] = useState(false)

  useEffect(() => {
    if (!walletToast) return
    const id = setTimeout(() => setWalletToast(false), 2200)
    return () => clearTimeout(id)
  }, [walletToast])

  const proximaVisita =
    visitas.find((v) => v.status === "activa") ??
    visitas.find((v) => v.status === "programada") ??
    null

  const nombre = user?.nombre ?? ""
  const apellido = user?.apellido ?? ""
  const studentId = user?.profile?.estudiante?.studentId ?? user?.id ?? ""
  const tipoLabel = user?.role === "estudiante" ? "Estudiante Licenciatura" : (user?.role ?? "")

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      {walletToast && (
        <div
          role="status"
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white shadow-lg"
          style={{ background: "#0f172a" }}
        >
          <CheckCircle2 className="size-4 text-green-400" />
          Añadido correctamente a Wallet
        </div>
      )}
      {/* Header */}
      <div
        className="px-5 pt-12 pb-6 flex items-center justify-between"
        style={{ background: "white" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center text-white font-black text-base"
            style={{ background: "linear-gradient(135deg,#1e3a5f,#0f2d5e)" }}
          >
            {nombre[0] ?? ""}
            {apellido[0] ?? ""}
          </div>
          <div>
            <p className="font-black text-gray-900 text-base leading-tight">
              {nombre} {apellido}
            </p>
            <p className="text-xs text-gray-400 font-medium">ID: {studentId}</p>
            <span
              className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-0.5"
              style={{ background: "#fff3ee", color: "#ea580c" }}
            >
              {tipoLabel}
            </span>
          </div>
        </div>
        <button className="relative w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center">
          <Bell className="size-4.5 text-gray-500" />
          <span
            className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
            style={{ background: "#ea580c" }}
          />
        </button>
      </div>

      <div className="px-5 py-5 space-y-4">
        {/* Quick actions */}
        <div className="flex gap-3">
          {quickActions.map(({ label, icon: Icon, path, color }) => (
            <button
              key={label}
              onClick={() => navigate(path)}
              className="flex-1 flex flex-col items-center gap-2 py-4 rounded-2xl bg-white shadow-sm transition-transform active:scale-95"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: color + "18" }}
              >
                <Icon className="size-5" style={{ color }} />
              </div>
              <span className="text-[11px] font-bold text-gray-600">{label}</span>
            </button>
          ))}
        </div>

        {/* Próxima visita */}
        <div className="w-full rounded-2xl bg-white shadow-sm p-4">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
            Próxima visita
          </p>
          {loading ? (
            <p className="text-sm text-gray-400">Cargando…</p>
          ) : proximaVisita ? (
            <button
              onClick={() => navigate(`/movil/visitas/${proximaVisita._id}`)}
              className="w-full flex items-center gap-3 text-left"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "#fff3ee" }}
              >
                <Users className="size-5" style={{ color: "#ea580c" }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">
                  {proximaVisita.invitado.nombre}
                </p>
                <p className="text-xs text-gray-400">
                  {formatFechaHora(proximaVisita.fechaHora)} · {proximaVisita.puntoAcceso}
                </p>
              </div>
              <ChevronRight className="size-4 text-gray-300 shrink-0" />
            </button>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-gray-500">No hay visitas próximas.</p>
              <button
                onClick={() => navigate("/movil/visitas/nueva")}
                className="text-xs font-bold px-3 py-1.5 rounded-lg whitespace-nowrap"
                style={{ background: "#fff3ee", color: "#ea580c" }}
              >
                Registrar
              </button>
            </div>
          )}
        </div>

        {/* Apple Wallet card */}
        <button
          onClick={() => navigate("/movil/qr-nfc")}
          className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white shadow-sm"
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "#f5ebe0" }}
          >
            <QrCodeIcon className="size-5" style={{ color: "#ea580c" }} />
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-black text-gray-800">Apple Wallet</p>
            <p className="text-xs text-gray-400">Tu credencial digital para el campus</p>
          </div>
          <div className="shrink-0">
            <QrCode size={40} color="#ea580c" />
          </div>
        </button>

        {/* Wallet add button */}
        <button
          onClick={() => setWalletToast(true)}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white text-sm font-bold"
          style={{ background: "linear-gradient(135deg,#1c1c1e,#2c2c2e)" }}
        >
          <span className="text-lg leading-none">⊕</span>
          Añadir a Apple Wallet
        </button>

        {/* Recent activity preview */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Accesos Recientes
            </p>
            <button
              onClick={() => navigate("/movil/visitas")}
              className="flex items-center gap-1 text-xs font-semibold"
              style={{ color: "#ea580c" }}
            >
              Ver todo
              <ChevronRight className="size-3.5" />
            </button>
          </div>
          <div className="space-y-2">
            {[
              { label: "Entrada Puerta Principal", time: "Hoy, 08:12 AM", dot: "#16a34a" },
              { label: "Salida Puerta Principal", time: "Ayer, 07:45 PM", dot: "#6b7280" },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 shadow-sm"
              >
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: item.dot }} />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-800">{item.label}</p>
                  <p className="text-xs text-gray-400">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="h-[68px]" />
      <BottomNav />
    </div>
  )
}
