import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import axios from 'axios'
import Sidebar from '../pages/dashboard/Sidebar'
import { Button } from '@/components/ui/button'
import { Clock, CheckCircle, AlertCircle, Circle, Menu } from 'lucide-react'

const statusColors = {
    DRAFT: 'bg-slate-100 text-slate-600',
    ACTIVE: 'bg-blue-100 text-blue-600',
    IN_PROGRESS: 'bg-yellow-100 text-yellow-600',
    COMPLETED: 'bg-green-100 text-green-600',
    DISPUTED: 'bg-red-100 text-red-600',
    CANCELLED: 'bg-slate-100 text-slate-400'
}

const milestoneStatusIcons = {
    PENDING: <Circle className='w-4 h-4 text-slate-400' />,
    SUBMITTED: <Clock className='w-4 h-4 text-yellow-500' />,
    APPROVED: <CheckCircle className='w-4 h-4 text-green-500' />,
    REJECTED: <AlertCircle className='w-4 h-4 text-red-400' />,
    DISPUTED: <AlertCircle className='w-4 h-4 text-red-500' />
}

const verdictColors = {
    APPROVE: 'bg-green-50 border-green-200 text-green-700',
    REQUEST_CHANGES: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    ESCALATE: 'bg-red-50 border-red-200 text-red-700'
}

