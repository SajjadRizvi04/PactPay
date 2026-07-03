import {z} from 'zod'

export const createContractSchema = z.object({
    title: z.string().min(3),
    description: z.string().min(10),
    totalAmount: z.number().positive(),
    freelancerId: z.string().uuid(),
    milestones: z.array(z.object({
        title: z.string().min(3),
        description: z.string().min(10),
        amount: z.number().positive(),
        dueDate: z.string().datetime()
    })).min(1)
})

export const updateContractStatusSchema = z.object({
    status: z.enum(['ACTIVE', 'CANCELLED'])
})