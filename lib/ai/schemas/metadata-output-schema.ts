import { z } from "zod";

export const metadataAIOutputSchema = z.object({
  keyword_principal: z.string().min(2).max(120),
  keywords_secundarias: z.array(z.string().min(1).max(80)).min(1).max(12),
  meta_title: z.string().min(20).max(70),
  meta_description: z.string().min(80).max(180),
  slug: z.string().min(2).max(120),
  image_alt_texts: z.array(z.string().min(2).max(160)).max(8),
  quality_warnings: z.array(z.string().min(2).max(220)).max(12),
});

export type MetadataAIOutput = z.infer<typeof metadataAIOutputSchema>;
