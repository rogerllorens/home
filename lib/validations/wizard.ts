import { z } from 'zod'
export const wizardSchema = z.object({
  display_name:z.string().min(2), username:z.string().min(3).regex(/^[a-z0-9_]+$/), city:z.string().min(2), country:z.string().min(2), intention:z.string().min(2), emotional_status:z.string().min(2),
  headline:z.string().min(5), applying_for:z.string().min(5), about_me:z.string().min(20), fun_fact:z.string().optional(), ideal_date:z.string().optional(),
  affective_skills:z.array(z.string()).min(1), green_flags:z.array(z.string()).min(1), soft_red_flags:z.array(z.string()).min(1), love_languages:z.array(z.string()).min(1),
  template:z.string().default('classic'), is_public:z.boolean().default(false)
})
export type WizardInput = z.infer<typeof wizardSchema>
