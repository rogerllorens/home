import { NextResponse } from "next/server";
import { z } from "zod";
import { hashAuditReportToken } from "@/lib/audit/report-token";
import { createServiceClient } from "@/lib/supabase/admin";
import { enforceRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
const schema = z.object({ token: z.string().min(32), eventType: z.enum(["cta_clicked", "signup_clicked", "upload_clicked", "gsc_clicked"]), metadata: z.record(z.string(), z.unknown()).optional() });

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  const limited = await enforceRateLimit(request, "audit-report:event", ip, 60, 300);
  if (limited) return limited;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_event" }, { status: 400 });
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return NextResponse.json({ ok: true, skipped: true });
  const supabase = createServiceClient();
  const tokenHash = hashAuditReportToken(parsed.data.token);
  const { data } = await supabase.from("free_seo_audits").select("id,user_id,public_token_expires_at").eq("public_token_hash", tokenHash).maybeSingle<{ id: string; user_id: string | null; public_token_expires_at: string | null }>();
  if (!data || (data.public_token_expires_at && new Date(data.public_token_expires_at).getTime() < Date.now())) return NextResponse.json({ error: "not_found" }, { status: 404 });
  await supabase.from("audit_report_events").insert({ audit_id: data.id, user_id: data.user_id, event_type: parsed.data.eventType, metadata: parsed.data.metadata ?? {} });
  return NextResponse.json({ ok: true });
}
