import crypto from "node:crypto";
import { createServiceClient } from "@/lib/supabase/admin";

export type AuditReportRecord = {
  id: string; user_id?: string | null; email?: string | null; lead_email?: string | null; domain: string; normalized_url: string; created_at: string; public_token_expires_at?: string | null; scores?: Record<string, number | null>; audit_result?: unknown; executive_summary?: unknown; top_issues?: unknown[]; top_opportunities?: unknown[]; recommended_actions?: unknown[]; rankelia_value_summary?: unknown;
};

export function hashAuditReportToken(rawToken: string) { return crypto.createHash("sha256").update(rawToken).digest("hex"); }
export function createAuditReportToken(days = Number(process.env.AUDIT_REPORT_TOKEN_DAYS ?? 30)) { const rawToken = crypto.randomBytes(32).toString("base64url"); return { rawToken, tokenHash: hashAuditReportToken(rawToken), expiresAt: new Date(Date.now() + days * 86400_000) }; }

export async function verifyAuditReportToken(rawToken: string): Promise<AuditReportRecord | null> {
  if (!rawToken || rawToken.length < 32 || !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return null;
  const tokenHash = hashAuditReportToken(rawToken);
  const supabase = createServiceClient();
  const { data } = await supabase.from("free_seo_audits").select("id,user_id,email,lead_email,domain,normalized_url,created_at,public_token_expires_at,scores,audit_result,executive_summary,top_issues,top_opportunities,recommended_actions,rankelia_value_summary").eq("public_token_hash", tokenHash).maybeSingle<AuditReportRecord>();
  if (!data) return null;
  if (data.public_token_expires_at && new Date(data.public_token_expires_at).getTime() < Date.now()) return null;
  await supabase.from("free_seo_audits").update({ last_viewed_at: new Date().toISOString() }).eq("id", data.id);
  await supabase.from("audit_report_events").insert({ audit_id: data.id, user_id: data.user_id ?? null, event_type: "report_viewed", metadata: {} });
  return data;
}
