import type { NormalizedPageSpeedResult, PageSpeedStrategy } from "./types";
import { buildPageSpeedCacheKey } from "./normalizer";

const memory = new Map<string, NormalizedPageSpeedResult>();
export function getMemoryPageSpeedCache(url: string, strategy: PageSpeedStrategy) {
  const key = buildPageSpeedCacheKey(url, strategy);
  const item = memory.get(key);
  if (!item || new Date(item.expiresAt).getTime() <= Date.now()) return null;
  return item;
}
export function setMemoryPageSpeedCache(result: NormalizedPageSpeedResult) { memory.set(result.cacheKey, result); }
