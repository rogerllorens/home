import { getGscConfig } from "../lib/gsc/config";

function main() {
  const config = getGscConfig();
  const missing = ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "GOOGLE_REDIRECT_URI", "GOOGLE_TOKEN_ENCRYPTION_KEY"].filter((key) => !process.env[key]);
  if (!config.enabled || missing.length || !process.env.GSC_SMOKE_CONNECTION_ID) { console.log(JSON.stringify({ skipped: true, enabled: config.enabled, missing, reason: "OAuth real requires a connected test account; set GSC_SMOKE_CONNECTION_ID after manual OAuth." })); return; }
  console.log(JSON.stringify({ skipped: true, reason: "Dry config validated; live property sync intentionally requires manual connected account flow." }));
}
main();
