import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a given amount in pennies (or hryvnias if specified) strictly as Ukrainian Hryvnia (UAH / ₴).
 * Example: 4500000 pennies -> "45 000.00 ₴"
 */
export function formatUAH(amountInPennies: number, includeDecimals = true): string {
  const hryvnias = (amountInPennies || 0) / 100;
  
  const formatted = hryvnias.toLocaleString('uk-UA', {
    minimumFractionDigits: includeDecimals ? 2 : 0,
    maximumFractionDigits: includeDecimals ? 2 : 0,
  });

  return `${formatted} ₴`;
}

/**
 * Parses a user input string (e.g. "45 000,50" or "45000") into pennies.
 */
export function parseUAHInputToPennies(input: string): number {
  if (!input) return 0;
  // Replace spaces, commas with dots
  const sanitized = input.replace(/\s+/g, '').replace(',', '.');
  const numeric = parseFloat(sanitized);
  if (isNaN(numeric) || numeric < 0) return 0;
  return Math.round(numeric * 100);
}
