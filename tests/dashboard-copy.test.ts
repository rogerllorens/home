import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("productive app navigation exposes real app sections without inactive templates", () => {
  const routes = readFileSync("lib/routes.ts", "utf8");
  const appRoutes = routes.split("export const appRoutes = ")[1].split("export const adminRoutes")[0];
  assert.doesNotMatch(appRoutes, /templates/i);
  assert.match(appRoutes, /Search Console/);
  assert.match(appRoutes, /Catálogo/);
  assert.match(appRoutes, /Oportunidades/);
});

test("app sidebar badges are loaded from dashboard endpoint, not AppStateProvider mock jobs", () => {
  const sidebar = readFileSync("components/app/AppSidebar.tsx", "utf8");
  assert.match(sidebar, /\/api\/app\/dashboard/);
  assert.doesNotMatch(sidebar, /state\.jobs|state\.downloads|state\.credits|Beta privada/);
});
