import prisma from '../../db/client.js'
import { transitionContract, transitionMilestone } from './contract.statemachine.js'
import { aiQueue } from '../../jobs/queues.js';

export const createContract = async (clientId,data) => {
    const {title, description, totalAmount,freelancerId,milestones} = data;
    const milestonesTotal = milestones.reduce((sum,m)=> sum + m.amount,0)
    if(milestonesTotal !== totalAmount) {
        throw new Error('Milestones total must be equal to the contact total amount')
    }

    const contract = await prisma.contract.create({
        data: {
            title,
            description,
            totalAmount,
            clientId,
            freelancerId,
            milestones: {
                create: milestones.map(m=>({
                    title: m.title,
                    description: m.description,
                    amount: m.amount,
                    dueDate: new Date(m.dueDate)
                }))
            }
        },
        include: {milestones:true}
    })
    return contract
}

export const getContracts = async (userId) => {
    return await prisma.contract.findMany({
        where:{
            OR: [
                {clientId: userId},
                {freelancerId: userId}
            ]
        },
        include: {milestones: true},
        orderBy: {createdAt: 'desc'}
    })
}

export const getContract = async (contractId, userId) => {
    const contract = await prisma.contract.findUnique({
        where: {
            id: contractId
        },
        include: {milestones:true, transactions:true }
    })
    if(!contract) {
        throw new Error('Contract not found')
    }
    if(contract.clientId !== userId && contract.freelancerId !== userId) {
        throw new Error('Unauthorized')
    }
    return contract
}

export const updateContractStatus = async (contractId, userId,nextStatus) =>{
    const contract = await prisma.contract.findUnique({
        where: {id: contractId}
    })

    if(!contract) throw new Error('Contract not found')

    if(contract.clientId !== userId) {
        throw new Error('Only the client can update the contract status')
    }

    const validStatus = transitionContract(contract.status, nextStatus)

    return await prisma.contract.update({
        where: {id: contractId},
        data: {status: validStatus}
    })
}

export const submitMileStone = async (contractId, milestoneId, userId, {submissionNotes,submissionUrl}) => {
    const milestone = await prisma.milestone.findUnique({
        where: {id: milestoneId},
        include: {contract: true}
    })
    if(!milestone) throw new Error('Milestone not found')

    if(milestone.contract.freelancerId !== userId) {
        throw new Error('Only the freelancer can submit a milestone')
    }

    if(milestone.contractId !== contractId) {
        throw new Error('Milestone does not belong to this contract')
    }
    const validStatus = transitionMilestone(milestone.status, 'SUBMITTED')

    return await prisma.milestone.update({
        where: {id: milestoneId}, 
        data: {
            status: validStatus,
            submissionNotes,
            submissionUrl
        }
    })
    await aiQueue.add('assess-milestone', { contractId, milestoneId })

    return upDateMilestonedone
} 