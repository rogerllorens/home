import { NextResponse } from "next/server";
import { getCurrentUserContext, isAdminRole } from "@/lib/auth";
import { enforceRateLimit } from "@/lib/rate-limit";
import { defaultPromptKinds } from "@/lib/ai-template-studio/defaults";
import { listPromptTemplates } from "@/lib/ai-template-studio/repository";

export const dynamic = "force-dynamic";
export async function GET(request: Request) { const context = await getCurrentUserContext(); if (!context.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); if (!isAdminRole(context.profile?.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 }); const limited = await enforceRateLimit(request, "admin:ai-templates", context.user.id, 60, 60); if (limited) return limited; if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return NextResponse.json({ templates: defaultPromptKinds, source: "defaults" }); const templates = await listPromptTemplates(); return NextResponse.json({ templates, source: "db" }); }
