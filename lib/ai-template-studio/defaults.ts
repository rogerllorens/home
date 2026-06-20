import type { ModelConfig, PromptTemplateType, SectorRule } from "./types";

export const AI_TEMPLATE_STUDIO_ENABLED = process.env.AI_TEMPLATE_STUDIO_ENABLED === "true";
export const DEFAULT_PROMPT_VERSION_LABEL = "code-fallback-v1";

export const promptSafetyRules = [
  "No inventes claims, certificaciones, materiales, compatibilidades, stock, precios, descuentos, opiniones ni reviews.",
  "No prometas rankings, tráfico, curas, beneficios médicos, cumplimiento legal ni resultados no soportados por datos.",
  "Si faltan datos, añade warnings y baja confidence_score; no rellenes con ficción.",
  "Escribe SEO natural, ecommerce-ready y GEO/AEO friendly sin keyword stuffing.",
  "Devuelve JSON estricto conforme al schema solicitado."
];

export const defaultSectorRules: SectorRule[] = [
  { key: "generic_ecommerce", name: "Ecommerce genérico", sector: "generic_ecommerce", tone: "claro, útil y comercial", forbidden_claims: ["rankings garantizados", "tráfico garantizado"], required_fields: ["product_name"], writing_guidelines: { style: "beneficios solo si están soportados por datos" } },
  { key: "industrial_b2b", name: "Industrial / B2B", sector: "industrial_b2b", tone: "técnico y preciso", forbidden_claims: ["certificaciones no aportadas", "compatibilidades no verificadas"], required_fields: ["sku", "description"], writing_guidelines: { style: "prioriza referencia, material y compatibilidad solo si existen" } },
  { key: "moda", name: "Moda", sector: "moda", tone: "aspiracional prudente", forbidden_claims: ["materiales no indicados", "sostenible si no está en datos"], required_fields: ["product_name", "category"], writing_guidelines: { style: "talla, tejido y ocasión solo con datos" } },
  { key: "electronica", name: "Electrónica", sector: "electronica", tone: "claro y técnico", forbidden_claims: ["garantía no indicada", "compatibilidad no verificada"], required_fields: ["sku"], writing_guidelines: { style: "no inventar especificaciones" } },
  { key: "alimentacion", name: "Alimentación", sector: "alimentacion", tone: "descriptivo y prudente", forbidden_claims: ["sin gluten", "vegano", "bio", "eco", "origen"], required_fields: ["product_name"], compliance_notes: { warning: "no inventar nutrición, alérgenos ni origen" } },
  { key: "cosmetica", name: "Cosmética", sector: "cosmetica", tone: "sensorial y prudente", forbidden_claims: ["resultados clínicos", "cura", "dermatológicamente probado"], compliance_notes: { warning: "claims cosméticos solo si están soportados" } },
  { key: "hogar", name: "Hogar", sector: "hogar", tone: "inspirador y práctico", forbidden_claims: ["material no indicado"], writing_guidelines: { style: "uso y estancia solo si encaja" } },
  { key: "deporte", name: "Deporte", sector: "deporte", tone: "activo y claro", forbidden_claims: ["mejora rendimiento garantizada"], writing_guidelines: { style: "nivel y uso solo si existen" } },
  { key: "recambios", name: "Recambios", sector: "recambios", tone: "técnico y exacto", forbidden_claims: ["compatibilidad no verificada"], required_fields: ["sku"], compliance_notes: { warning: "compatibilidades requieren datos explícitos" } },
  { key: "lujo", name: "Lujo", sector: "lujo", tone: "premium sin exageración", forbidden_claims: ["autenticidad no verificada", "edición limitada no indicada"] },
  { key: "infantil", name: "Infantil", sector: "infantil", tone: "claro y responsable", forbidden_claims: ["seguridad certificada no indicada", "edad recomendada inventada"] },
  { key: "farmacia_parafarmacia_cautious", name: "Farmacia/parafarmacia cautelosa", sector: "farmacia_parafarmacia_cautious", tone: "prudente y revisable", forbidden_claims: ["cura", "previene enfermedades", "beneficio clínico no soportado"], compliance_notes: { warning: "requiere revisión humana; evitar claims médicos" } }
];

