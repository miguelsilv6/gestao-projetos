import { z } from 'zod'
import { NUIPC_REGEX } from '@/lib/constants'

export const inqueritoSchema = z.object({
  nuipc: z
    .string()
    .min(1, 'NUIPC obrigatório')
    .regex(NUIPC_REGEX, 'Formato inválido. Ex: 2024/000001/YUSTR'),
  natureza: z.string().min(1, 'Natureza obrigatória').max(200),
  estado: z.enum(['ABERTO', 'EM_INVESTIGACAO', 'SUSPENSO', 'CONCLUIDO', 'ARQUIVADO']),
  faseProcessual: z.enum(['INQUERITO', 'INSTRUCAO', 'JULGAMENTO', 'RECURSO', 'TRANSITO_EM_JULGADO']),
  dataAbertura: z.string().min(1, 'Data de abertura obrigatória'),
  dataPrazo: z.string().optional().nullable(),
  dataConclusao: z.string().optional().nullable(),
  notas: z.string().optional().nullable(),
  brigadaId: z.string().min(1, 'Brigada obrigatória'),
  inspetorId: z.string().optional().nullable(),
})

export type InqueritoFormData = z.infer<typeof inqueritoSchema>

export const bulkActionSchema = z.object({
  ids: z.array(z.string()).min(1),
  action: z.enum(['assign', 'changeState', 'changeFase', 'transfer']),
  inspetorId: z.string().optional(),
  estado: z.enum(['ABERTO', 'EM_INVESTIGACAO', 'SUSPENSO', 'CONCLUIDO', 'ARQUIVADO']).optional(),
  faseProcessual: z.enum(['INQUERITO', 'INSTRUCAO', 'JULGAMENTO', 'RECURSO', 'TRANSITO_EM_JULGADO']).optional(),
  brigadaId: z.string().optional(),
})
