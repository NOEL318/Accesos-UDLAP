import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react"
import { Camera, RefreshCw, Check, X, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { compressToBase64 } from "@/lib/image"
import { cn } from "@/lib/utils"

interface CameraCaptureProps {
  open: boolean
  onClose(): void
  onCapture(dataUrl: string): void
  facingMode?: "user" | "environment"
  title?: string
  hint?: string
  maxKB?: number
  maxPx?: number
}

export interface CameraCaptureHandle {
  retake(): void
}

// abre la cámara con getUserMedia, captura un frame y lo entrega como dataURL base64
export const CameraCapture = forwardRef<CameraCaptureHandle, CameraCaptureProps>(
  function CameraCapture(
    {
      open,
      onClose,
      onCapture,
      facingMode = "environment",
      title = "Capturar foto",
      hint = "Centra el sujeto y presiona el botón.",
      maxKB = 350,
      maxPx = 1280,
    },
    ref
  ) {
    const videoRef = useRef<HTMLVideoElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const streamRef = useRef<MediaStream | null>(null)
    const [snapshot, setSnapshot] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [busy, setBusy] = useState(false)

    // libera el stream activo de la camara para apagar el indicador del navegador
    const stopStream = useCallback(() => {
      streamRef.current?.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }, [])

    // pide acceso a la cámara y conecta el stream al video
    const startStream = useCallback(async () => {
      setError(null)
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode },
          audio: false,
        })
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play().catch(() => undefined)
        }
      } catch (err) {
        const msg =
          err instanceof Error
            ? err.message.includes("Permission") || err.message.includes("denied")
              ? "Permiso de cámara denegado. Usa el botón Subir archivo."
              : err.message
            : "No se pudo abrir la cámara."
        setError(msg)
      }
    }, [facingMode])

    // arranca/detiene la cámara según el estado de open y limpia al desmontar
    useEffect(() => {
      if (open && !snapshot) {
        void startStream()
      } else {
        stopStream()
      }
      return () => stopStream()
    }, [open, snapshot, startStream, stopStream])

    // toma una foto del video con un canvas y la guarda como dataURL base64
    const takeSnapshot = useCallback(() => {
      const video = videoRef.current
      const canvas = canvasRef.current
      if (!video || !canvas) return
      const w = video.videoWidth || 1280
      const h = video.videoHeight || 720
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext("2d")
      if (!ctx) return
      ctx.drawImage(video, 0, 0, w, h)
      const dataUrl = canvas.toDataURL("image/jpeg", 0.85)
      setSnapshot(dataUrl)
      stopStream()
    }, [stopStream])

    // descarta la foto actual y vuelve a abrir la cámara
    const retake = useCallback(() => {
      setSnapshot(null)
      void startStream()
    }, [startStream])

    useImperativeHandle(ref, () => ({ retake }), [retake])

    // confirma la foto, la comprime y notifica al padre
    const confirm = useCallback(async () => {
      if (!snapshot) return
      setBusy(true)
      try {
        const blob = await fetch(snapshot).then((r) => r.blob())
        const file = new File([blob], `capture-${Date.now()}.jpg`, { type: "image/jpeg" })
        const compressed = await compressToBase64(file, { maxKB, maxPx })
        onCapture(compressed)
        setSnapshot(null)
        onClose()
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error al procesar imagen")
      } finally {
        setBusy(false)
      }
    }, [snapshot, maxKB, maxPx, onCapture, onClose])

    // procesa una foto subida desde archivo y la convierte a base64
    const handleFile = useCallback(
      async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (e.target) e.target.value = ""
        if (!file) return
        setBusy(true)
        setError(null)
        try {
          const compressed = await compressToBase64(file, { maxKB, maxPx })
          onCapture(compressed)
          setSnapshot(null)
          onClose()
        } catch (err) {
          setError(err instanceof Error ? err.message : "Error al procesar imagen")
        } finally {
          setBusy(false)
        }
      },
      [maxKB, maxPx, onCapture, onClose]
    )

    if (!open) return null

    return (
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 px-4 py-6"
        role="dialog"
        aria-modal="true"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose()
        }}
      >
        <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
            <div>
              <div className="text-sm font-black tracking-tight">{title}</div>
              <div className="text-xs text-muted-foreground">{hint}</div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-1.5 text-slate-500 hover:bg-slate-100"
              aria-label="Cerrar"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="relative aspect-[4/3] w-full bg-slate-900">
            {!snapshot ? (
              <video
                ref={videoRef}
                playsInline
                muted
                autoPlay
                className={cn("absolute inset-0 size-full object-cover", error && "opacity-30")}
              />
            ) : (
              <img src={snapshot} alt="captura" className="absolute inset-0 size-full object-cover" />
            )}
            {error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/60 px-6 text-center text-sm text-white">
                <span>{error}</span>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => fileInputRef.current?.click()}
                  className="gap-2"
                >
                  <Upload className="size-4" />
                  Subir archivo
                </Button>
              </div>
            )}
            <canvas ref={canvasRef} className="hidden" />
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={handleFile}
          />

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-5 py-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="gap-2"
            >
              <Upload className="size-4" />
              Subir archivo
            </Button>

            <div className="flex items-center gap-2">
              {snapshot ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={retake}
                    disabled={busy}
                    className="gap-2"
                  >
                    <RefreshCw className="size-4" />
                    Repetir
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={confirm}
                    disabled={busy}
                    className="gap-2 bg-orange-600 hover:bg-orange-700"
                  >
                    <Check className="size-4" />
                    {busy ? "Guardando..." : "Usar foto"}
                  </Button>
                </>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  onClick={takeSnapshot}
                  disabled={!!error}
                  className="gap-2 bg-orange-600 hover:bg-orange-700"
                >
                  <Camera className="size-4" />
                  Capturar
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }
)
