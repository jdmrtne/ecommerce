import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge conditional class names and resolve Tailwind conflicts.
 * Use this instead of raw template strings whenever a component
 * accepts a `className` override prop.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
