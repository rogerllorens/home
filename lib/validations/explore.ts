import { z } from 'zod'
export const exploreFilterSchema=z.object({q:z.string().optional(),city:z.string().optional(),country:z.string().optional(),intention:z.string().optional(),emotional_status:z.string().optional(),sort:z.enum(['recent','most_viewed','featured','recommended']).default('recommended')})
