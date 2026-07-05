import Razorpay from 'razorpay'
import crypto from 'crypto'
import config from '../../config/index.js'
import prisma from '../../db/client.js'
import { appendEntry,getEscrowBalance } from './ledger.service.js'
import {transitionContract, transitionMilestone} from '../contracts/contract.statemachine.js'
import { ifError } from 'assert'

const razorpay = new Razorpay({
    key_id: config.RAZORPAY_KEY_ID,
    key_secret: config.RAZORPAY_KEY_SECRET
})

export const fundEscrow = async (clientId, {contractId,amount})=> {
    const contract = await prisma.contract.findUnique({
        where: {id:contractId}
    })
    if(!contract) throw new Error('Contract not found')
    if(contract.clientId !== clientId) throw new Error('Unauthorized')
    if(contract.status !== 'DRAFT' &&  contract.status !== 'ACTIVE') {
        throw new Error('Contract must be DRAFT or ACTIVE to fund escrow')
    }
    const order = await razorpay.orders.create({
        amount: amount*100,
        currency: 'INR',
        receipt: contractId
    })

    await appendEntry({
        type: 'ESCROW_FUNDED',
        amount,
        contractId,
        meta: {razorpayOrderId: order.id}
    })

    await prisma.contract.update({
        where: { id: contractId},
        data: { status: 'ACTIVE'}
    })

    return order
}

export const verifyPayment = async ({razorpayOrderId, razorpayPaymentId, razorpaySignature}) => {
    const body = razorpayOrderId +'|' + razorpayPaymentId
    const expectedSignature = crypto 
    .createHmac('sha256', config.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex')

    if(expectedSignature !== razorpaySignature) {
        throw new Error('Invalid payment signature')
    }
    return true
}

export const releasePayment = async (clientId, {contractId, milestoneId}) => {
    const milestone = await prisma.milestone.findUnique({
        where:{id: milestoneId},
        include: {contract: true}
    })

    if(!milestone) throw new Error('Milestone not found')
    if(milestone.contractId !== contractId) throw new Error('Milestone does not belong to this contract')
    if(milestone.contract.clientId !== clientId) throw new Error('Unauthorized')
    if(milestone.status !== 'SUBMITTED') throw new Error('Milestone must be SUBMITTED to release payment')
    
    const balance = await getEscrowBalance(contractId)
    if(balance < Number(milestone.amount)) {
        throw new Error('Insufficient escrow balance')
    }

    await appendEntry({
        type: 'MILESTONE_RELEASED',
        amount: milestone.amount,
        contractId,
        milestoneId,
        meta: {releasedBy: clientId}
    })

    const validStatus = transitionMilestone(milestone.status, 'APPROVED')

    await prisma.milestone.update({
        where: {id: milestoneId},
        data: {status: validStatus}
    })

    const allMilestones = await prisma.milestone.findMany({
        where: {contractId}
    })

    const allApproved = allMilestones.every(m => m.status === 'APPROVED')

    if(allApproved) {
        await prisma.contract.update({
            where: {id: contractId},
            data: {status: 'COMPLETED'}
        })
    }
    return {success: true, remainingBalance: balance - Number(milestone.amount)}
}
