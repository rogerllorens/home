async function main() {
  const missing = ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"].filter((key) => !process.env[key]);
  if (missing.length) { console.log(`SKIP: missing worker env: ${missing.join(", ")}`); return; }
  console.log("READY: worker env present. Run worker:once against a fixture queued job in staging.");
}
main().catch((error) => { console.error(error); process.exit(1); });

export {};
