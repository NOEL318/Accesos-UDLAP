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
  HiOutlineMapPin,
  HiOutlineClock,
  HiXMark,
} from "react-icons/hi2"
import { MdNfc } from "react-icons/md"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { KioscoHeader } from "@/components/KioscoHeader"
import { cn } from "@/lib/utils"
import type { Screen } from "@/App"

interface Props {
  onNavigate: (screen: Screen) => void
}

type ScanStatus = "idle" | "authorized" | "denied"

// pantalla principal del quiosco con escaneo QR y opciones de registro alternativo
export function KioscoPrincipal({ onNavigate }: Props) {
  const [time, setTime] = useState(new Date())
  const [scanStatus] = useState<ScanStatus>("idle")
  const [senderoOpen, setSenderoOpen] = useState(false)
  const [senderoForm, setSenderoForm] = useState({
    origen: "",
    destino: "",
    contacto: "",
    notas: "",
  })
  const [senderoConfirm, setSenderoConfirm] = useState<{ folio: string; eta: string } | null>(null)

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

  // valida los campos y simula la solicitud de sendero seguro
  function handleSenderoSubmit() {
    if (!senderoForm.origen.trim() || !senderoForm.destino.trim()) return
    const folio = `SS-${Math.floor(100000 + Math.random() * 900000)}`
    const eta = `${4 + Math.floor(Math.random() * 6)} min`
    setSenderoConfirm({ folio, eta })
  }

  // cierra el modal de sendero seguro y limpia el estado
  function closeSendero() {
    setSenderoOpen(false)
    setSenderoConfirm(null)
    setSenderoForm({ origen: "", destino: "", contacto: "", notas: "" })
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
            onClick={() => setSenderoOpen(true)}
          >
            <HiOutlineShieldCheck className="size-5" />
            SOLICITAR SENDERO SEGURO
          </Button>
        </div>
      </main>

      {senderoOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 px-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeSendero()
          }}
        >
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-black text-[#0f2d5e] tracking-tight">
                  Solicitar Sendero Seguro
                </h2>
                <p className="text-xs text-gray-500">
                  Un oficial te acompañará entre dos puntos del campus.
                </p>
              </div>
              <button
                type="button"
                onClick={closeSendero}
                aria-label="Cerrar"
                className="rounded-full p-1.5 text-gray-500 hover:bg-gray-100"
              >
                <HiXMark className="size-5" />
              </button>
            </div>

            {senderoConfirm ? (
              <div className="px-6 py-6 space-y-4 text-center">
                <div className="mx-auto size-14 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                  <HiOutlineCheckCircle className="size-8 text-emerald-600" />
                </div>
                <div>
                  <div className="text-sm font-bold text-[#0f2d5e]">Solicitud confirmada</div>
                  <div className="mt-1 text-xs text-gray-500">
                    Folio <span className="font-mono font-bold text-[#0f2d5e]">{senderoConfirm.folio}</span>
                  </div>
                  <div className="mt-3 inline-flex items-center gap-1.5 text-xs text-gray-700 bg-gray-50 border border-gray-200 rounded-full px-3 py-1.5">
                    <HiOutlineClock className="size-3.5 text-orange-600" />
                    Oficial llegando en aprox. <span className="font-bold">{senderoConfirm.eta}</span>
                  </div>
                </div>
                <Button onClick={closeSendero} className="w-full h-11 font-bold">
                  Listo
                </Button>
              </div>
            ) : (
              <div className="px-6 py-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                      Origen
                    </Label>
                    <div className="relative mt-1">
                      <HiOutlineMapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                      <Input
                        value={senderoForm.origen}
                        onChange={(e) =>
                          setSenderoForm((f) => ({ ...f, origen: e.target.value }))
                        }
                        placeholder="Ej. Biblioteca"
                        className="pl-9 h-11"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                      Destino
                    </Label>
                    <div className="relative mt-1">
                      <HiOutlineMapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                      <Input
                        value={senderoForm.destino}
                        onChange={(e) =>
                          setSenderoForm((f) => ({ ...f, destino: e.target.value }))
                        }
                        placeholder="Ej. Estacionamiento 4"
                        className="pl-9 h-11"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <Label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                    Teléfono o ID UDLAP
                  </Label>
                  <Input
                    value={senderoForm.contacto}
                    onChange={(e) =>
                      setSenderoForm((f) => ({ ...f, contacto: e.target.value }))
                    }
                    placeholder="Opcional — para localizarte"
                    className="mt-1 h-11"
                  />
                </div>
                <div>
                  <Label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                    Notas
                  </Label>
                  <Textarea
                    value={senderoForm.notas}
                    onChange={(e) =>
                      setSenderoForm((f) => ({ ...f, notas: e.target.value }))
                    }
                    placeholder="Indica si llevas pertenencias, vas con alguien, etc."
                    className="mt-1 min-h-[80px]"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <Button variant="outline" onClick={closeSendero}>
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleSenderoSubmit}
                    disabled={!senderoForm.origen.trim() || !senderoForm.destino.trim()}
                    className="bg-[#1e4d9e] hover:bg-[#0f2d5e] text-white"
                  >
                    <HiOutlineShieldCheck className="size-4" />
                    Confirmar solicitud
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

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
