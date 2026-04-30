import { z } from "zod"
import { config } from "dotenv"
import { resolve } from "node:path"

config({ path: resolve(process.cwd(), ".env.local") })

const schema = z.object({
  MONGODB_URI: z.string().min(1, "MONGODB_URI es requerido"),
  PORT: z.coerce.number().default(4000),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
})

const parsed = schema.safeParse(process.env)
if (!parsed.success) {
  console.error("Variables de entorno inválidas:")
  console.error(parsed.error.flatten().fieldErrors)
  throw new Error("Falta(n) variables de entorno. Revisa .env.local")
}

export const env = parsed.data
