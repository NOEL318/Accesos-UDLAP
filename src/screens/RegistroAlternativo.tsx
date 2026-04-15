import {
  HiOutlineIdentification,
  HiOutlineQrCode,
  HiOutlineCheckCircle,
  HiOutlinePhone,
  HiOutlineGlobeAlt,
  HiOutlineShieldExclamation,
  HiOutlineUser,
  HiOutlineArrowLeft,
} from "react-icons/hi2"
import { RiIdCardLine, RiScanLine } from "react-icons/ri"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { KioscoHeader } from "@/components/KioscoHeader"
import type { Screen } from "@/App"

interface Props {
  onNavigate: (screen: Screen) => void
}

export function RegistroAlternativo({ onNavigate }: Props) {
  return (
    <div className="flex flex-col h-screen bg-[#f4f5f7] overflow-hidden">
      <KioscoHeader
        rightContent={
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs font-semibold text-gray-700">Kiosco de Acceso</p>
              <p className="text-[10px] text-gray-400">Entrada — Izquierda</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center">
              <HiOutlineUser className="size-5 text-gray-500" />
            </div>
          </div>
        }
      />

      {/* ── Body ─────────────────────────────────────────── */}
      <main className="flex flex-col items-center justify-center flex-1 gap-7 px-10 py-6">

        {/* Icon + Title */}
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white border border-gray-200 flex items-center justify-center shadow-sm">
            <HiOutlineIdentification className="size-9 text-gray-400" />
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-black text-[#0f2d5e] tracking-tight leading-tight">
              Registro Alternativo – Identificación
            </h1>
            <p className="text-gray-500 text-sm max-w-lg leading-relaxed">
              ¿Olvidaste tu credencial o teléfono? No te preocupes, puedes usar tu{" "}
              <span className="font-bold text-primary">INE</span> para obtener acceso rápido al campus.
            </p>
          </div>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-2 gap-5 w-full max-w-3xl">

          {/* ── Card 1: Scan INE */}
          <Card className="overflow-hidden border-0 shadow-md rounded-2xl bg-white p-0 gap-0">
            {/* Illustration header */}
            <div
              className="h-32 flex items-center justify-center relative overflow-hidden"
              style={{
                background: "linear-gradient(135deg,#fff7ed 0%,#fed7aa 50%,#fb923c 100%)",
              }}
            >
              <div className="flex items-center gap-3">
                {/* Fake ID card */}
                <div className="w-24 h-16 rounded-lg bg-white/80 shadow-md flex flex-col overflow-hidden border border-orange-200">
                  <div className="h-2 bg-gradient-to-r from-orange-500 to-amber-400" />
                  <div className="flex-1 flex items-center gap-2 px-2">
                    <div className="w-7 h-7 rounded bg-orange-100 flex items-center justify-center">
                      <HiOutlineUser className="size-4 text-orange-400" />
                    </div>
                    <div className="space-y-1 flex-1">
                      <div className="h-1.5 bg-gray-200 rounded" />
                      <div className="h-1.5 bg-gray-200 rounded w-3/4" />
                      <div className="h-1.5 bg-orange-200 rounded w-1/2" />
                    </div>
                  </div>
                </div>
                {/* Scan indicator */}
                <div className="flex flex-col gap-1">
                  <RiScanLine className="size-7 text-orange-600 opacity-80" />
                  <div className="w-7 h-px bg-orange-500 animate-pulse" />
                </div>
              </div>
            </div>

            <CardHeader className="px-6 pt-5 pb-0">
              <CardTitle className="text-[#0f2d5e] font-bold text-base">
                Escanea tu INE
              </CardTitle>
              <CardDescription className="text-xs leading-relaxed">
                Usa tu identificación oficial (INE) o tu licencia de manejo para registrarte.
              </CardDescription>
            </CardHeader>

            <CardContent className="px-6 pb-6 pt-4 space-y-4">
              <ul className="space-y-2.5">
                {[
                  "Escaneo automático de datos oficiales",
                  "Validación biométrica instantánea",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-xs text-gray-600">
                    <HiOutlineCheckCircle className="size-4 text-primary shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>

              <Button
                className="w-full h-11 font-bold gap-2.5 rounded-xl text-sm border-0"
                style={{
                  background: "linear-gradient(135deg,#ea580c 0%,#c2410c 100%)",
                  boxShadow: "0 4px 16px rgba(234,88,12,0.35)",
                }}
                onClick={() => onNavigate("captura-ine")}
              >
                <RiIdCardLine className="size-4" />
                Escanear INE
              </Button>
            </CardContent>
          </Card>

          {/* ── Card 2: No INE */}
          <Card className="overflow-hidden border-0 shadow-md rounded-2xl bg-white p-0 gap-0">
            {/* Illustration header */}
            <div
              className="h-32 flex items-center justify-center relative overflow-hidden"
              style={{
                background: "linear-gradient(135deg,#eff6ff 0%,#bfdbfe 50%,#3b82f6 100%)",
              }}
            >
              <div className="flex items-center gap-3">
                {/* Fake QR card */}
                <div className="w-24 h-16 rounded-lg bg-white/80 shadow-md flex flex-col overflow-hidden border border-blue-200">
                  <div className="h-2 bg-gradient-to-r from-blue-600 to-blue-400" />
                  <div className="flex-1 flex items-center gap-2 px-2">
                    <div className="w-7 h-7 rounded bg-blue-50 flex items-center justify-center">
                      <HiOutlineQrCode className="size-4 text-blue-400" />
                    </div>
                    <div className="space-y-1 flex-1">
                      <div className="h-1.5 bg-gray-200 rounded" />
                      <div className="h-1.5 bg-gray-200 rounded w-3/4" />
                      <div className="h-1.5 bg-blue-200 rounded w-1/2" />
                    </div>
                  </div>
                </div>
                {/* Scanner lines */}
                <div className="flex flex-col gap-1">
                  <RiScanLine className="size-7 text-blue-600 opacity-80" />
                  <div className="w-7 h-px bg-blue-500 animate-pulse" />
                </div>
              </div>
            </div>

            <CardHeader className="px-6 pt-5 pb-0">
              <CardTitle className="text-[#0f2d5e] font-bold text-base">
                ¿No tienes INE?
              </CardTitle>
              <CardDescription className="text-xs leading-relaxed">
                Inicia un registro manual con tu número de estudiante o empleado.
              </CardDescription>
            </CardHeader>

            <CardContent className="px-6 pb-6 pt-4 space-y-4">
              <ul className="space-y-2.5">
                {[
                  { text: "Usa el ID del estudiante (ID Banner)", icon: HiOutlineCheckCircle },
                  { text: "Se requiere verificación con seguridad", icon: HiOutlineShieldExclamation },
                ].map(({ text, icon: Icon }) => (
                  <li key={text} className="flex items-center gap-2.5 text-xs text-gray-600">
                    <Icon className="size-4 text-[#1e4d9e] shrink-0" />
                    {text}
                  </li>
                ))}
              </ul>

              <Button
                variant="outline"
                className="w-full h-11 font-bold gap-2.5 rounded-xl text-sm border-2 border-[#1e4d9e] text-[#1e4d9e] hover:bg-blue-50"
              >
                <HiOutlineUser className="size-4" />
                Registro Manual
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Otras opciones */}
        <div className="flex flex-col items-center gap-3 w-full max-w-3xl">
          <div className="flex items-center gap-4 w-full">
            <Separator className="flex-1" />
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.15em] shrink-0">
              Otras opciones
            </span>
            <Separator className="flex-1" />
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="rounded-full h-9 px-5 gap-2 text-xs text-gray-500 border-gray-200"
            >
              <HiOutlinePhone className="size-3.5" />
              Llamar a Asistencia
            </Button>
            <Button
              variant="outline"
              className="rounded-full h-9 px-5 gap-2 text-xs text-gray-500 border-gray-200"
            >
              <HiOutlineGlobeAlt className="size-3.5" />
              Change Language (EN)
            </Button>
          </div>
        </div>
      </main>

      {/* ── Footer ───────────────────────────────────────── */}
      <footer className="flex items-center justify-between px-8 py-4 bg-white border-t border-gray-100 shrink-0">
        <Button
          variant="ghost"
          className="gap-2 text-xs text-gray-400 h-8 hover:text-gray-600"
          onClick={() => onNavigate("principal")}
        >
          <HiOutlineArrowLeft className="size-3.5" />
          Volver al inicio
        </Button>
        <p className="text-[10px] text-gray-400">
          © 2026 Universidad de las Américas Puebla ·{" "}
          <span className="underline cursor-pointer hover:text-gray-600">Privacidad</span> ·{" "}
          <span className="underline cursor-pointer hover:text-gray-600">Términos de Uso</span>
        </p>
      </footer>
    </div>
  )
}
