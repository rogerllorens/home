async function main() {
  const missing = ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"].filter((key) => !process.env[key]);
  if (missing.length) { console.log(`SKIP: missing Supabase storage env: ${missing.join(", ")}`); return; }
  console.log("READY: Supabase storage env present. Manual smoke should verify private bucket upload, signed URL ownership and cleanup.");
}
main().catch((error) => { console.error(error); process.exit(1); });

export {};
