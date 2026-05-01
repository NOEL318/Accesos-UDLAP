import { useMemo, useState } from "react"
import {
  HiOutlineIdentification,
  HiOutlineQrCode,
  HiOutlineCheckCircle,
  HiOutlinePhone,
  HiOutlineGlobeAlt,
  HiOutlineShieldExclamation,
  HiOutlineUser,
  HiOutlineArrowLeft,
  HiXMark,
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { KioscoHeader } from "@/components/KioscoHeader"
import type { Screen } from "@/App"

interface Props {
  onNavigate: (screen: Screen) => void
}

type Lang = "es" | "en"

const COPY = {
  es: {
    headerLabel: "Kiosco de Acceso",
    headerSub: "Entrada — Izquierda",
    title: "Registro Alternativo – Identificación",
    subtitle: (
      <>
        ¿Olvidaste tu credencial o teléfono? No te preocupes, puedes usar tu{" "}
        <span className="font-bold text-primary">INE</span> para obtener acceso rápido al campus.
      </>
    ),
    card1Title: "Escanea tu INE",
    card1Desc: "Usa tu identificación oficial (INE) o tu licencia de manejo para registrarte.",
    card1List: ["Escaneo automático de datos oficiales", "Validación biométrica instantánea"],
    card1Cta: "Escanear INE",
    card2Title: "¿No tienes INE?",
    card2Desc: "Inicia un registro manual con tu número de estudiante o empleado.",
    card2List: ["Usa el ID del estudiante (ID Banner)", "Se requiere verificación con seguridad"],
    card2Cta: "Registro Manual",
    otherOptions: "Otras opciones",
    callAssistance: "Llamar a Asistencia",
    languageToggle: "Change Language (EN)",
    back: "Volver al inicio",
    privacy: "Privacidad",
    terms: "Términos de Uso",
    manualTitle: "Registro Manual",
    manualSub: "Captura tus datos para que seguridad valide tu acceso.",
    manualIdLabel: "ID UDLAP / ID Banner",
    manualNameLabel: "Nombre completo",
    manualReasonLabel: "Motivo de visita",
    manualNotesLabel: "Notas (opcional)",
    manualCancel: "Cancelar",
    manualConfirm: "Enviar a verificación",
    manualSuccessTitle: "Solicitud enviada",
    manualSuccessBody: "Un oficial validará tus datos en seguida.",
    manualClose: "Listo",
    callTitle: "Llamar a Asistencia",
    callSub: "Marca al puesto de seguridad o utiliza el botón de llamada.",
    callNumberLabel: "Línea directa",
    callBtn: "Llamar ahora",
    callClose: "Cerrar",
  },
  en: {
    headerLabel: "Access Kiosk",
    headerSub: "Entrance — Left",
    title: "Alternative Registration – Identification",
    subtitle: (
      <>
        Forgot your ID or phone? Don't worry, you can use your{" "}
        <span className="font-bold text-primary">government ID</span> for fast campus access.
      </>
    ),
    card1Title: "Scan your ID",
    card1Desc: "Use your government ID or driver's license to register.",
    card1List: ["Automatic scan of official data", "Instant biometric validation"],
    card1Cta: "Scan ID",
    card2Title: "No ID?",
    card2Desc: "Start a manual registration with your student or employee number.",
    card2List: ["Use your student ID (Banner ID)", "Requires verification by security"],
    card2Cta: "Manual Registration",
    otherOptions: "Other options",
    callAssistance: "Call Assistance",
    languageToggle: "Cambiar idioma (ES)",
    back: "Back to start",
    privacy: "Privacy",
    terms: "Terms of Use",
    manualTitle: "Manual Registration",
    manualSub: "Enter your details so security can validate your access.",
    manualIdLabel: "UDLAP ID / Banner ID",
    manualNameLabel: "Full name",
    manualReasonLabel: "Reason for visit",
    manualNotesLabel: "Notes (optional)",
    manualCancel: "Cancel",
    manualConfirm: "Submit for verification",
    manualSuccessTitle: "Request sent",
    manualSuccessBody: "An officer will validate your data shortly.",
    manualClose: "Done",
    callTitle: "Call Assistance",
    callSub: "Dial the security desk or use the call button.",
    callNumberLabel: "Hotline",
    callBtn: "Call now",
    callClose: "Close",
  },
} as const

const ASSIST_PHONE = "+522229692000"
const ASSIST_PHONE_DISPLAY = "+52 222 969 2000"

// pantalla del quiosco con opciones de registro alterno cuando el visitante no tiene credencial
export function RegistroAlternativo({ onNavigate }: Props) {
  const [lang, setLang] = useState<Lang>("es")
  const [manualOpen, setManualOpen] = useState(false)
  const [manualSent, setManualSent] = useState(false)
  const [callOpen, setCallOpen] = useState(false)
  const [manualForm, setManualForm] = useState({
    id: "",
    nombre: "",
    motivo: "",
    notas: "",
  })

  const t = useMemo(() => COPY[lang], [lang])

  // valida los campos minimos y simula el envio del registro manual
  function handleManualSubmit() {
    if (!manualForm.id.trim() || !manualForm.nombre.trim() || !manualForm.motivo.trim()) return
    setManualSent(true)
  }

  // cierra el modal de registro manual y resetea el estado
  function closeManual() {
    setManualOpen(false)
    setManualSent(false)
    setManualForm({ id: "", nombre: "", motivo: "", notas: "" })
  }

  return (
    <div className="flex flex-col h-screen bg-[#f4f5f7] overflow-hidden">
      <KioscoHeader
        rightContent={
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs font-semibold text-gray-700">{t.headerLabel}</p>
              <p className="text-[10px] text-gray-400">{t.headerSub}</p>
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
              {t.title}
            </h1>
            <p className="text-gray-500 text-sm max-w-lg leading-relaxed">{t.subtitle}</p>
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
                <div className="flex flex-col gap-1">
                  <RiScanLine className="size-7 text-orange-600 opacity-80" />
                  <div className="w-7 h-px bg-orange-500 animate-pulse" />
                </div>
              </div>
            </div>

            <CardHeader className="px-6 pt-5 pb-0">
              <CardTitle className="text-[#0f2d5e] font-bold text-base">{t.card1Title}</CardTitle>
              <CardDescription className="text-xs leading-relaxed">{t.card1Desc}</CardDescription>
            </CardHeader>

            <CardContent className="px-6 pb-6 pt-4 space-y-4">
              <ul className="space-y-2.5">
                {t.card1List.map((item) => (
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
                {t.card1Cta}
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
                <div className="flex flex-col gap-1">
                  <RiScanLine className="size-7 text-blue-600 opacity-80" />
                  <div className="w-7 h-px bg-blue-500 animate-pulse" />
                </div>
              </div>
            </div>

            <CardHeader className="px-6 pt-5 pb-0">
              <CardTitle className="text-[#0f2d5e] font-bold text-base">{t.card2Title}</CardTitle>
              <CardDescription className="text-xs leading-relaxed">{t.card2Desc}</CardDescription>
            </CardHeader>

            <CardContent className="px-6 pb-6 pt-4 space-y-4">
              <ul className="space-y-2.5">
                {t.card2List.map((text, idx) => {
                  const Icon = idx === 0 ? HiOutlineCheckCircle : HiOutlineShieldExclamation
                  return (
                    <li key={text} className="flex items-center gap-2.5 text-xs text-gray-600">
                      <Icon className="size-4 text-[#1e4d9e] shrink-0" />
                      {text}
                    </li>
                  )
                })}
              </ul>

              <Button
                variant="outline"
                onClick={() => setManualOpen(true)}
                className="w-full h-11 font-bold gap-2.5 rounded-xl text-sm border-2 border-[#1e4d9e] text-[#1e4d9e] hover:bg-blue-50"
              >
                <HiOutlineUser className="size-4" />
                {t.card2Cta}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Otras opciones */}
        <div className="flex flex-col items-center gap-3 w-full max-w-3xl">
          <div className="flex items-center gap-4 w-full">
            <Separator className="flex-1" />
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.15em] shrink-0">
              {t.otherOptions}
            </span>
            <Separator className="flex-1" />
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setCallOpen(true)}
              className="rounded-full h-9 px-5 gap-2 text-xs text-gray-500 border-gray-200"
            >
              <HiOutlinePhone className="size-3.5" />
              {t.callAssistance}
            </Button>
            <Button
              variant="outline"
              onClick={() => setLang((l) => (l === "es" ? "en" : "es"))}
              className="rounded-full h-9 px-5 gap-2 text-xs text-gray-500 border-gray-200"
            >
              <HiOutlineGlobeAlt className="size-3.5" />
              {t.languageToggle}
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
          {t.back}
        </Button>
        <p className="text-[10px] text-gray-400">
          © 2026 Universidad de las Américas Puebla ·{" "}
          <span className="underline cursor-pointer hover:text-gray-600">{t.privacy}</span> ·{" "}
          <span className="underline cursor-pointer hover:text-gray-600">{t.terms}</span>
        </p>
      </footer>

      {/* ── Modal: Registro Manual ───────────────────── */}
      {manualOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 px-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeManual()
          }}
        >
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-black text-[#0f2d5e] tracking-tight">{t.manualTitle}</h2>
                <p className="text-xs text-gray-500">{t.manualSub}</p>
              </div>
              <button
                type="button"
                onClick={closeManual}
                aria-label="X"
                className="rounded-full p-1.5 text-gray-500 hover:bg-gray-100"
              >
                <HiXMark className="size-5" />
              </button>
            </div>

            {manualSent ? (
              <div className="px-6 py-6 space-y-4 text-center">
                <div className="mx-auto size-14 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                  <HiOutlineCheckCircle className="size-8 text-emerald-600" />
                </div>
                <div>
                  <div className="text-sm font-bold text-[#0f2d5e]">{t.manualSuccessTitle}</div>
                  <div className="mt-1 text-xs text-gray-500">{t.manualSuccessBody}</div>
                </div>
                <Button onClick={closeManual} className="w-full h-11 font-bold">
                  {t.manualClose}
                </Button>
              </div>
            ) : (
              <div className="px-6 py-5 space-y-4">
                <div>
                  <Label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                    {t.manualIdLabel}
                  </Label>
                  <Input
                    value={manualForm.id}
                    onChange={(e) => setManualForm((f) => ({ ...f, id: e.target.value }))}
                    placeholder="123456"
                    className="mt-1 h-11 font-mono"
                  />
                </div>
                <div>
                  <Label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                    {t.manualNameLabel}
                  </Label>
                  <Input
                    value={manualForm.nombre}
                    onChange={(e) => setManualForm((f) => ({ ...f, nombre: e.target.value }))}
                    placeholder="Nombre y apellidos"
                    className="mt-1 h-11"
                  />
                </div>
                <div>
                  <Label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                    {t.manualReasonLabel}
                  </Label>
                  <Input
                    value={manualForm.motivo}
                    onChange={(e) => setManualForm((f) => ({ ...f, motivo: e.target.value }))}
                    placeholder="Clase, trámite, visita…"
                    className="mt-1 h-11"
                  />
                </div>
                <div>
                  <Label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                    {t.manualNotesLabel}
                  </Label>
                  <Textarea
                    value={manualForm.notas}
                    onChange={(e) => setManualForm((f) => ({ ...f, notas: e.target.value }))}
                    className="mt-1 min-h-[80px]"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <Button variant="outline" onClick={closeManual}>
                    {t.manualCancel}
                  </Button>
                  <Button
                    onClick={handleManualSubmit}
                    disabled={
                      !manualForm.id.trim() ||
                      !manualForm.nombre.trim() ||
                      !manualForm.motivo.trim()
                    }
                    className="bg-[#1e4d9e] hover:bg-[#0f2d5e] text-white"
                  >
                    {t.manualConfirm}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Modal: Llamar a Asistencia ───────────────── */}
      {callOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 px-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setCallOpen(false)
          }}
        >
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-black text-[#0f2d5e] tracking-tight">{t.callTitle}</h2>
                <p className="text-xs text-gray-500">{t.callSub}</p>
              </div>
              <button
                type="button"
                onClick={() => setCallOpen(false)}
                aria-label="X"
                className="rounded-full p-1.5 text-gray-500 hover:bg-gray-100"
              >
                <HiXMark className="size-5" />
              </button>
            </div>

            <div className="px-6 py-6 space-y-5 text-center">
              <div className="mx-auto size-14 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center">
                <HiOutlinePhone className="size-7 text-[#1e4d9e]" />
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                  {t.callNumberLabel}
                </div>
                <a
                  href={`tel:${ASSIST_PHONE}`}
                  className="mt-1 inline-block text-2xl font-black text-[#0f2d5e] tracking-tight tabular-nums hover:underline"
                >
                  {ASSIST_PHONE_DISPLAY}
                </a>
              </div>
              <div className="flex flex-col gap-2">
                <a
                  href={`tel:${ASSIST_PHONE}`}
                  className="inline-flex items-center justify-center gap-2 h-11 rounded-xl bg-[#1e4d9e] hover:bg-[#0f2d5e] text-white font-bold text-sm"
                >
                  <HiOutlinePhone className="size-4" />
                  {t.callBtn}
                </a>
                <Button variant="outline" onClick={() => setCallOpen(false)}>
                  {t.callClose}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
