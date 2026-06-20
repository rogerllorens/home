import { z } from "zod";

export const faqSchema = z.object({ question: z.string().min(3).max(180), answer: z.string().min(10).max(800) });

export const productAIOutputSchema = z.object({
  seo_product_name: z.string().min(2).max(160),
  keyword_principal: z.string().min(2).max(120),
  keywords_secundarias: z.array(z.string().min(1).max(80)).min(1).max(12),
  keywords_long_tail: z.array(z.string().min(1).max(120)).min(1).max(12),
  entidades_relacionadas: z.array(z.string().min(1).max(80)).min(1).max(12),
  short_description: z.string().min(40).max(500),
  long_description_html: z.string().min(60).max(5000),
  bullet_points: z.array(z.string().min(4).max(180)).min(2).max(12),
  benefits: z.array(z.string().min(4).max(180)).min(1).max(10),
  technical_features: z.array(z.string().min(1).max(180)).max(15),
  use_cases: z.array(z.string().min(1).max(180)).max(10),
  meta_title: z.string().min(20).max(70),
  meta_description: z.string().min(80).max(180),
  slug: z.string().min(2).max(120),
  faqs: z.array(faqSchema).min(2).max(8),
  schema_product_json: z.record(z.string(), z.unknown()),
  image_alt_texts: z.array(z.string().min(2).max(160)).max(10),
  primary_image_alt: z.string().min(2).max(160).optional(),
  gallery_image_alts: z.array(z.string().min(2).max(160)).max(10).optional(),
  image_alt_keyword_used: z.string().max(120).nullable().optional(),
  image_alt_warnings: z.array(z.string().min(2).max(220)).max(12).optional(),
  image_alt_human_review_required: z.boolean().optional(),
  internal_link_suggestions: z.array(z.string().min(1).max(160)).max(8),
  cta: z.string().min(2).max(120),
  seo_score: z.number().int().min(0).max(100),
  conversion_score: z.number().int().min(0).max(100),
  quality_warnings: z.array(z.string().min(2).max(220)).max(12),
  data_needed: z.array(z.string().min(2).max(220)).max(12),
  forbidden_claims_avoided: z.array(z.string().min(2).max(220)).max(12),
});

export type ProductAIOutput = z.infer<typeof productAIOutputSchema>;
