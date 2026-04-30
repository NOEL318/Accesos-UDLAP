import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose"

const propietarioSchema = new Schema(
  {
    nombre: { type: String, required: true },
    idUdlap: String,
    tipo: { type: String, enum: ["estudiante", "empleado", "visita", "externo"], required: true },
  },
  { _id: false }
)

const selloSchema = new Schema(
  {
    vigente: { type: Boolean, default: true },
    vence: Date,
  },
  { _id: false }
)

const bloqueoSalidaSchema = new Schema(
  {
    motivo: { type: String, enum: ["multa", "restriccion_academica", "incidente"] },
    descripcion: String,
  },
  { _id: false }
)

// schema de mongoose para los vehiculos registrados con su sello, propietario y estado de acceso
const vehiculoSchema = new Schema(
  {
    matricula: { type: String, required: true, unique: true, index: true, uppercase: true },
    propietarioUserId: { type: Schema.Types.ObjectId, ref: "User" },
    propietarioInfo: { type: propietarioSchema, required: true },
    modelo: String,
    color: String,
    foto: String, // base64
    sello: { type: selloSchema, default: () => ({ vigente: true }) },
    ubicacion: String,
    estadoAcceso: {
      type: String,
      enum: ["permitido", "denegado", "revision"],
      default: "permitido",
    },
    ocupantes: { type: Number, default: 1 },
    multasPendientes: { type: Number, default: 0 },
    bloqueoSalida: bloqueoSalidaSchema,
  },
  { timestamps: true }
)

export type VehiculoDoc = InferSchemaType<typeof vehiculoSchema> & { _id: unknown }
export const Vehiculo: Model<VehiculoDoc> =
  (mongoose.models.Vehiculo as Model<VehiculoDoc>) ||
  mongoose.model<VehiculoDoc>("Vehiculo", vehiculoSchema)
