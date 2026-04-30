import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose"

// schema de mongoose para los items del menu del comedor
const menuItemSchema = new Schema(
  {
    nombre: { type: String, required: true },
    precio: { type: Number, required: true, min: 0 },
    descripcion: String,
    categoria: {
      type: String,
      enum: ["principal", "economico", "vegano"],
      required: true,
    },
    icon: String,
    disponible: { type: Boolean, default: true },
    fecha: { type: Date, default: () => new Date(), index: true },
  },
  { timestamps: true }
)

export type MenuItemDoc = InferSchemaType<typeof menuItemSchema> & { _id: unknown }
export const MenuItem: Model<MenuItemDoc> =
  (mongoose.models.MenuItem as Model<MenuItemDoc>) ||
  mongoose.model<MenuItemDoc>("MenuItem", menuItemSchema)
