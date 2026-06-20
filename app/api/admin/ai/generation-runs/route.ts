import { NextResponse } from "next/server";
import { getCurrentUserRole, isAdminRole } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/admin";
export async function GET() { if (!isAdminRole(await getCurrentUserRole())) return NextResponse.json({ error: "Forbidden" }, { status: 403 }); if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return NextResponse.json({ runs: [], skipped: true }); const runs = (await createServiceClient().from("ai_generation_runs").select("id,task_type,provider,model,estimated_cost,currency,status,fallback_used,quality_score,created_at").order("created_at", { ascending: false }).limit(100)).data ?? []; return NextResponse.json({ runs }); }
