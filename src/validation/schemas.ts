import { z } from 'zod';

export const qrUrlSchema = z.string().url().max(2048);

export const productCodeSchema = z.string().regex(/^\d{8,14}$/);
