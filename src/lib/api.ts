const STORAGE_TOKEN_KEY = "accesos_udlap_token"

export class ApiError extends Error {
  status: number
  code: string
  details?: unknown
  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message)
    this.status = status
    this.code = code
    this.details = details
  }
}

const baseUrl: string =
  (import.meta.env.VITE_API_URL as string | undefined) ?? ""

// arma la url con query params, relativa al baseUrl configurado
function buildUrl(path: string, query?: Record<string, unknown>): string {
  const url = new URL(`${baseUrl}${path}`, window.location.origin)
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v === undefined || v === null) continue
      url.searchParams.set(k, String(v))
    }
  }
  return url.pathname + url.search
}

// saca el token guardado en localStorage
function getToken(): string | null {
  return localStorage.getItem(STORAGE_TOKEN_KEY)
}

// guarda o borra el token de sesion en localStorage
export function setStoredToken(token: string | null): void {
  if (token === null) localStorage.removeItem(STORAGE_TOKEN_KEY)
  else localStorage.setItem(STORAGE_TOKEN_KEY, token)
}

// hace la llamada http con token, parsea la respuesta y maneja errores 401
async function request<T>(
  method: string,
  path: string,
  opts?: { query?: Record<string, unknown>; body?: unknown }
): Promise<T> {
  const headers: Record<string, string> = {}
  const token = getToken()
  if (token) headers["Authorization"] = `Bearer ${token}`
  if (opts?.body !== undefined) headers["Content-Type"] = "application/json"

  const res = await fetch(buildUrl(path, opts?.query), {
    method,
    headers,
    body: opts?.body !== undefined ? JSON.stringify(opts.body) : undefined,
  })

  if (res.status === 204) return undefined as T

  const text = await res.text()
  let json: any = null
  try {
    json = text ? JSON.parse(text) : null
  } catch {
    /* not json */
  }

  if (!res.ok) {
    const code = json?.error ?? "INTERNAL"
    const message = json?.message ?? `HTTP ${res.status}`
    if (res.status === 401) {
      setStoredToken(null)
      window.dispatchEvent(new Event("accesos:unauthorized"))
    }
    throw new ApiError(res.status, code, message, json?.details)
  }

  return (json?.data ?? json) as T
}

export const api = {
  get: <T>(path: string, query?: Record<string, unknown>) =>
    request<T>("GET", path, { query }),
  post: <T>(path: string, body?: unknown) =>
    request<T>("POST", path, { body }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>("PATCH", path, { body }),
  delete: <T>(path: string) => request<T>("DELETE", path),
}
