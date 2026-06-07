import { NextResponse } from "next/server";
import { getCurrentUserContext } from "@/lib/auth";
import { createCustomerPortalSession, sessionUrl } from "@/lib/stripe/checkout";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const { user } = await getCurrentUserContext();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const session = await createCustomerPortalSession(user);
    return NextResponse.json({ url: sessionUrl(session) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Stripe Portal failed" }, { status: 500 });
  }
}
