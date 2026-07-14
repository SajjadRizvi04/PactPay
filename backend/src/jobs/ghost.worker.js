import { Worker } from "bullmq"
import { connection } from "./connection.js"
import prisma from '../db/client.js'
import { ghostQueue } from './queues.js'
import { v4 as uuidv4 } from 'uuid'
import { sendToDeadLetter

 } from "./deadletter.worker.js"

const GHOST_THRESHOLD_DAYS = 14

const processGhostJob = async (job) => {
    const now = new Date()
    const thresholdDate = new Date(now - GHOST_THRESHOLD_DAYS * 24 * 60 * 60 * 1000)

    const activeContracts = await prisma.contract.findMany({
        where: {
            status: { in: ['ACTIVE', 'IN_PROGRESS'] }
        },
        include: { milestones: true }
    })

    for (const contract of activeContracts) {
        const alreadyProcessed = await prisma.ghostEvent.findFirst({
            where: {
                contractId: contract.id,
                processed: true
            }
        })

        if (alreadyProcessed) continue

        const submittedMilestones = contract.milestones.filter(
            m => m.status === 'SUBMITTED' && m.updatedAt < thresholdDate
        )

        if (submittedMilestones.length > 0) {
            await prisma.$transaction(async (tx) => {
                for (const milestone of submittedMilestones) {
                    await tx.transaction.create({
                        data: {
                            type: 'MILESTONE_RELEASED',
                            amount: milestone.amount,
                            contractId: contract.id,
                            milestoneId: milestone.id,
                            idempotencyKey: uuidv4(),
                            meta: { reason: 'CLIENT_GHOST_AUTO_RELEASE' }
                        }
                    })
                    await tx.milestone.update({
                        where: { id: milestone.id },
                        data: { status: 'APPROVED' }
                    })


                }
                await tx.ghsotEvent.create({
                    data: {
                        type: 'CLIENT_SILENT',
                        action: 'AUTO_RELEASED',
                        contractId: contract.id,
                        processed: true
                    }
                })
            })
            continue
        }

        const pendingMilestones = contract.milestones.filter(m => m.status === 'PENDING')
        const contractOld = contract.createdAt < thresholdDate

        if(pendingMilestones.length > 0 && contractOld) {
            await prisma.$transaction(async (tx) => {
                await tx.contract.update({
                    where: { id: contract.id },
                    data: { status: 'DISPUTED'}
                })
                
                await tx.dispute.create({
                    data: {
                        reason: 'GHOST_DETECTED',
                        description: 'Freelancer has not submitted any milestones in 14 days.',
                        contractId: contract.id,
                        raisedById: contract.clientId
                    }
                })

                await tx.ghostEvent.create({
                    data: {
                        type: 'FREELANCER_ABANDONED',
                        action: 'PAYMENT_LOCKED',
                        contractId: contract.id,
                        processed: true
                    }
                })
            })
        }
    }

}

const worker = new Worker('ghost', processGhostJob, {connection})

worker.on('completed', (job)=> {
    console.log(`Ghost job ${job.id} completed`)
})

worker.on('failed', async (job,error)=> {
    console.error(`Ghost job ${job.id} failed:`, error.message)
    await sendToDeadLetter('ghost', job.id, error, job.data) 
})

export const scheduleGhostCheck = async ()=> {
    await ghostQueue.add(
        'check-ghost',
        {},
        {
            repeat: {every: 24*60*60*1000}
        }
    )
}
export default worker