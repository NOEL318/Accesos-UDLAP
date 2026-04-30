import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose"

export const VISITA_STATUS = [
  "programada",
  "activa",
  "expirada",
  "cancelada",
] as const
export type VisitaStatus = (typeof VISITA_STATUS)[number]

const invitadoSchema = new Schema(
  {
    nombre: { type: String, required: true },
    tipoId: String,
    foto: String, // base64; opcional, no usado en plan 1
    categoria: {
      type: String,
      enum: ["servicio", "personal", "comunidad_udlap", "visita"],
      default: "visita",
    },
  },
  { _id: false }
)

const scanSchema = new Schema(
  {
    puntoId: String,
    oficialId: { type: Schema.Types.ObjectId, ref: "User" },
    timestamp: { type: Date, default: () => new Date() },
    resultado: { type: String, enum: ["permitido", "denegado"] },
    motivo: String,
  },
  { _id: false }
)

// schema de mongoose para las visitas con su QR, invitado, scans y status
const visitaSchema = new Schema(
  {
    anfitrionId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    invitado: { type: invitadoSchema, required: true },
    tipoAcceso: {
      type: String,
      enum: ["vehicular", "peatonal"],
      required: true,
    },
    puntoAcceso: { type: String, required: true },
    fechaHora: { type: Date, required: true, index: true },
    multiplesEntradas: { type: Boolean, default: false },
    status: {
      type: String,
      enum: VISITA_STATUS,
      default: "programada",
    },
    qrToken: { type: String, required: true, unique: true, index: true },
    qrExpiraEn: Date,
    edificioDestinoId: { type: Schema.Types.ObjectId, ref: "Edificio" },
    comentarios: String,
    estatusVisitante: {
      type: String,
      enum: ["sin_antecedentes", "con_antecedentes"],
      default: "sin_antecedentes",
    },
    scans: [scanSchema],
  },
  { timestamps: true }
)

export type VisitaDoc = InferSchemaType<typeof visitaSchema> & { _id: unknown }
export const Visita: Model<VisitaDoc> =
  (mongoose.models.Visita as Model<VisitaDoc>) ||
  mongoose.model<VisitaDoc>("Visita", visitaSchema)
