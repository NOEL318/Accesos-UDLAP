import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose"

// schema de mongoose para la coleccion de alertas (vehiculares y residenciales)
const alertaSchema = new Schema(
  {
    scope: { type: String, enum: ["vehicular", "residencial"], required: true, index: true },
    tipo: { type: String, required: true },
    severidad: {
      type: String,
      enum: ["critica", "alta", "moderada", "media", "info"],
      required: true,
    },
    descripcion: { type: String, required: true },
    refs: {
      vehiculoId: { type: Schema.Types.ObjectId, ref: "Vehiculo" },
      residenteUserId: { type: Schema.Types.ObjectId, ref: "User" },
      edificioId: { type: Schema.Types.ObjectId, ref: "Edificio" },
    },
    timestamp: { type: Date, default: () => new Date(), index: true },
    estado: { type: String, enum: ["activa", "atendida"], default: "activa" },
    atendidaPor: { type: Schema.Types.ObjectId, ref: "User" },
    atendidaEn: Date,
  },
  { timestamps: true }
)
alertaSchema.index({ estado: 1, timestamp: -1 })

export type AlertaDoc = InferSchemaType<typeof alertaSchema> & { _id: unknown }
export const Alerta: Model<AlertaDoc> =
  (mongoose.models.Alerta as Model<AlertaDoc>) ||
  mongoose.model<AlertaDoc>("Alerta", alertaSchema)
