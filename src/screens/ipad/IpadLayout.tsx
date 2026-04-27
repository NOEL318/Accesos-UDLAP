import { useState } from "react"
import { Navigate, Outlet, useLocation } from "react-router-dom"
import { IpadSessionProvider, useIpadSession } from "./context/IpadSessionContext"
import { IpadDataProvider } from "./context/IpadDataContext"
import { IpadSidebar } from "./IpadSidebar"
import { IpadHeader } from "./IpadHeader"

export function IpadLayout() {
  return (
    <IpadSessionProvider>
      <IpadDataProvider>
        <IpadLayoutInner />
      </IpadDataProvider>
    </IpadSessionProvider>
  )
}

function IpadLayoutInner() {
  const { pathname } = useLocation()
  const { officer } = useIpadSession()
  const [mobileOpen, setMobileOpen] = useState(false)

  const isLogin = pathname === "/ipad/login"

  if (!officer && !isLogin) {
    return <Navigate to="/ipad/login" replace />
  }
  if (officer && isLogin) {
    return <Navigate to="/ipad/dashboard" replace />
  }

  if (isLogin) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Outlet />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <IpadSidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      <div className="flex-1 flex flex-col min-w-0">
        <IpadHeader onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
