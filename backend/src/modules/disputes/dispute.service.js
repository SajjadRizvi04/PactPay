import prisma  from '../../db/client.js'
import { transitionContract } from '../contracts/contract.statemachine.js'
import  {v4 as uuidv4} from 'uuid'

export const createDispute = async (userId, {contractId, milestoneId, reason, description}) => {
    const contract = await prisma.contract.findUnique({
        where: {id: contractId}
    })

    if(!contract) throw new Error('No contract found')
    if(contract.clientId !== userId && contract.freelancerId !== userId) throw new Error('Unauthorized ')

    const validStatus = transitionContract(contract.status, 'DISPUTED')
    const result = await prisma.$transaction(async (tx)=> {
        const dispute = await tx.dispute.create({
            data: {
                contractId,
                milestoneId,
                reason,
                description,
                raisedById: userId
            }
        })
        await tx.contract.update({
            where: {id:contractId},
            data: { status: validStatus }
        })

        return dispute
    })

    return result
}

export const getDispute = async (disputeId, userId) => {
    const dispute = await prisma.dispute.findUnique({
        where:{
            id: disputeId
        },
        include: {contract: true}
    })
    if(!dispute) throw new Error('Dispute not found')
    if(dispute.contract.clientId !== userId && dispute.contract.freelancerId !== userId) throw new Error('Unauthorized')
    
    return dispute
}

export const resolveDispute = async(disputeId,userId, {resolution,notes}) => {

    const dispute = await prisma.dispute.findUnique({
        where: { id: disputeId },
        include: { contract: true }
    })

    if(!dispute) throw new Error('Dispute not found')
    if(dispute.contract.clientId !== userId) throw new Error('Only the client can resolve a dispute')
    if(dispute.status === 'RESOLVED_CLIENT' || dispute.status === 'RESOLVED_FREELANCER') throw new Error('Dispute already resolved')

    const result = await prisma.$transaction(async (tx)=> {
        const updatedDispute = await tx.dispute.update({
            where: {id: disputeId},
            data: {
                status: resolution,
                resolution: notes,
                resolvedAt: new Date()
            }
        })

        if(resolution === 'RESOLVED_FREELANCER') {
            await tx.milestone.update({
                where: {id: dispute.milestoneId},
                data: {status: 'APPROVED'}
            })
            await tx.transaction.create({
                data: {
                type: 'MILESTONE_RELEASED',
                amount: dispute.contract.totalAmount,
                contractId: dispute.contractId,
                milestoneId: dispute.milestoneId,
                idempotencyKey: uuidv4(),
                meta: { resolvedBy: userId, disputeId }
                }
            })
        }

        if(resolution === 'RESOLVED_CLIENT') {
            await tx.milestone.update({
                where: {id: dispute.milestoneId},
                data: {status: 'REJECTED'}
            })

            await tx.transaction.create({
                data: {
                    type: 'REFUNDED',
                    amount: dispute.contract.totalAmount,
                    contractId: dispute.contractId,
                    milestoneId: dispute.milestoneId,
                    idempotencyKey: uuidv4(),
                    meta: { resolvedBy: userId, disputeId }
                }
            })
        }
        await tx.contract.update({
            where: { id: dispute.contractId},
            data: {status: 'IN_PROGRESS'}
        })

        return updatedDispute
    })
    return result
}