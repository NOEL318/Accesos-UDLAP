import { Link, useNavigate } from "react-router-dom"
import {
  CheckCircle2,
  IdCard,
  UserPlus,
  Printer,
  ScrollText,
  LayoutDashboard,
  MapPin,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useColegiosData } from "./context/ColegiosDataContext"

// pantalla de confirmación luego de registrar una visita exitosa
export function RegistroExitosoScreen() {
  const navigate = useNavigate()
  const { ultimaVisita, edificios } = useColegiosData()

  const visita = ultimaVisita ?? {
    id: "vis-demo",
    nombreCompleto: "Ricardo Morales Sánchez",
    categoria: "comunidad_udlap" as const,
    tipoAcceso: "peatonal" as const,
    edificioDestinoId: "ed-gaos",
    fechaHora: new Date().toISOString(),
    multipleEntrada: false,
    tipoId: "INE / Credencial Oficial",
    estatusVisitante: "sin_antecedentes" as const,
    ubicacionEntrada: "Puerta Principal Sur",
  }

  const edificio = edificios.find((e) => e.id === visita.edificioDestinoId)
  const fecha = new Date(visita.fechaHora)
  const horaStr = fecha.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
  const fechaStr = fecha.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  })

  const categoriaLabel: Record<typeof visita.categoria, string> = {
    servicio: "SERVICIO / PROVEEDOR",
    personal: "VISITA PERSONAL",
    comunidad_udlap: "COMUNIDAD UDLAP",
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      {/* Banner de éxito */}
      <Card className="overflow-hidden p-0 gap-0 text-center">
        <CardContent className="flex flex-col items-center px-6 py-10">
          <span className="flex size-16 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="size-9 text-emerald-600" strokeWidth={2.5} />
          </span>
          <h1 className="mt-5 text-3xl font-black tracking-tight">Registro Exitoso</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            El registro del visitante se ha completado con éxito.
          </p>
        </CardContent>
      </Card>

      {/* Detalles + ID */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="p-0 gap-0">
          <div className="flex items-center gap-2 border-b border-border px-5 py-4">
            <span className="flex size-7 items-center justify-center rounded-md bg-orange-100 text-orange-600">
              <UserPlus className="size-4" />
            </span>
            <h3 className="text-base font-bold">Detalles</h3>
          </div>
          <CardContent className="space-y-4 px-5 py-5">
            <Detail label="Nombre Visitante" value={<strong>{visita.nombreCompleto}</strong>} />
            <Detail
              label="Tipo de Acceso"
              value={
                <span className="inline-flex rounded-md bg-orange-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-orange-700">
                  {categoriaLabel[visita.categoria]}
                </span>
              }
            />
            <Detail
              label="Colegio"
              value={
                <span className="inline-flex items-center gap-1 font-bold uppercase tracking-wide">
                  <MapPin className="size-3.5 text-orange-600" />
                  {edificio?.nombre.replace("Edificio ", "").replace("Residencias ", "") ?? "—"}
                </span>
              }
            />
            <Detail
              label="Hora"
              value={<strong>{horaStr}, {fechaStr}</strong>}
            />

            <Button variant="outline" className="mt-2 w-full justify-center gap-2">
              <Printer className="size-4" />
              Imprimir Boleto de Acceso
            </Button>
          </CardContent>
        </Card>

        <Card className="p-0 gap-0">
          <div className="flex items-center gap-2 border-b border-border px-5 py-4">
            <span className="flex size-7 items-center justify-center rounded-md bg-orange-100 text-orange-600">
              <IdCard className="size-4" />
            </span>
            <h3 className="text-base font-bold">ID</h3>
          </div>
          <CardContent className="px-5 py-5">
            <div className="relative flex aspect-[4/5] items-center justify-center overflow-hidden rounded-xl bg-slate-300">
              <div
                className="absolute inset-0 opacity-30"
                style={{
                  backgroundImage:
                    "linear-gradient(135deg, rgba(0,0,0,0.1) 0%, transparent 50%, rgba(0,0,0,0.15) 100%)",
                }}
              />
              {/* Cinta de credencial */}
              <div className="absolute left-1/2 top-0 h-12 w-16 -translate-x-1/2 bg-gradient-to-b from-slate-400 to-slate-300">
                <div className="absolute left-1/2 top-3 size-3 -translate-x-1/2 rounded-full bg-slate-500 ring-2 ring-slate-200" />
              </div>
              <div className="relative mt-12 w-3/4 rounded-md bg-slate-100 p-4 text-center text-xs text-muted-foreground shadow-md">
                Escanea tu credencial<br />de (INE, PASAPORTE,<br />UDLAP)
              </div>
            </div>
            <p className="mt-3 flex items-start gap-1.5 text-xs text-muted-foreground">
              <span className="text-base leading-none">ⓘ</span>
              <span>
                El ID puede ser verificado después con motivos de seguridad en caso de algún
                incidente.
              </span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* CTA principal */}
      <Button
        size="lg"
        onClick={() => navigate("/colegios/visitas/registrar")}
        className="h-14 w-full gap-2 bg-orange-600 text-base font-bold hover:bg-orange-700"
      >
        <UserPlus className="size-5" />
        Registrar Visita
      </Button>

      <div className="grid gap-3 sm:grid-cols-2">
        <Button asChild variant="outline" className="h-12 gap-2 text-sm font-bold">
          <Link to="/colegios/visitas/bitacora">
            <ScrollText className="size-4" />
            View Security Log
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-12 gap-2 text-sm font-bold">
          <Link to="/colegios/dashboard">
            <LayoutDashboard className="size-4" />
            Return to Dashboard
          </Link>
        </Button>
      </div>

      <p className="pt-2 text-center text-xs text-muted-foreground">
        © 2023 Universidad de las Américas Puebla | Internal Security Management System
      </p>
    </div>
  )
}

// fila label-valor para los detalles del registro de visita
function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-right text-sm">{value}</span>
    </div>
  )
}
