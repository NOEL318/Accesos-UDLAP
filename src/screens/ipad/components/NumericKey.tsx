import { cn } from "@/lib/utils"

interface Props {
  label: React.ReactNode
  onClick: () => void
  variant?: "default" | "muted"
  disabled?: boolean
  className?: string
}

export function NumericKey({ label, onClick, variant = "default", disabled, className }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex h-16 items-center justify-center rounded-2xl text-2xl font-bold transition-all",
        "active:scale-95 disabled:opacity-40 disabled:pointer-events-none",
        variant === "default"
          ? "bg-white border border-slate-200 text-slate-900 hover:bg-slate-50 shadow-sm"
          : "bg-transparent text-slate-500 hover:bg-slate-100",
        className
      )}
    >
      {label}
    </button>
  )
}
