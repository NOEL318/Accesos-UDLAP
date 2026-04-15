import { useNavigate } from "react-router-dom"
import { ArrowLeft, Search, BookMarked, Heart, Star } from "lucide-react"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { librosMock } from "./data"
import type { Libro } from "./data"
import { cn } from "@/lib/utils"

type Tab = "favoritos" | "material"

export function BibliotecaScreen() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>("favoritos")
  const [query, setQuery] = useState("")

  const prestamos = librosMock.filter((b) => b.estado === "prestamo")
  const deseos = librosMock.filter((b) => b.estado === "deseo")

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
              2 Préstamos
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
        {/* Libros en préstamo */}
        <div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
            Libros en Préstamo
          </p>
          <div className="space-y-3">
            {prestamos.map((libro) => (
              <LibroCard key={libro.id} libro={libro} showDue />
            ))}
          </div>
        </div>

        {/* Lista de deseos */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Lista de Deseos
            </p>
            <button className="text-xs font-bold" style={{ color: "#ea580c" }}>
              Ver todo
            </button>
          </div>
          <div className="space-y-3">
            {deseos.map((libro) => (
              <LibroCard key={libro.id} libro={libro} wishlist />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function LibroCard({
  libro,
  showDue,
  wishlist,
}: {
  libro: Libro
  showDue?: boolean
  wishlist?: boolean
}) {
  return (
    <div className="flex items-center gap-4 bg-white rounded-2xl px-4 py-4 shadow-sm">
      {/* Cover */}
      <div
        className="w-12 h-16 rounded-lg flex items-center justify-center text-3xl shrink-0 shadow-sm"
        style={{ background: "#f0f0f0" }}
      >
        {libro.cover}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-black text-gray-800 leading-snug line-clamp-2">
          {libro.titulo}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">{libro.autor}</p>

        {showDue && libro.dueDate && (
          <div className="flex items-center gap-1.5 mt-1.5">
            <BookMarked className="size-3 text-orange-400" />
            <span className="text-[11px] font-bold text-orange-500">
              Devolver: {libro.dueDate}
            </span>
          </div>
        )}
        {wishlist && (
          <div className="flex items-center gap-1 mt-1.5">
            <Star className="size-3 text-gray-300 fill-gray-300" />
            <Star className="size-3 text-gray-300 fill-gray-300" />
            <Star className="size-3 text-gray-300 fill-gray-300" />
            <Star className="size-3 text-gray-300 fill-gray-300" />
            <Star className="size-3 text-gray-300 fill-gray-300" />
          </div>
        )}
      </div>

      {/* Action */}
      <div className="shrink-0">
        {wishlist ? (
          <button
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: "#fff3ee" }}
          >
            <Heart className="size-4" style={{ color: "#ea580c" }} />
          </button>
        ) : (
          <button
            className="text-xs font-bold px-3 py-1.5 rounded-lg"
            style={{ background: "#fff3ee", color: "#ea580c" }}
          >
            Renovar
          </button>
        )}
      </div>
    </div>
  )
}
