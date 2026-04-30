import { useEffect, useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { api } from "@/lib/api"
import { useAuth } from "@/lib/auth-store"
import { PinKeypad } from "./ipad/components/PinKeypad"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface OficialItem {
  id: string
  nombre: string
  turno: string
  avatar?: string | null
}

// pantalla de login del quiosco con selección de oficial y PIN de 4 dígitos
export function KioscoLoginScreen() {
  const navigate = useNavigate()
  const { loginPin, user } = useAuth()
  const [oficiales, setOficiales] = useState<OficialItem[]>([])
  const [selected, setSelected] = useState<OficialItem | null>(null)
  const [pin, setPin] = useState("")
  const [error, setError] = useState(false)
  const [shake, setShake] = useState(false)

  // carga la lista de oficiales disponibles desde el backend
  useEffect(() => {
    void api.get<OficialItem[]>("/api/auth/oficiales").then(setOficiales).catch(() => setOficiales([]))
  }, [])

  // si el usuario ya está autenticado como oficial o admin, lo redirige al quiosco
  useEffect(() => {
    if (user?.role === "oficial" || user?.role === "admin") {
      navigate("/quiosco", { replace: true })
    }
  }, [user, navigate])

  // agrega un dígito al PIN y valida el login cuando llega a 4 dígitos
  async function handleDigit(d: string) {
    if (!selected || pin.length >= 4) return
    const next = pin + d
    setPin(next)
    setError(false)
    if (next.length === 4) {
      try {
        await loginPin(selected.id, next)
        navigate("/quiosco", { replace: true })
      } catch {
        setError(true)
        setShake(true)
        setTimeout(() => { setShake(false); setPin("") }, 500)
      }
    }
  }

  // borra el último dígito del PIN
  function handleBackspace() {
    setPin((p) => p.slice(0, -1))
    setError(false)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10 bg-slate-50 relative">
      <Link to="/" className="absolute top-6 left-6 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900">
        <ArrowLeft className="size-4" /> Volver al selector
      </Link>

      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="text-2xl font-black text-[#0f2d5e]">Quiosco UDLAP</div>
          <p className="text-sm text-slate-500 mt-1">Ingreso de operador</p>
        </div>

        {!selected ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h1 className="text-center text-lg font-bold mb-4">Selecciona oficial operador</h1>
            <div className="grid grid-cols-2 gap-3">
              {oficiales.map((o) => (
                <button
                  key={o.id}
                  onClick={() => setSelected(o)}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl border border-slate-200 hover:bg-slate-50"
                >
                  <Avatar className="size-12">
                    {o.avatar ? <AvatarImage src={o.avatar} alt={o.nombre} /> : null}
                    <AvatarFallback>{o.nombre.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="text-sm font-bold">{o.nombre}</div>
                  <div className="text-[11px] text-slate-500">{o.turno}</div>
                </button>
              ))}
              {oficiales.length === 0 && (
                <p className="col-span-2 text-center text-sm text-slate-400">No hay oficiales disponibles</p>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <button
              onClick={() => { setSelected(null); setPin(""); setError(false) }}
              className="text-xs text-slate-500 mb-4 hover:text-slate-900"
            >
              ← Cambiar oficial
            </button>
            <div className="flex flex-col items-center mb-4">
              <Avatar className="size-16 mb-2">
                {selected.avatar ? <AvatarImage src={selected.avatar} alt={selected.nombre} /> : null}
                <AvatarFallback>{selected.nombre.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="font-bold">{selected.nombre}</div>
              <div className="text-[11px] text-slate-500">{selected.turno}</div>
            </div>

            <div className={"flex justify-center gap-3 mb-4 " + (shake ? "animate-shake" : "")}>
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={
                    "size-3 rounded-full transition-colors " +
                    (i < pin.length
                      ? error ? "bg-red-500" : "bg-orange-600"
                      : "bg-slate-300")
                  }
                />
              ))}
            </div>

            {error && <div className="text-center text-xs text-red-600 mb-3">PIN incorrecto</div>}

            <PinKeypad onDigit={handleDigit} onBackspace={handleBackspace} />
          </div>
        )}
      </div>
    </div>
  )
}
