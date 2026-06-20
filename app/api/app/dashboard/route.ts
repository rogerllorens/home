import { NextResponse } from "next/server";
import { getCurrentUserContext } from "@/lib/auth";
import { enforceRateLimit } from "@/lib/rate-limit";
import { createServiceClient } from "@/lib/supabase/admin";
import { getDashboardOverview } from "@/lib/dashboard";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const context = await getCurrentUserContext();
  if (!context.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const limited = await enforceRateLimit(request, "dashboard:overview", context.user.id, 120, 60); if (limited) return limited;
  try { return NextResponse.json(await getDashboardOverview(createServiceClient(), { id: context.user.id, email: context.user.email })); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "dashboard_failed" }, { status: 500 }); }
}
