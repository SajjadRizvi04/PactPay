import {z} from 'zod'

export const fundEscrowSchema = z.object({
    contractId: z.string().uuid(),
    amount: z.number().positive()
})

export const releasePaymentSchema = z.object({
    contractId: z.string().uuid(),
    milestoneId: z.string().uuid()
})

export const refundSchema = z.object({
    contractId: z.string().uuid(),
    milestoneId: z.string().uuid()
})

export const webhookSchema = z.object({
    event: z.string(),
    payload: z.object({
        payment: z.object({
            entity: z.object({
                id: z.string(),
                amount: z.number(),
                status: z.string(),
                order_id: z.string()
            })
        })
    })
})