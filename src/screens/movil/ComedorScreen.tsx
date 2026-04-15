import { useNavigate } from "react-router-dom"
import { ArrowLeft, Bell, CreditCard } from "lucide-react"
import { useState } from "react"
import { menuMock, currentUser } from "./data"
import { cn } from "@/lib/utils"
import type { MenuItem } from "./data"

type Categoria = "todos" | "principal" | "economico" | "vegano"

const catLabels: Record<Categoria, string> = {
  todos: "Todos",
  principal: "Principal",
  economico: "Económico",
  vegano: "Vegano",
}

export function ComedorScreen() {
  const navigate = useNavigate()
  const [cat, setCat] = useState<Categoria>("todos")

  const filtered =
    cat === "todos" ? menuMock : menuMock.filter((m) => m.categoria === cat)

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      {/* Header */}
      <div
        className="px-5 pt-12 pb-5"
        style={{ background: "linear-gradient(135deg,#ea580c,#c2410c)" }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="text-white/70">
              <ArrowLeft className="size-5" />
            </button>
            <h1 className="text-lg font-black text-white">Comedores UDLAP</h1>
          </div>
          <button className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
            <Bell className="size-4.5 text-white" />
          </button>
        </div>

        {/* Balance card */}
        <div className="bg-white/15 rounded-2xl px-4 py-4 backdrop-blur-sm">
          <p className="text-white/70 text-xs font-bold uppercase tracking-widest mb-1">
            Saldo disponible
          </p>
          <p className="text-white font-black text-3xl">
            ${currentUser.saldo.toFixed(2)}
            <span className="text-sm font-bold text-white/60 ml-1">MXN</span>
          </p>

          <div className="flex gap-2 mt-4">
            <button
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white"
              style={{ background: "rgba(0,0,0,0.2)" }}
            >
              <span className="text-base">⊕</span>
              Apple Pay
            </button>
            <button
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white"
              style={{ background: "rgba(0,0,0,0.2)" }}
            >
              <CreditCard className="size-4" />
              Ticket
            </button>
          </div>
        </div>
      </div>

      {/* Category tabs */}
      <div className="px-5 py-4">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {(Object.keys(catLabels) as Categoria[]).map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all",
                cat === c
                  ? "text-white shadow-sm"
                  : "text-gray-500 bg-white"
              )}
              style={cat === c ? { background: "#ea580c" } : {}}
            >
              {catLabels[c]}
            </button>
          ))}
        </div>
      </div>

      {/* Menú del día */}
      <div className="px-5 pb-8">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
          Menú del Día
        </p>
        <div className="space-y-3">
          {filtered.map((item) => (
            <MenuItemCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    </div>
  )
}

function MenuItemCard({ item }: { item: MenuItem }) {
  return (
    <div className="flex items-center gap-4 bg-white rounded-2xl px-4 py-4 shadow-sm">
      {/* Emoji placeholder */}
      <div
        className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl shrink-0"
        style={{ background: "#f5f5f5" }}
      >
        {item.emoji}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-black text-gray-800">{item.nombre}</p>
        <p className="text-xs text-gray-400 mt-0.5 leading-snug">{item.descripcion}</p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-base font-black" style={{ color: "#ea580c" }}>
          ${item.precio}
        </p>
        <button
          className="mt-1 w-7 h-7 rounded-full flex items-center justify-center text-white text-lg leading-none"
          style={{ background: "#ea580c" }}
        >
          +
        </button>
      </div>
    </div>
  )
}
