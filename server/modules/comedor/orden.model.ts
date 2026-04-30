import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose"

// schema de mongoose para las ordenes de comedor con sus lineas y total
const ordenSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    items: [
      {
        menuItemId: { type: Schema.Types.ObjectId, ref: "MenuItem", required: true },
        cantidad: { type: Number, required: true, min: 1 },
        precioUnit: { type: Number, required: true },
        nombre: { type: String, required: true },
      },
    ],
    total: { type: Number, required: true },
    fecha: { type: Date, default: () => new Date() },
    estado: { type: String, enum: ["pagada", "cancelada"], default: "pagada" },
  },
  { timestamps: true }
)

export type OrdenDoc = InferSchemaType<typeof ordenSchema> & { _id: unknown }
export const Orden: Model<OrdenDoc> =
  (mongoose.models.OrdenComedor as Model<OrdenDoc>) ||
  mongoose.model<OrdenDoc>("OrdenComedor", ordenSchema)
