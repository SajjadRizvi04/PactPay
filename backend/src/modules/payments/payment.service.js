import Razorpay from 'razorpay'
import crypto from 'crypto'
import { v4 as uuidv4 } from 'uuid'
import config from '../../config/index.js'
import prisma from '../../db/client.js'
import { getEscrowBalance } from './ledger.service.js'
import { transitionMilestone } from '../contracts/contract.statemachine.js'

const razorpay = new Razorpay({
    key_id: config.RAZORPAY_KEY_ID,
    key_secret: config.RAZORPAY_KEY_SECRET
})

export const fundEscrow = async (clientId, { contractId, amount }) => {
    const contract = await prisma.contract.findUnique({
        where: { id: contractId }
    })
    if (!contract) throw new Error('Contract not found')
    if (contract.clientId !== clientId) throw new Error('Unauthorized')
    if (contract.status !== 'DRAFT' && contract.status !== 'ACTIVE') {
        throw new Error('Contract must be DRAFT or ACTIVE to fund escrow')
    }
    const order = await razorpay.orders.create({
        amount: amount * 100,
        currency: 'INR',
        receipt: contractId
    })
    return order
}

export const verifyAndFundEscrow = async ({ razorpayOrderId, razorpayPaymentId, razorpaySignature, contractId,amount }) => {
    const body = razorpayOrderId + '|' + razorpayPaymentId
    const expectedSignature = crypto
        .createHmac('sha256', config.RAZORPAY_KEY_SECRET)
        .update(body)
        .digest('hex')

    if (expectedSignature !== razorpaySignature) {
        throw new Error('Invalid payment signature')
    }
    await prisma.$transaction(async (tx) => {
        await tx.transaction.create({
            data: {
                type: 'ESCROW_FUNDED',
                amount,
                contractId,
                idempotencyKey: uuidv4(),
                meta: { razorpayOrderId, razorpayPaymentId }
            }
        })

        await tx.contract.update({
            where: { id: contractId },
            data: { status: 'ACTIVE' }
        })
    })

    return true
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

    const result = await prisma.$transaction(async (tx) => {
        const transaction = await tx.transaction.create({
            data: {
                type: 'MILESTONE_RELEASED',
                amount: milestone.amount,
                contractId,
                milestoneId,
                idempotencyKey: uuidv4(),
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
    await prisma.$transaction(async (tx) => {
        await tx.transaction.create({
            data: {
                type: 'REFUNDED',
                amount: milestone.amount,
                contractId,
                milestoneId,
                idempotencyKey: uuidv4(),
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




    return { success: true }
}