export const defaultModelConfigs: ModelConfig[] = [
  { provider: "openai", model: process.env.AI_DEFAULT_MODEL || process.env.AI_MODEL_STANDARD || "gpt-4o-mini", display_name: "OpenAI default", status: process.env.OPENAI_API_KEY || process.env.AI_OPENAI_API_KEY ? "active" : "paused", supports_json: true, input_cost_per_1m: 0.15, output_cost_per_1m: 0.6, quality_tier: "standard" },
  { provider: "openai_compatible", model: process.env.AI_DEFAULT_MODEL || "openai-compatible-model", display_name: "OpenAI compatible", status: process.env.AI_OPENAI_BASE_URL && process.env.AI_OPENAI_API_KEY ? "active" : "paused", supports_json: true, input_cost_per_1m: null, output_cost_per_1m: null, quality_tier: "standard" },
  { provider: "qwen", model: process.env.AI_QWEN_MODEL || "qwen-plus", display_name: "Qwen compatible", status: process.env.QWEN_API_KEY || process.env.AI_QWEN_API_KEY ? "active" : "paused", supports_json: true, input_cost_per_1m: null, output_cost_per_1m: null, quality_tier: "standard" },
  { provider: "deepseek", model: process.env.AI_DEEPSEEK_MODEL || "deepseek-chat", display_name: "DeepSeek compatible", status: process.env.DEEPSEEK_API_KEY || process.env.AI_DEEPSEEK_API_KEY ? "active" : "paused", supports_json: true, input_cost_per_1m: null, output_cost_per_1m: null, quality_tier: "cheap" },
  { provider: "anthropic", model: "claude-3-5-sonnet", display_name: "Claude prepared", status: "paused", supports_json: false, input_cost_per_1m: null, output_cost_per_1m: null, quality_tier: "premium" },
  { provider: "gemini", model: "gemini-1.5-pro", display_name: "Gemini prepared", status: "paused", supports_json: true, input_cost_per_1m: null, output_cost_per_1m: null, quality_tier: "experimental" },
  { provider: "template_fallback", model: "rankelia-template", display_name: "Template fallback", status: "active", supports_json: true, input_cost_per_1m: 0, output_cost_per_1m: 0, quality_tier: "cheap" }
];

export const defaultPromptKinds: Array<{ key: string; name: string; type: PromptTemplateType }> = [
  { key: "product.seo.v1", name: "Producto SEO", type: "product" }, { key: "category.seo.v1", name: "Categoría SEO", type: "category" }, { key: "metadata.v1", name: "Metadatos", type: "metadata" }, { key: "alt_text.v1", name: "ALT text", type: "alt_text" }, { key: "schema.v1", name: "Schema suggestions", type: "schema" }, { key: "faq.v1", name: "FAQ ecommerce", type: "faq" }, { key: "article.editorial.v1", name: "Artículo editorial", type: "article" }, { key: "repair_json.v1", name: "Repair JSON", type: "repair_json" }, { key: "product_regeneration.v1", name: "Regeneración producto", type: "product_regeneration" }, { key: "field_regeneration.v1", name: "Regeneración campo", type: "field_regeneration" }, { key: "free_audit_summary.v1", name: "Resumen auditoría", type: "free_audit_summary" }, { key: "gsc_opportunity_summary.v1", name: "Resumen oportunidad GSC", type: "gsc_opportunity" }, { key: "import_mapping_assistant.v1", name: "Asistente mapping import", type: "import_mapping_assistant" }
];

export function buildDefaultSystemPrompt(type: PromptTemplateType) { return [`Eres Rankelia.ai, especialista en SEO ecommerce para ${type}.`, ...promptSafetyRules].join("\n"); }
export function buildDefaultUserPromptTemplate() { return "Datos delimitados del producto/categoría:\n```json\n{{input_json}}\n```\nSector: {{sector}}\nIdioma: {{language}}\nInstrucciones manuales: {{manual_instructions}}\nDevuelve JSON estricto con warnings, unsupported_claims y confidence_score."; }
