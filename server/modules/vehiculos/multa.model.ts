import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose"

// schema de mongoose para las multas de transito asignadas a un vehiculo
const multaSchema = new Schema(
  {
    vehiculoId: { type: Schema.Types.ObjectId, ref: "Vehiculo", required: true, index: true },
    oficialId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    tipo: { type: String, required: true },
    montoMxn: { type: Number, required: true },
    evidencia: { type: [String], default: [] }, // base64
    comentarios: String,
    estado: { type: String, enum: ["pendiente", "pagada", "cancelada"], default: "pendiente", index: true },
    fecha: { type: Date, default: () => new Date() },
  },
  { timestamps: true }
)

export type MultaDoc = InferSchemaType<typeof multaSchema> & { _id: unknown }
export const Multa: Model<MultaDoc> =
  (mongoose.models.Multa as Model<MultaDoc>) ||
  mongoose.model<MultaDoc>("Multa", multaSchema)
