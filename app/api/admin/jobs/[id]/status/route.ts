import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUserContext, isAdminRole } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/admin";
import { enforceRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const allowedStatuses = new Set(["queued", "cancelled", "failed"]);

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const context = await getCurrentUserContext();
  if (!context.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdminRole(context.profile?.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const limited = await enforceRateLimit(request, "admin:job-status", context.user.id, 30, 60);
  if (limited) return limited;
  const body = await request.json().catch(() => ({})) as { status?: string; errorMessage?: string };
  if (!body.status || !allowedStatuses.has(body.status)) return NextResponse.json({ error: "Estado admin no permitido." }, { status: 400 });
  const supabase = createServiceClient();
  const patch: Record<string, unknown> = { status: body.status };
  if (body.status === "queued") Object.assign(patch, { rows_processed: 0, rows_failed: 0, error_message: null, finished_at: null });
  if (body.status === "failed") Object.assign(patch, { error_message: body.errorMessage ?? "Marcado como error desde admin", finished_at: new Date().toISOString() });
  if (body.status === "cancelled") Object.assign(patch, { error_message: "Cancelado desde admin", finished_at: new Date().toISOString() });
  const { data, error } = await supabase.from("jobs").update(patch).eq("id", id).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ job: data });
}
