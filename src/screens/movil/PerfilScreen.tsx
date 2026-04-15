import { useNavigate } from "react-router-dom"
import { ArrowLeft, LogOut, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { BottomNav } from "./BottomNav"
import { currentUser } from "./data"

const fields = [
  { label: "Nombre", value: currentUser.nombre },
  { label: "Apellido", value: currentUser.apellido },
  { label: "ID", value: currentUser.studentId },
  { label: "Email", value: currentUser.email },
]

export function PerfilScreen() {
  const navigate = useNavigate()

  const handleLogout = () => {
    navigate("/movil/login")
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      {/* Header */}
      <div className="bg-white px-5 pt-12 pb-4 flex items-center gap-3">
        <button onClick={() => navigate("/movil/dashboard")} className="text-gray-400">
          <ArrowLeft className="size-5" />
        </button>
        <h1 className="text-lg font-black text-gray-900">Perfil</h1>
      </div>

      <div className="px-5 py-6 space-y-5">
        {/* Avatar + name */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-white font-black text-xl"
              style={{
                background: "linear-gradient(135deg,#1e3a5f,#0f2d5e)",
                border: "3px solid #ea580c",
                padding: 2,
              }}
            >
              {currentUser.nombre[0]}{currentUser.apellido[0]}
            </div>
            {/* Online dot */}
            <span
              className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white"
              style={{ background: "#22c55e" }}
            />
          </div>
          <div>
            <h2 className="text-xl font-black text-gray-900">
              {currentUser.nombre} {currentUser.apellido}
            </h2>
            <p className="text-sm text-gray-400 font-medium">ID: {currentUser.id}</p>
            <span
              className="inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full mt-1"
              style={{ background: "#fff3ee", color: "#ea580c" }}
            >
              {currentUser.tipo}
            </span>
          </div>
        </div>

        {/* Info card */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: "#fff3ee" }}
        >
          {fields.map(({ label, value }, i) => (
            <div
              key={label}
              className={`px-5 py-3.5 ${i < fields.length - 1 ? "border-b border-orange-100" : ""}`}
            >
              <p className="text-xs font-black text-gray-700 mb-0.5">{label}</p>
              <p className="text-sm text-gray-600">{value}</p>
            </div>
          ))}

          {/* Change password */}
          <div className="px-5 py-3.5 border-t border-orange-100">
            <button
              className="text-sm font-bold flex items-center gap-1"
              style={{ color: "#ea580c" }}
            >
              Cambiar contraseña
              <ChevronRight className="size-3.5" />
            </button>
          </div>
        </div>

        {/* Logout */}
        <Button
          onClick={handleLogout}
          className="w-full h-13 rounded-2xl text-white font-bold text-base gap-3"
          style={{
            background: "linear-gradient(135deg,#ea580c,#c2410c)",
            border: "none",
            height: 52,
          }}
        >
          <LogOut className="size-5" />
          Cerrar Sesión
        </Button>
      </div>

      <div className="h-[68px]" />
      <BottomNav />
    </div>
  )
}
