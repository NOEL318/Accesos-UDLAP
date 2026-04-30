import { useState } from "react"
import { Outlet } from "react-router-dom"
import { ColegiosSessionProvider } from "./context/ColegiosSessionContext"
import { ColegiosDataProvider } from "./context/ColegiosDataContext"
import { ColegiosSidebar } from "./ColegiosSidebar"
import { ColegiosHeader } from "./ColegiosHeader"

// layout raíz del módulo colegios con providers de sesión y data
export function ColegiosLayout() {
  return (
    <ColegiosSessionProvider>
      <ColegiosDataProvider>
        <ColegiosLayoutInner />
      </ColegiosDataProvider>
    </ColegiosSessionProvider>
  )
}

// layout interno con sidebar, header y outlet de las rutas hijas
function ColegiosLayoutInner() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <ColegiosSidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      <div className="flex-1 flex flex-col min-w-0">
        <ColegiosHeader onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
