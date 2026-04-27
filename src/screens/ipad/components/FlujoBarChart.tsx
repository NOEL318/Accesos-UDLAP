import { useMemo } from "react"

interface Bar {
  franja: string
  label: string
  valor: number
}

export function FlujoBarChart({ data }: { data: Bar[] }) {
  const max = useMemo(() => Math.max(...data.map((d) => d.valor), 1), [data])
  return (
    <div>
      <div className="flex items-end gap-2 h-48">
        {data.map((bar) => {
          const h = (bar.valor / max) * 100
          const intense = bar.valor / max > 0.7
          return (
            <div key={bar.franja} className="group flex-1 flex flex-col items-center gap-1.5 h-full">
              <div className="flex-1 w-full flex items-end">
                <div
                  className={`w-full rounded-t-md transition-all ${
                    intense ? "bg-orange-500" : "bg-orange-200"
                  } group-hover:bg-orange-600`}
                  style={{ height: `${h}%` }}
                  title={`${bar.valor} vehículos`}
                />
              </div>
            </div>
          )
        })}
      </div>
      <div className="mt-2 flex gap-2">
        {data.map((bar) => (
          <div key={bar.franja} className="flex-1 text-center">
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground truncate">
              {bar.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
