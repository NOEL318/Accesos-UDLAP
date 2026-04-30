import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { Navigate, useLocation } from "react-router-dom"
import { api, setStoredToken } from "./api"
import type { Role, User } from "./types"

const STORAGE_USER_KEY = "accesos_udlap_user"

interface AuthValue {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<User>
  loginPin: (oficialUserId: string, pin: string) => Promise<User>
  logout: () => Promise<void>
  refresh: () => Promise<void>
}

const Ctx = createContext<AuthValue | null>(null)

// provider de autenticacion: maneja sesion, login, loginPin y logout
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const raw = localStorage.getItem(STORAGE_USER_KEY)
    if (!raw) return null
    try {
      return JSON.parse(raw) as User
    } catch {
      return null
    }
  })
  const [isLoading, setIsLoading] = useState(true)

  const persist = (u: User | null) => {
    setUser(u)
    if (u) localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(u))
    else localStorage.removeItem(STORAGE_USER_KEY)
  }

  // pide al backend el usuario actual y lo guarda; si falla, limpia la sesion
  const refresh = useCallback(async () => {
    try {
      const data = await api.get<{ user: User }>("/api/auth/me")
      persist(data.user)
    } catch {
      persist(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // al montar, valida la sesion contra el backend
  useEffect(() => {
    void refresh()
  }, [refresh])

  // escucha el evento 401 que dispara api.ts para cerrar sesion
  useEffect(() => {
    const onUnauthorized = () => persist(null)
    window.addEventListener("accesos:unauthorized", onUnauthorized)
    return () => window.removeEventListener("accesos:unauthorized", onUnauthorized)
  }, [])

  // login con email y password, guarda token y usuario
  const login = useCallback(async (email: string, password: string) => {
    const data = await api.post<{ user: User; token: string }>("/api/auth/login", {
      email,
      password,
    })
    setStoredToken(data.token)
    persist(data.user)
    setIsLoading(false)
    return data.user
  }, [])

  // login con pin para oficiales de seguridad
  const loginPin = useCallback(async (oficialUserId: string, pin: string) => {
    const data = await api.post<{ user: User; token: string }>("/api/auth/login-pin", {
      oficialUserId,
      pin,
    })
    setStoredToken(data.token)
    persist(data.user)
    setIsLoading(false)
    return data.user
  }, [])

  // cierra sesion en el backend y limpia el estado local
  const logout = useCallback(async () => {
    try {
      await api.post("/api/auth/logout")
    } catch {
      /* ignore */
    } finally {
      setStoredToken(null)
      persist(null)
    }
  }, [])

  // memoiza el value del context para evitar renders innecesarios
  const value = useMemo<AuthValue>(
    () => ({ user, isLoading, login, loginPin, logout, refresh }),
    [user, isLoading, login, loginPin, logout, refresh]
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
// hook para consumir el context de auth desde cualquier pantalla
export function useAuth(): AuthValue {
  const v = useContext(Ctx)
  if (!v) throw new Error("useAuth fuera de AuthProvider")
  return v
}

interface RequireAuthProps {
  children: ReactNode
  role?: Role | Role[]
  loginPath?: string
}

// guard de rutas: redirige a login si no hay sesion o si el rol no coincide
export function RequireAuth({
  children,
  role,
  loginPath = "/movil/login",
}: RequireAuthProps) {
  const { user, isLoading, logout } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-gray-400">
        Cargando…
      </div>
    )
  }
  if (!user) {
    return <Navigate to={loginPath} replace state={{ from: location }} />
  }
  if (role) {
    const allowed = Array.isArray(role) ? role : [role]
    if (!allowed.includes(user.role)) {
      return <RoleMismatch user={user} allowed={allowed} loginPath={loginPath} onLogout={logout} />
    }
  }
  return <>{children}</>
}

// pantalla que muestra cuando el usuario logueado no tiene el rol requerido
function RoleMismatch({
  user,
  allowed,
  loginPath,
  onLogout,
}: {
  user: User
  allowed: Role[]
  loginPath: string
  onLogout: () => Promise<void>
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-6">
      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-6 text-center">
        <h1 className="text-lg font-black text-slate-900 mb-2">Cuenta incorrecta</h1>
        <p className="text-sm text-slate-600 mb-1">
          Estás conectado como <span className="font-bold">{user.email}</span> con rol <span className="font-bold">{user.role}</span>.
        </p>
        <p className="text-sm text-slate-600 mb-5">
          Esta sección requiere uno de: <span className="font-mono text-xs">{allowed.join(", ")}</span>.
        </p>
        <div className="flex flex-col gap-2">
          <button
            onClick={async () => { await onLogout(); window.location.href = loginPath }}
            className="w-full h-10 rounded-lg bg-orange-600 text-white font-bold text-sm hover:bg-orange-700"
          >
            Cerrar sesión y entrar con otra cuenta
          </button>
          <a
            href="/"
            className="w-full h-10 rounded-lg border border-slate-200 text-slate-700 font-bold text-sm flex items-center justify-center hover:bg-slate-50"
          >
            Volver al selector
          </a>
        </div>
      </div>
    </div>
  )
}
