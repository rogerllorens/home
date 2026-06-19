import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUserContext, isAdminRole } from "@/lib/auth";
import { enforceRateLimit } from "@/lib/rate-limit";
import { createServiceClient } from "@/lib/supabase/admin";
import { validateStoragePathOwnership } from "@/lib/storage/files";

export const dynamic = "force-dynamic";

const INPUT_BUCKETS = new Set(["rankelia-inputs"]);

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const context = await getCurrentUserContext();
  if (!context.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const limited = await enforceRateLimit(request, "jobs:original:signed-url", context.user.id, 30, 60);
  if (limited) return limited;

  const supabase = createServiceClient();
  const { data: job, error } = await supabase
    .from("jobs")
    .select("id,user_id,input_bucket,input_file_path")
    .eq("id", id)
    .maybeSingle<{ id: string; user_id: string; input_bucket: string | null; input_file_path: string | null }>();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!job?.input_bucket || !job.input_file_path) return NextResponse.json({ error: "Original file not found" }, { status: 404 });

  const isAdmin = isAdminRole(context.profile?.role);
  if (job.user_id !== context.user.id && !isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!INPUT_BUCKETS.has(job.input_bucket)) return NextResponse.json({ error: "Invalid input bucket" }, { status: 400 });
  if (!validateStoragePathOwnership(job.user_id, job.input_file_path)) return NextResponse.json({ error: "Invalid storage path" }, { status: 403 });

  const signed = await supabase.storage.from(job.input_bucket).createSignedUrl(job.input_file_path, 60 * 10);
  if (signed.error || !signed.data?.signedUrl) return NextResponse.json({ error: signed.error?.message ?? "Could not sign original file" }, { status: 500 });
  return NextResponse.json({ signedUrl: signed.data.signedUrl, expiresIn: 600 });
}
