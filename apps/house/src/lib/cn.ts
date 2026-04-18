import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function isValidString(v: unknown): boolean {
  return v != null && typeof v === "string" && v.trim() !== "";
}
