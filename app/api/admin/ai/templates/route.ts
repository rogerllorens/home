import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUserContext, isAdminRole } from "@/lib/auth";
import { enforceRateLimit } from "@/lib/rate-limit";
import { defaultPromptKinds } from "@/lib/ai-template-studio/defaults";
import { createPromptTemplate, listPromptTemplates } from "@/lib/ai-template-studio/repository";

export const dynamic = "force-dynamic";
const schema = z.object({ key: z.string().min(3), name: z.string().min(2), description: z.string().optional(), type: z.string().min(2) });
export async function GET(request: Request) { const context = await getCurrentUserContext(); if (!context.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); if (!isAdminRole(context.profile?.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 }); const limited = await enforceRateLimit(request, "admin:ai-templates", context.user.id, 60, 60); if (limited) return limited; if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return NextResponse.json({ templates: defaultPromptKinds, source: "defaults" }); const templates = await listPromptTemplates(); return NextResponse.json({ templates, source: "db" }); }
export async function POST(request: Request) { const context = await getCurrentUserContext(); if (!context.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); if (!isAdminRole(context.profile?.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 }); const limited = await enforceRateLimit(request, "admin:ai-templates:write", context.user.id, 20, 60); if (limited) return limited; const parsed = schema.safeParse(await request.json().catch(() => ({}))); if (!parsed.success) return NextResponse.json({ error: "invalid_payload" }, { status: 400 }); const template = await createPromptTemplate({ ...parsed.data, status: "draft" } as Parameters<typeof createPromptTemplate>[0]); return NextResponse.json({ template }); }
