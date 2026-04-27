import { cn } from "@/lib/utils"

type Variant = "success" | "warning" | "danger" | "info" | "neutral" | "purple"

interface Props {
  variant?: Variant
  dot?: boolean
  children: React.ReactNode
  className?: string
}

const styles: Record<Variant, string> = {
  success: "bg-emerald-50 text-emerald-700 border-emerald-200",
  warning: "bg-amber-50 text-amber-700 border-amber-200",
  danger: "bg-red-50 text-red-700 border-red-200",
  info: "bg-blue-50 text-blue-700 border-blue-200",
  purple: "bg-violet-50 text-violet-700 border-violet-200",
  neutral: "bg-slate-100 text-slate-700 border-slate-200",
}

const dotStyles: Record<Variant, string> = {
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-red-500",
  info: "bg-blue-500",
  purple: "bg-violet-500",
  neutral: "bg-slate-400",
}

export function StatusBadge({ variant = "neutral", dot, children, className }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        styles[variant],
        className
      )}
    >
      {dot && <span className={cn("size-1.5 rounded-full", dotStyles[variant])} />}
      {children}
    </span>
  )
}
