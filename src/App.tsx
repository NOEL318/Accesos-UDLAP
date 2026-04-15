import { useState } from "react"
import { KioscoPrincipal } from "@/screens/KioscoPrincipal"
import { RegistroAlternativo } from "@/screens/RegistroAlternativo"
import { CapturaINE } from "@/screens/CapturaINE"

export type Screen = "principal" | "registro-alternativo" | "captura-ine"

export function App() {
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

export default App
