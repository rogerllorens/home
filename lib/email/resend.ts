export type ResendEmailPayload = { to: string; subject: string; html: string; text: string; replyTo?: string | null };
export type ResendEmailResult = { sent: boolean; skipped?: boolean; error?: string };

export function emailReportsEnabled() { return process.env.EMAIL_REPORTS_ENABLED === "true"; }

export async function sendResendEmail(payload: ResendEmailPayload): Promise<ResendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!emailReportsEnabled() || !apiKey || !from) return { sent: false, skipped: true };
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: payload.to, subject: payload.subject, html: payload.html, text: payload.text, reply_to: payload.replyTo ?? process.env.EMAIL_REPLY_TO ?? process.env.SUPPORT_EMAIL }),
      signal: AbortSignal.timeout(10_000)
    });
    if (!response.ok) return { sent: false, error: `Resend ${response.status}` };
    return { sent: true };
  } catch (error) {
    return { sent: false, error: error instanceof Error ? error.message : "resend_failed" };
  }
}
