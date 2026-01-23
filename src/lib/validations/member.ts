import { z } from 'zod'

export const memberSchema = z.object({
  fullName: z.string()
    .min(3, 'Nome deve ter pelo menos 3 caracteres')
    .max(100, 'Nome muito longo'),

  phone: z.string()
    .regex(/^\(\d{2}\) \d{4,5}-\d{4}$/, 'Formato: (12) 99999-9999')
    .optional()
    .or(z.literal('')),

  email: z.string()
    .email('Email inválido')
    .optional()
    .or(z.literal('')),

  memberStage: z.enum([
    'VISITOR',
    'REGULAR_VISITOR',
    'MEMBER',
    'GUARDIAN_ANGEL',
    'TRAINING_LEADER',
    'LEADER',
    'PASTOR'
  ], {
    required_error: 'Selecione um estágio',
    invalid_type_error: 'Estágio inválido'
  }),

  birthday: z.string()
    .optional()
    .or(z.literal(''))
})

export type MemberFormData = z.infer<typeof memberSchema>
