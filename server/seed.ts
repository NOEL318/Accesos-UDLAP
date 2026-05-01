import { connectDb } from "./db.js"
import { User } from "./modules/users/user.model.js"
import { Vehiculo } from "./modules/vehiculos/vehiculo.model.js"
import { Multa } from "./modules/vehiculos/multa.model.js"
import { EventoAcceso } from "./modules/vehiculos/evento.model.js"
import { PuntoControl } from "./modules/vehiculos/punto.model.js"
import { Alerta } from "./modules/alertas/alerta.model.js"
import { Edificio } from "./modules/colegios/edificio.model.js"
import { Movimiento } from "./modules/colegios/movimiento.model.js"

// borra y vuelve a poblar la base con datos demo de todos los modulos
async function main() {
  await connectDb()

  await User.deleteMany({})

  const docs = [
    {
      email: "admin@udlap.mx",
      password: "demo1234",
      role: "admin" as const,
      nombre: "Administrador",
      apellido: "UDLAP",
    },
    {
      email: "estudiante@udlap.mx",
      password: "demo1234",
      role: "estudiante" as const,
      nombre: "Juan",
      apellido: "Pérez",
      telefono: "222-1234567",
      profile: {
        estudiante: {
          studentId: "181278",
          programa: "Ing. en Sistemas",
          semestre: 6,
          frecuentes: [
            { nombre: "Juan López", iniciales: "JL" },
            { nombre: "Ana S.", iniciales: "AS" },
          ],
        },
      },
    },
    {
      email: "seguridad@udlap.mx",
      password: "demo1234",
      role: "oficial" as const,
      nombre: "María",
      apellido: "González",
      profile: {
        oficial: {
          numeroPlaca: "SEG-007",
          turno: "Matutino",
          pin: "0000",
          gateAsignado: "Gaos",
        },
      },
    },
  ]

  await User.insertMany(docs)

  console.log(`Seed completo: ${docs.length} usuarios creados`)
  console.log("   - admin@udlap.mx / demo1234")
  console.log("   - estudiante@udlap.mx / demo1234")
  console.log("   - seguridad@udlap.mx / demo1234")

  // ---- Plan 3 — iPad seguridad: vehículos, multas, eventos, puntos, alertas ----
  await Promise.all([
    Vehiculo.deleteMany({}),
    Multa.deleteMany({}),
    EventoAcceso.deleteMany({}),
    PuntoControl.deleteMany({}),
    Alerta.deleteMany({}),
  ])

  // Más oficiales (además del seguridad@udlap.mx ya creado)
  const oficialesExtra = await User.insertMany([
    {
      email: "ramirez@udlap.mx",
      password: "demo1234",
      role: "oficial" as const,
      nombre: "G.",
      apellido: "Ramírez",
      profile: {
        oficial: {
          numeroPlaca: "SEG-008",
          turno: "Vespertino",
          pin: "0000",
          gateAsignado: "Postgrado",
        },
      },
    },
    {
      email: "garza@udlap.mx",
      password: "demo1234",
      role: "oficial" as const,
      nombre: "Garza",
      apellido: "Nocturno",
      profile: {
        oficial: {
          numeroPlaca: "SEG-009",
          turno: "Nocturno",
          pin: "0000",
          gateAsignado: "Residencial",
        },
      },
    },
  ])
  const seguridad = await User.findOne({ email: "seguridad@udlap.mx" })

  // Puntos de control
  const puntos = await PuntoControl.insertMany([
    { nombre: "Puerta 1 (Principal)", tipo: "principal", estado: "activa", oficialOperadorId: seguridad?._id },
    { nombre: "Puerta 2 (Postgrado)", tipo: "postgrado", estado: "activa", oficialOperadorId: oficialesExtra[0]._id },
    { nombre: "Puerta 3 (Deportes)", tipo: "deportes", estado: "standby" },
    { nombre: "Acceso Residencial", tipo: "residencial", estado: "activa" },
  ])

  // Vehículos demo
  const vehiculos = await Vehiculo.insertMany([
    {
      matricula: "ABC-123-D",
      propietarioInfo: { nombre: "Juan Pérez Rodríguez", idUdlap: "154892", tipo: "estudiante" },
      modelo: "Mazda 3",
      color: "Rojo",
      sello: { vigente: true, vence: new Date("2027-12-31") },
      ubicacion: "Puerta 1",
      multasPendientes: 1,
      estadoAcceso: "permitido",
      ocupantes: 2,
    },
    {
      matricula: "TXY-4521",
      propietarioInfo: { nombre: "Carlos Méndez Rivera", idUdlap: "156432", tipo: "estudiante" },
      modelo: "Nissan Versa",
      color: "Blanco",
      sello: { vigente: true, vence: new Date("2027-12-31") },
      ubicacion: "Puerta 1",
      multasPendientes: 0,
      estadoAcceso: "permitido",
      ocupantes: 1,
    },
    {
      matricula: "UAL-9980",
      propietarioInfo: { nombre: "Dra. Elena García", idUdlap: "400192", tipo: "empleado" },
      modelo: "Honda Civic",
      color: "Negro",
      sello: { vigente: true, vence: new Date("2027-12-31") },
      ubicacion: "Puerta 2",
      multasPendientes: 1,
      estadoAcceso: "permitido",
      ocupantes: 1,
    },
    {
      matricula: "MXZ-1122",
      propietarioInfo: { nombre: "Juan Pérez S.", idUdlap: "Externo", tipo: "visita" },
      modelo: "Toyota Corolla",
      color: "Gris",
      sello: { vigente: false, vence: new Date("2024-12-31") },
      ubicacion: "Puerta 1",
      multasPendientes: 0,
      estadoAcceso: "denegado",
      ocupantes: 3,
    },
    {
      matricula: "PUE-6734",
      propietarioInfo: { nombre: "Mariana Torres", idUdlap: "158990", tipo: "estudiante" },
      modelo: "VW Jetta",
      color: "Azul",
      sello: { vigente: true, vence: new Date("2027-12-31") },
      ubicacion: "Estacionamiento 2",
      multasPendientes: 3,
      estadoAcceso: "revision",
      ocupantes: 1,
      bloqueoSalida: { motivo: "multa", descripcion: "3 multas pendientes sin pagar" },
    },
    {
      matricula: "HGT-5521",
      propietarioInfo: { nombre: "Andrea S. Valerdi", idUdlap: "164082", tipo: "estudiante" },
      modelo: "Kia Río",
      color: "Blanco",
      sello: { vigente: true, vence: new Date("2027-12-31") },
      ubicacion: "Estacionamiento 1",
      multasPendientes: 2,
      estadoAcceso: "revision",
      ocupantes: 1,
      bloqueoSalida: { motivo: "restriccion_academica", descripcion: "Estudiante con multas de $500" },
    },
    {
      matricula: "ROB-7788",
      propietarioInfo: { nombre: "Roberto G. Garza", idUdlap: "Empleado-021", tipo: "empleado" },
      modelo: "Ford Escape",
      color: "Plata",
      sello: { vigente: true, vence: new Date("2027-12-31") },
      ubicacion: "Estacionamiento 3",
      multasPendientes: 1,
      estadoAcceso: "revision",
      ocupantes: 1,
      bloqueoSalida: { motivo: "incidente", descripcion: "Conducir en estado de ebriedad" },
    },
  ])

  // Multas
  await Multa.insertMany([
    {
      vehiculoId: vehiculos[0]._id,
      oficialId: oficialesExtra[0]._id,
      tipo: "Estacionamiento prohibido",
      montoMxn: 450,
      comentarios: "Estacionado en zona roja",
      fecha: new Date(Date.now() - 9 * 86400000),
      evidencia: [],
    },
    {
      vehiculoId: vehiculos[2]._id,
      oficialId: seguridad?._id,
      tipo: "Exceso de velocidad",
      montoMxn: 850,
      comentarios: "45 km/h en zona escolar",
      fecha: new Date(Date.now() - 13 * 86400000),
      evidencia: [],
    },
    {
      vehiculoId: vehiculos[4]._id,
      oficialId: oficialesExtra[0]._id,
      tipo: "No respetar alto",
      montoMxn: 600,
      comentarios: "",
      fecha: new Date(Date.now() - 18 * 86400000),
      evidencia: [],
    },
  ])

  // Eventos recientes
  const ahora = Date.now()
  await EventoAcceso.insertMany([
    {
      vehiculoId: vehiculos[1]._id,
      puntoId: puntos[0]._id,
      oficialId: seguridad?._id,
      resultado: "permitido",
      timestamp: new Date(ahora - 2 * 60 * 60 * 1000),
    },
    {
      vehiculoId: vehiculos[0]._id,
      puntoId: puntos[0]._id,
      oficialId: seguridad?._id,
      resultado: "permitido",
      timestamp: new Date(ahora - 3 * 60 * 60 * 1000),
    },
    {
      vehiculoId: vehiculos[3]._id,
      puntoId: puntos[0]._id,
      oficialId: seguridad?._id,
      resultado: "denegado",
      motivo: "Sello vencido",
      timestamp: new Date(ahora - 4 * 60 * 60 * 1000),
    },
    {
      vehiculoId: vehiculos[2]._id,
      puntoId: puntos[1]._id,
      oficialId: oficialesExtra[0]._id,
      resultado: "permitido",
      timestamp: new Date(ahora - 5 * 60 * 60 * 1000),
    },
  ])

  // Alertas
  await Alerta.insertMany([
    {
      scope: "vehicular",
      tipo: "placa_detectada",
      severidad: "info",
      descripcion: "Placa Detectada: ABC-123-D · Ingreso por Puerta 1",
      refs: { vehiculoId: vehiculos[0]._id },
      timestamp: new Date(ahora - 60 * 60 * 1000),
      estado: "activa",
    },
    {
      scope: "vehicular",
      tipo: "incidente",
      severidad: "moderada",
      descripcion: "Objetos perdidos en zona deportiva",
      timestamp: new Date(ahora - 90 * 60 * 1000),
      estado: "activa",
    },
    {
      scope: "vehicular",
      tipo: "ronda",
      severidad: "info",
      descripcion: "Ronda Perimetral Completada · Sector 4 (Residencias)",
      timestamp: new Date(ahora - 120 * 60 * 1000),
      estado: "atendida",
    },
    {
      scope: "vehicular",
      tipo: "visitante",
      severidad: "info",
      descripcion: "Nuevo Visitante: Juan Pérez · Destino: Edificio Administrativo",
      timestamp: new Date(ahora - 150 * 60 * 1000),
      estado: "activa",
    },
    {
      scope: "vehicular",
      tipo: "salida_bloqueada",
      severidad: "critica",
      descripcion: "Salida bloqueada · Roberto G. Garza · Estado de ebriedad",
      refs: { vehiculoId: vehiculos[6]._id },
      timestamp: new Date(ahora - 180 * 60 * 1000),
      estado: "activa",
    },
  ])

  console.log(
    `Seed iPad: ${oficialesExtra.length + 1} oficiales, ${puntos.length} puntos, ${vehiculos.length} vehículos, 3 multas, 4 eventos, 5 alertas`
  )

  // ---- Plan 5 — Colegios residenciales: edificios, residentes, movimientos, alertas ----
  await Promise.all([
    Edificio.deleteMany({}),
    Movimiento.deleteMany({}),
  ])

  // Edificios
  const edificios = await Edificio.insertMany([
    { nombre: "Edificio Cain-Murray", capacidad: 250 },
    { nombre: "Edificio Ray Lindley", capacidad: 200 },
    { nombre: "Residencias Ignacio Bernal", capacidad: 400 },
    { nombre: "Edificio José Gaos", capacidad: 150 },
  ])

  // Admin colegios
  await User.create({
    email: "colegios@udlap.mx",
    password: "demo1234",
    role: "adminColegios" as const,
    nombre: "Coordinador",
    apellido: "Residencias",
    profile: { adminColegios: { edificiosACargo: edificios.map((e) => e._id) } },
  })

  // Residentes (users con role residente)
  const residentesData = [
    { studentId: "158293", nombre: "Alejandro", apellido: "Ramírez", programa: "Ing. en Sistemas", semestre: 6, edif: 0, hab: "Villa I - Hab 204B", estado: "en_campus" },
    { studentId: "161044", nombre: "María José", apellido: "Flores", programa: "Diseño de Información", semestre: 4, edif: 2, hab: "Torre A - Hab 512", estado: "fuera" },
    { studentId: "159382", nombre: "David G.", apellido: "Smith", programa: "Administración de Negocios", semestre: 8, edif: 1, hab: "Villa II - Hab 101C", estado: "en_campus" },
    { studentId: "162271", nombre: "Sarah", apellido: "Williams", programa: "Derecho", semestre: 5, edif: 0, hab: "Villa I - Hab 303A", estado: "invitado" },
    { studentId: "165432", nombre: "Mariana", apellido: "Sosa", programa: "Arquitectura", semestre: 7, edif: 0, hab: "Villa I - Hab 410D", estado: "en_campus" },
    { studentId: "167890", nombre: "Roberto", apellido: "Méndez", programa: "Ing. Industrial", semestre: 9, edif: 2, hab: "Torre B - Hab 207", estado: "en_campus" },
    { studentId: "164221", nombre: "Luisa", apellido: "Ortega", programa: "Psicología", semestre: 3, edif: 3, hab: "Edif. C - Hab 105", estado: "fuera" },
    { studentId: "166543", nombre: "Juan Pablo", apellido: "García", programa: "Computer Science", semestre: 7, edif: 0, hab: "Villa I - Hab 502", estado: "en_campus" },
    { studentId: "168901", nombre: "Andrea", apellido: "Castillo", programa: "Comunicación", semestre: 4, edif: 1, hab: "Villa II - Hab 203A", estado: "fuera" },
    { studentId: "170112", nombre: "Carlos", apellido: "Mendoza", programa: "Mecatrónica", semestre: 5, edif: 3, hab: "Edif. C - Hab 312", estado: "en_campus" },
  ] as const

  const residentes = await User.insertMany(
    residentesData.map((r, i) => ({
      email: `residente${i + 1}@udlap.mx`,
      password: "demo1234",
      role: "residente" as const,
      nombre: r.nombre,
      apellido: r.apellido,
      profile: {
        residente: {
          studentId: r.studentId,
          programa: r.programa,
          semestre: r.semestre,
          edificioId: edificios[r.edif]._id,
          habitacion: r.hab,
          estado: r.estado as "en_campus" | "fuera" | "invitado",
        },
      },
    }))
  )

  // Movimientos recientes
  const ahoraColegios = Date.now()
  await Movimiento.insertMany([
    { residenteUserId: residentes[4]._id, edificioId: edificios[0]._id, hora: new Date(ahoraColegios - 15 * 60 * 1000), tipo: "entrada", estado: "normal" },
    { residenteUserId: residentes[5]._id, edificioId: edificios[2]._id, hora: new Date(ahoraColegios - 48 * 60 * 1000), tipo: "entrada", estado: "ebriedad" },
    { residenteUserId: residentes[6]._id, edificioId: edificios[3]._id, hora: new Date(ahoraColegios - 65 * 60 * 1000), tipo: "salida", estado: "autorizada" },
    { residenteUserId: residentes[0]._id, edificioId: edificios[0]._id, hora: new Date(ahoraColegios - 82 * 60 * 1000), tipo: "entrada", estado: "normal" },
    { residenteUserId: residentes[7]._id, edificioId: edificios[0]._id, hora: new Date(ahoraColegios - 105 * 60 * 1000), tipo: "salida", estado: "autorizada" },
  ])

  // Alertas residenciales (NO borramos las vehiculares previas; solo agregamos)
  await Alerta.insertMany([
    { scope: "residencial", tipo: "ebriedad", severidad: "alta", descripcion: "Caso de ebriedad detectado en caseta nocturna", refs: { edificioId: edificios[2]._id, residenteUserId: residentes[5]._id }, timestamp: new Date(ahoraColegios - 18 * 60 * 1000), estado: "activa" },
    { scope: "residencial", tipo: "items_prohibidos", severidad: "media", descripcion: "Visitante con vape detectado en Villa I", refs: { edificioId: edificios[0]._id }, timestamp: new Date(ahoraColegios - 45 * 60 * 1000), estado: "activa" },
    { scope: "residencial", tipo: "ronda", severidad: "info", descripcion: "Ronda nocturna completada en Ray Lindley", refs: { edificioId: edificios[1]._id }, timestamp: new Date(ahoraColegios - 90 * 60 * 1000), estado: "atendida" },
    { scope: "residencial", tipo: "incidente", severidad: "media", descripcion: "Reporte de ruido excesivo en Edif. C", refs: { edificioId: edificios[3]._id }, timestamp: new Date(ahoraColegios - 120 * 60 * 1000), estado: "activa" },
  ])

  console.log(`Seed colegios: ${edificios.length} edificios, 1 admin, ${residentes.length} residentes, 5 movimientos, 4 alertas`)
  console.log("   - colegios@udlap.mx / demo1234")
}

main()
  .catch((e) => {
    console.error("Seed falló:", e)
    process.exit(1)
  })
  .finally(async () => {
    const mongoose = await import("mongoose")
    await mongoose.disconnect()
  })
