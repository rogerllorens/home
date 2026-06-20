import { NextResponse } from "next/server";
import { getCurrentUserContext } from "@/lib/auth";
import { enforceRateLimit } from "@/lib/rate-limit";
import { createServiceClient } from "@/lib/supabase/admin";
import { assertGscEnabled, buildGoogleAuthUrl, createCodeChallenge, createCodeVerifier, generateOAuthStateValue } from "@/lib/gsc";
export const dynamic = "force-dynamic";
export async function GET(request: Request) { const context = await getCurrentUserContext(); if (!context.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); const limited = await enforceRateLimit(request, "gsc:connect", context.user.id, 10, 300); if (limited) return limited; try { assertGscEnabled(); const client = createServiceClient(); const state = generateOAuthStateValue(); const verifier = createCodeVerifier(); const redirectAfter = new URL(request.url).searchParams.get("redirectAfter") ?? "/app/search-console"; await client.from("gsc_oauth_states").insert({ user_id: context.user.id, state, code_verifier: verifier, redirect_after: redirectAfter }); return NextResponse.redirect(buildGoogleAuthUrl({ state, codeChallenge: createCodeChallenge(verifier) })); } catch { return NextResponse.json({ error: "gsc_not_enabled_or_configured" }, { status: 503 }); } }
