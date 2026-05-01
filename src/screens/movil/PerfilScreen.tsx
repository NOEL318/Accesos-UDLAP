import { useNavigate } from "react-router-dom"
import { ArrowLeft, LogOut, ChevronRight, Camera, Image } from "lucide-react"
import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { BottomNav } from "./BottomNav"
import { useAuth } from "@/lib/auth-store"
import { usePerfil } from "./hooks/usePerfil"
import { CameraCapture } from "@/components/CameraCapture"

// pantalla de perfil del usuario con avatar, datos basicos y boton de cerrar sesion
export function PerfilScreen() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { changeAvatar, changeAvatarBase64, saving, error } = usePerfil()
  const fileRef = useRef<HTMLInputElement>(null)
  const [localError, setLocalError] = useState<string | null>(null)
  const [cameraOpen, setCameraOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [confirmLogout, setConfirmLogout] = useState(false)

  // cierra sesion y regresa al login
  const handleLogout = async () => {
    await logout()
    navigate("/movil/login")
  }

  // toma el archivo seleccionado y lo manda como nuevo avatar
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLocalError(null)
    try {
      await changeAvatar(file)
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Error al subir avatar")
    } finally {
      if (fileRef.current) fileRef.current.value = ""
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-gray-400">
        Cargando…
      </div>
    )
  }

  const studentId = user.profile?.estudiante?.studentId ?? ""
  const fields = [
    { label: "Nombre", value: user.nombre },
    { label: "Apellido", value: user.apellido },
    { label: "ID", value: studentId },
    { label: "Email", value: user.email },
  ]

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
              className="w-16 h-16 rounded-full flex items-center justify-center text-white font-black text-xl overflow-hidden"
              style={{
                background: "linear-gradient(135deg,#1e3a5f,#0f2d5e)",
                border: "3px solid #ea580c",
                padding: 2,
              }}
            >
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={`${user.nombre} ${user.apellido}`}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <>
                  {user.nombre[0]}
                  {user.apellido[0]}
                </>
              )}
            </div>
            {/* Online dot */}
            <span
              className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white"
              style={{ background: "#22c55e" }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-black text-gray-900">
              {user.nombre} {user.apellido}
            </h2>
            <p className="text-sm text-gray-400 font-medium">ID: {studentId || user.id}</p>
            <span
              className="inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full mt-1"
              style={{ background: "#fff3ee", color: "#ea580c" }}
            >
              {user.role === "estudiante" ? "Estudiante Licenciatura" : user.role}
            </span>
          </div>
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              disabled={saving}
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl disabled:opacity-50"
              style={{ background: "#fff3ee", color: "#ea580c" }}
            >
              <Camera className="size-3.5" />
              {saving ? "Subiendo…" : "Cambiar foto"}
            </button>
            {menuOpen && (
              <div
                className="absolute right-0 z-30 mt-2 w-44 overflow-hidden rounded-xl border border-orange-100 bg-white shadow-lg"
              >
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false)
                    setCameraOpen(true)
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-bold text-gray-700 hover:bg-orange-50"
                >
                  <Camera className="size-3.5 text-orange-600" />
                  Tomar selfie
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false)
                    fileRef.current?.click()
                  }}
                  className="flex w-full items-center gap-2 border-t border-orange-50 px-3 py-2 text-left text-xs font-bold text-gray-700 hover:bg-orange-50"
                >
                  <Image className="size-3.5 text-orange-600" />
                  Subir desde galería
                </button>
              </div>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={handleFileChange}
          />
        </div>

        {(localError || error) && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-2.5 text-xs font-bold text-red-700">
            {localError || error}
          </div>
        )}

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
            <a
              href="https://inscripciones.udlap.mx/DesbloqueoCuenta"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-bold flex items-center gap-1"
              style={{ color: "#ea580c" }}
            >
              Cambiar contraseña
              <ChevronRight className="size-3.5" />
            </a>
          </div>
        </div>

        {/* Logout */}
        <Button
          onClick={() => setConfirmLogout(true)}
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

      <AlertDialog
        open={confirmLogout}
        onOpenChange={setConfirmLogout}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro de cerrar sesión?</AlertDialogTitle>
            <AlertDialogDescription>
              Tendrás que volver a iniciar sesión con tus credenciales institucionales.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmLogout(false)
                void handleLogout()
              }}
            >
              Cerrar sesión
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="h-[68px]" />
      <BottomNav />

      <CameraCapture
        open={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onCapture={async (b64) => {
          setLocalError(null)
          try {
            await changeAvatarBase64(b64)
          } catch (e) {
            setLocalError(e instanceof Error ? e.message : "Error al subir avatar")
          }
        }}
        title="Tomar selfie"
        hint="Encuadra tu rostro y captura la foto."
        facingMode="user"
        maxKB={250}
        maxPx={512}
      />
    </div>
  )
}
