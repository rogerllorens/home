import { NextResponse } from "next/server";
import { buildTemplateCsv, type ImportTemplateId } from "@/lib/import";
export const dynamic = "force-dynamic";
export async function GET(_request: Request, { params }: { params: Promise<{ template: string }> }) { const { template } = await params; const built = buildTemplateCsv(template as ImportTemplateId); return new NextResponse(built.csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${built.filename}"` } }); }
