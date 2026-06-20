async function main() {
  const missing = ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"].filter((key) => !process.env[key]);
  if (missing.length) { console.log(`SKIP: missing Stripe env: ${missing.join(", ")}`); return; }
  console.log("READY: Stripe env present. Use Stripe CLI fixture to validate checkout and duplicate webhook idempotency.");
}
main().catch((error) => { console.error(error); process.exit(1); });

export {};
