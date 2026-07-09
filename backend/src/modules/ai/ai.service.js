import { GoogleGenAI } from '@google/genai'
import config from '../../config/index.js'
import prisma from '../../db/client.js'


const ai = new GoogleGenAI({ apiKey: config.GEMINI_API_KEY })

const buildPrompt = (contract, milestone) => {
    return `
    You are an AI assessor for an escrow platform. Your job is to assess whether a freelancer has completed a milestone based on the contract and milestone details.
    CONTRACT:
    Title: ${contract.title}
    Description: ${contract.description}
    Total Amount: ${contract.totalAmount}

    MILESTONE: 
    Title: ${milestone.title}
    Description: ${milestone.description}
    Amount: ${milestone.amount}
    Due Date: ${milestone.dueDate}
    Status: ${milestone.status}

    FREELAMCER SUBMISSION: 
    Notes: ${milestone.submissionNotes || 'No notes provided'}
    Submission URL: ${milestone.submissionUrl || 'No URL provided'}

    Based on the milestone description and its current status, assess whether the work appears complete.

    Respond in this exact JSON format and nothing else:
    {
        "verdict": "APPROVE" | "REQUEST_CHANGES" | "ESCALATE",
        "confidence": <number between 0 and 1>,
        "reasoning": "<your reasoning in one or two sentences>"
    }

    Rules:
    - APPROVE if the milestone is clearly complete based on description
    - REQUEST_CHANGES if the milestone needs more work
    - ESCALATE if you cannot determine completion with confidence above 0.5

`
}

export const assessMilestone = async (contractId,milestoneId)=> {
    const contract = await prisma.contract.findUnique({
        where: {id: contractId},
        include: {milestones: true}
    })

    if(!contract) throw new Error('Contract not found')
    
    const milestone = contract.milestones.find(m=>m.id === milestoneId)
    if(!milestone) throw new Error('Milestone not found')
    
    const prompt = buildPrompt(contract,milestone)

    const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt
    })

    const text = response.text
    let parsed

    try {
        const clean = text.replace(/```json|```/g, '')
        parsed = JSON.parse(clean)
    } catch (error) {
        throw new Error('AI returned invalid response format')
    }

    if(!['APPROVE', 'REQUEST_CHANGES', 'ESCALATE'].includes(parsed.verdict)) {
        throw new Error('AI returned invalid verdict')
    }

    const verdict = await prisma.aIVerdict.create({
        data: {
            verdict: parsed.verdict,
            confidence: parsed.confidence,
            reasoning: parsed.reasoning,
            contractId,
            milestoneId
        }
    })

    return verdict
}
