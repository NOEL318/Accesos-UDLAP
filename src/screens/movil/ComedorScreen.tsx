import { useNavigate } from "react-router-dom"
import { ArrowLeft, Bell, CreditCard, ShoppingCart } from "lucide-react"
import { useState } from "react"
import { useComedor, type MenuItem } from "./hooks/useComedor"
import { cn } from "@/lib/utils"
import { getComidaIcon } from "@/lib/icon-map"

type Categoria = "todos" | "principal" | "economico" | "vegano"

const catLabels: Record<Categoria, string> = {
  todos: "Todos",
  principal: "Principal",
  economico: "Económico",
  vegano: "Vegano",
}

interface CartItem {
  menuItemId: string
  cantidad: number
  nombre: string
  precio: number
}

// pantalla del comedor con saldo, menu por categoria y carrito para ordenar
export function ComedorScreen() {
  const navigate = useNavigate()
  const { menu, saldo, ordenar, loading } = useComedor()
  const [cat, setCat] = useState<Categoria>("todos")
  const [cart, setCart] = useState<CartItem[]>([])
  const [feedback, setFeedback] = useState<{ kind: "ok" | "err"; msg: string } | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const filtered =
    cat === "todos" ? menu : menu.filter((m) => m.categoria === cat)

  const totalItems = cart.reduce((acc, c) => acc + c.cantidad, 0)
  const totalPrice = cart.reduce((acc, c) => acc + c.precio * c.cantidad, 0)

  // agrega un platillo al carrito o le suma cantidad si ya estaba
  const addToCart = (item: MenuItem) => {
    setCart((curr) => {
      const existing = curr.find((c) => c.menuItemId === item._id)
      if (existing) {
        return curr.map((c) =>
          c.menuItemId === item._id ? { ...c, cantidad: c.cantidad + 1 } : c
        )
      }
      return [
        ...curr,
        {
          menuItemId: item._id,
          cantidad: 1,
          nombre: item.nombre,
          precio: item.precio,
        },
      ]
    })
  }

  // manda la orden al backend, limpia el carrito y muestra el feedback
  const handlePagar = async () => {
    if (cart.length === 0 || submitting) return
    setSubmitting(true)
    setFeedback(null)
    try {
      const result = await ordenar(
        cart.map((c) => ({ menuItemId: c.menuItemId, cantidad: c.cantidad }))
      )
      setCart([])
      setFeedback({
        kind: "ok",
        msg: `Orden registrada. Saldo restante: $${result.saldoRestante.toFixed(2)}`,
      })
    } catch (e) {
      setFeedback({
        kind: "err",
        msg: e instanceof Error ? e.message : "Error al pagar",
      })
    } finally {
      setSubmitting(false)
    }
  }

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
            ${saldo.toFixed(2)}
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

      {/* Feedback toast */}
      {feedback && (
        <div className="px-5 pt-4">
          <div
            className={cn(
              "rounded-xl px-4 py-2.5 text-xs font-bold border",
              feedback.kind === "ok"
                ? "bg-green-50 border-green-200 text-green-700"
                : "bg-red-50 border-red-200 text-red-700"
            )}
          >
            {feedback.msg}
          </div>
        </div>
      )}

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
      <div className="px-5 pb-32">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
          Menú del Día
        </p>
        {loading && menu.length === 0 ? (
          <p className="text-xs font-bold text-gray-400">Cargando…</p>
        ) : (
          <div className="space-y-3">
            {filtered.map((item) => (
              <MenuItemCard key={item._id} item={item} onAdd={() => addToCart(item)} />
            ))}
          </div>
        )}
      </div>

      {/* Cart bottom bar */}
      {cart.length > 0 && (
        <div
          className="fixed bottom-0 left-0 right-0 bg-orange-50 border-t border-orange-200 px-5 py-3 flex items-center justify-between gap-3"
          style={{ zIndex: 40 }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-white shrink-0"
              style={{ background: "#ea580c" }}
            >
              <ShoppingCart className="size-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide leading-none">
                {totalItems} {totalItems === 1 ? "ítem" : "ítems"}
              </p>
              <p className="text-base font-black text-gray-900 leading-tight">
                ${totalPrice.toFixed(2)}
              </p>
            </div>
          </div>
          <button
            onClick={handlePagar}
            disabled={submitting}
            className="px-5 py-2.5 rounded-xl text-white font-bold text-sm disabled:opacity-60"
            style={{ background: "linear-gradient(135deg,#ea580c,#c2410c)" }}
          >
            {submitting ? "Pagando…" : "Pagar"}
          </button>
        </div>
      )}
    </div>
  )
}

// tarjeta que muestra un platillo del menu con icono, descripcion, precio y boton agregar
function MenuItemCard({ item, onAdd }: { item: MenuItem; onAdd: () => void }) {
  return (
    <div className="flex items-center gap-4 bg-white rounded-2xl px-4 py-4 shadow-sm">
      {/* Icono del platillo */}
      <div
        className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: "#f5f5f5" }}
      >
        {getComidaIcon(item.icon, { size: 32 })}
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
          onClick={onAdd}
          className="mt-1 w-7 h-7 rounded-full flex items-center justify-center text-white text-lg leading-none"
          style={{ background: "#ea580c" }}
        >
          +
        </button>
      </div>
    </div>
  )
}
