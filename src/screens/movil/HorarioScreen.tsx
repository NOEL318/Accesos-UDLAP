import { useNavigate } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { BottomNav } from "./BottomNav"
import { useHorario } from "./hooks/useHorario"

const DAYS = ["Lu.", "Ma.", "Mi.", "Ju.", "Vi.", "Sá."]
const START_HOUR = 7
const END_HOUR = 19
const TOTAL_HOURS = END_HOUR - START_HOUR
const SLOT_HEIGHT = 52 // px per hour

// Hours to display on left axis
const timeLabels = Array.from(
  { length: TOTAL_HOURS + 1 },
  (_, i) => {
    const h = START_HOUR + i
    if (h < 12) return `${h} am.`
    if (h === 12) return `12 am.`
    return `${h - 12} p.m.`
  }
)

// pantalla con el horario semanal del estudiante en formato de cuadricula por hora y dia
export function HorarioScreen() {
  const navigate = useNavigate()
  const { data: clases, loading } = useHorario()
  const totalHeight = TOTAL_HOURS * SLOT_HEIGHT

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="px-5 pt-12 pb-4 flex items-center gap-3 bg-white">
        <button onClick={() => navigate("/movil/dashboard")} className="text-gray-400">
          <ArrowLeft className="size-5" />
        </button>
        <h1 className="text-lg font-black text-gray-900">Horario</h1>
      </div>

      {/* Day headers */}
      <div className="flex bg-white border-b border-gray-100 px-5">
        <div className="w-10 shrink-0" /> {/* time column spacer */}
        {DAYS.map((d) => (
          <div key={d} className="flex-1 text-center py-2 text-xs font-bold text-gray-500">
            {d}
          </div>
        ))}
      </div>

      {/* Grid scroll area */}
      <div className="flex-1 overflow-y-auto pb-[68px]">
        {loading && clases.length === 0 && (
          <div className="px-5 py-6 text-center text-xs font-bold text-gray-400">
            Cargando…
          </div>
        )}
        <div className="flex px-5 pt-2">
          {/* Time axis */}
          <div className="w-10 shrink-0 relative" style={{ height: totalHeight }}>
            {timeLabels.map((label, i) => (
              <div
                key={label}
                className="absolute left-0 text-[9px] font-medium text-gray-400 -translate-y-2 leading-none"
                style={{ top: i * SLOT_HEIGHT }}
              >
                {label}
              </div>
            ))}
          </div>

          {/* Day columns */}
          <div className="flex-1 flex relative" style={{ height: totalHeight }}>
            {/* Horizontal hour lines */}
            {timeLabels.map((_, i) => (
              <div
                key={i}
                className="absolute left-0 right-0 border-t border-gray-100"
                style={{ top: i * SLOT_HEIGHT }}
              />
            ))}

            {/* Day columns with class blocks */}
            {DAYS.map((_, dayIdx) => (
              <div key={dayIdx} className="flex-1 relative">
                {clases
                  .filter((c) => c.dia === dayIdx)
                  .map((clase, ci) => {
                    const top = (clase.inicio - START_HOUR) * SLOT_HEIGHT
                    const height = (clase.fin - clase.inicio) * SLOT_HEIGHT - 2
                    return (
                      <div
                        key={ci}
                        className="absolute left-0.5 right-0.5 rounded-lg flex flex-col items-center justify-center overflow-hidden cursor-pointer hover:brightness-95 transition-all"
                        style={{
                          top,
                          height,
                          background: "linear-gradient(160deg,#f97316,#ea580c)",
                        }}
                      >
                        {height > 28 && (
                          <p className="text-[8px] font-black text-white text-center px-1 leading-tight">
                            {clase.materia}
                          </p>
                        )}
                        {height > 44 && (
                          <p className="text-[7px] text-white/70 text-center px-1 leading-tight mt-0.5">
                            {clase.salon}
                          </p>
                        )}
                      </div>
                    )
                  })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
