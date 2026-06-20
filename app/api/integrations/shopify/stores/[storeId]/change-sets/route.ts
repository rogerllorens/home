import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUserContext } from "@/lib/auth";
import { enforceRateLimit } from "@/lib/rate-limit";
import { createServiceClient } from "@/lib/supabase/admin";
import { createShopifyChangeSet } from "@/lib/shopify";

const schema = z.object({ jobId: z.string().uuid().optional(), proposalIds: z.array(z.string().uuid()).optional(), includeFields: z.array(z.string()).default(["seo.title", "seo.description", "descriptionHtml"]), excludeFields: z.array(z.string()).optional(), title: z.string().max(120).optional() });

export async function POST(request: Request, { params }: { params: Promise<{ storeId: string }> }) {
  const context = await getCurrentUserContext();
  if (!context.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const limited = await enforceRateLimit(request, "shopify:change-set", context.user.id, 10, 60);
  if (limited) return limited;
  const body = schema.parse(await request.json().catch(() => ({})));
  const { storeId } = await params;
  try {
    const result = await createShopifyChangeSet(createServiceClient(), { userId: context.user.id, storeId, ...body });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "change_set_failed" }, { status: 400 });
  }
}
