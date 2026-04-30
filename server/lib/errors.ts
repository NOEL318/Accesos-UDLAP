export type ErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION"
  | "CONFLICT"
  | "INTERNAL"

const STATUS_BY_CODE: Record<ErrorCode, number> = {
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  VALIDATION: 400,
  CONFLICT: 409,
  INTERNAL: 500,
}

// error custom de la API que mapea el code a un status HTTP
export class ApiError extends Error {
  status: number
  code: ErrorCode
  details?: unknown

  constructor(code: ErrorCode, message: string, details?: unknown) {
    super(message)
    this.code = code
    this.status = STATUS_BY_CODE[code]
    this.details = details
  }
}
