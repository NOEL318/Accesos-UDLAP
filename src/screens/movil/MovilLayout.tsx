import { Outlet, Link } from "react-router-dom"
import { ArrowLeft } from "lucide-react"

export function MovilLayout() {
  return (
    <div
      className="min-h-screen flex justify-center"
      style={{ background: "linear-gradient(160deg,#060d1f 0%,#0a1528 100%)" }}
    >
      {/* Back to selector — visible on desktop */}
      <Link
        to="/"
        className="fixed top-5 left-5 z-50 hidden md:flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors text-sm font-medium px-3 py-1.5 rounded-full"
        style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}
      >
        <ArrowLeft className="size-3.5" />
        Volver
      </Link>

      {/* Phone container */}
      <div
        className="relative w-full max-w-[390px] min-h-screen flex flex-col overflow-x-hidden"
        style={{ background: "#f5f5f5" }}
      >
        <Outlet />
      </div>
    </div>
  )
}

/** Layout for screens that show the bottom navigation */
export function MainLayout() {
  return (
    <>
      <div className="flex-1 pb-[68px] overflow-y-auto">
        <Outlet />
      </div>
      {/* BottomNav is imported per-screen via fixed positioning in BottomNav.tsx */}
    </>
  )
}
