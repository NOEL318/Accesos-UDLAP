import { useState } from "react"
import { Routes, Route, Navigate } from "react-router-dom"

import { RequireAuth } from "@/lib/auth-store"

// ── Interface selector & selector screens ─────────────────────────────────
import { InterfaceSelector } from "@/screens/InterfaceSelector"

// ── Kiosco screens ─────────────────────────────────────────────────────────
import { KioscoPrincipal } from "@/screens/KioscoPrincipal"
import { RegistroAlternativo } from "@/screens/RegistroAlternativo"
import { CapturaINE } from "@/screens/CapturaINE"
import { KioscoLoginScreen } from "@/screens/KioscoLoginScreen"

// ── Móvil screens ──────────────────────────────────────────────────────────
import { MovilLayout } from "@/screens/movil/MovilLayout"
import { LoginScreen } from "@/screens/movil/LoginScreen"
import { DashboardScreen } from "@/screens/movil/DashboardScreen"
import { QrNfcScreen } from "@/screens/movil/QrNfcScreen"
import { VisitasScreen } from "@/screens/movil/VisitasScreen"
import { NuevaVisitaScreen } from "@/screens/movil/NuevaVisitaScreen"
import { DetallesVisitaScreen } from "@/screens/movil/DetallesVisitaScreen"
import { PerfilScreen } from "@/screens/movil/PerfilScreen"

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

// ── Colegios screens ───────────────────────────────────────────────────────
import { ColegiosLayout } from "@/screens/colegios/ColegiosLayout"
import { ColegiosLoginScreen } from "@/screens/colegios/LoginScreen"
import { DashboardScreen as ColegiosDashboardScreen } from "@/screens/colegios/DashboardScreen"
import { ResidentesScreen } from "@/screens/colegios/ResidentesScreen"
import { VerificacionScreen } from "@/screens/colegios/VerificacionScreen"
import { RegistrarVisitaScreen } from "@/screens/colegios/RegistrarVisitaScreen"
import { RegistroExitosoScreen } from "@/screens/colegios/RegistroExitosoScreen"
import { EdificiosScreen } from "@/screens/colegios/EdificiosScreen"
import { AlertasScreen as ColegiosAlertasScreen } from "@/screens/colegios/AlertasScreen"
import { BitacoraScreen } from "@/screens/colegios/BitacoraScreen"
import { MapaScreen } from "@/screens/colegios/MapaScreen"

// ── Kiosco type (kept for existing screens) ────────────────────────────────
export type Screen = "principal" | "registro-alternativo" | "captura-ine"

// shell del quiosco que cambia entre pantalla principal, registro alternativo y captura ine
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
    <Routes>
      {/* ── Selector ────────────────────────────────── */}
      <Route path="/" element={<InterfaceSelector />} />

      {/* ── Quiosco ─────────────────────────────────── */}
      <Route path="/quiosco/login" element={<KioscoLoginScreen />} />
      <Route
        path="/quiosco"
        element={
          <RequireAuth role={["oficial", "admin"]} loginPath="/quiosco/login">
            <KioscoApp />
          </RequireAuth>
        }
      />

      {/* ── Móvil: login es público ─────────────────── */}
      <Route path="/movil/login" element={<LoginScreen />} />

      {/* ── Móvil: resto requiere sesión ────────────── */}
      <Route
        path="/movil"
        element={
          <RequireAuth role={["estudiante", "residente", "exaudlap", "maestro", "proveedor", "admin"]}>
            <MovilLayout />
          </RequireAuth>
        }
      >
        <Route index element={<Navigate to="/movil/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardScreen />} />
        <Route path="qr-nfc" element={<QrNfcScreen />} />
        <Route path="visitas" element={<VisitasScreen />} />
        <Route path="visitas/nueva" element={<NuevaVisitaScreen />} />
        <Route path="visitas/:id" element={<DetallesVisitaScreen />} />
        <Route path="perfil" element={<PerfilScreen />} />
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

      {/* ── Colegios Residenciales ─────────────────── */}
      <Route path="/colegios/login" element={<ColegiosLoginScreen />} />
      <Route
        path="/colegios"
        element={
          <RequireAuth role={["adminColegios", "admin"]} loginPath="/colegios/login">
            <ColegiosLayout />
          </RequireAuth>
        }
      >
        <Route index element={<Navigate to="/colegios/dashboard" replace />} />
        <Route path="dashboard" element={<ColegiosDashboardScreen />} />
        <Route path="residentes" element={<ResidentesScreen />} />
        <Route path="visitas">
          <Route index element={<Navigate to="/colegios/visitas/registrar" replace />} />
          <Route path="registrar" element={<RegistrarVisitaScreen />} />
          <Route path="verificacion" element={<VerificacionScreen />} />
          <Route path="verificacion/:id" element={<VerificacionScreen />} />
          <Route path="exitoso" element={<RegistroExitosoScreen />} />
          <Route path="bitacora" element={<BitacoraScreen />} />
        </Route>
        <Route path="edificios" element={<EdificiosScreen />} />
        <Route path="alertas" element={<ColegiosAlertasScreen />} />
        <Route path="mapa" element={<MapaScreen />} />
      </Route>
    </Routes>
  )
}

export default App
