import { HiOutlineGlobeAlt } from "react-icons/hi2"
import { Button } from "@/components/ui/button"

interface KioscoHeaderProps {
  rightContent: React.ReactNode
  subtitle?: string
}

export function KioscoHeader({ rightContent, subtitle = "Acceso System" }: KioscoHeaderProps) {
  return (
    <header className="flex items-center justify-between px-8 py-3.5 bg-white border-b border-gray-200 shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center select-none"
          style={{ background: "linear-gradient(135deg, #1e4d9e 0%, #0f2d5e 100%)" }}
        >
          <span className="text-white font-black text-xs tracking-tight leading-none">UD</span>
        </div>
        <div className="leading-none">
          <p className="text-[#0f2d5e] font-black text-sm tracking-widest uppercase">UDLAP</p>
          <p className="text-[10px] text-gray-400 tracking-widest uppercase mt-0.5">{subtitle}</p>
        </div>
      </div>

      {/* Language toggle */}
      <Button
        variant="outline"
        className="rounded-full h-8 px-4 gap-2 text-xs font-medium text-gray-600 border-gray-200 hover:bg-gray-50"
      >
        <HiOutlineGlobeAlt className="size-3.5 text-gray-400" />
        Change Language (EN)
      </Button>

      {/* Right slot */}
      <div className="text-right">{rightContent}</div>
    </header>
  )
}
