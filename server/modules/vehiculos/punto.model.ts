import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose"

// schema de mongoose para los puntos de control vehicular (puertas, casetas)
const puntoSchema = new Schema(
  {
    nombre: { type: String, required: true },
    tipo: { type: String, enum: ["principal", "postgrado", "deportes", "residencial"], required: true },
    estado: { type: String, enum: ["activa", "standby"], default: "activa" },
    oficialOperadorId: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
)

export type PuntoDoc = InferSchemaType<typeof puntoSchema> & { _id: unknown }
export const PuntoControl: Model<PuntoDoc> =
  (mongoose.models.PuntoControl as Model<PuntoDoc>) ||
  mongoose.model<PuntoDoc>("PuntoControl", puntoSchema)
