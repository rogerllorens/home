import { sendResendEmail } from "../lib/email/resend";

async function main() {
  const to = process.env.SMOKE_TEST_EMAIL_TO;
  if (!process.env.EMAIL_REPORTS_ENABLED || process.env.EMAIL_REPORTS_ENABLED !== "true" || !process.env.RESEND_API_KEY || !process.env.EMAIL_FROM || !to) { console.log(JSON.stringify({ skipped: true, reason: "Missing EMAIL_REPORTS_ENABLED=true, RESEND_API_KEY, EMAIL_FROM or SMOKE_TEST_EMAIL_TO" })); return; }
  const result = await sendResendEmail({ to, subject: "Rankelia smoke Resend", html: "<p>Smoke test Rankelia email reports.</p>", text: "Smoke test Rankelia email reports." });
  console.log(JSON.stringify(result));
  if (!result.sent) process.exit(1);
}
main().catch((error) => { console.error(error); process.exit(1); });
