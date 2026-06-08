import { NextResponse } from "next/server";
import { getCurrentUserContext } from "@/lib/auth";
import { createCustomerPortalSession, sessionUrl } from "@/lib/stripe/checkout";
import { enforceRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { user } = await getCurrentUserContext();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const limited = await enforceRateLimit(request, "stripe:portal", user.id, 10, 60);
    if (limited) return limited;
    const session = await createCustomerPortalSession(user);
    return NextResponse.json({ url: sessionUrl(session) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Stripe Portal failed" }, { status: 500 });
  }
}
