import prisma from '../../db/client.js'

export const getEscrowBalance = async (contractId)=> {
    const transactions = await prisma.transaction.findMany({
        where: {contractId}
    })

    const balance = transactions.reduce((sum,t)=> {
        if(t.type === 'ESCROW_FUNDED') return sum + Number(t.amount)
        if(t.type === 'MILESTONE_RELEASED') return sum - Number(t.amount)
        if(t.type === 'REFUNDED') return sum - Number(t.amount)
        if(t.type === 'DISPUTED_HOLD') return sum - Number(t.amount)
        return sum
    }, 0)
    return balance
}