const ContractDetail = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const user = JSON.parse(localStorage.getItem('user'))
    const token = localStorage.getItem('token')

    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [contract, setContract] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [actionLoading, setActionLoading] = useState(false)

    useEffect(() => {
        const fetchContract = async () => {
            try {
                const { data } = await axios.get(`http://localhost:5000/api/contracts/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
                setContract(data)
            } catch (err) {
                setError(err.response?.data?.error || 'Failed to load contract')
            } finally {
                setLoading(false)
            }
        }
        fetchContract()
    }, [id])

    const handleReleasePayment = async (milestoneId) => {
        setActionLoading(true)
        try {
            await axios.post('http://localhost:5000/api/payments/release',
                { contractId: id, milestoneId },
                { headers: { Authorization: `Bearer ${token}` } }
            )
            const { data } = await axios.get(`http://localhost:5000/api/contracts/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            setContract(data)
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to release payment')
        } finally {
            setActionLoading(false)
        }
    }
    const handleRequestChanges = async (milestoneId) => {
        setActionLoading(true)
        try {
            await axios.post('http://localhost:5000/api/payments/refund',
                { contractId: id, milestoneId },
                { headers: { Authorization: `Bearer ${token}` } }
            )
            const { data } = await axios.get(`http://localhost:5000/api/contracts/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            setContract(data)
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to request changes')
        } finally {
            setActionLoading(false)
        }
    }

    const escrowBalance = contract?.transactions?.reduce((sum, t) => {
        if (t.type === 'ESCROW_FUNDED') return sum + Number(t.amount)
        if (t.type === 'MILESTONE_RELEASED') return sum - Number(t.amount)
        if (t.type === 'REFUNDED') return sum - Number(t.amount)
        return sum
    }, 0) || 0

    if (loading) {
        return (
            <div className='min-h-screen bg-slate-50 flex'>
                <Sidebar user={user} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
                <main className='flex-1  px-8 py-8 flex items-center justify-center'>
                    <p className='text-slate-400'>Loading contract...</p>
                </main>
            </div>
        )
    }

    if (error) {
        return (
            <div className='min-h-screen bg-slate-50 flex'>
                <Sidebar user={user} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
                <main className='flex-1  px-8 py-8 flex items-center justify-center'>
                    <p className='text-red-400'>{error}</p>
                </main>
            </div>
        )
    }

    return (
        <div className='min-h-screen bg-slate-50 flex'>
            <Sidebar user={user} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <main className='flex-1  px-8 py-8'>

                {/* Header */}
                <div className='flex items-start justify-between mb-8'>
                    <div className='flex flex-col gap-2'>
                        <button
                            className='lg:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200'
                            onClick={() => setSidebarOpen(true)}
                        >
                            <Menu className='w-5 h-5 text-slate-600' />
                        </button>
                        <button
                            onClick={() => navigate('/dashboard')}
                            className='text-slate-400 text-sm hover:text-slate-600 transition w-fit'
                        >
                            ← Back to Dashboard
                        </button>
                        <h1 className='text-2xl font-bold text-slate-900'>{contract.title}</h1>
                        <p className='text-slate-500 text-sm max-w-xl'>{contract.description}</p>
                    </div>
                    <span className={`text-xs px-3 py-1.5 rounded-full font-medium ${statusColors[contract.status]}`}>
                        {contract.status.replace('_', ' ')}
                    </span>
                </div>

                <div className='grid lg:grid-cols-3 grid-cols-1 gap-6'>

                    {/* Left — Milestones */}
                    <div className='lg:col-span-2 flex flex-col gap-4'>
                        <h2 className='font-semibold text-slate-900'>Milestones</h2>

                        {contract.milestones.map((milestone) => {
                            const verdict = contract.aiVerdicts?.find(v => v.milestoneId === milestone.id)

                            return (
                                <div key={milestone.id} className='bg-white rounded-2xl p-5 flex flex-col gap-4'>

                                    {/* Milestone Header */}
                                    <div className='flex items-start justify-between'>
                                        <div className='flex items-center gap-3'>
                                            {milestoneStatusIcons[milestone.status]}
                                            <div>
                                                <p className='font-medium text-slate-900 text-sm'>{milestone.title}</p>
                                                <p className='text-slate-400 text-xs'>{milestone.description}</p>
                                            </div>
                                        </div>
                                        <div className='flex flex-col items-end gap-1'>
                                            <p className='font-bold text-slate-900'>₹{Number(milestone.amount).toLocaleString()}</p>
                                            <p className='text-slate-400 text-xs'>Due {new Date(milestone.dueDate).toLocaleDateString()}</p>
                                        </div>
                                    </div>

                                    {/* Submission Notes */}
                                    {milestone.submissionNotes && (
                                        <div className='bg-slate-50 rounded-xl px-4 py-3 flex flex-col gap-1'>
                                            <p className='text-xs font-semibold text-slate-600'>Freelancer Submission</p>
                                            <p className='text-xs text-slate-500'>{milestone.submissionNotes}</p>
                                            {milestone.submissionUrl && (
                                                <a
                                                    href={milestone.submissionUrl}
                                                    target='_blank'
                                                    rel='noreferrer noopener'
                                                    className='text-xs text-blue-500 hover:underline mt-1'
                                                >
                                                    View submission →
                                                </a>
                                            )}
                                        </div>
                                    )}

                                    {/* AI Verdict */}
                                    {verdict && (
                                        <div className={`rounded-xl border px-4 py-3 flex flex-col gap-1 ${verdictColors[verdict.verdict]}`}>
                                            <div className='flex items-center justify-between'>
                                                <p className='text-xs font-semibold'>AI Verdict — {verdict.verdict.replace('_', ' ')}</p>
                                                <p className='text-xs'>{Math.round(verdict.confidence * 100)}% confidence</p>
                                            </div>
                                            <p className='text-xs'>{verdict.reasoning}</p>
                                        </div>
                                    )}

                                    {/* Actions */}
                                    <div className='flex items-center gap-2'>
                                        {user.role === 'FREELANCER' && milestone.status === 'PENDING' && (
                                            <Button
                                                size='sm'
                                                onClick={() => navigate(`/contracts/${id}/milestones/${milestone.id}`)}
                                            >
                                                Submit Work
                                            </Button>
                                        )}
                                        {user.role === 'FREELANCER' && milestone.status === 'REJECTED' && (
                                            <Button
                                                size='sm'
                                                onClick={() => navigate(`/contracts/${id}/milestones/${milestone.id}`)}
                                            >
                                                Resubmit Work
                                            </Button>
                                        )}
                                        {user.role === 'CLIENT' && milestone.status === 'SUBMITTED' && (
                                            <>
                                                <Button
                                                    size='sm'
                                                    disabled={actionLoading}
                                                    onClick={() => handleReleasePayment(milestone.id)}
                                                >
                                                    {actionLoading ? 'Processing...' : 'Release Payment'}
                                                </Button>
                                                <Button
                                                    size='sm'
                                                    variant='outline'
                                                    disabled={actionLoading}
                                                    onClick={() => handleRequestChanges(milestone.id)}
                                                >
                                                    Request Changes
                                                </Button>
                                            </>
                                        )}
                                        {user.role === 'CLIENT' && milestone.status === 'APPROVED' && (
                                            <span className='text-xs text-green-500 font-medium'>Payment Released</span>
                                        )}
                                    </div>

                                </div>
                            )
                        })}
                    </div>

                    {/* Right — Escrow + Info */}
                    <div className='flex flex-col gap-4'>

                        {/* Escrow Balance */}
                        <div className='bg-slate-900 rounded-2xl p-5 flex flex-col gap-2'>
                            <p className='text-slate-400 text-xs'>Escrow Balance</p>
                            <p className='text-white text-3xl font-bold'>₹{escrowBalance.toLocaleString()}</p>
                            <p className='text-slate-400 text-xs'>Held securely in escrow</p>
                            <div className='flex items-center gap-1.5 mt-1'>
                                <div className='w-2 h-2 rounded-full bg-green-400'></div>
                                <span className='text-green-400 text-xs'>Protected by PayPact</span>
                            </div>
                        </div>

                        {/* Contract Info */}
                        <div className='bg-white rounded-2xl p-5 flex flex-col gap-3'>
                            <h3 className='font-semibold text-slate-900 text-sm'>Contract Info</h3>
                            <div className='flex flex-col gap-2'>
                                <div className='flex items-center justify-between'>
                                    <span className='text-slate-400 text-xs'>Total Amount</span>
                                    <span className='text-slate-900 font-medium text-sm'>₹{Number(contract.totalAmount).toLocaleString()}</span>
                                </div>
                                <div className='flex items-center justify-between'>
                                    <span className='text-slate-400 text-xs'>Milestones</span>
                                    <span className='text-slate-900 font-medium text-sm'>{contract.milestones.length} total</span>
                                </div>
                                <div className='flex items-center justify-between'>
                                    <span className='text-slate-400 text-xs'>Completed</span>
                                    <span className='text-slate-900 font-medium text-sm'>
                                        {contract.milestones.filter(m => m.status === 'APPROVED').length} of {contract.milestones.length}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Progress */}
                        <div className='bg-white rounded-2xl p-5 flex flex-col gap-3'>
                            <h3 className='font-semibold text-slate-900 text-sm'>Progress</h3>
                            <div className='w-full bg-slate-100 rounded-full h-2'>
                                <div
                                    className='bg-green-500 h-2 rounded-full transition-all'
                                    style={{
                                        width: `${Math.round((contract.milestones.filter(m => m.status === 'APPROVED').length / contract.milestones.length) * 100)}%`
                                    }}
                                />
                            </div>
                            <p className='text-slate-400 text-xs'>
                                {Math.round((contract.milestones.filter(m => m.status === 'APPROVED').length / contract.milestones.length) * 100)}% complete
                            </p>
                        </div>

                        {/* Disputes */}
                        {contract.disputes?.length > 0 && (
                            <div className='bg-red-50 border border-red-100 rounded-2xl p-5 flex flex-col gap-2'>
                                <h3 className='font-semibold text-red-700 text-sm'>Active Dispute</h3>
                                <p className='text-red-500 text-xs'>{contract.disputes[0].description}</p>
                                <Button
                                    size='sm'
                                    variant='outline'
                                    className='border-red-200 text-red-600 hover:bg-red-50'
                                    onClick={() => navigate(`/disputes/${contract.disputes[0].id}`)}
                                >
                                    View Dispute
                                </Button>
                            </div>
                        )}

                        {/* Fund Escrow */}
                        {user.role === 'CLIENT' && contract.status === 'DRAFT' && (
                            <Button onClick={() => navigate(`/contracts/${id}/payment`)}>
                                Fund Escrow
                            </Button>
                        )}

                    </div>
                </div>
            </main >
        </div >
    )
}

export default ContractDetail