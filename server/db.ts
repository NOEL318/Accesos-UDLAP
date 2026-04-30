import mongoose from "mongoose"
import { env } from "./env"

type Cached = { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null }

const globalAny = globalThis as unknown as { __mongoose?: Cached }
const cached: Cached = globalAny.__mongoose ?? { conn: null, promise: null }
globalAny.__mongoose = cached

// conecta a mongo reusando la conexion cacheada para no abrir varias en hot-reload
export async function connectDb(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn
  if (!cached.promise) {
    cached.promise = mongoose
      .connect(env.MONGODB_URI, {
        serverSelectionTimeoutMS: 8000,
        maxPoolSize: 5,
      })
      .then((m) => {
        console.log("MongoDB conectado")
        return m
      })
  }
  cached.conn = await cached.promise
  return cached.conn
}
