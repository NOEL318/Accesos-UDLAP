import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, Scan, Globe, Fingerprint } from "lucide-react"
import { QrCode } from "./QrCode"

export function LoginScreen() {
  const navigate = useNavigate()
  const [userId, setUserId] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  const handleLogin = () => {
    navigate("/movil/dashboard")
  }

  const handleFaceId = () => {
    navigate("/movil/dashboard")
  }

  return (
    <div className="min-h-screen flex flex-col bg-white px-6 pt-12 pb-8">
      {/* Logo + title */}
      <div className="flex flex-col items-center mb-8">
        <div
          className="w-24 h-24 rounded-full mb-5 flex items-center justify-center overflow-hidden"
          style={{ border: "3px solid #ea580c", padding: 3 }}
        >
          {/* UDLAP shield placeholder */}
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

      {/* Form */}
      <div className="flex flex-col gap-5 mb-6">
        <div className="space-y-1.5">
          <Label className="text-sm font-semibold text-gray-700">Usuario ID</Label>
          <Input
            placeholder="ID Estudiante"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="h-12 rounded-xl border-gray-200 bg-gray-50 text-sm"
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
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
            >
              {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
            </button>
          </div>
          <div className="flex justify-end">
            <button className="text-xs font-semibold" style={{ color: "#ea580c" }}>
              ¿Olvidaste tu contraseña?
            </button>
          </div>
        </div>

        <Button
          onClick={handleLogin}
          className="h-13 rounded-xl text-white font-bold text-base w-full"
          style={{ background: "linear-gradient(135deg,#ea580c 0%,#c2410c 100%)", border: "none", height: 52 }}
        >
          Iniciar Sesión
        </Button>
      </div>

      {/* Quick access */}
      <div className="mb-6">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
          Accesos Rápidos
        </p>
        <button
          onClick={handleFaceId}
          className="w-full flex items-center gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100 hover:bg-gray-100 transition-colors"
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "#f5ebe0" }}
          >
            <Scan className="size-5" style={{ color: "#ea580c" }} />
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-bold text-gray-800">Acceso Rápido con FaceID</p>
            <p className="text-xs text-gray-500">Abre tu código QR de acceso inmediatamente</p>
          </div>
          <div className="shrink-0 opacity-30">
            <QrCode size={36} color="#ea580c" />
          </div>
        </button>
      </div>

      {/* Other options */}
      <div className="mt-auto">
        <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest text-center mb-4">
          Otras Opciones
        </p>
        <div className="flex justify-center gap-8 mb-6">
          <button className="flex flex-col items-center gap-1.5">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
              <Fingerprint className="size-5 text-gray-400" />
            </div>
          </button>
          <button className="flex flex-col items-center gap-1.5">
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
