import { NextResponse } from "next/server";
import { getCurrentUserContext } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/admin";
export const dynamic = "force-dynamic";
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) { const context = await getCurrentUserContext(); if (!context.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); const { id } = await params; if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return NextResponse.json({ run: null, skipped: true }); const { data, error } = await createServiceClient().from("import_runs").select("*").eq("id", id).eq("user_id", context.user.id).maybeSingle(); if (error) return NextResponse.json({ error: error.message }, { status: 500 }); if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 }); return NextResponse.json({ run: data }); }
