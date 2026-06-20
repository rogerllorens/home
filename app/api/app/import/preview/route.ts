import { NextResponse } from "next/server";
import { getCurrentUserContext } from "@/lib/auth";
import { enforceRateLimit } from "@/lib/rate-limit";
import { parseImportPreview } from "@/lib/import";
export const dynamic = "force-dynamic";
export async function POST(request: Request) { const context = await getCurrentUserContext(); if (!context.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); const limited = await enforceRateLimit(request, "import:preview", context.user.id, 30, 300); if (limited) return limited; try { const form = await request.formData(); const file = form.get("file"); if (!(file instanceof File)) return NextResponse.json({ error: "file_required" }, { status: 400 }); const catalog = await parseImportPreview({ buffer: await file.arrayBuffer(), fileName: file.name, mime: file.type, sheetId: String(form.get("sheetId") ?? "") || undefined }); return NextResponse.json(catalog); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "import_preview_failed" }, { status: 400 }); } }
