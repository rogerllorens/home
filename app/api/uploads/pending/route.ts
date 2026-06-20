import { NextResponse } from "next/server";
import { getCurrentUserContext } from "@/lib/auth";
import { enforceRateLimit } from "@/lib/rate-limit";
import { INPUT_BUCKET, validateStoragePathOwnership } from "@/lib/storage/files";
import { createServiceClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type Body = { storagePath?: string; bucket?: string };

export async function POST(request: Request) {
  const context = await getCurrentUserContext();
  if (!context.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const limited = await enforceRateLimit(request, "uploads:pending", context.user.id, 30, 60);
  if (limited) return limited;
  const body = (await request.json().catch(() => null)) as Body | null;
  const bucket = body?.bucket ?? INPUT_BUCKET;
  if (bucket !== INPUT_BUCKET || !body?.storagePath || !validateStoragePathOwnership(context.user.id, body.storagePath)) return NextResponse.json({ error: "Upload path inválido." }, { status: 400 });
  const service = createServiceClient();
  const { error } = await service.from("pending_uploads").upsert({ user_id: context.user.id, storage_bucket: bucket, storage_path: body.storagePath, status: "pending", expires_at: new Date(Date.now() + 24 * 3600_000).toISOString() }, { onConflict: "storage_bucket,storage_path" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
