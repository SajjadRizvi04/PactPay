import { Worker } from "bullmq";
import { connection } from "./connection.js";
import { assessMilestone } from "../modules/ai/ai.service.js";
import { processVerdict } from "../modules/ai/verdict.processor.js";
import { sendToDeadLetter } from './deadletter.worker.js'

const processAiJob = async (job) => {
    const { contractId, milestoneId } = job.data;

    const verdict = await assessMilestone(contractId,milestoneId)
    const result = await processVerdict(verdict)

    return result
}

const worker = new Worker('ai', processAiJob, { connection })

worker.on('completed', (job)=> {
    console.log(`AI job ${job.id} completed`)
})

worker.on('failed', async (job,error) => {
    console.error(`AI job ${job.id} failed:`, error.message)
    await sendToDeadLetter('ai', job.id,error,job.data)
})

export default worker
