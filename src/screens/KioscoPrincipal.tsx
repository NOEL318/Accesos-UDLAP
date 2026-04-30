import { useState, useEffect } from "react"
import {
  HiOutlineQrCode,
  HiOutlineUserPlus,
  HiOutlineShieldCheck,
  HiOutlinePhone,
  HiOutlineExclamationTriangle,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiSignal,
} from "react-icons/hi2"
import { MdNfc } from "react-icons/md"
import { CheckCircle2, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { KioscoHeader } from "@/components/KioscoHeader"
import { cn } from "@/lib/utils"
import type { Screen } from "@/App"
import { validarQrToken } from "@/lib/quiosco"
import { api } from "@/lib/api"
import type { Visita } from "@/lib/types"

interface Props {
  onNavigate: (screen: Screen) => void
}

type ScanStatus = "idle" | "authorized" | "denied"

// pantalla principal del quiosco con escaneo QR y opciones de registro alternativo
export function KioscoPrincipal({ onNavigate }: Props) {
  const [time, setTime] = useState(new Date())
  const [scanStatus, setScanStatus] = useState<ScanStatus>("idle")
  const [qrToken, setQrToken] = useState("")
  const [scanResult, setScanResult] = useState<{
    visita: Visita
    resultado: "permitido" | "denegado"
    motivo?: string
  } | null>(null)
  const [scanError, setScanError] = useState<string | null>(null)
  const [scanning, setScanning] = useState(false)

  // actualiza el reloj del header cada segundo
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const formattedTime = time.toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })
  const formattedDate = time.toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })

  // valida el token QR contra el backend y registra el resultado del scan
  const handleValidateQr = async () => {
    if (!qrToken.trim() || scanning) return
    setScanning(true)
    setScanError(null)
    setScanResult(null)
    try {
      const visita = await validarQrToken(qrToken.trim())
      const resultado: "permitido" | "denegado" =
        visita.status === "cancelada" || visita.status === "expirada"
          ? "denegado"
          : "permitido"
      const motivo = resultado === "denegado" ? `Visita ${visita.status}` : undefined

      // Registrar el scan en el backend
      await api.post(`/api/visitas/qr/${qrToken.trim()}/scan`, {
        puntoId: "kiosco-principal",
        resultado,
        motivo,
      })
      setScanResult({ visita, resultado, motivo })
      setScanStatus(resultado === "permitido" ? "authorized" : "denied")
      setTimeout(() => {
        setScanStatus("idle")
        setScanResult(null)
        setQrToken("")
      }, 5000)
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "QR inválido"
      setScanError(message)
      setScanStatus("denied")
      setTimeout(() => {
        setScanStatus("idle")
        setScanError(null)
        setQrToken("")
      }, 4000)
    } finally {
      setScanning(false)
    }
  }

  return (
    <div className="flex flex-col h-screen bg-[#f4f5f7] overflow-hidden">
      <KioscoHeader
        rightContent={
          <div>
            <p className="font-mono font-bold text-[#0f2d5e] text-xl tabular-nums leading-none">
              {formattedTime}
            </p>
            <p className="text-[11px] text-gray-400 capitalize mt-0.5">{formattedDate}</p>
            <div className="flex items-center justify-end gap-1.5 mt-1">
              <HiSignal className="size-3 text-emerald-500" />
              <span className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider">
                Puerta Principal Sur
              </span>
            </div>
          </div>
        }
      />

      {/* ── Body ─────────────────────────────────────────── */}
      <main className="flex flex-col items-center justify-center flex-1 gap-6 px-10 py-6">

        {/* Title */}
        <div className="text-center space-y-2">
          <h1 className="text-[2.75rem] font-black text-[#0f2d5e] tracking-tight leading-tight">
            Bienvenido a la UDLAP
          </h1>
          <p className="text-gray-500 text-sm flex items-center justify-center gap-2">
            <HiOutlineQrCode className="size-4 shrink-0" />
            Escanea tu Código QR o acerca tu dispositivo
            <span className="inline-flex items-center gap-1 font-semibold text-[#0f2d5e]">
              <MdNfc className="size-4" /> NFC
            </span>
          </p>
        </div>

        {/* Scanner */}
        <div className="relative">
          {/* Top badge */}
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
            <Badge
              className={cn(
                "flex items-center gap-1.5 px-3 h-7 rounded-full text-[11px] font-bold uppercase tracking-widest border-0 transition-colors duration-500",
                scanStatus === "idle" && "bg-[#1a1a2e] text-white",
                scanStatus === "authorized" && "bg-emerald-600 text-white",
                scanStatus === "denied" && "bg-red-600 text-white",
              )}
            >
              <span
                className={cn(
                  "size-1.5 rounded-full shrink-0",
                  scanStatus === "idle" && "bg-emerald-400 animate-pulse",
                  scanStatus !== "idle" && "bg-white",
                )}
              />
              {scanStatus === "idle" && "CÁMARA LISTA"}
              {scanStatus === "authorized" && "ACCESO AUTORIZADO"}
              {scanStatus === "denied" && "ACCESO DENEGADO"}
            </Badge>
          </div>

          {/* Frame */}
          <div
            className={cn(
              "relative w-72 h-72 rounded-2xl overflow-hidden transition-all duration-700 cursor-pointer",
              scanStatus === "idle" && "border-2 border-dashed border-primary",
            )}
            style={{
              background:
                scanStatus === "idle"
                  ? "linear-gradient(160deg,#111827 0%,#1c2a3a 100%)"
                  : scanStatus === "authorized"
                  ? "linear-gradient(160deg,#052e16 0%,#166534 100%)"
                  : "linear-gradient(160deg,#450a0a 0%,#991b1b 100%)",
              boxShadow:
                scanStatus === "idle"
                  ? "0 0 0 0 transparent, 0 20px 60px rgba(0,0,0,0.3)"
                  : scanStatus === "authorized"
                  ? "0 0 0 3px #16a34a, 0 20px 60px rgba(22,163,74,0.3)"
                  : "0 0 0 3px #dc2626, 0 20px 60px rgba(220,38,38,0.3)",
            }}
          >
            {/* Corner brackets (idle only) */}
            {scanStatus === "idle" && (
              <>
                <span className="absolute top-3.5 left-3.5 w-8 h-8 border-t-[3px] border-l-[3px] border-primary rounded-tl" />
                <span className="absolute top-3.5 right-3.5 w-8 h-8 border-t-[3px] border-r-[3px] border-primary rounded-tr" />
                <span className="absolute bottom-3.5 left-3.5 w-8 h-8 border-b-[3px] border-l-[3px] border-primary rounded-bl" />
                <span className="absolute bottom-3.5 right-3.5 w-8 h-8 border-b-[3px] border-r-[3px] border-primary rounded-br" />
              </>
            )}

            {/* Scan line */}
            {scanStatus === "idle" && (
              <div
                className="kiosco-scanline absolute left-6 right-6 h-px"
                style={{
                  background: "linear-gradient(90deg,transparent,#ea580c 40%,#ea580c 60%,transparent)",
                  boxShadow: "0 0 10px 2px rgba(234,88,12,0.7)",
                }}
              />
            )}

            {/* Center content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              {scanStatus === "idle" && (
                <>
                  <HiOutlineQrCode className="size-28 text-white/15" style={{ strokeWidth: 0.6 }} />
                  <p className="text-[10px] text-white/30 uppercase tracking-[0.25em]">
                    Posiciona tu código aquí
                  </p>
                </>
              )}
              {scanStatus === "authorized" && (
                <div className="flex flex-col items-center gap-2">
                  <HiOutlineCheckCircle
                    className="size-24 text-emerald-400"
                    style={{ filter: "drop-shadow(0 0 16px rgba(52,211,153,0.8))" }}
                  />
                  <p className="text-emerald-300 font-bold text-sm uppercase tracking-widest">Bienvenido</p>
                </div>
              )}
              {scanStatus === "denied" && (
                <div className="flex flex-col items-center gap-2">
                  <HiOutlineXCircle
                    className="size-24 text-red-400"
                    style={{ filter: "drop-shadow(0 0 16px rgba(248,113,113,0.8))" }}
                  />
                  <p className="text-red-300 font-bold text-sm uppercase tracking-widest">
                    Sin autorización
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Status row */}
        <div className="flex items-center gap-6 text-xs font-semibold uppercase tracking-widest">
          <span className="flex items-center gap-2 text-emerald-600">
            <HiOutlineCheckCircle className="size-4" />
            Acceso Autorizado
          </span>
          <span className="w-px h-4 bg-gray-300 block" />
          <span className="flex items-center gap-2 text-red-500">
            <HiOutlineXCircle className="size-4" />
            Acceso Denegado
          </span>
        </div>

        {/* QR token input + Validar */}
        <div className="w-full max-w-md flex flex-col gap-2">
          <div className="flex gap-2">
            <input
              value={qrToken}
              onChange={(e) => setQrToken(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void handleValidateQr()
              }}
              placeholder="Pega el token del QR"
              disabled={scanning}
              className="flex-1 h-12 px-4 rounded-xl border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50"
            />
            <Button
              onClick={() => void handleValidateQr()}
              disabled={scanning || !qrToken.trim()}
              className="h-12 px-5 text-sm font-bold"
            >
              {scanning ? "Validando…" : "Validar"}
            </Button>
          </div>
          <p className="text-[10px] text-gray-400 text-center">
            En producción, el visitante muestra el código en su móvil para escanearse.
          </p>
          {scanResult && (
            <div
              className={cn(
                "p-3 rounded-lg text-sm font-medium",
                scanResult.resultado === "permitido"
                  ? "bg-green-50 text-green-800 border border-green-200"
                  : "bg-red-50 text-red-800 border border-red-200",
              )}
            >
              {scanResult.resultado === "permitido" ? (
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 size={20} />
                  Acceso permitido — {scanResult.visita.invitado.nombre}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5">
                  <XCircle size={20} />
                  Acceso denegado — {scanResult.motivo ?? "Validación fallida"}
                </span>
              )}
            </div>
          )}
          {scanError && (
            <div className="p-3 rounded-lg bg-red-50 text-red-800 text-sm font-medium border border-red-200">
              {scanError}
            </div>
          )}
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col gap-3 w-full max-w-sm">
          <Button
            className="w-full h-14 text-sm font-bold tracking-wide gap-3 rounded-xl shadow-lg shadow-primary/30"
            style={{
              background: "linear-gradient(135deg,#ea580c 0%,#c2410c 100%)",
              border: "none",
            }}
            onClick={() => onNavigate("registro-alternativo")}
          >
            <HiOutlineUserPlus className="size-5" />
            REGISTRO ALTERNATIVO
          </Button>

          <Button
            className="w-full h-14 text-sm font-bold tracking-wide gap-3 rounded-xl text-white shadow-lg"
            style={{
              background: "linear-gradient(135deg,#1e4d9e 0%,#0f2d5e 100%)",
              border: "none",
              boxShadow: "0 10px 25px rgba(15,45,94,0.35)",
            }}
          >
            <HiOutlineShieldCheck className="size-5" />
            SOLICITAR SENDERO SEGURO
          </Button>
        </div>
      </main>

      {/* ── Footer ───────────────────────────────────────── */}
      <footer className="flex items-center justify-between px-8 py-4 bg-white border-t border-gray-100 shrink-0">
        <Button
          variant="outline"
          className="h-11 px-6 gap-2.5 rounded-xl text-sm text-gray-600 border-gray-200 font-medium"
        >
          <HiOutlinePhone className="size-4 text-gray-400" />
          Ayuda / Hablar con Seguridad
        </Button>

        <Button
          className="h-11 px-6 gap-2.5 rounded-xl text-sm font-bold text-white border-0"
          style={{
            background: "linear-gradient(135deg,#dc2626 0%,#b91c1c 100%)",
            boxShadow: "0 4px 16px rgba(220,38,38,0.4)",
          }}
        >
          <HiOutlineExclamationTriangle className="size-4" />
          PÁNICO / EMERGENCIA
        </Button>
      </footer>
    </div>
  )
}
