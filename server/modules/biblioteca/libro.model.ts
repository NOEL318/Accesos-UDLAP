import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose"

// schema de mongoose para los libros del catalogo de biblioteca
const libroSchema = new Schema(
  {
    titulo: { type: String, required: true, index: true },
    autor: { type: String, required: true },
    isbn: String,
    icon: String, // nombre simbolico para el mapper de iconos lucide
    totalCopias: { type: Number, default: 1 },
    copiasDisponibles: { type: Number, default: 1 },
  },
  { timestamps: true }
)

export type LibroDoc = InferSchemaType<typeof libroSchema> & { _id: unknown }
export const Libro: Model<LibroDoc> =
  (mongoose.models.Libro as Model<LibroDoc>) ||
  mongoose.model<LibroDoc>("Libro", libroSchema)
