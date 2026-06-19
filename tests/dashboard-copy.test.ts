import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("productive app navigation does not expose inactive template/search-console routes", () => {
  const routes = readFileSync("lib/routes.ts", "utf8");
  const appRoutes = routes.split("export const appRoutes = ")[1].split("export const adminRoutes")[0];
  assert.doesNotMatch(appRoutes, /templates/i);
  assert.doesNotMatch(appRoutes, /search console/i);
  assert.match(appRoutes, /Catálogo/);
  assert.match(appRoutes, /Oportunidades/);
});

test("app sidebar badges are loaded from dashboard endpoint, not AppStateProvider mock jobs", () => {
  const sidebar = readFileSync("components/app/AppSidebar.tsx", "utf8");
  assert.match(sidebar, /\/api\/app\/dashboard/);
  assert.doesNotMatch(sidebar, /state\.jobs|state\.downloads|state\.credits|Beta privada/);
});
