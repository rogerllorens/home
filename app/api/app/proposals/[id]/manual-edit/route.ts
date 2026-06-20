import { NextResponse } from "next/server";
import { getCurrentUserContext } from "@/lib/auth";
import { enforceRateLimit } from "@/lib/rate-limit";
import { createServiceClient } from "@/lib/supabase/admin";
import { createProposalEvent, createProposalVersion, getProposalDetail, sanitizeManualFields } from "@/lib/proposals";

export const dynamic = "force-dynamic";
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const context = await getCurrentUserContext();
  if (!context.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const limited = await enforceRateLimit(request, "proposals:manual-edit", context.user.id, 20, 60);
  if (limited) return limited;
  const body = await request.json().catch(() => null) as { fields?: Record<string, unknown>; notes?: string } | null;
  if (!body?.fields || Object.keys(body.fields).length === 0) return NextResponse.json({ error: "fields_required" }, { status: 400 });
  try {
    const { id } = await params;
    const client = createServiceClient();
    const detail = await getProposalDetail(client, context.user.id, id);
    const fields = sanitizeManualFields(body.fields);
    const output = { ...(detail.activeVersion?.output_data ?? detail.proposal.current_snapshot), ...fields } as Record<string, unknown>;
    const version = await createProposalVersion(client, { proposal: detail.proposal, userId: context.user.id, outputData: output as unknown as import("@/lib/generation/template-generator").GenerationOutput & Record<string, unknown>, originalData: detail.proposal.original_snapshot, source: "manual_edit", scope: "manual_fields", instructions: String(body.notes ?? "").slice(0, 1000), metadata: { generationEngine: "manual" } });
    await createProposalEvent(client, { proposalId: id, versionId: version.id, userId: context.user.id, eventType: "manual_edit", metadata: { fields: Object.keys(fields) } });
    return NextResponse.json({ version });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "manual_edit_failed" }, { status: 400 }); }
}
