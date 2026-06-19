type EmailPayload = { to?: string | null; subject: string; text: string };
type EmailResult = { sent: boolean; skipped?: boolean; error?: string };

function supportEmail() {
  return process.env.SUPPORT_EMAIL || "soporte@rankelia.ai";
}

export async function sendEmail({ to, subject, text }: EmailPayload): Promise<EmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!to || !apiKey || !from) {
    console.info(`[email:noop] ${subject} -> ${to ?? "missing-recipient"}. Configure RESEND_API_KEY and EMAIL_FROM for real delivery.`);
    return { sent: false, skipped: true };
  }
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to, subject, text, reply_to: supportEmail() }),
    });
    if (!response.ok) return { sent: false, error: `Resend ${response.status}` };
    return { sent: true };
  } catch (error) {
    return { sent: false, error: error instanceof Error ? error.message : "Email failed" };
  }
}

export async function sendJobCompletedEmail(user: { email?: string | null }, job: { id: string }, downloads: unknown[]) {
  return sendEmail({
    to: user.email,
    subject: "Tu lote SEO de Rankelia está listo",
    text: `El job ${job.id} ha terminado y tiene ${downloads.length} descargas disponibles. Revisa siempre los contenidos antes de importarlos: Rankelia no publica automáticamente.`,
  });
}

export async function sendJobFailedEmail(user: { email?: string | null }, job: { id: string }, error: string) {
  return sendEmail({
    to: user.email,
    subject: "Tu lote SEO necesita revisión",
    text: `El job ${job.id} no ha podido completarse. Motivo: ${error}. Si se reservaron productos, el worker intentará liberarlos automáticamente.`,
  });
}

export async function sendPaymentStatusEmail(user: { email?: string | null }, status: "success" | "failed", description: string) {
  return sendEmail({
    to: user.email,
    subject: status === "success" ? "Pago confirmado en Rankelia" : "No hemos podido confirmar tu pago",
    text: description,
  });
}
