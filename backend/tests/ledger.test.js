import { describe, test, expect, vi, beforeEach } from 'vitest'

vi.mock('../src/db/client.js', () => ({
    default: {
        transaction: {
            create: vi.fn(),
            findMany: vi.fn()
        }
    }
}))

import prisma from '../src/db/client.js'
import { getEscrowBalance, getContractLedger } from '../src/modules/payments/ledger.service.js'

describe('Ledger Service', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('getEscrowBalance', () => {
        test('returns 0 when no transactions exist', async () => {
            prisma.transaction.findMany.mockResolvedValue([])
            const balance = await getEscrowBalance('contract-1')
            expect(balance).toBe(0)
        })

        test('returns correct balance after escrow funded', async () => {
            prisma.transaction.findMany.mockResolvedValue([
                { type: 'ESCROW_FUNDED', amount: '10000' }
            ])
            const balance = await getEscrowBalance('contract-1')
            expect(balance).toBe(10000)
        })

        test('deducts milestone release from balance', async () => {
            prisma.transaction.findMany.mockResolvedValue([
                { type: 'ESCROW_FUNDED', amount: '10000' },
                { type: 'MILESTONE_RELEASED', amount: '4000' }
            ])
            const balance = await getEscrowBalance('contract-1')
            expect(balance).toBe(6000)
        })

        test('deducts refund from balance', async () => {
            prisma.transaction.findMany.mockResolvedValue([
                { type: 'ESCROW_FUNDED', amount: '10000' },
                { type: 'REFUNDED', amount: '3000' }
            ])
            const balance = await getEscrowBalance('contract-1')
            expect(balance).toBe(7000)
        })

        test('handles multiple releases correctly', async () => {
            prisma.transaction.findMany.mockResolvedValue([
                { type: 'ESCROW_FUNDED', amount: '10000' },
                { type: 'MILESTONE_RELEASED', amount: '4000' },
                { type: 'MILESTONE_RELEASED', amount: '6000' }
            ])
            const balance = await getEscrowBalance('contract-1')
            expect(balance).toBe(0)
        })

        test('balance never goes below zero with correct transactions', async () => {
            prisma.transaction.findMany.mockResolvedValue([
                { type: 'ESCROW_FUNDED', amount: '5000' },
                { type: 'MILESTONE_RELEASED', amount: '5000' }
            ])
            const balance = await getEscrowBalance('contract-1')
            expect(balance).toBe(0)
        })

        test('ignores unknown transaction types', async () => {
            prisma.transaction.findMany.mockResolvedValue([
                { type: 'ESCROW_FUNDED', amount: '10000' },
                { type: 'UNKNOWN_TYPE', amount: '5000' }
            ])
            const balance = await getEscrowBalance('contract-1')
            expect(balance).toBe(10000)
        })
    })
    describe('getContractLedger', () => {
        test('returns all transactions for a contract', async () => {
            const mockTransactions = [
                { type: 'ESCROW_FUNDED', amount: '10000', createdAt: new Date() },
                { type: 'MILESTONE_RELEASED', amount: '4000', createdAt: new Date() }
            ]
            prisma.transaction.findMany.mockResolvedValue(mockTransactions)
            const ledger = await getContractLedger('contract-1')
            expect(ledger).toHaveLength(2)
        })

        test('returns empty array when no transactions', async () => {
            prisma.transaction.findMany.mockResolvedValue([])
            const ledger = await getContractLedger('contract-1')
            expect(ledger).toHaveLength(0)
        })

        test('calls findMany with correct contractId', async () => {
            prisma.transaction.findMany.mockResolvedValue([])
            await getContractLedger('contract-123')
            expect(prisma.transaction.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { contractId: 'contract-123' }
                })
            )
        })
    })

})