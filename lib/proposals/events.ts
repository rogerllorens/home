import type { SupabaseClient } from "@supabase/supabase-js";

export async function createProposalEvent(client: SupabaseClient, input: { proposalId: string; versionId?: string | null; userId: string; eventType: string; metadata?: Record<string, unknown> }) {
  return client.from("proposal_events").insert({ proposal_id: input.proposalId, version_id: input.versionId ?? null, user_id: input.userId, event_type: input.eventType, metadata: input.metadata ?? {} });
}
