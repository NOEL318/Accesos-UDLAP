import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/lib/auth-store"
import { ApiError } from "@/lib/api"

// pantalla de login del coordinador de colegios residenciales
export function ColegiosLoginScreen() {
  const navigate = useNavigate()
  const { login, user } = useAuth()
  const [email, setEmail] = useState("colegios@udlap.mx")
  const [password, setPassword] = useState("demo1234")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // si ya hay sesión válida, redirige directo al dashboard de colegios
  useEffect(() => {
    if (user?.role === "adminColegios" || user?.role === "admin") {
      navigate("/colegios", { replace: true })
    }
  }, [user, navigate])

  // dispara el login con email y password y maneja errores de la API
  const submit = async () => {
    setSubmitting(true)
    setError(null)
    try {
      await login(email.trim().toLowerCase(), password)
      navigate("/colegios", { replace: true })
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Error")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <Link
        to="/"
        className="absolute top-6 left-6 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft className="size-4" /> Volver al selector
      </Link>
      <div className="w-full max-w-sm bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h1 className="text-xl font-black text-slate-900 mb-1 text-center">
          Colegios Residenciales
        </h1>
        <p className="text-sm text-slate-500 mb-5 text-center">
          Ingreso del coordinador
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (!submitting) void submit()
          }}
          className="space-y-3"
        >
          <Input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="correo"
            type="email"
            required
          />
          <Input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="contraseña"
            type="password"
            required
          />
          {error && <div className="text-xs text-red-600">{error}</div>}
          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? "Ingresando…" : "Ingresar"}
          </Button>
        </form>
        <p className="text-[11px] text-center text-slate-400 mt-4">
          Demo: colegios@udlap.mx / demo1234
        </p>
      </div>
    </div>
  )
}
