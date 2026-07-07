import prisma from '../../db/client.js'
import { transitionMilestone, transitionContract } from '../contracts/contract.statemachine.js'

export const processVerdict = async (verdict) => {
  const { id, contractId, milestoneId, verdict: result, confidence } = verdict

  if (result === 'APPROVE' && confidence >= 0.7) {
    await prisma.milestone.update({
      where: { id: milestoneId },
      data: { status: 'SUBMITTED' }
    })

    return {
      action: 'NOTIFY_CLIENT',
      message: 'AI recommends approval. Awaiting client confirmation to release payment.',
      verdictId: id
    }
  }

  if (result === 'REQUEST_CHANGES') {
    const validStatus = transitionMilestone('SUBMITTED', 'REJECTED')

    await prisma.milestone.update({
      where: { id: milestoneId },
      data: { status: validStatus }
    })

    return {
      action: 'NOTIFY_FREELANCER',
      message: 'AI recommends changes. Milestone sent back to freelancer.',
      verdictId: id
    }
  }

  if (result === 'ESCALATE' || confidence < 0.7) {
    const validContractStatus = transitionContract('IN_PROGRESS', 'DISPUTED')

    await prisma.$transaction(async (tx) => {
      await tx.dispute.create({
        data: {
          reason: 'WORK_INCOMPLETE',
          description: `AI escalated with low confidence (${confidence}). Manual review required.`,
          contractId,
          milestoneId,
          raisedById: verdict.contract?.clientId || contractId
        }
      })

      await tx.contract.update({
        where: { id: contractId },
        data: { status: validContractStatus }
      })
    })

    return {
      action: 'DISPUTE_CREATED',
      message: 'AI could not determine completion. Dispute created for manual review.',
      verdictId: id
    }
  }
}