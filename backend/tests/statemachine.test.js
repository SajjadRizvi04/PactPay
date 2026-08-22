import { describe, test, expect } from 'vitest'
import { transitionContract, transitionMilestone } from '../src/modules/contracts/contract.statemachine.js'

describe('Contract State Machine', () => {
    describe('transitionContract', () => {
        test('DRAFT can transition to ACTIVE', () => {
            expect(transitionContract('DRAFT', 'ACTIVE')).toBe('ACTIVE')
        })
        test('DRAFT can transition to CANCELLED', () => {
            expect(transitionContract('DRAFT', 'CANCELLED')).toBe('CANCELLED')
        })

        test('ACTIVE can transition to IN_PROGRESS', () => {
            expect(transitionContract('ACTIVE', 'IN_PROGRESS')).toBe('IN_PROGRESS')
        })

        test('ACTIVE can transition to CANCELLED', () => {
            expect(transitionContract('ACTIVE', 'CANCELLED')).toBe('CANCELLED')
        })

        test('IN_PROGRESS can transition to COMPLETED', () => {
            expect(transitionContract('IN_PROGRESS', 'COMPLETED')).toBe('COMPLETED')
        })

        test('IN_PROGRESS can transition to DISPUTED', () => {
            expect(transitionContract('IN_PROGRESS', 'DISPUTED')).toBe('DISPUTED')
        })

        test('DISPUTED can transition to IN_PROGRESS', () => {
            expect(transitionContract('DISPUTED', 'IN_PROGRESS')).toBe('IN_PROGRESS')
        })

        test('DISPUTED can transition to CANCELLED', () => {
            expect(transitionContract('DISPUTED', 'CANCELLED')).toBe('CANCELLED')
        })

        test('COMPLETED cannot transition to anything', () => {
            expect(() => transitionContract('COMPLETED', 'IN_PROGRESS')).toThrow()
        })

        test('CANCELLED cannot transition to anything', () => {
            expect(() => transitionContract('CANCELLED', 'ACTIVE')).toThrow()
        })

        test('DRAFT cannot skip to COMPLETED', () => {
            expect(() => transitionContract('DRAFT', 'COMPLETED')).toThrow()
        })

        test('DRAFT cannot skip to IN_PROGRESS', () => {
            expect(() => transitionContract('DRAFT', 'IN_PROGRESS')).toThrow()
        })

        test('throws correct error message', () => {
            expect(() => transitionContract('DRAFT', 'COMPLETED'))
                .toThrow('Cannot transition contract from DRAFT to COMPLETED')
        })
    })
    describe('transitionMilestone', () => {
        test('PENDING can transition to SUBMITTED', () => {
            expect(transitionMilestone('PENDING', 'SUBMITTED')).toBe('SUBMITTED')
        })

        test('SUBMITTED can transition to APPROVED', () => {
            expect(transitionMilestone('SUBMITTED', 'APPROVED')).toBe('APPROVED')
        })

        test('SUBMITTED can transition to REJECTED', () => {
            expect(transitionMilestone('SUBMITTED', 'REJECTED')).toBe('REJECTED')
        })

        test('SUBMITTED can transition to DISPUTED', () => {
            expect(transitionMilestone('SUBMITTED', 'DISPUTED')).toBe('DISPUTED')
        })

        test('REJECTED can transition back to SUBMITTED', () => {
            expect(transitionMilestone('REJECTED', 'SUBMITTED')).toBe('SUBMITTED')
        })

        test('DISPUTED can transition to APPROVED', () => {
            expect(transitionMilestone('DISPUTED', 'APPROVED')).toBe('APPROVED')
        })

        test('DISPUTED can transition to REJECTED', () => {
            expect(transitionMilestone('DISPUTED', 'REJECTED')).toBe('REJECTED')
        })

        test('APPROVED cannot transition to anything', () => {
            expect(() => transitionMilestone('APPROVED', 'SUBMITTED')).toThrow()
        })

        test('PENDING cannot skip to APPROVED', () => {
            expect(() => transitionMilestone('PENDING', 'APPROVED')).toThrow()
        })

        test('throws correct error message', () => {
            expect(() => transitionMilestone('APPROVED', 'SUBMITTED'))
                .toThrow('Cannot transition milestone from APPROVED to SUBMITTED')
        })
    })
})