import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose"

// schema de mongoose para las clases del horario semanal del estudiante
const claseSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    dia: { type: Number, min: 0, max: 5, required: true }, // 0=Lu ... 5=Sá
    inicio: { type: Number, required: true }, // hora decimal: 7.5 = 7:30
    fin: { type: Number, required: true },
    materia: { type: String, required: true },
    salon: { type: String, required: true },
    periodo: { type: String, default: "OT26" },
  },
  { timestamps: true }
)

export type ClaseDoc = InferSchemaType<typeof claseSchema> & { _id: unknown }
export const Clase: Model<ClaseDoc> =
  (mongoose.models.Clase as Model<ClaseDoc>) ||
  mongoose.model<ClaseDoc>("Clase", claseSchema)
