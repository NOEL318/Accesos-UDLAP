import { useNavigate } from "react-router-dom"
import { useState } from "react"
import { ArrowLeft, X, ChevronLeft, ChevronRight, Smartphone } from "lucide-react"

// Glob all screenshots from /base/ at project root
const imageModules = import.meta.glob("/base/*.png", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>

// Human-readable names keyed by filename (without extension)
const displayNames: Record<string, string> = {
  "udlaploginconaccesorápido": "Login con Acceso Rápido",
  "udlapdashboardestudiante": "Dashboard Estudiante",
  "horario": "Horario",
  "perfil": "Perfil",
  "gestióndevisitas": "Gestión de Visitas",
  "formularioderegistrodevisitas": "Formulario de Registro",
  "detallesvisita": "Detalles de Visita",
  "visita_registrada": "Visita Registrada",
  "actividadreciente_visitas": "Actividad Reciente",
  "previsualizaciónqrynfc": "Prev. QR y NFC",
  "comedoryrecargas": "Comedor y Recargas",
  "bibliotecaudlap": "Biblioteca UDLAP",
  "component1": "Componente 1",
  "component2": "Componente 2",
}

// Preferred display order
const order = [
  "udlaploginconaccesorápido",
  "udlapdashboardestudiante",
  "horario",
  "perfil",
  "gestióndevisitas",
  "formularioderegistrodevisitas",
  "detallesvisita",
  "visita_registrada",
  "actividadreciente_visitas",
  "previsualizaciónqrynfc",
  "comedoryrecargas",
  "bibliotecaudlap",
  "component1",
  "component2",
]

function getBaseName(path: string) {
  return path.split("/").pop()?.replace(".png", "") ?? ""
}

function getDisplayName(path: string) {
  const base = getBaseName(path)
  return displayNames[base] ?? base
}

// Build sorted screen list
const allScreens = Object.entries(imageModules)
  .map(([path, url]) => ({
    path,
    url: url as string,
    name: getDisplayName(path),
    base: getBaseName(path),
  }))
  .sort((a, b) => {
    const ai = order.indexOf(a.base)
    const bi = order.indexOf(b.base)
    if (ai === -1 && bi === -1) return a.name.localeCompare(b.name)
    if (ai === -1) return 1
    if (bi === -1) return -1
    return ai - bi
  })

export function MovilGallery() {
  const navigate = useNavigate()
  const [selected, setSelected] = useState<number | null>(null)

  const openModal = (i: number) => setSelected(i)
  const closeModal = () => setSelected(null)
  const prev = () => setSelected((s) => (s !== null && s > 0 ? s - 1 : s))
  const next = () =>
    setSelected((s) =>
      s !== null && s < allScreens.length - 1 ? s + 1 : s
    )

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "linear-gradient(160deg, #060d1f 0%, #0a1528 100%)" }}
    >
      {/* Header */}
      <header
        className="flex items-center gap-4 px-6 py-4 shrink-0"
        style={{
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          background: "rgba(0,0,0,0.3)",
          backdropFilter: "blur(12px)",
        }}
      >
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-white/50 hover:text-white transition-colors duration-200 text-sm font-medium"
        >
          <ArrowLeft className="size-4" />
          Volver
        </button>

        <div className="w-px h-5 bg-white/10" />

        <div className="flex items-center gap-2.5">
          <div
            className="flex items-center justify-center w-7 h-7 rounded-lg"
            style={{ background: "rgba(234,88,12,0.2)", border: "1px solid rgba(234,88,12,0.3)" }}
          >
            <Smartphone className="size-3.5" style={{ color: "#ea580c" }} />
          </div>
          <div>
            <h1 className="text-white font-bold text-sm leading-none">
              App Móvil
            </h1>
            <p className="text-white/35 text-[11px] mt-0.5">
              {allScreens.length} pantallas
            </p>
          </div>
        </div>

        <span className="ml-auto text-white/20 text-xs uppercase tracking-widest font-medium">
          UDLAP 2026
        </span>
      </header>

      {/* Grid */}
      <main className="flex-1 px-6 py-8 overflow-y-auto">
        {allScreens.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <Smartphone className="size-12 text-white/20" />
            <p className="text-white/40 text-sm">No se encontraron pantallas</p>
            <p className="text-white/20 text-xs">
              Asegúrate de que la carpeta /base contiene imágenes PNG
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-5">
            {allScreens.map((screen, i) => (
              <ScreenCard
                key={screen.path}
                screen={screen}
                index={i}
                onClick={() => openModal(i)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Modal */}
      {selected !== null && (
        <ScreenModal
          screen={allScreens[selected]}
          index={selected}
          total={allScreens.length}
          onClose={closeModal}
          onPrev={prev}
          onNext={next}
        />
      )}
    </div>
  )
}

// ── Screen card ────────────────────────────────────────────────────────────

interface ScreenCardProps {
  screen: { url: string; name: string }
  index: number
  onClick: () => void
}

function ScreenCard({ screen, index, onClick }: ScreenCardProps) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      className="flex flex-col items-center gap-3 cursor-pointer"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        animation: `fadeUp 0.4s ease ${index * 40}ms both`,
      }}
    >
      {/* Phone frame */}
      <div
        className="relative w-full transition-all duration-300"
        style={{
          transform: hovered ? "translateY(-4px) scale(1.02)" : "none",
        }}
      >
        <PhoneFrame src={screen.url} alt={screen.name} hovered={hovered} />
      </div>

      {/* Label */}
      <p
        className="text-center text-[11px] font-semibold leading-snug transition-colors duration-200"
        style={{
          color: hovered ? "rgba(255,255,255,0.75)" : "rgba(255,255,255,0.4)",
          maxWidth: "100%",
        }}
      >
        {screen.name}
      </p>
    </div>
  )
}

