import { useState } from "react"
import { ArrowLeft, ShieldCheck } from "lucide-react"
import { Link } from "react-router-dom"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { useIpadSession } from "./context/IpadSessionContext"
import { PinKeypad } from "./components/PinKeypad"
import { cn } from "@/lib/utils"

// pantalla de login del iPad con seleccion de oficial y captura de PIN
export function LoginScreen() {
  const { officers, login } = useIpadSession()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [pin, setPin] = useState("")
  const [error, setError] = useState(false)
  const [shake, setShake] = useState(false)

  const selected = officers.find((o) => o.id === selectedId) ?? null

  // agrega un digito al PIN y dispara el login al llegar a 4
  function handleDigit(d: string) {
    if (pin.length >= 4) return
    const next = pin + d
    setPin(next)
    setError(false)
    if (next.length === 4 && selected) {
      void (async () => {
        const ok = await login(selected.id, next)
        if (!ok) {
          setError(true)
          setShake(true)
          setTimeout(() => {
            setShake(false)
            setPin("")
          }, 500)
        }
        // En caso de éxito, AuthProvider actualiza el user → IpadLayoutInner
        // re-renderiza y redirige al dashboard automáticamente.
      })()
    }
  }

  // borra el ultimo digito del PIN
  function handleBackspace() {
    setPin((p) => p.slice(0, -1))
    setError(false)
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-10 relative overflow-hidden"
      style={{
        background:
          "radial-gradient(circle at 15% 15%, rgba(234,88,12,0.08) 0%, transparent 45%), radial-gradient(circle at 85% 85%, rgba(234,88,12,0.06) 0%, transparent 45%), #f8fafc",
      }}
    >
      <Link
        to="/"
        className="absolute top-6 left-6 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft className="size-4" />
        Volver al selector
      </Link>

      <div className="w-full max-w-md" style={{ animation: "fadeUp 0.5s ease both" }}>
        <div className="mb-8 flex items-center justify-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-xl bg-orange-600 shadow-lg shadow-orange-600/20">
            <ShieldCheck className="size-6 text-white" />
          </div>
          <div>
            <div className="text-xl font-black leading-none">UDLAP</div>
            <div className="text-[11px] font-bold tracking-widest text-orange-600 uppercase mt-0.5">
              Security Control
            </div>
          </div>
        </div>

        {!selected ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h1 className="text-center text-xl font-bold tracking-tight mb-1">Selecciona tu perfil</h1>
            <p className="text-center text-sm text-muted-foreground mb-6">
              Ingresa con tu PIN de oficial
            </p>
            <div className="grid grid-cols-2 gap-3">
              {officers.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => setSelectedId(o.id)}
                  className="group flex flex-col items-center gap-2 rounded-xl border border-slate-200 bg-white p-4 text-center transition-all hover:border-orange-500 hover:shadow-md"
                >
                  <Avatar className="size-14">
                    <AvatarImage src={o.avatar} alt={o.nombre} />
                    <AvatarFallback>{o.nombre[0]}</AvatarFallback>
                  </Avatar>
                  <div className="text-sm font-semibold leading-tight">{o.nombre}</div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-orange-600">
                    Turno {o.turno}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            style={{ animation: shake ? "shake 0.4s ease" : undefined }}
          >
            <div className="flex items-center gap-3 mb-6">
              <Avatar className="size-12">
                <AvatarImage src={selected.avatar} alt={selected.nombre} />
                <AvatarFallback>{selected.nombre[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold truncate">{selected.nombre}</div>
                <div className="text-xs text-orange-600 font-semibold">Turno {selected.turno}</div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => { setSelectedId(null); setPin(""); setError(false) }}>
                Cambiar
              </Button>
            </div>

            <div className="mb-6 flex justify-center gap-3">
              {[0, 1, 2, 3].map((i) => (
                <span
                  key={i}
                  className={cn(
                    "size-4 rounded-full transition-all",
                    pin.length > i
                      ? error
                        ? "bg-red-500"
                        : "bg-orange-600"
                      : "bg-slate-200"
                  )}
                />
              ))}
            </div>

            {error && (
              <p className="mb-4 text-center text-sm font-medium text-red-600">
                PIN incorrecto, inténtalo de nuevo.
              </p>
            )}

            <PinKeypad onDigit={handleDigit} onBackspace={handleBackspace} />

            <p className="mt-6 text-center text-xs text-muted-foreground">
              Demo — PIN de prueba: <span className="font-mono font-semibold">{selected.pin}</span>
            </p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-8px); }
          75% { transform: translateX(8px); }
        }
      `}</style>
    </div>
  )
}
