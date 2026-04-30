import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose"

// schema de mongoose para la lista de deseos de biblioteca por usuario
const deseoSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    libroId: { type: Schema.Types.ObjectId, ref: "Libro", required: true },
    fechaAgregado: { type: Date, default: () => new Date() },
  },
  { timestamps: true }
)
deseoSchema.index({ userId: 1, libroId: 1 }, { unique: true })

export type DeseoDoc = InferSchemaType<typeof deseoSchema> & { _id: unknown }
export const Deseo: Model<DeseoDoc> =
  (mongoose.models.DeseoBiblioteca as Model<DeseoDoc>) ||
  mongoose.model<DeseoDoc>("DeseoBiblioteca", deseoSchema)
