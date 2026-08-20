import { render, screen } from '@testing-library/react'
import { describe, test, expect } from 'vitest'
import StatsCard from '../pages/dashboard/StatsCard'

const mockClientContracts = [
  { status: 'ACTIVE', totalAmount: '10000', milestones: [] },
  { status: 'IN_PROGRESS', totalAmount: '20000', milestones: [] },
  { status: 'COMPLETED', totalAmount: '15000', milestones: [] },
  { status: 'DRAFT', totalAmount: '5000', milestones: [] },
]

const mockFreelancerContracts = [
  {
    status: 'ACTIVE',
    totalAmount: '10000',
    milestones: [
      { status: 'PENDING' },
      { status: 'APPROVED' },
    ]
  },
  {
    status: 'COMPLETED',
    totalAmount: '20000',
    milestones: [
      { status: 'APPROVED' },
      { status: 'APPROVED' },
    ]
  }
]

describe('StatsCard', () => {
  describe('CLIENT role', () => {
    test('renders all four client stat titles', () => {
      render(<StatsCard contracts={mockClientContracts} role='CLIENT' />)
      expect(screen.getByText('Total Contracts')).toBeInTheDocument()
      expect(screen.getByText('Active Contracts')).toBeInTheDocument()
      expect(screen.getByText('Total in Escrow')).toBeInTheDocument()
      expect(screen.getByText('Completed')).toBeInTheDocument()
    })

    test('shows correct total contracts count', () => {
      render(<StatsCard contracts={mockClientContracts} role='CLIENT' />)
      expect(screen.getByText('4')).toBeInTheDocument()
    })

    test('shows correct active contracts count', () => {
      render(<StatsCard contracts={mockClientContracts} role='CLIENT' />)
      expect(screen.getByText('2')).toBeInTheDocument()
    })

    test('shows correct completed count', () => {
      render(<StatsCard contracts={mockClientContracts} role='CLIENT' />)
      expect(screen.getByText('1')).toBeInTheDocument()
    })

    test('shows empty state with no contracts', () => {
      render(<StatsCard contracts={[]} role='CLIENT' />)
      expect(screen.getByText('Total Contracts')).toBeInTheDocument()
      const zeros = screen.getAllByText('0')
      expect(zeros).toHaveLength(3)
      expect(screen.getByText('₹0')).toBeInTheDocument()
    })
  })

  describe('FREELANCER role', () => {
    test('renders all four freelancer stat titles', () => {
      render(<StatsCard contracts={mockFreelancerContracts} role='FREELANCER' />)
      expect(screen.getByText('Active Contracts')).toBeInTheDocument()
      expect(screen.getByText('Pending Submissions')).toBeInTheDocument()
      expect(screen.getByText('Completed Milestones')).toBeInTheDocument()
      expect(screen.getByText('Total Earned')).toBeInTheDocument()
    })

    test('shows correct completed milestones count', () => {
      render(<StatsCard contracts={mockFreelancerContracts} role='FREELANCER' />)
      expect(screen.getByText('3')).toBeInTheDocument()
    })

    test('shows correct pending submissions count', () => {
      render(<StatsCard contracts={mockFreelancerContracts} role='FREELANCER' />)
      const ones = screen.getAllByText('1')
      expect(ones.length).toBeGreaterThanOrEqual(1)
    })

    test('shows correct total earned', () => {
      render(<StatsCard contracts={mockFreelancerContracts} role='FREELANCER' />)
      expect(screen.getByText('₹20,000')).toBeInTheDocument()
    })

    test('shows empty state with no contracts', () => {
      render(<StatsCard contracts={[]} role='FREELANCER' />)
      const zeros = screen.getAllByText('0')
      expect(zeros.length).toBeGreaterThanOrEqual(3)
    })
  })
})