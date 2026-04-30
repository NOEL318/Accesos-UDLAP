import imageCompression from "browser-image-compression"

interface CompressOpts {
  maxKB?: number
  maxPx?: number
}

// comprime una imagen y la devuelve como data url base64
export async function compressToBase64(
  file: File,
  opts: CompressOpts = {}
): Promise<string> {
  const { maxKB = 300, maxPx = 1280 } = opts
  const compressed = await imageCompression(file, {
    maxSizeMB: maxKB / 1024,
    maxWidthOrHeight: maxPx,
    useWebWorker: true,
  })
  return await fileToDataUrl(compressed)
}

// lee un file/blob y lo convierte en data url usando FileReader
function fileToDataUrl(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}
