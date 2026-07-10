import {z} from 'zod'

export const createDisputeSchema = z.object({
    contractId: z.string().uuid(),
    milestoneId: z.string().uuid().optional(),
    reason: z.enum([
        'WORK_INCOMPLETE',
        'WORK_NOT_AS_DESCRIBED',
        'PAYMENT_DELAYED',
        'GHOST_DETECTED',
        'OTHER'
    ]),
    description: z.string().min(10)
})

export const resolveDisputeSchema = z.object({
    resolution: z.enum(['RESOLVED_CLIENT', 'RESOLVED_FREELANCER']),
    notes: z.string().min(10)
})