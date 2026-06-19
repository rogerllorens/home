export type Platform = "Shopify" | "Prestashop" | "WooCommerce" | "CSV genérico";
export type JobStatus = "Procesando" | "Listo" | "En cola" | "Error";
export type BadgeVariant = "default" | "success" | "warning" | "danger" | "info" | "ai";
export type CardVariant = "default" | "elevated" | "dark" | "gradient";

export interface DemoUser {
  name: string;
  email: string;
  company: string;
  plan: string;
  credits: number;
}

export interface Job {
  id: string;
  name: string;
  platform: Platform;
  rows: number;
  status: JobStatus;
  progress: number;
  score: number;
  createdAt: string;
}

export interface Download {
  id: string;
  fileName: string;
  platform: Platform;
  rows: number;
  size: string;
  readyAt: string;
}

export interface Template {
  id: string;
  name: string;
  platform: Platform;
  sector: string;
  outputs: string[];
  status: "Activa" | "Borrador";
}

export interface PricingPack {
  name: string;
  credits: number;
  price: string;
  description: string;
  featured?: boolean;
}
