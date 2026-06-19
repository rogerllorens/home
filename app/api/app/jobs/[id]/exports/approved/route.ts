import { NextResponse } from "next/server";
import { getCurrentUserContext } from "@/lib/auth";
import { enforceRateLimit } from "@/lib/rate-limit";
import { createServiceClient } from "@/lib/supabase/admin";
import { exportApprovedForJob } from "@/lib/proposals/export-approved";

export const dynamic = "force-dynamic";
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const context = await getCurrentUserContext();
  if (!context.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const limited = await enforceRateLimit(request, "jobs:export-approved", context.user.id, 8, 60);
  if (limited) return limited;
  const body = await request.json().catch(() => ({})) as { platform?: string };
  try { const { id } = await params; return NextResponse.json(await exportApprovedForJob(createServiceClient(), { userId: context.user.id, jobId: id, platform: body.platform })); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "export_approved_failed" }, { status: 400 }); }
}
