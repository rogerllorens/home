import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { AuditReportView } from "@/components/audit-report/AuditReportView";
import { verifyAuditReportToken } from "@/lib/audit/report-token";

export const dynamic = "force-dynamic";

export default async function AuditPublicReportPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const report = await verifyAuditReportToken(token);
  if (!report) return <main className="min-h-screen bg-slate-50 px-4 py-16"><Card className="mx-auto max-w-2xl" variant="elevated"><h1 className="text-3xl font-black">Informe no disponible</h1><p className="mt-3 text-slate-600">El enlace no existe o ha expirado. Puedes generar una nueva auditoría gratuita.</p><Button className="mt-6" href="/#free-audit">Nueva auditoría</Button></Card></main>;
  return <AuditReportView report={report} token={token} />;
}
