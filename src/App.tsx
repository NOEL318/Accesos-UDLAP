import { useState } from "react"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"

// ── Interface selector & selector screens ─────────────────────────────────
import { InterfaceSelector } from "@/screens/InterfaceSelector"
import { ComingSoon } from "@/screens/ComingSoon"

// ── Kiosco screens ─────────────────────────────────────────────────────────
import { KioscoPrincipal } from "@/screens/KioscoPrincipal"
import { RegistroAlternativo } from "@/screens/RegistroAlternativo"
import { CapturaINE } from "@/screens/CapturaINE"

// ── Móvil screens ──────────────────────────────────────────────────────────
import { MovilLayout } from "@/screens/movil/MovilLayout"
import { LoginScreen } from "@/screens/movil/LoginScreen"
import { DashboardScreen } from "@/screens/movil/DashboardScreen"
import { QrNfcScreen } from "@/screens/movil/QrNfcScreen"
import { VisitasScreen } from "@/screens/movil/VisitasScreen"
import { NuevaVisitaScreen } from "@/screens/movil/NuevaVisitaScreen"
import { DetallesVisitaScreen } from "@/screens/movil/DetallesVisitaScreen"
import { HorarioScreen } from "@/screens/movil/HorarioScreen"
import { PerfilScreen } from "@/screens/movil/PerfilScreen"
import { ComedorScreen } from "@/screens/movil/ComedorScreen"
import { BibliotecaScreen } from "@/screens/movil/BibliotecaScreen"

// ── Kiosco type (kept for existing screens) ────────────────────────────────
export type Screen = "principal" | "registro-alternativo" | "captura-ine"

function KioscoApp() {
  const [screen, setScreen] = useState<Screen>("principal")
  return (
    <div className="min-h-screen bg-background">
      {screen === "principal" && <KioscoPrincipal onNavigate={setScreen} />}
      {screen === "registro-alternativo" && <RegistroAlternativo onNavigate={setScreen} />}
      {screen === "captura-ine" && <CapturaINE onNavigate={setScreen} />}
    </div>
  )
}

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ── Selector ────────────────────────────────── */}
        <Route path="/" element={<InterfaceSelector />} />

        {/* ── Quiosco ─────────────────────────────────── */}
        <Route path="/quiosco" element={<KioscoApp />} />

        {/* ── Móvil ───────────────────────────────────── */}
        <Route path="/movil" element={<MovilLayout />}>
          <Route index element={<Navigate to="/movil/login" replace />} />
          <Route path="login" element={<LoginScreen />} />
          <Route path="dashboard" element={<DashboardScreen />} />
          <Route path="qr-nfc" element={<QrNfcScreen />} />
          <Route path="visitas" element={<VisitasScreen />} />
          <Route path="visitas/nueva" element={<NuevaVisitaScreen />} />
          <Route path="visitas/:id" element={<DetallesVisitaScreen />} />
          <Route path="horario" element={<HorarioScreen />} />
          <Route path="perfil" element={<PerfilScreen />} />
          <Route path="comedor" element={<ComedorScreen />} />
          <Route path="biblioteca" element={<BibliotecaScreen />} />
        </Route>

        {/* ── Coming soon ─────────────────────────────── */}
        <Route
          path="/ipad"
          element={<ComingSoon title="iPad" subtitle="Tableta Operativa" type="ipad" />}
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
