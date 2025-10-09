"use client";

import { DefaultSeo } from "next-seo";
import seoConfig from "@/next-seo.config";

export function SeoProvider() {
  return <DefaultSeo {...seoConfig} />;
}
