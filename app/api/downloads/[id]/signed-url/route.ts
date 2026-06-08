import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUserContext, isAdminRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { validateStoragePathOwnership } from "@/lib/storage/files";
import { enforceRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await getCurrentUserContext();
  if (!auth.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const limited = await enforceRateLimit(_request, "downloads:signed-url", auth.user.id, 60, 60);
  if (limited) return limited;
  const supabase = await createClient();
  const { data: download, error } = await supabase.from("downloads").select("*").eq("id", id).maybeSingle<{ id: string; user_id: string; storage_bucket: string; storage_path: string }>();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!download) return NextResponse.json({ error: "Download not found" }, { status: 404 });
  const isAdmin = isAdminRole(auth.profile?.role);
  if (download.user_id !== auth.user.id && !isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!isAdmin && !validateStoragePathOwnership(auth.user.id, download.storage_path)) return NextResponse.json({ error: "Invalid storage path" }, { status: 403 });
  const signed = await supabase.storage.from(download.storage_bucket).createSignedUrl(download.storage_path, 60 * 10);
  if (signed.error || !signed.data?.signedUrl) return NextResponse.json({ error: signed.error?.message ?? "Could not sign URL" }, { status: 500 });
  return NextResponse.json({ signedUrl: signed.data.signedUrl, expiresIn: 600 });
}
