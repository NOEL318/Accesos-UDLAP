import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose"

// schema de mongoose para los eventos de acceso (entradas/salidas) de vehiculos
const eventoSchema = new Schema(
  {
    vehiculoId: { type: Schema.Types.ObjectId, ref: "Vehiculo", required: true, index: true },
    puntoId: { type: Schema.Types.ObjectId, ref: "PuntoControl" },
    oficialId: { type: Schema.Types.ObjectId, ref: "User" },
    resultado: { type: String, enum: ["permitido", "denegado"], required: true },
    motivo: String,
    timestamp: { type: Date, default: () => new Date(), index: true },
  },
  { timestamps: true }
)

export type EventoDoc = InferSchemaType<typeof eventoSchema> & { _id: unknown }
export const EventoAcceso: Model<EventoDoc> =
  (mongoose.models.EventoAcceso as Model<EventoDoc>) ||
  mongoose.model<EventoDoc>("EventoAcceso", eventoSchema)
