import { ImportHistoryPanel } from "@/components/app/import/ImportHistoryPanel";
import { getCurrentUserContext } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/admin";
export const dynamic = "force-dynamic";
export default async function UploadHistoryPage() { const context = await getCurrentUserContext(); const runs = context.user && process.env.SUPABASE_SERVICE_ROLE_KEY ? (await createServiceClient().from("import_runs").select("id,source_type,original_file_name,sheet_name,status,rows_total,rows_valid,rows_invalid,mapping_confidence,job_id,created_at").eq("user_id", context.user.id).order("created_at", { ascending: false }).limit(50)).data ?? [] : []; return <div className="space-y-6"><ImportHistoryPanel runs={runs} /></div>; }
