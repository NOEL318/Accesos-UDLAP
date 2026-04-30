import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose"

// schema de mongoose para entradas y salidas de residentes en cada edificio
const movimientoSchema = new Schema(
  {
    residenteUserId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    edificioId: { type: Schema.Types.ObjectId, ref: "Edificio", required: true },
    hora: { type: Date, default: () => new Date() },
    tipo: { type: String, enum: ["entrada", "salida"], required: true },
    estado: { type: String, enum: ["normal", "ebriedad", "autorizada", "alerta"], default: "normal" },
  },
  { timestamps: true }
)

export type MovimientoDoc = InferSchemaType<typeof movimientoSchema> & { _id: unknown }
export const Movimiento: Model<MovimientoDoc> =
  (mongoose.models.MovimientoResidente as Model<MovimientoDoc>) ||
  mongoose.model<MovimientoDoc>("MovimientoResidente", movimientoSchema)
