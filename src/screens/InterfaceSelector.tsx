import { useNavigate } from "react-router-dom"
import {
  Monitor,
  Smartphone,
  Tablet,
  Building2,
  ArrowRight,
  ShieldCheck,
} from "lucide-react"
import { useState } from "react"

const interfaces = [
  {
    id: "quiosco",
    title: "Quiosco",
    subtitle: "Control de Acceso",
    description: "QR · NFC · Registro Alternativo · Sendero Seguro",
    Icon: Monitor,
    path: "/quiosco",
    available: true,
    accent: "#1e4d9e",
    glow: "rgba(30,77,158,0.4)",
    tag: "Disponible",
    screens: "3 pantallas",
  },
  {
    id: "movil",
    title: "Móvil",
    subtitle: "App Estudiantil",
    description: "Dashboard · Visitas · QR Personal · Horario · Perfil",
    Icon: Smartphone,
    path: "/movil",
    available: true,
    accent: "#ea580c",
    glow: "rgba(234,88,12,0.4)",
    tag: "Disponible",
    screens: "14 pantallas",
  },
  {
    id: "ipad",
    title: "iPad",
    subtitle: "Tableta Operativa",
    description: "Captura de visitas · Verificación de identidad",
    Icon: Tablet,
    path: "/ipad",
    available: false,
    accent: "#059669",
    glow: "rgba(5,150,105,0.4)",
    tag: "Próximamente",
    screens: "",
  },
  {
    id: "colegios",
    title: "Colegios Residenciales",
    subtitle: "Acceso Residencial",
    description: "Control de entrada · Registro de residentes",
    Icon: Building2,
    path: "/colegios",
    available: false,
    accent: "#7c3aed",
    glow: "rgba(124,58,237,0.4)",
    tag: "Próximamente",
    screens: "",
  },
]

export function InterfaceSelector() {
  const navigate = useNavigate()

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{
        background:
          "linear-gradient(145deg, #060d1f 0%, #0a1528 50%, #0c0a1e 100%)",
      }}
    >
      {/* Dot grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.035) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* Ambient glow orbs */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: "-15%",
          left: "-5%",
          width: "700px",
          height: "700px",
          background:
            "radial-gradient(circle, rgba(30,77,158,0.18) 0%, transparent 65%)",
          borderRadius: "50%",
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          bottom: "-20%",
          right: "0%",
          width: "600px",
          height: "600px",
          background:
            "radial-gradient(circle, rgba(234,88,12,0.14) 0%, transparent 65%)",
          borderRadius: "50%",
        }}
      />

      {/* Content */}
      <div className="relative z-10 w-full max-w-4xl px-6 py-10">
        {/* Header */}
        <div className="text-center mb-14" style={{ animation: "fadeUp 0.6s ease both" }}>
          <div className="inline-flex items-center gap-2.5 mb-5 px-4 py-1.5 rounded-full"
               style={{ background: "rgba(30,77,158,0.15)", border: "1px solid rgba(30,77,158,0.3)" }}>
            <ShieldCheck className="size-3.5 text-blue-400" />
            <span className="text-blue-400 text-[11px] font-bold uppercase tracking-[0.3em]">
              Sistema de Acceso
            </span>
          </div>

          <h1
            className="text-6xl font-black text-white mb-3"
            style={{
              letterSpacing: "-0.03em",
              textShadow: "0 0 80px rgba(30,78,216,0.35)",
            }}
          >
            UDLAP
            <span className="text-white/20 font-light ml-3 text-5xl">2026</span>
          </h1>

          <p className="text-white/35 text-sm tracking-wide">
            Selecciona la interfaz que deseas visualizar
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 gap-4">
          {interfaces.map((iface, i) => (
            <InterfaceCard
              key={iface.id}
              {...iface}
              delay={i * 80}
              onClick={() => navigate(iface.path)}
            />
          ))}
        </div>

        {/* Footer */}
        <p
          className="text-center text-white/15 text-xs mt-10 tracking-widest uppercase"
          style={{ animation: "fadeUp 0.6s ease 0.5s both" }}
        >
          Universidad de las Américas Puebla
        </p>
      </div>
    </div>
  )
}

interface CardProps {
  title: string
  subtitle: string
  description: string
  Icon: React.ElementType
  accent: string
  glow: string
  tag: string
  screens: string
  available: boolean
  delay: number
  onClick: () => void
}

function InterfaceCard({
  title,
  subtitle,
  description,
  Icon,
  accent,
  glow,
  tag,
  screens,
  available,
  delay,
  onClick,
}: CardProps) {
  const [hovered, setHovered] = useState(false)

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="group relative text-left rounded-2xl p-7 transition-all duration-300"
      style={{
        background: hovered
          ? `rgba(255,255,255,0.05)`
          : "rgba(255,255,255,0.025)",
        border: `1px solid ${hovered ? accent + "55" : "rgba(255,255,255,0.07)"}`,
        boxShadow: hovered
          ? `0 0 50px ${glow}, 0 20px 40px rgba(0,0,0,0.3)`
          : "0 4px 20px rgba(0,0,0,0.2)",
        transform: hovered ? "translateY(-3px) scale(1.01)" : "none",
        animation: `fadeUp 0.5s ease ${delay}ms both`,
        backdropFilter: "blur(8px)",
      }}
    >
      {/* Top right: tag + screens */}
      <div className="absolute top-5 right-5 flex flex-col items-end gap-1">
        <span
          className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full"
          style={{
            background: available ? accent + "22" : "rgba(255,255,255,0.05)",
            color: available ? accent : "rgba(255,255,255,0.25)",
            border: `1px solid ${available ? accent + "40" : "rgba(255,255,255,0.07)"}`,
          }}
        >
          {tag}
        </span>
        {screens && (
          <span className="text-[10px] text-white/25 font-medium">{screens}</span>
        )}
      </div>

      {/* Icon */}
      <div
        className="mb-6 inline-flex items-center justify-center w-14 h-14 rounded-xl transition-all duration-300"
        style={{
          background: hovered ? accent + "25" : accent + "12",
          border: `1px solid ${hovered ? accent + "50" : accent + "25"}`,
          boxShadow: hovered ? `0 0 20px ${accent}30` : "none",
        }}
      >
        <Icon
          className="size-6 transition-all duration-300"
          style={{ color: hovered ? accent : accent + "bb" }}
        />
      </div>

      {/* Text */}
      <h2
        className="text-white font-black text-xl mb-0.5"
        style={{ letterSpacing: "-0.02em" }}
      >
        {title}
      </h2>
      <p
        className="text-[11px] font-bold uppercase tracking-widest mb-3"
        style={{ color: accent + "90" }}
      >
        {subtitle}
      </p>
      <p className="text-white/30 text-sm leading-relaxed">{description}</p>

      {/* Bottom action */}
      <div
        className="mt-6 flex items-center gap-2 transition-all duration-300"
        style={{
          color: available
            ? hovered
              ? accent
              : accent + "70"
            : "rgba(255,255,255,0.15)",
          transform: hovered ? "translateX(2px)" : "none",
        }}
      >
        <span className="text-xs font-bold uppercase tracking-wider">
          {available ? "Abrir interfaz" : "No disponible"}
        </span>
        {available && (
          <ArrowRight
            className="size-3.5 transition-transform duration-300"
            style={{ transform: hovered ? "translateX(4px)" : "none" }}
          />
        )}
      </div>
    </button>
  )
}
