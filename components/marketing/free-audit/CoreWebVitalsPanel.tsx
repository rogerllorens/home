import { Card } from "@/components/ui/Card";
import { PerformanceMetricBadge } from "./PerformanceMetricBadge";

type StrategySummary = { largestContentfulPaintMs?: number | null; cumulativeLayoutShift?: number | null; interactionToNextPaintMs?: number | null; totalBlockingTimeMs?: number | null };
type Summary = { mobile?: StrategySummary; desktop?: StrategySummary; core_web_vitals_status?: { lcp_status?: string; cls_status?: string; inp_status?: string; inp_available?: boolean }; field_data_available?: boolean; lab_data_used?: boolean };
function ms(value?: number | null) { return value === null || value === undefined ? "—" : `${value} ms`; }
function cls(value?: number | null) { return value === null || value === undefined ? "—" : value.toFixed(3); }

export function CoreWebVitalsPanel({ summary }: { summary: Summary }) {
  const primary = summary.mobile ?? summary.desktop;
  const status = summary.core_web_vitals_status ?? {};
  return <Card><div className="flex flex-col justify-between gap-2 sm:flex-row"><div><h4 className="text-xl font-black">Core Web Vitals</h4><p className="mt-1 text-sm text-slate-500">Los datos de laboratorio pueden variar; los datos de campo dependen de que Google tenga muestra suficiente.</p></div></div><div className="mt-4 grid gap-3 md:grid-cols-3"><PerformanceMetricBadge label="LCP" value={ms(primary?.largestContentfulPaintMs)} status={status.lcp_status ?? "unavailable"} /><PerformanceMetricBadge label="CLS" value={cls(primary?.cumulativeLayoutShift)} status={status.cls_status ?? "unavailable"} /><PerformanceMetricBadge label={status.inp_available ? "INP" : "TBT proxy"} value={ms(primary?.interactionToNextPaintMs ?? primary?.totalBlockingTimeMs)} status={status.inp_status ?? "unavailable"} /></div></Card>;
}
