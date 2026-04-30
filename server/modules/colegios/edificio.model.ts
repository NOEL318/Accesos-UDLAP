import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose"

// schema de mongoose para los edificios residenciales con su capacidad maxima
const edificioSchema = new Schema(
  {
    nombre: { type: String, required: true, unique: true },
    capacidad: { type: Number, required: true, min: 1 },
  },
  { timestamps: true }
)

export type EdificioDoc = InferSchemaType<typeof edificioSchema> & { _id: unknown }
export const Edificio: Model<EdificioDoc> =
  (mongoose.models.Edificio as Model<EdificioDoc>) ||
  mongoose.model<EdificioDoc>("Edificio", edificioSchema)
