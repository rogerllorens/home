import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUserContext, isAdminRole } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/admin";
import { enforceRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const context = await getCurrentUserContext();
  if (!context.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const limited = await enforceRateLimit(request, "jobs:cancel", context.user.id, 20, 60);
  if (limited) return limited;

  const supabase = createServiceClient();
  const { data: job, error } = await supabase.from("jobs").select("id,user_id,status").eq("id", id).maybeSingle<{ id: string; user_id: string; status: string }>();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });
  if (job.user_id !== context.user.id && !isAdminRole(context.profile?.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (["completed", "completed_with_warnings", "failed", "cancelled"].includes(job.status)) return NextResponse.json({ error: "Este job ya está finalizado." }, { status: 409 });

  const reservation = await supabase.from("credit_reservations").select("id,status").eq("job_id", id).eq("status", "reserved").maybeSingle<{ id: string; status: string }>();
  if (reservation.data?.id) await supabase.rpc("release_reserved_credits", { p_reservation_id: reservation.data.id, p_reason: "Job cancelled by user" });
  const updated = await supabase.from("jobs").update({ status: "cancelled", error_message: "Cancelado por el usuario", finished_at: new Date().toISOString() }).eq("id", id).select("*").single();
  if (updated.error) return NextResponse.json({ error: updated.error.message }, { status: 500 });
  return NextResponse.json({ job: updated.data });
}