// ── Phone frame ────────────────────────────────────────────────────────────

function PhoneFrame({
  src,
  alt,
  hovered,
  large,
}: {
  src: string
  alt: string
  hovered?: boolean
  large?: boolean
}) {
  return (
    <div
      className="relative mx-auto overflow-hidden"
      style={{
        width: large ? "280px" : "100%",
        aspectRatio: "9 / 19.5",
        borderRadius: large ? "44px" : "24px",
        background: "#0a0a0a",
        border: `${large ? "8px" : "4px"} solid ${hovered ? "#333" : "#1a1a1a"}`,
        boxShadow: hovered
          ? "0 0 0 1px #444, 0 30px 60px rgba(0,0,0,0.7), 0 0 40px rgba(234,88,12,0.15)"
          : "0 0 0 1px #252525, 0 12px 30px rgba(0,0,0,0.5)",
        transition: "all 0.3s ease",
      }}
    >
      {/* Notch */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 z-10"
        style={{
          width: large ? "96px" : "40%",
          height: large ? "24px" : "12px",
          background: "#000",
          borderRadius: "0 0 16px 16px",
        }}
      />

      {/* Screenshot */}
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover object-top"
        loading="lazy"
      />
    </div>
  )
}

// ── Modal ──────────────────────────────────────────────────────────────────

interface ModalProps {
  screen: { url: string; name: string }
  index: number
  total: number
  onClose: () => void
  onPrev: () => void
  onNext: () => void
}

function ScreenModal({ screen, index, total, onClose, onPrev, onNext }: ModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(16px)" }}
      onClick={onClose}
    >
      <div
        className="flex flex-col items-center gap-6"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: "fadeUp 0.2s ease both" }}
      >
        {/* Nav */}
        <div className="flex items-center gap-6">
          <button
            onClick={onPrev}
            disabled={index === 0}
            className="flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200"
            style={{
              background: index === 0 ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: index === 0 ? "rgba(255,255,255,0.2)" : "white",
            }}
          >
            <ChevronLeft className="size-5" />
          </button>

          <div className="text-center">
            <p className="text-white font-bold text-sm">{screen.name}</p>
            <p className="text-white/35 text-xs mt-0.5">
              {index + 1} / {total}
            </p>
          </div>

          <button
            onClick={onNext}
            disabled={index === total - 1}
            className="flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200"
            style={{
              background: index === total - 1 ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: index === total - 1 ? "rgba(255,255,255,0.2)" : "white",
            }}
          >
            <ChevronRight className="size-5" />
          </button>
        </div>

        {/* Phone */}
        <PhoneFrame src={screen.url} alt={screen.name} hovered large />

        {/* Close */}
        <button
          onClick={onClose}
          className="flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors duration-200 text-xs font-medium uppercase tracking-wider"
        >
          <X className="size-3.5" />
          Cerrar
        </button>
      </div>
    </div>
  )
}
