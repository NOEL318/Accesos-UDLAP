import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose"

export const ROLES = [
  "admin",
  "estudiante",
  "maestro",
  "oficial",
  "proveedor",
  "exaudlap",
  "residente",
  "adminColegios",
] as const
export type Role = (typeof ROLES)[number]

const profileEstudianteSchema = new Schema(
  {
    studentId: { type: String, required: true },
    programa: String,
    semestre: Number,
    saldoComedor: { type: Number, default: 0 },
    frecuentes: [{ nombre: String, iniciales: String }],
  },
  { _id: false }
)

const profileOficialSchema = new Schema(
  {
    numeroPlaca: String,
    turno: { type: String, enum: ["Matutino", "Vespertino", "Nocturno"] },
    pin: String,
    gateAsignado: String,
  },
  { _id: false }
)

const profileProveedorSchema = new Schema(
  {
    empresa: String,
    rfc: String,
    vehiculoMatricula: String,
  },
  { _id: false }
)

const profileMaestroSchema = new Schema(
  {
    numeroEmpleado: String,
    departamento: String,
  },
  { _id: false }
)

const profileExaudlapSchema = new Schema(
  {
    studentId: String,
    anioGraduacion: Number,
    programa: String,
  },
  { _id: false }
)

const profileResidenteSchema = new Schema(
  {
    studentId: String,
    programa: String,
    semestre: Number,
    edificioId: { type: Schema.Types.ObjectId, ref: "Edificio" },
    habitacion: String,
    estado: {
      type: String,
      enum: ["en_campus", "fuera", "invitado"],
      default: "fuera",
    },
  },
  { _id: false }
)

const profileAdminColegiosSchema = new Schema(
  {
    edificiosACargo: [{ type: Schema.Types.ObjectId, ref: "Edificio" }],
  },
  { _id: false }
)

// schema de mongoose para los usuarios con sus distintos perfiles segun el role
const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
    password: { type: String, required: true }, // texto plano (decisión explícita del usuario)
    role: { type: String, enum: ROLES, required: true, index: true },
    nombre: { type: String, required: true },
    apellido: { type: String, required: true },
    telefono: String,
    avatar: String, // base64
    sessionToken: { type: String, index: true },
    sessionExpiresAt: Date,
    profile: {
      estudiante: profileEstudianteSchema,
      oficial: profileOficialSchema,
      proveedor: profileProveedorSchema,
      maestro: profileMaestroSchema,
      exaudlap: profileExaudlapSchema,
      residente: profileResidenteSchema,
      adminColegios: profileAdminColegiosSchema,
    },
  },
  { timestamps: true }
)

export type UserDoc = InferSchemaType<typeof userSchema> & { _id: unknown }
export const User: Model<UserDoc> =
  (mongoose.models.User as Model<UserDoc>) ||
  mongoose.model<UserDoc>("User", userSchema)
