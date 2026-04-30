import { useCallback, useState } from "react"
import { api } from "@/lib/api"
import { useAuth } from "@/lib/auth-store"
import { compressToBase64 } from "@/lib/image"

// hook para administrar la edicion del perfil del usuario y el cambio de avatar
export function usePerfil() {
  const { user, refresh } = useAuth()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // actualiza datos basicos del perfil y refresca al usuario
  const update = useCallback(
    async (patch: Partial<{ nombre: string; apellido: string; telefono: string }>) => {
      setSaving(true)
      setError(null)
      try {
        await api.patch("/api/users/me", patch)
        await refresh()
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error")
        throw e
      } finally {
        setSaving(false)
      }
    },
    [refresh]
  )

  // comprime la imagen, la sube como avatar y refresca al usuario
  const changeAvatar = useCallback(
    async (file: File) => {
      setSaving(true)
      setError(null)
      try {
        const base64 = await compressToBase64(file, { maxKB: 250, maxPx: 512 })
        await api.post("/api/users/me/avatar", { base64 })
        await refresh()
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error")
        throw e
      } finally {
        setSaving(false)
      }
    },
    [refresh]
  )

  return { user, saving, error, update, changeAvatar }
}
