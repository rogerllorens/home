import { z } from "zod";
import { faqSchema } from "./product-output-schema";

export const categoryAIOutputSchema = z.object({
  category_h1: z.string().min(2).max(160),
  keyword_principal: z.string().min(2).max(120),
  keywords_secundarias: z.array(z.string()).min(1).max(12),
  keywords_long_tail: z.array(z.string()).min(1).max(12),
  entidades_relacionadas: z.array(z.string()).min(1).max(12),
  top_text_html: z.string().min(60).max(4000),
  bottom_text_html: z.string().min(60).max(5000),
  meta_title: z.string().min(20).max(70),
  meta_description: z.string().min(80).max(180),
  slug: z.string().min(2).max(120),
  faqs: z.array(faqSchema).min(2).max(8),
  subcategory_suggestions: z.array(z.string()).max(12),
  internal_link_suggestions: z.array(z.string()).max(8),
  schema_collection_page_json: z.record(z.string(), z.unknown()),
  cta: z.string().min(2).max(120),
  seo_score: z.number().int().min(0).max(100),
  conversion_score: z.number().int().min(0).max(100),
  quality_warnings: z.array(z.string()).max(12),
  data_needed: z.array(z.string()).max(12),
  forbidden_claims_avoided: z.array(z.string()).max(12),
});

export type CategoryAIOutput = z.infer<typeof categoryAIOutputSchema>;
