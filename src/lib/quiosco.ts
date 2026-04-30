import { api } from "./api"
import type { Visita } from "./types"

export interface QrValidation {
  visita: Visita
  estado: "valido" | "expirado" | "no_encontrado"
}

// pega al endpoint publico para validar el token del qr de visita
export async function validarQrToken(token: string): Promise<Visita> {
  // Endpoint público (no requiere auth)
  return api.get<Visita>(`/api/visitas/qr/${encodeURIComponent(token)}`)
}

// registra un ingreso alternativo cuando el visitante no trae qr
export async function registrarIngresoAlternativo(input: {
  nombre: string
  tipoId?: string
  motivo?: string
  fotoIne?: string
  vehiculoMatricula?: string
}) {
  return api.post<{ _id: string; nombre: string; ingreso: string }>(
    "/api/quiosco/registro-alternativo",
    input
  )
}
