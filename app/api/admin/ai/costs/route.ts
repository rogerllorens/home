import { NextResponse } from "next/server";
import { getCurrentUserRole, isAdminRole } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/admin";
import { buildCostDashboard } from "@/lib/ai-template-studio/cost-dashboard";
export async function GET() { if (!isAdminRole(await getCurrentUserRole())) return NextResponse.json({ error: "Forbidden" }, { status: 403 }); const runs = process.env.SUPABASE_SERVICE_ROLE_KEY ? (await createServiceClient().from("ai_generation_runs").select("estimated_cost,task_type,model,prompt_version_id,fallback_used,quality_score,created_at").limit(1000)).data ?? [] : []; return NextResponse.json(buildCostDashboard(runs)); }
