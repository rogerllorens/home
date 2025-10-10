import { z } from 'zod';

export const usernameSchema = z
  .string()
  .min(3, 'Debe tener al menos 3 caracteres')
  .max(20, 'Debe tener máximo 20 caracteres')
  .regex(/^[a-z0-9_]+$/i, 'Solo letras, números y guiones bajos');

export const passwordSchema = z.string().min(8, 'Debe tener mínimo 8 caracteres');

export const loginSchema = z.object({
  usernameOrEmail: z.string().min(1, 'Campo requerido'),
  password: passwordSchema,
  totp: z
    .string()
    .regex(/^\d{6}$/u, 'Introduce el código de 6 dígitos')
    .optional()
    .or(z.literal('').transform(() => undefined))
});

export const countryCodeSchema = z
  .string({ required_error: 'Selecciona un país' })
  .min(2, 'Selecciona un país')
  .max(2, 'Selecciona un país')
  .transform((value) => value.toUpperCase());

export const registerSchema = z.object({
  username: usernameSchema,
  email: z.string().email('Correo no válido').optional().or(z.literal('').transform(() => undefined)),
  password: passwordSchema,
  ageConfirmed: z
    .boolean()
    .refine((value) => value, { message: 'Debes confirmar que eres mayor de edad' }),
  countryCode: countryCodeSchema,
  languageTags: z.array(z.string()).max(6).optional()
});

export const upgradeSchema = z.object({
  sessionId: z.string().min(10),
  username: usernameSchema,
  email: z.string().email('Correo no válido').optional().or(z.literal('').transform(() => undefined)),
  password: passwordSchema,
  countryCode: countryCodeSchema,
  languageTags: z.array(z.string()).max(6).optional()
});

export const matchConsentSchema = z.array(z.string()).max(6);

const optionalNumberFromInput = (min: number, max: number, messagePrefix: string) =>
  z.preprocess(
    (value) => {
      if (value === '' || value === null || typeof value === 'undefined') {
        return undefined;
      }
      if (typeof value === 'number') {
        return Number.isNaN(value) ? undefined : value;
      }
      const parsed = Number(value);
      return Number.isNaN(parsed) ? undefined : parsed;
    },
    z
      .number({ invalid_type_error: `${messagePrefix} debe ser numérico` })
      .int()
      .min(min, `${messagePrefix} mínimo ${min} TKN`)
      .max(max, `${messagePrefix} máximo ${max} TKN`)
      .optional()
  );

export const createGroupSchema = z.object({
  title: z.string().min(1).max(40).optional(),
  vipPrice: optionalNumberFromInput(100, 1000, 'El precio VIP')
});

export const ppvPriceSchema = z
  .number({ invalid_type_error: 'El precio debe ser numérico' })
  .int()
  .min(199)
  .max(1999);

export const passPriceSchema = z
  .number({ invalid_type_error: 'El precio debe ser numérico' })
  .int()
  .min(499)
  .max(2999);

export const vipTicketSchema = z
  .number({ invalid_type_error: 'El precio debe ser numérico' })
  .int()
  .min(100)
  .max(1000);

export const payPerMinuteSchema = z
  .number({ invalid_type_error: 'El precio debe ser numérico' })
  .int()
  .min(50)
  .max(500);

export const createPostSchema = z.object({
  text: z.string().max(1000).optional(),
  mediaIds: z.array(z.string()).max(5),
  visibility: z.enum(['free', 'ppv', 'pass_only']),
  priceTokens: z.number().optional()
});

export const adminTokenPackSchema = z.object({
  id: z.string().min(2, 'ID requerido'),
  name: z.string().min(2, 'Nombre requerido'),
  amount: z.number().int().min(100, 'Debe ser al menos 100 TKN'),
  price: z.number().min(0.5, 'Precio mínimo 0,5 €')
});

export const adminGiftSchema = z.object({
  id: z.string().min(2, 'ID requerido'),
  name: z.string().min(2, 'Nombre requerido'),
  tokens: z.number().int().min(1, 'Debe ser al menos 1 TKN'),
  animKey: z.string().min(2, 'Animación requerida'),
  isActive: z.boolean()
});

export const payoutDecisionSchema = z.object({
  reference: z.string().min(2, 'Referencia requerida'),
  note: z.string().max(280).optional()
});
