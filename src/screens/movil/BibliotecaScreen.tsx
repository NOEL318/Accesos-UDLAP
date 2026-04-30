import { useNavigate } from "react-router-dom"
import { ArrowLeft, Search, BookMarked, Heart, X } from "lucide-react"
import { useMemo, useState } from "react"
import { Input } from "@/components/ui/input"
import {
  useBiblioteca,
  type Libro,
  type Prestamo,
  type Deseo,
} from "./hooks/useBiblioteca"
import { cn } from "@/lib/utils"
import { getLibroIcon } from "@/lib/icon-map"

type Tab = "favoritos" | "material"

// convierte una fecha ISO al formato corto en español
function formatFecha(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  } catch {
    return iso
  }
}

// pantalla de biblioteca con prestamos activos, lista de deseos y catalogo buscable
export function BibliotecaScreen() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>("favoritos")
  const [query, setQuery] = useState("")
  const {
    libros,
    prestamos,
    deseos,
    loading,
    error,
    prestar,
    devolver,
    agregarDeseo,
    quitarDeseo,
  } = useBiblioteca()

  // filtra solo los prestamos que siguen activos
  const prestamosActivos = useMemo(
    () => prestamos.filter((p) => p.estado === "activo"),
    [prestamos]
  )

  // filtra el catalogo segun el texto buscado en titulo o autor
  const filteredLibros = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return libros
    return libros.filter(
      (l) =>
        l.titulo.toLowerCase().includes(q) ||
        l.autor.toLowerCase().includes(q)
    )
  }, [libros, query])

  // arma un set con los ids de libros ya prestados para checar rapido
  const prestadoIds = useMemo(
    () => new Set(prestamosActivos.map((p) => p.libroId)),
    [prestamosActivos]
  )
  // arma un set con los ids de libros que ya estan en deseos
  const deseoLibroIds = useMemo(
    () => new Set(deseos.map((d) => d.libroId)),
    [deseos]
  )

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      {/* Header */}
      <div className="bg-white px-5 pt-12 pb-4">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate(-1)} className="text-gray-400">
            <ArrowLeft className="size-5" />
          </button>
          <h1 className="text-lg font-black text-gray-900">Biblioteca UDLAP</h1>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
          <Input
            placeholder="Buscar libros..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10 h-11 rounded-xl border-gray-200 bg-gray-50 text-sm"
          />
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded"
              style={{ background: "#fff3ee", color: "#ea580c" }}
            >
              {prestamosActivos.length} Préstamos
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mt-4">
          {(["favoritos", "material"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "pb-2 text-sm font-bold transition-all border-b-2",
                tab === t
                  ? "border-orange-500 text-orange-600"
                  : "border-transparent text-gray-400"
              )}
            >
              {t === "favoritos" ? "Favoritos" : "Material"}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 py-5 space-y-6">
        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-2.5 text-xs font-bold text-red-700">
            {error}
          </div>
        )}

        {loading && libros.length === 0 && (
          <p className="text-xs font-bold text-gray-400 text-center">Cargando…</p>
        )}

        {tab === "favoritos" && (
          <>
            {/* Libros en préstamo */}
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
                Libros en Préstamo
              </p>
              {prestamosActivos.length === 0 ? (
                <p className="text-xs text-gray-400 italic">No tienes préstamos activos.</p>
              ) : (
                <div className="space-y-3">
                  {prestamosActivos.map((p) => (
                    <PrestamoCard
                      key={p._id}
                      prestamo={p}
                      onDevolver={() => devolver(p._id)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Lista de deseos */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  Lista de Deseos
                </p>
              </div>
              {deseos.length === 0 ? (
                <p className="text-xs text-gray-400 italic">Lista vacía.</p>
              ) : (
                <div className="space-y-3">
                  {deseos.map((d) => (
                    <DeseoCard
                      key={d._id}
                      deseo={d}
                      onQuitar={() => quitarDeseo(d._id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {tab === "material" && (
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
              Catálogo
            </p>
            {filteredLibros.length === 0 ? (
              <p className="text-xs text-gray-400 italic">Sin resultados.</p>
            ) : (
              <div className="space-y-3">
                {filteredLibros.map((libro) => {
                  const yaPrestado = prestadoIds.has(libro._id)
                  const yaEnDeseos = deseoLibroIds.has(libro._id)
                  return (
                    <LibroCard
                      key={libro._id}
                      libro={libro}
                      canPrestar={libro.copiasDisponibles > 0 && !yaPrestado}
                      canDeseo={!yaEnDeseos}
                      onPrestar={() => prestar(libro._id)}
                      onDeseo={() => agregarDeseo(libro._id)}
                    />
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// tarjeta de un prestamo activo con icono, titulo, vencimiento y boton de devolver
function PrestamoCard({
  prestamo,
  onDevolver,
}: {
  prestamo: Prestamo
  onDevolver: () => void | Promise<void>
}) {
  const libro = prestamo.libro
  return (
    <div className="flex items-center gap-4 bg-white rounded-2xl px-4 py-4 shadow-sm">
      <div
        className="w-12 h-16 rounded-lg flex items-center justify-center shrink-0 shadow-sm"
        style={{ background: "#f0f0f0" }}
      >
        {getLibroIcon(libro?.icon, { size: 32 })}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-black text-gray-800 leading-snug line-clamp-2">
          {libro?.titulo ?? "Libro"}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">{libro?.autor ?? ""}</p>
        <div className="flex items-center gap-1.5 mt-1.5">
          <BookMarked className="size-3 text-orange-400" />
          <span className="text-[11px] font-bold text-orange-500">
            Préstamo activo, vence {formatFecha(prestamo.fechaVencimiento)}
          </span>
        </div>
      </div>
      <div className="shrink-0">
        <button
          onClick={() => void onDevolver()}
          className="text-xs font-bold px-3 py-1.5 rounded-lg"
          style={{ background: "#fff3ee", color: "#ea580c" }}
        >
          Devolver
        </button>
      </div>
    </div>
  )
}

// tarjeta de un libro en lista de deseos con boton para quitarlo
function DeseoCard({
  deseo,
  onQuitar,
}: {
  deseo: Deseo
  onQuitar: () => void | Promise<void>
}) {
  const libro = deseo.libro
  return (
    <div className="flex items-center gap-4 bg-white rounded-2xl px-4 py-4 shadow-sm">
      <div
        className="w-12 h-16 rounded-lg flex items-center justify-center shrink-0 shadow-sm"
        style={{ background: "#f0f0f0" }}
      >
        {getLibroIcon(libro?.icon, { size: 32 })}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-black text-gray-800 leading-snug line-clamp-2">
          {libro?.titulo ?? "Libro"}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">{libro?.autor ?? ""}</p>
        <div className="flex items-center gap-1 mt-1.5">
          <Heart className="size-3" style={{ color: "#ea580c" }} />
          <span className="text-[11px] font-bold text-orange-500">Deseo</span>
        </div>
      </div>
      <div className="shrink-0">
        <button
          onClick={() => void onQuitar()}
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ background: "#fff3ee" }}
        >
          <X className="size-4" style={{ color: "#ea580c" }} />
        </button>
      </div>
    </div>
  )
}

// tarjeta del catalogo con info del libro y botones de prestar y agregar a deseos
function LibroCard({
  libro,
  canPrestar,
  canDeseo,
  onPrestar,
  onDeseo,
}: {
  libro: Libro
  canPrestar: boolean
  canDeseo: boolean
  onPrestar: () => void | Promise<void>
  onDeseo: () => void | Promise<void>
}) {
  return (
    <div className="flex items-center gap-4 bg-white rounded-2xl px-4 py-4 shadow-sm">
      <div
        className="w-12 h-16 rounded-lg flex items-center justify-center shrink-0 shadow-sm"
        style={{ background: "#f0f0f0" }}
      >
        {getLibroIcon(libro.icon, { size: 32 })}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-black text-gray-800 leading-snug line-clamp-2">
          {libro.titulo}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">{libro.autor}</p>
        <p className="text-[11px] font-bold text-gray-500 mt-1">
          {libro.copiasDisponibles}/{libro.totalCopias} disponibles
        </p>
      </div>
      <div className="shrink-0 flex flex-col items-end gap-1.5">
        <button
          onClick={() => void onPrestar()}
          disabled={!canPrestar}
          className="text-[11px] font-bold px-3 py-1.5 rounded-lg disabled:opacity-50"
          style={{ background: "#fff3ee", color: "#ea580c" }}
        >
          Prestar
        </button>
        <button
          onClick={() => void onDeseo()}
          disabled={!canDeseo}
          className="text-[11px] font-bold px-3 py-1.5 rounded-lg disabled:opacity-50 flex items-center gap-1"
          style={{ background: "#fff3ee", color: "#ea580c" }}
        >
          <Heart className="size-3" />
          Deseo
        </button>
      </div>
    </div>
  )
}
