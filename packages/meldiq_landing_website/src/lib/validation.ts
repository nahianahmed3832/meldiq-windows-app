import { z } from "zod";

/**
 * Form checks shown before anything is sent. They match the server's rules (meldiq_android/server: zEmail, zName,
 * PASSWORD_MIN_LENGTH 10, PASSWORD_MAX_LENGTH 128); the server checks again and has the last word.
 */
export const PASSWORD_MIN = 10;
export const PASSWORD_MAX = 128;

export const emailSchema = z
  .string()
  .trim()
  .min(1, "Enter your email address.")
  .max(254, "That email address is too long.")
  .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Enter an email address like name@example.com.");

export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN, `Use at least ${PASSWORD_MIN} characters.`)
  .max(PASSWORD_MAX, `Use at most ${PASSWORD_MAX} characters.`);
export const nameSchema = z.string().trim().min(1, "Enter your name.").max(80, "Use at most 80 characters.");
export const codeSchema = z.string().trim().min(4, "Enter the code from the email.").max(32, "That code is too long.");

export type FieldErrors<K extends string> = Partial<Record<K, string>>;

/** Checks [values] field by field; an empty result means everything is fine. */
export function check<K extends string>(rules: Record<K, z.ZodType<string>>, values: Record<K, string>): FieldErrors<K> {
  const errors: FieldErrors<K> = {};
  for (const key of Object.keys(rules) as K[]) {
    const r = rules[key].safeParse(values[key]);
    if (!r.success) errors[key] = r.error.issues[0]?.message ?? "Check this field.";
  }
  return errors;
}

/** Only same-site paths are followed after signing in (an open redirect would send people anywhere). */
export function safeNext(next: unknown, fallback = "/account"): string {
  if (typeof next !== "string" || !next.startsWith("/") || next.startsWith("//") || next.includes("\\")) return fallback;
  return next;
}
