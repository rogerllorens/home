import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { LlmsTxtPreview } from "./LlmsTxtPreview";
import { DownloadLlmsTxtButton } from "./DownloadLlmsTxtButton";

type Llms = { llms_txt_content?: string; llms_txt_score?: number; llms_txt_warnings?: string[]; llms_txt_generated?: boolean };
export function LlmsTxtPanel({ llms }: { llms?: Llms }) {
  if (!llms?.llms_txt_generated || !llms.llms_txt_content) return null;
  return <Card><div className="flex flex-col justify-between gap-3 md:flex-row md:items-start"><div><h4 className="text-xl font-black">llms.txt orientativo</h4><p className="mt-1 text-sm text-slate-500">Archivo experimental para sistemas de IA/crawlers compatibles. No garantiza visibilidad en ChatGPT, Gemini o Perplexity.</p></div><Badge variant="info">{llms.llms_txt_score}/100</Badge></div><div className="mt-4"><LlmsTxtPreview content={llms.llms_txt_content} /></div>{Boolean(llms.llms_txt_warnings?.length) && <p className="mt-3 text-sm font-semibold text-amber-700">{llms.llms_txt_warnings?.join(" · ")}</p>}<div className="mt-4"><DownloadLlmsTxtButton content={llms.llms_txt_content} /></div><p className="mt-3 text-xs text-slate-500">Revísalo y súbelo manualmente a la raíz del dominio como /llms.txt si quieres probarlo.</p></Card>;
}
