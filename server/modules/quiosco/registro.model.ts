import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose"

// schema de mongoose para los registros alternativos del quiosco (visitas sin pre-registro)
const registroSchema = new Schema(
  {
    nombre: { type: String, required: true },
    tipoId: String,            // "INE 1234..."
    motivo: String,
    fotoIne: String,           // base64
    vehiculoMatricula: String,
    oficialId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    ingreso: { type: Date, default: () => new Date() },
    salida: Date,
  },
  { timestamps: true }
)

export type RegistroDoc = InferSchemaType<typeof registroSchema> & { _id: unknown }
export const RegistroAlternativo: Model<RegistroDoc> =
  (mongoose.models.RegistroAlternativo as Model<RegistroDoc>) ||
  mongoose.model<RegistroDoc>("RegistroAlternativo", registroSchema)
