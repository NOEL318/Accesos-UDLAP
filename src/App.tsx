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

// ── iPad screens ───────────────────────────────────────────────────────────
import { IpadLayout } from "@/screens/ipad/IpadLayout"
import { LoginScreen as IpadLoginScreen } from "@/screens/ipad/LoginScreen"
import { DashboardScreen as IpadDashboardScreen } from "@/screens/ipad/DashboardScreen"
import { PuntoControlScreen } from "@/screens/ipad/PuntoControlScreen"
import { SalidasScreen } from "@/screens/ipad/SalidasScreen"
import { VehiculosScreen } from "@/screens/ipad/VehiculosScreen"
import { MultasScreen } from "@/screens/ipad/MultasScreen"
import { HistorialScreen } from "@/screens/ipad/HistorialScreen"
import { AlertasScreen } from "@/screens/ipad/AlertasScreen"

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

        {/* ── iPad Seguridad ──────────────────────────── */}
        <Route path="/ipad" element={<IpadLayout />}>
          <Route index element={<Navigate to="/ipad/dashboard" replace />} />
          <Route path="login" element={<IpadLoginScreen />} />
          <Route path="dashboard" element={<IpadDashboardScreen />} />
          <Route path="acceso" element={<PuntoControlScreen />} />
          <Route path="salidas" element={<SalidasScreen />} />
          <Route path="vehiculos" element={<VehiculosScreen />} />
          <Route path="multas" element={<MultasScreen />} />
          <Route path="historial" element={<HistorialScreen />} />
          <Route path="alertas" element={<AlertasScreen />} />
        </Route>

        {/* ── Coming soon ─────────────────────────────── */}
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
