import { useNavigate } from "react-router-dom"
import { ArrowLeft, Clock, Tablet, Building2 } from "lucide-react"

interface Props {
  title: string
  subtitle: string
  type: "ipad" | "colegios"
}

const config = {
  ipad: {
    Icon: Tablet,
    accent: "#059669",
    glow: "rgba(5,150,105,0.25)",
    description:
      "La interfaz de tablet para operadores está en desarrollo. Permitirá captura de visitas y verificación de identidad directamente desde iPad.",
  },
  colegios: {
    Icon: Building2,
    accent: "#7c3aed",
    glow: "rgba(124,58,237,0.25)",
    description:
      "El módulo de colegios residenciales está en desarrollo. Gestionará el acceso y registro de residentes del campus universitario.",
  },
}

export function ComingSoon({ title, subtitle, type }: Props) {
  const navigate = useNavigate()
  const { Icon, accent, glow, description } = config[type]

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{
        background: "linear-gradient(145deg, #060d1f 0%, #0a1528 50%, #0c0a1e 100%)",
      }}
    >
      {/* Dot grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* Ambient glow */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "800px",
          height: "800px",
          background: `radial-gradient(circle, ${glow} 0%, transparent 60%)`,
          borderRadius: "50%",
        }}
      />

      {/* Back button */}
      <button
        onClick={() => navigate("/")}
        className="absolute top-6 left-6 z-10 flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors duration-200 text-sm font-medium"
      >
        <ArrowLeft className="size-4" />
        Volver al selector
      </button>

      {/* Content */}
      <div
        className="relative z-10 text-center max-w-md px-8"
        style={{ animation: "fadeUp 0.5s ease both" }}
      >
        {/* Icon */}
        <div
          className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-8"
          style={{
            background: accent + "18",
            border: `1px solid ${accent}35`,
            boxShadow: `0 0 40px ${accent}20`,
          }}
        >
          <Icon className="size-9" style={{ color: accent }} />
        </div>

        {/* Text */}
        <div
          className="inline-flex items-center gap-2 mb-5 px-3 py-1 rounded-full"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <Clock className="size-3 text-white/30" />
          <span className="text-white/30 text-[11px] font-bold uppercase tracking-widest">
            Próximamente
          </span>
        </div>

        <h1
          className="text-4xl font-black text-white mb-2"
          style={{ letterSpacing: "-0.03em" }}
        >
          {title}
        </h1>

        <p
          className="text-xs font-bold uppercase tracking-widest mb-6"
          style={{ color: accent + "90" }}
        >
          {subtitle}
        </p>

        <p className="text-white/35 text-sm leading-relaxed">{description}</p>

        {/* Progress bar placeholder */}
        <div
          className="mt-10 h-px w-full rounded-full overflow-hidden"
          style={{ background: "rgba(255,255,255,0.06)" }}
        >
          <div
            className="h-full rounded-full"
            style={{
              width: "30%",
              background: `linear-gradient(90deg, ${accent}80, ${accent})`,
            }}
          />
        </div>
        <p className="text-white/20 text-[11px] mt-2 font-medium">
          En desarrollo
        </p>
      </div>
    </div>
  )
}
