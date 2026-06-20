import type { CsvRow } from "../../csv";

export type ImageAltSource = "existing" | "ai" | "fallback" | "none";
export type ImageAltStatus = "good" | "warning" | "missing" | "generated" | "needs_review";
export type ImageDataQuality = "complete" | "partial" | "missing";

export type ExtractedImageData = {
  primaryImageUrl: string;
  galleryImageUrls: string[];
  existingAltTexts: string[];
  detectedImageColumns: string[];
  detectedAltColumns: string[];
  warnings: string[];
};

export type ImageAltContext = {
  productName?: string;
  brand?: string;
  category?: string;
  sku?: string;
  keyword?: string;
  features?: string;
};

export type ImageAltEvaluation = {
  score: number;
  status: ImageAltStatus;
  warnings: string[];
  recommendations: string[];
  humanReviewRequired: boolean;
};

export type ImageSeoEnrichment = {
  primary_image_url: string;
  gallery_image_urls: string[];
  existing_image_alt_texts: string[];
  image_alt_texts: string;
  primary_image_alt: string;
  gallery_image_alts: string[];
  image_seo_score: number;
  image_alt_status: ImageAltStatus;
  image_alt_warnings: string[];
  image_alt_recommendations: string[];
  image_data_quality: ImageDataQuality;
  image_alt_source: ImageAltSource;
  image_alt_keyword_used: string | null;
  image_alt_human_review_required: boolean;
};

export type CsvRowLike = CsvRow;
