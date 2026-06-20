export function AuditSkeleton() {
  return <div className="rounded-[2rem] border border-blue-100 bg-white p-6 shadow-sm"><div className="h-4 w-40 animate-pulse rounded bg-blue-100" /><div className="mt-4 h-8 w-2/3 animate-pulse rounded bg-slate-100" /><div className="mt-6 grid gap-3 md:grid-cols-3">{[0,1,2].map((item) => <div className="h-28 animate-pulse rounded-3xl bg-slate-100" key={item} />)}</div><p className="mt-4 text-sm font-semibold text-slate-500">Validando URL, leyendo HTML público, robots.txt y sitemap…</p></div>;
}
