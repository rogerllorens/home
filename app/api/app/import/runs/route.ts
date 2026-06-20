import { NextResponse } from "next/server";
import { getCurrentUserContext } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/admin";
import { enforceRateLimit } from "@/lib/rate-limit";
export const dynamic = "force-dynamic";
export async function GET(request: Request) { const context = await getCurrentUserContext(); if (!context.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); const limited = await enforceRateLimit(request, "import:runs", context.user.id, 60, 60); if (limited) return limited; if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return NextResponse.json({ runs: [], skipped: true }); const { data, error } = await createServiceClient().from("import_runs").select("*").eq("user_id", context.user.id).order("created_at", { ascending: false }).limit(50); if (error) return NextResponse.json({ error: error.message }, { status: 500 }); return NextResponse.json({ runs: data ?? [] }); }
