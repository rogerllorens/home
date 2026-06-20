import type { z } from "zod";

export function extractJSONFromText(text: string) {
  const cleaned = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  try { return JSON.parse(cleaned); } catch {}
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start >= 0 && end > start) return JSON.parse(cleaned.slice(start, end + 1));
  throw new Error("No se pudo extraer JSON válido de la respuesta IA.");
}

function coerceArrays(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(coerceArrays);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, coerceArrays(v)]));
  return value;
}

export function validateWithSchema<T>(raw: unknown, schema: z.ZodType<T>) {
  const normalized = coerceArrays(raw);
  const result = schema.safeParse(normalized);
  if (result.success) return { ok: true as const, data: result.data, errors: [] as string[] };
  return { ok: false as const, data: null, errors: result.error.issues.map((issue) => `${issue.path.join(".") || "root"}: ${issue.message}`) };
}
