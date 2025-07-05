const inflight = new Map<string, Promise<any>>();

export default async function singleflight(key: string, fn: () => Promise<any>): Promise<any> {
  if (inflight.has(key)) {
    return inflight.get(key);
  }
  const p = fn().finally(() => inflight.delete(key));
  inflight.set(key, p);
  return p;
}
