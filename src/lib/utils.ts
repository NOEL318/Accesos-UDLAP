import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

// junta clases de tailwind y resuelve conflictos con twMerge
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
