import type { ErrorRequestHandler, RequestHandler } from "express"
import { ZodError } from "zod"
import { ApiError } from "../lib/errors"

// middleware fallback para rutas que no matchean ningun handler
export const notFoundHandler: RequestHandler = (_req, res) => {
  res.status(404).json({ error: "NOT_FOUND", message: "Ruta no encontrada" })
}

// middleware central que serializa ApiError, ZodError y el resto a respuestas JSON
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ApiError) {
    res.status(err.status).json({
      error: err.code,
      message: err.message,
      details: err.details,
    })
    return
  }
  if (err instanceof ZodError) {
    res.status(400).json({
      error: "VALIDATION",
      message: "Datos inválidos",
      details: err.flatten(),
    })
    return
  }
  console.error("Unhandled error:", err)
  res.status(500).json({
    error: "INTERNAL",
    message: "Error interno del servidor",
  })
}
