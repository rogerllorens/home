import { NextResponse } from "next/server";
import { getCurrentUserContext } from "@/lib/auth";
import { enforceRateLimit } from "@/lib/rate-limit";
import { createServiceClient } from "@/lib/supabase/admin";
import { setActiveVersion } from "@/lib/proposals";

export const dynamic = "force-dynamic";
export async function POST(request: Request, { params }: { params: Promise<{ id: string; versionId: string }> }) {
  const context = await getCurrentUserContext();
  if (!context.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const limited = await enforceRateLimit(request, "proposals:activate", context.user.id, 30, 60);
  if (limited) return limited;
  try { const { id, versionId } = await params; return NextResponse.json({ version: await setActiveVersion(createServiceClient(), context.user.id, id, versionId) }); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "activate_failed" }, { status: 400 }); }
}
