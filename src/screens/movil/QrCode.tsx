interface QrCodeProps {
  size?: number
  color?: string
}

// Generates a visually accurate QR-like code with proper finder patterns
export function QrCode({ size = 200, color = "#ea580c" }: QrCodeProps) {
  const N = 21

  function cell(r: number, c: number): boolean {
    // Top-left finder pattern (rows 0-6, cols 0-6)
    if (r <= 6 && c <= 6) {
      if (r === 0 || r === 6 || c === 0 || c === 6) return true
      if (r === 1 || r === 5 || c === 1 || c === 5) return false
      return true
    }
    // Top-right finder pattern (rows 0-6, cols 14-20)
    if (r <= 6 && c >= 14) {
      const lc = c - 14
      if (r === 0 || r === 6 || lc === 0 || lc === 6) return true
      if (r === 1 || r === 5 || lc === 1 || lc === 5) return false
      return true
    }
    // Bottom-left finder pattern (rows 14-20, cols 0-6)
    if (r >= 14 && c <= 6) {
      const lr = r - 14
      if (lr === 0 || lr === 6 || c === 0 || c === 6) return true
      if (lr === 1 || lr === 5 || c === 1 || c === 5) return false
      return true
    }
    // Separator rows/cols
    if (r === 7 && c <= 7) return false
    if (r === 7 && c >= 13) return false
    if (c === 7 && r <= 7) return false
    if (c === 7 && r >= 13) return false
    // Timing patterns
    if (r === 6 && c > 7 && c < 13) return c % 2 === 0
    if (c === 6 && r > 7 && r < 13) return r % 2 === 0
    // Alignment pattern center (row 16, col 16)
    if (r >= 14 && r <= 18 && c >= 14 && c <= 18) {
      const ar = r - 16, ac = c - 16
      const ring = Math.max(Math.abs(ar), Math.abs(ac))
      return ring !== 1
    }
    // Data modules — deterministic "random" pattern
    const h = (r * 31 + c * 17 + r * c * 7) % 29
    return h > 14
  }

  const rects: { x: number; y: number }[] = []
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      if (cell(r, c)) rects.push({ x: c, y: r })
    }
  }

  const padding = 2
  const total = N + padding * 2

  return (
    <div
      style={{
        display: "inline-flex",
        background: "white",
        padding: (size / total) * padding,
        borderRadius: 8,
        boxShadow: "0 2px 12px rgba(0,0,0,0.1)",
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${N} ${N}`}
        shapeRendering="crispEdges"
      >
        {rects.map(({ x, y }) => (
          <rect key={`${y}-${x}`} x={x} y={y} width={1} height={1} fill={color} />
        ))}
      </svg>
    </div>
  )
}
