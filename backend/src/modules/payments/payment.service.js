import Razorpay from 'razorpay'
import crypto from 'crypto'
import config from '../../config/index.js'
import prisma from '../../db/client.js'
import { getEscrowBalance } from './ledger.service.js'
import { transitionMilestone } from '../contracts/contract.statemachine.js'

const razorpay = new Razorpay({
    key_id: config.RAZORPAY_KEY_ID,
    key_secret: config.RAZORPAY_KEY_SECRET
})

class NotFundableError extends Error {}

const refundAndRecord = async ({ payment, contractId, reason }) => {
    // The unique row is the lock: only one concurrent caller gets past this.
    try {
        await prisma.paymentAttempt.create({
            data: {
                razorpayPaymentId: payment.id,
                razorpayOrderId: payment.order_id,
                contractId,
                amount: payment.amount,
                status: 'REFUND_PENDING',
                reason
            }
        })
    } catch (e) {
        if (e.code === 'P2002') return // someone else is already handling it
        throw e
    }

    try {
        await razorpay.payments.refund(payment.id, {
            amount: payment.amount,
            notes: { reason, contractId }
        })
        await prisma.paymentAttempt.update({
            where: { razorpayPaymentId: payment.id },
            data: { status: 'REFUNDED' }
        })
    } catch (e) {
        console.error('REFUND FAILED', payment.id, e)
        await prisma.paymentAttempt.update({
            where: { razorpayPaymentId: payment.id },
            data: { status: 'REFUND_FAILED' }
        })
    }
}

export const fundEscrow = async (clientId, { contractId}) => {
    const contract = await prisma.contract.findUnique({
        where: { id: contractId }
    })

    if (!contract) throw new Error('Contract not found')
    if (contract.clientId !== clientId) throw new Error('Unauthorized')
    if (contract.status !== 'DRAFT' && contract.status !== 'ACTIVE') {
        throw new Error('Contract must be DRAFT or ACTIVE to fund escrow')
    }
    const funded = await prisma.transaction.aggregate({
        where: { contractId, type: 'ESCROW_FUNDED' },
        _sum: { amount: true }
    })
    const totalFunded = Number(funded._sum.amount ?? 0)
    if (totalFunded > 0) throw new Error('Contract is already funded')
    const order = await razorpay.orders.create({
        amount: Math.round(Number(contract.totalAmount) * 100),
        currency: 'INR',
        receipt: contractId
    })
    return order
}

export const verifyAndFundEscrow = async (clientId, { razorpayOrderId, razorpayPaymentId, razorpaySignature, contractId }) => {
    // 1. Signature first: cheap, local, no Razorpay call for forged input
    const expected = crypto
        .createHmac('sha256', config.RAZORPAY_KEY_SECRET)
        .update(razorpayOrderId + '|' + razorpayPaymentId)
        .digest('hex')
    const a = Buffer.from(expected)
    const b = Buffer.from(String(razorpaySignature ?? ''))
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
        throw new Error('Invalid payment signature')
    }

    // 2. Contract + caller
    const contract = await prisma.contract.findUnique({ where: { id: contractId } })
    if (!contract) throw new Error('Contract not found')
    if (contract.clientId !== clientId) throw new Error('Unauthorized')

    // 3. Ask Razorpay what really happened
    let payment, order
    try {
        payment = await razorpay.payments.fetch(razorpayPaymentId)
        order = await razorpay.orders.fetch(razorpayOrderId)
    } catch (e) {
        throw new Error('Could not verify payment with Razorpay')
    }

    // 4. Reject (no refund): payment doesn't belong to this order/contract or isn't captured
    if (payment.order_id !== razorpayOrderId) throw new Error('Payment does not belong to this order')
    if (order.receipt !== contractId) throw new Error('Order does not belong to this contract')
    if (payment.status !== 'captured') throw new Error('Payment not captured')
    if (payment.currency !== 'INR') throw new Error('Invalid currency')
    if (payment.amount_refunded > 0) throw new Error('Payment already refunded')

    // 5. Real money, wrong amount: refund it
    const expectedPaise = Math.round(Number(contract.totalAmount) * 100)
    if (payment.amount !== expectedPaise) {
        await refundAndRecord({ payment, contractId, reason: 'AMOUNT_MISMATCH' })
        throw new Error('Paid amount does not match contract total. Payment will be refunded.')
    }

    // 6. Credit atomically
    try {
        await prisma.$transaction(async (tx) => {
            await tx.transaction.create({
                data: {
                    type: 'ESCROW_FUNDED',
                    amount: contract.totalAmount,
                    contractId,
                    // one credit per contract: DB rejects any second payment
                    idempotencyKey: `escrow_funded_${contractId}`,
                    meta: { razorpayOrderId, razorpayPaymentId }
                }
            })

            const { count } = await tx.contract.updateMany({
                where: { id: contractId, status: { in: ['DRAFT', 'ACTIVE'] } },
                data: { status: 'ACTIVE' }
            })
            if (count === 0) throw new NotFundableError()

            await tx.paymentAttempt.create({
                data: {
                    razorpayPaymentId,
                    razorpayOrderId,
                    contractId,
                    amount: payment.amount,
                    status: 'CREDITED'
                }
            })
        })
        return true
    } catch (error) {
        if (error instanceof NotFundableError) {
            await refundAndRecord({ payment, contractId, reason: 'CONTRACT_NOT_FUNDABLE' })
            throw new Error('Contract cannot be funded in its current state. Payment will be refunded.')
        }
        if (error.code === 'P2002') {
            // Same payment retried, or a different payment on an already-funded contract?
            const existing = await prisma.paymentAttempt.findUnique({
                where: { razorpayPaymentId }
            })
            if (existing?.status === 'CREDITED') return true // legit retry
            await refundAndRecord({ payment, contractId, reason: 'ALREADY_FUNDED' })
            throw new Error('Contract is already funded. Payment will be refunded.')
        }
        throw error
    }
}

