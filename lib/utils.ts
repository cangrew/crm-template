import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Exhaustiveness guard for discriminated unions / state machines. Calling it
 * is a compile-time error unless every case has been handled, and a runtime
 * throw if an unexpected value slips through.
 */
export function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${String(value)}`);
}
