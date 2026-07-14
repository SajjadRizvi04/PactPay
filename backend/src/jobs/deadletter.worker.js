import {Worker, Queue} from 'bullmq'
import { connection } from './connection.js'
import prisma from '../db/client.js'

const deadLetterQueue = new Queue('deadletter', { connection })

const processDeadLetterJob = async (job) => {
    const {originalQueue, originalJobId, error,data} = job.data

    console.error(`Dead letter job received:`, {
        originalQueue,
        originalJobId,
        error,
        data
    })

    await prisma.ghostEvent.create({
        data: {
            type: 'CLIENT_SILENT',
            action: 'PAYMENT_LOCKED',
            contractId: data.contractId || 'unknown',
            processed: false
        }
    })
}

const worker = new Worker('deadletter', processDeadLetterJob, { connection })

worker.on('completed', (job) => {
  console.log(`Dead letter job ${job.id} completed`)
})

worker.on('failed', (job, error) => {
  console.error(`Dead letter job ${job.id} failed:`, error.message)
})

export const sendToDeadLetter = async (originalQueue, originalJobId,error,data) => {
     await deadLetterQueue.add('failed-job', {
        originalQueue,
        originalJobId,
        error: error.message,
        data
     })
}

export default worker