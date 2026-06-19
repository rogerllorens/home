import { NextResponse } from "next/server";
import { getCurrentUserContext } from "@/lib/auth";
import { enforceRateLimit } from "@/lib/rate-limit";
import { createServiceClient } from "@/lib/supabase/admin";
import { createProposalEvent, createProposalVersion, getProposalDetail } from "@/lib/proposals";
import { buildRegeneratedOutput, sanitizeInstructions, validateRegenerationInput } from "@/lib/proposals/regeneration";

export const dynamic = "force-dynamic";
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const context = await getCurrentUserContext();
  if (!context.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const limited = await enforceRateLimit(request, "proposals:regenerate", context.user.id, 10, 60);
  if (limited) return limited;
  const body = await request.json().catch(() => null) as { scope?: string; instructions?: string; baseVersionId?: string } | null;
  try {
    const scope = body?.scope ?? "full_product";
    validateRegenerationInput(scope, body?.instructions);
    const instructions = sanitizeInstructions(body?.instructions);
    const { id } = await params;
    const client = createServiceClient();
    const detail = await getProposalDetail(client, context.user.id, id);
    const base = (body?.baseVersionId ? detail.versions.find((version) => version.id === body.baseVersionId) : detail.activeVersion) ?? detail.activeVersion;
    if (!base) return NextResponse.json({ error: "base_version_not_found" }, { status: 404 });
    await createProposalEvent(client, { proposalId: id, versionId: base.id, userId: context.user.id, eventType: "regeneration_requested", metadata: { scope, instructions } });
    const output = buildRegeneratedOutput(base.output_data, scope, instructions);
    const version = await createProposalVersion(client, { proposal: detail.proposal, userId: context.user.id, outputData: output, originalData: detail.proposal.original_snapshot, source: scope === "full_product" ? "regeneration" : "field_regeneration", scope, instructions, metadata: { generationEngine: "template-safe-regeneration", fallbackUsed: true } });
    await createProposalEvent(client, { proposalId: id, versionId: version.id, userId: context.user.id, eventType: "regeneration_completed", metadata: { scope } });
    return NextResponse.json({ version });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "regeneration_failed" }, { status: 400 }); }
}
