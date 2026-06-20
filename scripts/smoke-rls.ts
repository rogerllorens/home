const required = ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "RLS_SMOKE_USER_A_ID", "RLS_SMOKE_USER_B_ID"];
async function main() {
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length) { console.log(`SKIP: missing RLS smoke env: ${missing.join(", ")}`); return; }
  console.log("READY: RLS smoke env present. Run staging checklist for user A/B isolation across jobs, downloads, catalog, proposals, GSC, Shopify, imports, AI runs, change sets and apply/rollback runs.");
}
main().catch((error) => { console.error(error); process.exit(1); });
export {};
