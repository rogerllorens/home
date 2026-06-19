import type { JsonLdParseResult } from "./types";

const MAX_SCRIPT = 120_000;
const MAX_SCRIPTS = 16;
function stripComments(input: string) { return input.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, ""); }
function asArray(value: unknown): unknown[] { return Array.isArray(value) ? value : value ? [value] : []; }
function record(value: unknown): Record<string, unknown> | null { return typeof value === "object" && value !== null ? value as Record<string, unknown> : null; }
function walk(value: unknown, out: Record<string, unknown>[], graph: { count: number }) {
  const item = record(value); if (!item) return;
  out.push(item);
  if (Array.isArray(item["@graph"])) { graph.count += 1; for (const child of item["@graph"]) walk(child, out, graph); }
  for (const key of ["mainEntity", "itemListElement", "offers", "review", "aggregateRating", "potentialAction"]) for (const child of asArray(item[key])) walk(child, out, graph);
}
function typeNames(item: Record<string, unknown>) { const raw = item["@type"]; return Array.isArray(raw) ? raw.map(String) : raw ? [String(raw)] : []; }

export function parseJsonLdBlocks(blocks: string[]): JsonLdParseResult {
  const items: Record<string, unknown>[] = []; const parse_errors: string[] = []; let valid_count = 0; const graph = { count: 0 };
  for (const block of blocks.slice(0, MAX_SCRIPTS)) {
    if (block.length > MAX_SCRIPT) { parse_errors.push("json_ld_too_large"); continue; }
    try { const parsed = JSON.parse(stripComments(block)); valid_count += 1; for (const root of asArray(parsed)) walk(root, items, graph); }
    catch (error) { parse_errors.push(error instanceof Error ? error.message.slice(0, 160) : "invalid_json_ld"); }
  }
  return { items, types: [...new Set(items.flatMap(typeNames))], parse_errors, raw_count: blocks.length, valid_count, invalid_count: parse_errors.length, graph_count: graph.count };
}