export const releasePayment = async (clientId, { contractId, milestoneId }) => {
    const milestone = await prisma.milestone.findUnique({
        where: { id: milestoneId },
        include: { contract: true }
    })

    if (!milestone) throw new Error('Milestone not found')
    if (milestone.contractId !== contractId) throw new Error('Milestone does not belong to this contract')
    if (milestone.contract.clientId !== clientId) throw new Error('Unauthorized')
    if (milestone.status !== 'SUBMITTED') throw new Error('Milestone must be SUBMITTED to release payment')

    const balance = await getEscrowBalance(contractId)
    if (balance < Number(milestone.amount)) {
        throw new Error('Insufficient escrow balance')
    }

    const validStatus = transitionMilestone(milestone.status, 'APPROVED')
    let result
    try {
        result = await prisma.$transaction(async (tx) => {
            const transaction = await tx.transaction.create({
                data: {
                    type: 'MILESTONE_RELEASED',
                    amount: milestone.amount,
                    contractId,
                    milestoneId,
                    idempotencyKey: `milestone_released_${milestoneId}`,
                    meta: { releasedBy: clientId }
                }
            })

            const updatedMilestone = await tx.milestone.update({
                where: { id: milestoneId },
                data: { status: validStatus }
            })

            const allMilestones = await tx.milestone.findMany({
                where: { contractId }
            })
            const allApproved = allMilestones.every(m => m.status === 'APPROVED')

            if (allApproved) {
                await tx.contract.update({
                    where: { id: contractId },
                    data: { status: 'COMPLETED' }
                })
            }
            return { transaction, updatedMilestone, allApproved }
        })
    } catch (error) {
        if (error.code === 'P2002') {
            return { success: true, remainingBalance: balance - Number(milestone.amount), contractCompleted: false }
        }
        throw error
    }

    return {
        success: true,
        remainingBalance: balance - Number(milestone.amount),
        contractCompleted: result.allApproved
    }
}

export const refundPayment = async (clientId, { contractId, milestoneId }) => {
    const contract = await prisma.contract.findUnique({
        where: { id: contractId }
    })

    if (!contract) throw new Error('Contract not found')
    if (contract.clientId !== clientId) throw new Error('Unauthorized')

    const balance = await getEscrowBalance(contractId)
    if (balance <= 0) throw new Error('No balance to refund')

    const milestone = await prisma.milestone.findUnique({
        where: { id: milestoneId }
    })

    if (!milestone) throw new Error('Milestone not found')

    const validStatus = transitionMilestone(milestone.status, 'REJECTED')

    try {
        await prisma.$transaction(async (tx) => {
            await tx.transaction.create({
                data: {
                    type: 'REFUNDED',
                    amount: milestone.amount,
                    contractId,
                    milestoneId,
                    idempotencyKey: `milestone_refunded_${milestoneId}`,
                    meta: { refundedBy: clientId }
                }
            })

            await tx.milestone.update({
                where: { id: milestoneId },
                data: { status: validStatus }
            })
            const allMilestones = await tx.milestone.findMany({
                where: { contractId }
            })

            const anyDisputed = allMilestones.some(m => m.status === 'DISPUTED')

            if (anyDisputed) {
                await tx.contract.update({
                    where: { id: contractId },
                    data: { status: 'DISPUTED' }
                })
            }
        })
    } catch (error) {
        if (error.code === 'P2002') {
            return { success: true }
        }
        throw error
    }





    return { success: true }
}
