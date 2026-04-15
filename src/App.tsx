import { useState } from "react"
import { BrowserRouter, Routes, Route } from "react-router-dom"
import { InterfaceSelector } from "@/screens/InterfaceSelector"
import { MovilGallery } from "@/screens/MovilGallery"
import { ComingSoon } from "@/screens/ComingSoon"
import { KioscoPrincipal } from "@/screens/KioscoPrincipal"
import { RegistroAlternativo } from "@/screens/RegistroAlternativo"
import { CapturaINE } from "@/screens/CapturaINE"

// Kept exported so existing kiosco screens can import it
export type Screen = "principal" | "registro-alternativo" | "captura-ine"

function KioscoApp() {
  const [screen, setScreen] = useState<Screen>("principal")

  return (
    <div className="min-h-screen bg-background">
      {screen === "principal" && (
        <KioscoPrincipal onNavigate={setScreen} />
      )}
      {screen === "registro-alternativo" && (
        <RegistroAlternativo onNavigate={setScreen} />
      )}
      {screen === "captura-ine" && (
        <CapturaINE onNavigate={setScreen} />
      )}
    </div>
  )
}

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<InterfaceSelector />} />
        <Route path="/quiosco" element={<KioscoApp />} />
        <Route path="/movil" element={<MovilGallery />} />
        <Route
          path="/ipad"
          element={
            <ComingSoon
              title="iPad"
              subtitle="Tableta Operativa"
              type="ipad"
            />
          }
        />
        <Route
          path="/colegios"
          element={
            <ComingSoon
              title="Colegios Residenciales"
              subtitle="Acceso Residencial"
              type="colegios"
            />
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
