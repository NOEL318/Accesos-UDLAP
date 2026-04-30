import { useRef, useState } from "react"
import {
  HiOutlineCamera,
  HiOutlineXMark,
  HiOutlineCheckCircle,
  HiOutlineArrowLeft,
  HiOutlineArrowPath,
} from "react-icons/hi2"
import { RiIdCardLine, RiAlignJustify, RiFontSize } from "react-icons/ri"
import { AiOutlineLoading3Quarters } from "react-icons/ai"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { KioscoHeader } from "@/components/KioscoHeader"
import { cn } from "@/lib/utils"
import type { Screen } from "@/App"
import { compressToBase64 } from "@/lib/image"
import { registrarIngresoAlternativo } from "@/lib/quiosco"

interface Props {
  onNavigate: (screen: Screen) => void
}

type CaptureState = "ready" | "capturing" | "captured"

// pantalla del quiosco para capturar la foto de la INE del visitante
export function CapturaINE({ onNavigate }: Props) {
  const [state, setState] = useState<CaptureState>("ready")
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // dispara el click oculto del input de archivo para abrir la cámara
  const handleCapture = () => {
    fileRef.current?.click()
  }

  // procesa la foto seleccionada, la comprime y registra el ingreso alternativo
  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    // Reset the input so the same file can be re-selected later
    if (e.target) e.target.value = ""
    if (!file) return
    setState("capturing")
    setError(null)
    try {
      const base64 = await compressToBase64(file, { maxKB: 250, maxPx: 800 })
      const nombre = window.prompt("Nombre completo del visitante:") || "Visitante INE"
      const tipoId = window.prompt("Número de identificación (opcional):") || undefined
      await registrarIngresoAlternativo({
        nombre,
        tipoId,
        fotoIne: base64,
        motivo: "Sin credencial",
      })
      setState("captured")
      setTimeout(() => onNavigate("principal"), 2500)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error al subir foto"
      setState("ready")
      setError(message)
    }
  }

  return (
    <div className="flex flex-col h-screen bg-[#f4f5f7] overflow-hidden">
      {/* Hidden file input — triggered by the "Capturar Foto" button */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={handleFile}
      />
      <KioscoHeader
        subtitle="Quiosco"
        rightContent={
          <div>
            <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">
              Acceso Personal
            </p>
            <p className="text-[10px] text-gray-400">Puerta 1 – Principal</p>
          </div>
        }
      />

      {/* ── Body ─────────────────────────────────────────── */}
      <main className="flex flex-col items-center justify-center flex-1 gap-7 px-10 py-6">

        {/* Title */}
        <div className="text-center space-y-2">
          <h1 className="text-[2.6rem] font-black text-[#0f2d5e] tracking-tight leading-tight">
            Captura de <span className="text-primary">INE</span> – Quiosco
          </h1>
          <p className="text-gray-500 text-sm max-w-lg leading-relaxed">
            Por favor, coloque su identificación oficial dentro del marco para registrar su ingreso.
          </p>
        </div>

        {/* Camera viewfinder */}
        <div className="relative">
          {/* Status badge */}
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
            <Badge
              className={cn(
                "flex items-center gap-1.5 px-3 h-7 rounded-full text-[11px] font-bold uppercase tracking-widest border-0 transition-all duration-500",
                state === "ready" && "bg-[#1a1a2e] text-white",
                state === "capturing" && "bg-primary text-white",
                state === "captured" && "bg-emerald-600 text-white",
              )}
            >
              <span
                className={cn(
                  "size-1.5 rounded-full shrink-0",
                  state === "ready" && "bg-emerald-400 animate-pulse",
                  state === "capturing" && "bg-white animate-pulse",
                  state === "captured" && "bg-white",
                )}
              />
              {state === "ready" && "CÁMARA LISTA"}
              {state === "capturing" && "PROCESANDO..."}
              {state === "captured" && "CAPTURA EXITOSA"}
            </Badge>
          </div>

          {/* Main frame */}
          <div
            className={cn(
              "relative overflow-hidden rounded-2xl transition-all duration-700",
              "w-[520px] h-72",
              state === "ready" && "border-2 border-dashed border-primary",
            )}
            style={{
              background:
                state === "ready"
                  ? "linear-gradient(160deg,#0d1b2a 0%,#1c2a3a 100%)"
                  : state === "capturing"
                  ? "linear-gradient(160deg,#1a0d00 0%,#2d1a00 100%)"
                  : "linear-gradient(160deg,#052e16 0%,#0f3d20 100%)",
              boxShadow:
                state === "ready"
                  ? "0 24px 60px rgba(0,0,0,0.3)"
                  : state === "capturing"
                  ? "0 0 0 2px #ea580c, 0 24px 60px rgba(234,88,12,0.25)"
                  : "0 0 0 2px #16a34a, 0 24px 60px rgba(22,163,74,0.25)",
            }}
          >
            {/* Scanline texture */}
            <div
              className="absolute inset-0 opacity-[0.025] pointer-events-none"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(255,255,255,1) 2px,rgba(255,255,255,1) 3px)",
              }}
            />

            {/* ── READY ── */}
            {state === "ready" && (
              <>
                {/* Corner brackets */}
                <span className="absolute top-4 left-4 w-9 h-9 border-t-[3px] border-l-[3px] border-primary rounded-tl" />
                <span className="absolute top-4 right-4 w-9 h-9 border-t-[3px] border-r-[3px] border-primary rounded-tr" />
                <span className="absolute bottom-4 left-4 w-9 h-9 border-b-[3px] border-l-[3px] border-primary rounded-bl" />
                <span className="absolute bottom-4 right-4 w-9 h-9 border-b-[3px] border-r-[3px] border-primary rounded-br" />

                {/* ID card illustration */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative w-64 h-44 rounded-xl border border-white/10 bg-white/[0.04] flex items-center gap-4 px-5">
                    {/* Photo area */}
                    <div className="w-14 h-20 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center shrink-0">
                      <HiOutlineCamera className="size-6 text-white/20" />
                    </div>
                    {/* Lines */}
                    <div className="flex-1 space-y-2.5">
                      <div className="h-2 bg-white/10 rounded-full" />
                      <div className="h-2 bg-white/10 rounded-full w-4/5" />
                      <div className="h-2 bg-white/10 rounded-full w-3/5" />
                      <div className="h-px bg-white/10 my-1" />
                      <div className="h-2 bg-white/[0.07] rounded-full" />
                      <div className="h-2 bg-white/[0.07] rounded-full w-2/3" />
                    </div>
                    {/* Watermark */}
                    <RiIdCardLine className="absolute bottom-3 right-4 size-7 text-white/[0.08]" />
                  </div>
                </div>

                {/* Scan line */}
                <div
                  className="kiosco-scanline absolute left-8 right-8 h-px"
                  style={{
                    background:
                      "linear-gradient(90deg,transparent,#ea580c 40%,#ea580c 60%,transparent)",
                    boxShadow: "0 0 12px 2px rgba(234,88,12,0.7)",
                  }}
                />
              </>
            )}

            {/* ── CAPTURING ── */}
            {state === "capturing" && (
              <>
                {/* Pulsing corner brackets */}
                <span className="absolute top-4 left-4 w-9 h-9 border-t-[3px] border-l-[3px] border-primary rounded-tl animate-pulse" />
                <span className="absolute top-4 right-4 w-9 h-9 border-t-[3px] border-r-[3px] border-primary rounded-tr animate-pulse" />
                <span className="absolute bottom-4 left-4 w-9 h-9 border-b-[3px] border-l-[3px] border-primary rounded-bl animate-pulse" />
                <span className="absolute bottom-4 right-4 w-9 h-9 border-b-[3px] border-r-[3px] border-primary rounded-br animate-pulse" />

                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                  <AiOutlineLoading3Quarters className="size-12 text-primary animate-spin" />
                  <p className="text-primary/80 text-sm font-bold uppercase tracking-widest">
                    Leyendo documento...
                  </p>
                </div>

                {/* Fast scan line */}
                <div
                  className="kiosco-scanline-fast absolute left-6 right-6 h-px"
                  style={{
                    background:
                      "linear-gradient(90deg,transparent,#ea580c 40%,#ea580c 60%,transparent)",
                    boxShadow: "0 0 14px 3px rgba(234,88,12,0.9)",
                  }}
                />
              </>
            )}

            {/* ── CAPTURED ── */}
            {state === "captured" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center"
                  style={{
                    background: "rgba(22,163,74,0.2)",
                    boxShadow: "0 0 40px rgba(22,163,74,0.5)",
                  }}
                >
                  <HiOutlineCheckCircle className="size-11 text-emerald-400" />
                </div>
                <p className="text-emerald-300 font-bold text-sm uppercase tracking-widest">
                  INE Capturada Correctamente
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Hints */}
        <div className="flex items-center gap-8 text-xs text-gray-400 font-medium">
          <span className="flex items-center gap-2">
            <RiAlignJustify className="size-4 text-gray-300" />
            Coloque su INE dentro del marco
          </span>
          <span className="w-px h-4 bg-gray-200 block" />
          <span className="flex items-center gap-2">
            <RiFontSize className="size-4 text-gray-300" />
            Asegúrese de que el texto sea legible
          </span>
        </div>

        {error && (
          <div className="px-4 py-2 rounded-lg bg-red-50 text-red-700 text-sm font-medium border border-red-200 max-w-md text-center">
            {error}
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3">
          {state === "captured" ? (
            <>
              <Button
                variant="outline"
                className="h-12 px-7 rounded-xl gap-2.5 text-sm font-semibold border-gray-200 text-gray-600"
                onClick={() => setState("ready")}
              >
                <HiOutlineArrowPath className="size-4" />
                Tomar de nuevo
              </Button>
              <Button
                className="h-12 px-7 rounded-xl gap-2.5 text-sm font-bold text-white border-0"
                style={{
                  background: "linear-gradient(135deg,#16a34a 0%,#15803d 100%)",
                  boxShadow: "0 4px 16px rgba(22,163,74,0.4)",
                }}
                onClick={() => onNavigate("principal")}
              >
                <HiOutlineCheckCircle className="size-4" />
                Confirmar y continuar
              </Button>
            </>
          ) : (
            <>
              <Button
                disabled={state === "capturing"}
                className={cn(
                  "h-12 px-8 rounded-xl gap-2.5 text-sm font-bold text-white border-0 transition-all",
                  state === "capturing" && "opacity-60 cursor-not-allowed",
                )}
                style={{
                  background: "linear-gradient(135deg,#ea580c 0%,#c2410c 100%)",
                  boxShadow: state !== "capturing" ? "0 4px 16px rgba(234,88,12,0.4)" : "none",
                }}
                onClick={handleCapture}
              >
                <HiOutlineCamera className="size-4" />
                {state === "capturing" ? "Capturando..." : "Capturar Foto"}
              </Button>

              <Button
                variant="outline"
                disabled={state === "capturing"}
                className="h-12 px-7 rounded-xl gap-2.5 text-sm font-semibold border-gray-200 text-gray-600 disabled:opacity-40"
                onClick={() => onNavigate("registro-alternativo")}
              >
                <HiOutlineXMark className="size-4" />
                Cancelar
              </Button>
            </>
          )}
        </div>
      </main>

      {/* ── Footer ───────────────────────────────────────── */}
      <footer className="px-8 py-4 bg-white border-t border-gray-100 shrink-0">
        <Button
          variant="ghost"
          className="gap-2 text-xs text-gray-400 h-8 hover:text-gray-600"
          onClick={() => onNavigate("registro-alternativo")}
        >
          <HiOutlineArrowLeft className="size-3.5" />
          Volver a Registro Alternativo
        </Button>
      </footer>
    </div>
  )
}
