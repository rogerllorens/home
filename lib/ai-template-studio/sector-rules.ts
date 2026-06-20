import { defaultSectorRules } from "./defaults";
import type { SectorRule } from "./types";

export function resolveSectorRule(input: { sector?: string | null; category?: string | null; productName?: string | null; rules?: SectorRule[] }): SectorRule {
  const rules = input.rules?.length ? input.rules : defaultSectorRules;
  const text = `${input.sector ?? ""} ${input.category ?? ""} ${input.productName ?? ""}`.toLowerCase();
  const byKey = (key: string) => rules.find((rule) => rule.key === key) ?? rules[0];
  if (/farmacia|parafarmacia|dermo|salud/.test(text)) return byKey("farmacia_parafarmacia_cautious");
  if (/industrial|b2b|herramienta|maquinaria/.test(text)) return byKey("industrial_b2b");
  if (/aliment|comida|bebida|gourmet/.test(text)) return byKey("alimentacion");
  if (/cosmet|belleza|crema|serum/.test(text)) return byKey("cosmetica");
  if (/moda|ropa|zapato|calzado|textil/.test(text)) return byKey("moda");
  if (/electron|ordenador|móvil|movil|cable/.test(text)) return byKey("electronica");
  if (/recambio|repuesto|compatib/.test(text)) return byKey("recambios");
  if (/infantil|niño|bebé|bebe/.test(text)) return byKey("infantil");
  return byKey(input.sector ?? "generic_ecommerce");
}
