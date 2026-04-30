import { useNavigate } from "react-router-dom"
import { useState } from "react"
import { ArrowLeft, Plus, QrCode, Car, PersonStanding, User, Clock, RefreshCw } from "lucide-react"
import type { ReactElement } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BottomNav } from "./BottomNav"
import { cn } from "@/lib/utils"
import { useVisitas } from "./hooks/useVisitas"
import { useAuth } from "@/lib/auth-store"
import type { Visita, VisitaStatus } from "@/lib/types"

const statusConfig: Record<VisitaStatus, { label: string; color: string; bg: string }> = {
  activa: { label: "ACTIVA", color: "#16a34a", bg: "#f0fdf4" },
  programada: { label: "PROGRAMADA", color: "#ea580c", bg: "#fff7ed" },
  expirada: { label: "EXPIRADA", color: "#6b7280", bg: "#f9fafb" },
  cancelada: { label: "CANCELADA", color: "#9ca3af", bg: "#f3f4f6" },
}

const modeIcon: Record<string, ReactElement> = {
  vehicular: <Car size={12} className="inline" />,
  peatonal: <PersonStanding size={12} className="inline" />,
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

// tarjeta de una visita con icono segun status, info del invitado y badge de estado
function VisitaCard({ visita, onClick }: { visita: Visita; onClick: () => void }) {
  const st = statusConfig[visita.status]
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 bg-white rounded-2xl px-4 py-4 shadow-sm text-left active:scale-[0.98] transition-transform"
    >
      {/* Icon */}
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 text-lg"
        style={{ background: st.bg }}
      >
        {visita.status === "activa" ? (
          <User size={20} className="text-green-600" />
        ) : visita.status === "programada" ? (
          <Clock size={20} className="text-orange-600" />
        ) : (
          <RefreshCw size={20} className="text-gray-500" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-gray-900 truncate">{visita.invitado.nombre}</p>
        <p className="text-xs text-gray-400 mt-0.5">
          {visita.status === "activa"
            ? `Ingreso: ${formatFechaHora(visita.fechaHora)}`
            : visita.status === "programada"
            ? `Cita: ${formatFechaHora(visita.fechaHora)}`
            : `Fecha: ${formatFechaHora(visita.fechaHora)}`}
        </p>
        <p className="text-[11px] text-gray-400">
          {modeIcon[visita.tipoAcceso]} {visita.tipoAcceso === "vehicular" ? "Acceso vehicular" : "Acceso peatonal"} · {visita.puntoAcceso}
        </p>
      </div>

      {/* Right */}
      <div className="flex flex-col items-end gap-2 shrink-0">
        <span
          className="text-[10px] font-black px-2 py-0.5 rounded-full"
          style={{ color: st.color, background: st.bg }}
        >
          {st.label}
        </span>
        {visita.status === "programada" && (
          <QrCode className="size-4 text-gray-300" />
        )}
      </div>
    </button>
  )
}

// pantalla con historial y frecuentes de visitas y boton flotante para crear una nueva
export function VisitasScreen() {
  const navigate = useNavigate()
  const [tab, setTab] = useState("historial")
  const { data: visitas, loading, error } = useVisitas()
  const { user } = useAuth()
  const frecuentes = user?.profile?.estudiante?.frecuentes ?? []

  if (loading) {
    return <div className="p-6 text-sm text-gray-500">Cargando visitas…</div>
  }
  if (error) {
    return <div className="p-6 text-sm text-red-600">{error}</div>
  }
  if (visitas.length === 0) {
    return (
      <div className="min-h-screen bg-[#f5f5f5]">
        <div className="bg-white px-5 pt-12 pb-4">
          <div className="flex items-center gap-3 mb-4">
            <button onClick={() => navigate("/movil/dashboard")} className="text-gray-400">
              <ArrowLeft className="size-5" />
            </button>
            <h1 className="text-lg font-black text-gray-900">Visitas y Accesos</h1>
          </div>
        </div>
        <div className="p-8 text-center">
          <p className="text-gray-500 mb-4">Aún no tienes visitas registradas.</p>
          <button
            onClick={() => navigate("/movil/visitas/nueva")}
            className="px-5 py-2.5 rounded-lg text-white font-bold"
            style={{ background: "#ea580c" }}
          >
            Registrar primera visita
          </button>
        </div>
        <div className="h-[68px]" />
        <BottomNav />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      {/* Header */}
      <div className="bg-white px-5 pt-12 pb-4">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate("/movil/dashboard")} className="text-gray-400">
            <ArrowLeft className="size-5" />
          </button>
          <h1 className="text-lg font-black text-gray-900">Visitas y Accesos</h1>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full bg-gray-100 rounded-xl h-10">
            <TabsTrigger
              value="historial"
              className={cn(
                "flex-1 text-sm font-bold rounded-lg transition-all",
                tab === "historial" ? "bg-white text-gray-900 shadow-sm" : "text-gray-400"
              )}
            >
              Historial
            </TabsTrigger>
            <TabsTrigger
              value="frecuentes"
              className={cn(
                "flex-1 text-sm font-bold rounded-lg transition-all",
                tab === "frecuentes" ? "bg-white text-gray-900 shadow-sm" : "text-gray-400"
              )}
            >
              Frecuentes
            </TabsTrigger>
          </TabsList>

          {/* Historial tab */}
          <TabsContent value="historial" className="mt-0">
            <div className="px-0 pt-5 space-y-4">
              {/* Visitantes frecuentes row */}
              {frecuentes.length > 0 && (
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
                    Visitantes Frecuentes
                  </p>
                  <div className="flex gap-3 overflow-x-auto pb-1 -mx-5 px-5 scrollbar-none">
                    {frecuentes.map((v, idx) => (
                      <div key={`${v.iniciales}-${idx}`} className="flex flex-col items-center gap-1.5 shrink-0">
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center text-white font-black text-sm"
                          style={{
                            background: `hsl(${(v.iniciales.charCodeAt(0) * 40) % 360}, 60%, 50%)`,
                          }}
                        >
                          {v.iniciales}
                        </div>
                        <span className="text-[10px] text-gray-500 font-medium w-12 text-center truncate">
                          {v.nombre.split(" ")[0]}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Activity list */}
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
                  Actividad Reciente
                </p>
                <div className="space-y-2.5">
                  {visitas.map((v) => (
                    <VisitaCard
                      key={v._id}
                      visita={v}
                      onClick={() => navigate(`/movil/visitas/${v._id}`)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Frecuentes tab */}
          <TabsContent value="frecuentes" className="mt-0">
            <div className="pt-5 space-y-2.5">
              {frecuentes.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">
                  No tienes visitantes frecuentes.
                </p>
              ) : (
                frecuentes.map((v, idx) => (
                  <div
                    key={`${v.iniciales}-${idx}`}
                    className="flex items-center gap-4 bg-white rounded-2xl px-4 py-4 shadow-sm"
                  >
                    <div
                      className="w-11 h-11 rounded-full flex items-center justify-center text-white font-black text-sm shrink-0"
                      style={{
                        background: `hsl(${(v.iniciales.charCodeAt(0) * 40) % 360}, 60%, 50%)`,
                      }}
                    >
                      {v.iniciales}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-gray-900">{v.nombre}</p>
                      <p className="text-xs text-gray-400">Visitante frecuente</p>
                    </div>
                    <button
                      onClick={() => navigate("/movil/visitas/nueva")}
                      className="text-xs font-bold px-3 py-1.5 rounded-lg"
                      style={{ background: "#fff3ee", color: "#ea580c" }}
                    >
                      Invitar
                    </button>
                  </div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Floating action button */}
      <button
        onClick={() => navigate("/movil/visitas/nueva")}
        className="fixed z-40 flex items-center justify-center w-14 h-14 rounded-full shadow-lg"
        style={{
          bottom: 88,
          right: "max(16px, calc(50% - 195px + 16px))",
          background: "linear-gradient(135deg,#ea580c,#c2410c)",
        }}
      >
        <Plus className="size-6 text-white" />
      </button>

      <div className="h-[68px]" />
      <BottomNav />
    </div>
  )
}
