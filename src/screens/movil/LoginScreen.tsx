import { useEffect, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, Scan, Globe, Fingerprint } from "lucide-react"
import { useAuth } from "@/lib/auth-store"
import { ApiError } from "@/lib/api"

// pantalla de login del movil con correo, password y opciones biometricas
export function LoginScreen() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, user } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const from =
    (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ??
    "/movil/dashboard"

  // si ya hay usuario autenticado redirige a la ruta correspondiente
  useEffect(() => {
    if (user) navigate(from, { replace: true })
  }, [user, navigate, from])

  // manda credenciales al backend y redirige segun el rol del usuario
  const handleLogin = async () => {
    setError(null)
    setSubmitting(true)
    try {
      const u = await login(email.trim().toLowerCase(), password)
      if (u.role === "oficial") navigate("/ipad", { replace: true })
      else if (u.role === "adminColegios") navigate("/colegios", { replace: true })
      else navigate(from, { replace: true })
    } catch (err) {
      if (err instanceof ApiError) setError(err.message)
      else setError("No se pudo iniciar sesión")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-white px-6 pt-12 pb-8">
      <div className="flex flex-col items-center mb-8">
        <div
          className="w-24 h-24 rounded-full mb-5 flex items-center justify-center overflow-hidden"
          style={{ border: "3px solid #ea580c", padding: 3 }}
        >
          <div
            className="w-full h-full rounded-full flex items-center justify-center text-white font-black text-2xl"
            style={{ background: "linear-gradient(135deg,#1e3a5f 0%,#0f2d5e 100%)" }}
          >
            UDLAP
          </div>
        </div>

        <h1 className="text-2xl font-black text-gray-900 mb-1">Iniciar Sesión</h1>
        <p className="text-sm text-gray-500 text-center">
          Ingresa tus credenciales institucionales
        </p>
      </div>

      <form
        className="flex flex-col gap-5 mb-6"
        onSubmit={(e) => {
          e.preventDefault()
          if (!submitting) void handleLogin()
        }}
      >
        <div className="space-y-1.5">
          <Label className="text-sm font-semibold text-gray-700">Correo institucional</Label>
          <Input
            type="email"
            placeholder="estudiante@udlap.mx"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-12 rounded-xl border-gray-200 bg-gray-50 text-sm"
            autoComplete="username"
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm font-semibold text-gray-700">Contraseña</Label>
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 rounded-xl border-gray-200 bg-gray-50 text-sm pr-12"
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              aria-label="Mostrar/ocultar contraseña"
            >
              {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
            </button>
          </div>
          <div className="flex justify-end">
            <a
              href="https://inscripciones.udlap.mx/DesbloqueoCuenta"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold"
              style={{ color: "#ea580c" }}
            >
              ¿Olvidaste tu contraseña?
            </a>
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <Button
          type="submit"
          disabled={submitting}
          className="h-13 rounded-xl text-white font-bold text-base w-full disabled:opacity-50"
          style={{ background: "linear-gradient(135deg,#ea580c 0%,#c2410c 100%)", border: "none", height: 52 }}
        >
          {submitting ? "Iniciando…" : "Iniciar Sesión"}
        </Button>
      </form>

      <div className="mb-6">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
          Cuenta demo
        </p>
        <button
          type="button"
          onClick={() => {
            setEmail("estudiante@udlap.mx")
            setPassword("demo1234")
          }}
          className="w-full text-left p-3 rounded-lg bg-gray-50 hover:bg-gray-100 text-xs text-gray-600"
        >
          <div className="font-bold text-gray-800">Estudiante</div>
          <div>estudiante@udlap.mx · demo1234</div>
        </button>
      </div>

      <div className="mt-auto">
        <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest text-center mb-4">
          Otras Opciones
        </p>
        <div className="flex justify-center gap-8 mb-6">
          <button className="flex flex-col items-center gap-1.5" type="button" onClick={() => alert("FaceID no disponible en demo")}>
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
              <Scan className="size-5 text-gray-400" />
            </div>
          </button>
          <button className="flex flex-col items-center gap-1.5" type="button" onClick={() => alert("Huella no disponible en demo")}>
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
              <Fingerprint className="size-5 text-gray-400" />
            </div>
          </button>
          <button className="flex flex-col items-center gap-1.5" type="button" onClick={() => navigate("/")}>
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
              <Globe className="size-5 text-gray-400" />
            </div>
          </button>
        </div>

        <p className="text-center text-[11px] text-gray-300 leading-relaxed">
          © 2024 Universidad de las Américas Puebla
          <br />
          Todos los derechos reservados.
        </p>
      </div>
    </div>
  )
}
