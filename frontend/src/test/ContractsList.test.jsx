import ContractsList from '@/pages/dashboard/ContractsList'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, test, expect } from 'vitest'


const renderWithRouter = (component) => {
    return render(<MemoryRouter>{component}</MemoryRouter>)
}

const mockContracts = [
    {
        id: '1',
        title: 'Build a portfolio website',
        status: 'IN_PROGRESS',
        totalAmount: '10000',
        milestones: [
            { status: 'APPROVED' },
            { status: 'PENDING' }
        ]
    },
    {
        id: '2',
        title: 'Design a mobile app',
        status: 'COMPLETED',
        totalAmount: '25000',
        milestones: [
            { status: 'APPROVED' },
            { status: 'APPROVED' }
        ]
    }
]

describe('ContractsList', () => {
    test('shows load state', () => {
        renderWithRouter(
            <ContractsList contracts={[]} loading={true} role='CLIENT' />
        )
        expect(screen.getByText('Loading...')).toBeInTheDocument()
    })

    test('shows empty state for client with no contracts', () => {
        renderWithRouter(
            <ContractsList contracts={[]} loading={false} role='CLIENT' />
        )
        expect(screen.getByText('No contracts yet')).toBeInTheDocument()
        expect(screen.getByText('Create your first contract')).toBeInTheDocument()
    })
    test('shows empty state for freelancer with no contracts', () => {
        renderWithRouter(
            <ContractsList contracts={[]} loading={false} role='FREELANCER' />
        )
        expect(screen.getByText('No contracts assigned yet')).toBeInTheDocument()
    })

    test('renders contract titles', () => {
        renderWithRouter(
            <ContractsList contracts={mockContracts} loading={false} role='CLIENT' />
        )
        expect(screen.getByText('Build a portfolio website')).toBeInTheDocument()
        expect(screen.getByText('Design a mobile app')).toBeInTheDocument()
    })

    test('renders contract amounts', () => {
        renderWithRouter(
            <ContractsList contracts={mockContracts} loading={false} role='CLIENT' />
        )
        expect(screen.getByText('₹10,000')).toBeInTheDocument()
        expect(screen.getByText('₹25,000')).toBeInTheDocument()
    })

    test('renders contract statuses', () => {
        renderWithRouter(
            <ContractsList contracts={mockContracts} loading={false} role='CLIENT' />
        )
        expect(screen.getByText('IN PROGRESS')).toBeInTheDocument()
        expect(screen.getByText('COMPLETED')).toBeInTheDocument()
    })

    test('shows progress bar for IN_PROGRESS contracts', () => {
        renderWithRouter(
            <ContractsList contracts={mockContracts} loading={false} role='CLIENT' />
        )
        const progressBar = document.querySelector('.bg-green-500')
        expect(progressBar).toBeInTheDocument()
    })

    test('shows new contract button for client', () => {
        renderWithRouter(
            <ContractsList contracts={[]} loading={false} role='CLIENT' />
        )
        expect(screen.getByText('Create your first contract')).toBeInTheDocument()
    })

    test('does not show new contract button for freelancer', () => {
        renderWithRouter(
            <ContractsList contracts={[]} loading={false} role='FREELANCER' />
        )
        expect(screen.queryByText('Create your first contract')).not.toBeInTheDocument()
    })
})