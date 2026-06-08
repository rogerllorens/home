import { NextResponse } from "next/server";
import { getCurrentUserContext } from "@/lib/auth";
import { createExtraProductsCheckoutSession, createSubscriptionCheckoutSession, sessionUrl } from "@/lib/stripe/checkout";
import { enforceRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { user } = await getCurrentUserContext();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const limited = await enforceRateLimit(request, "stripe:checkout", user.id, 10, 60);
    if (limited) return limited;
    const body = await request.json().catch(() => ({})) as { type?: "extra_products" | "subscription"; packId?: string; planId?: string };
    if (body.type === "extra_products") {
      if (!body.packId) return NextResponse.json({ error: "packId requerido" }, { status: 400 });
      const session = await createExtraProductsCheckoutSession(user, body.packId);
      return NextResponse.json({ url: sessionUrl(session), id: session.id });
    }
    if (body.type === "subscription") {
      if (!body.planId) return NextResponse.json({ error: "planId requerido" }, { status: 400 });
      const session = await createSubscriptionCheckoutSession(user, body.planId);
      return NextResponse.json({ url: sessionUrl(session), id: session.id });
    }
    return NextResponse.json({ error: "type inválido" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Stripe Checkout failed" }, { status: 500 });
  }
}
