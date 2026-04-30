import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose"

// schema de mongoose para los prestamos de libros (activos, devueltos o vencidos)
const prestamoSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    libroId: { type: Schema.Types.ObjectId, ref: "Libro", required: true },
    fechaPrestamo: { type: Date, default: () => new Date() },
    fechaVencimiento: { type: Date, required: true },
    fechaDevolucion: Date,
    estado: { type: String, enum: ["activo", "devuelto", "vencido"], default: "activo" },
  },
  { timestamps: true }
)
prestamoSchema.index({ userId: 1, estado: 1 })

export type PrestamoDoc = InferSchemaType<typeof prestamoSchema> & { _id: unknown }
export const Prestamo: Model<PrestamoDoc> =
  (mongoose.models.PrestamoBiblioteca as Model<PrestamoDoc>) ||
  mongoose.model<PrestamoDoc>("PrestamoBiblioteca", prestamoSchema)
