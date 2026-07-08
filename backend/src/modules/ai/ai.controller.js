import { assessMilestone } from './ai.service.js'
import { processVerdict } from './verdict.processor.js'

export const assess = async(req,res)=> {
    try {
        const {contractId, milestoneId } = req.body

        const verdict = await assessMilestone(contractId,milestoneId)
        const result = await processVerdict(verdict)

        res.status(200).json({
            verdict,
            action:result
        })
    } catch (error) {
        res.status(400).json({error: error.message})
    }
}