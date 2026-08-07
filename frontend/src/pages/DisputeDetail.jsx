import { useParams, useNavigate } from 'react-router-dom'
import Sidebar from './dashboard/Sidebar'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertCircle, Menu } from 'lucide-react'
import { useEffect, useState } from 'react'
import axios from 'axios'

const statusColors = {
  OPEN: 'bg-red-100 text-red-600',
  UNDER_REVIEW: 'bg-yellow-100 text-yellow-600',
  RESOLVED_CLIENT: 'bg-green-100 text-green-600',
  RESOLVED_FREELANCER: 'bg-green-100 text-green-600'
}

const DisputeDetail = () => {
  const { id } = useParams()
  const token = localStorage.getItem('token')
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user'))

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [dispute, setDispute] = useState()
  const [resolution, setResolution] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    const fetchDispute = async () => {
      try {
        const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/disputes/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        setDispute(data)
      } catch (error) {
        setError(error.response?.data?.error || 'Failed to get Disputes')
      } finally {
        setLoading(false)
      }
    }
    fetchDispute()
  }, [id])

  const handleResolve = async () => {
    setError('')
    try {
      await axios.patch(`${import.meta.env.VITE_API_URL}/api/disputes/${id}/resolve`,
        { resolution, notes },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      navigate('/dashboard')
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to send data, try again')
    }
  }
  if (loading) return (
    <div className='min-h-screen bg-slate-50 flex'>
      <Sidebar user={user} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className='flex-1  px-8 py-8 flex items-center justify-center'>
        {/* Hamburger */}
        <button
          className='lg:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 mb-6'
          onClick={() => setSidebarOpen(true)}
        >
          <Menu className='w-5 h-5 text-slate-600' />
        </button>
        <p className='text-slate-400'>Loading...</p>
      </main>
    </div>
  )

  return (
    <div className='min-h-screen bg-slate-50 flex'>
      <Sidebar user={user} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className='flex-1  px-8 py-8 max-w-2xl'>
        {/* Hamburger */}
        <button
          className='lg:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 mb-6'
          onClick={() => setSidebarOpen(true)}
        >
          <Menu className='w-5 h-5 text-slate-600' />
        </button>
        {/* Header */}
        <div className='mb-8 flex flex-col gap-2'>
          <button
            onClick={() => navigate(`/contracts/${dispute.contractId}`)}
            className='text-slate-400 text-sm hover:text-slate-600 transition w-fit'
          >
            ← Back to Contract
          </button>
          <div className='flex items-center gap-3'>
            <AlertCircle className='w-6 h-6 text-red-500' />
            <h1 className='text-2xl font-bold text-slate-900'>Dispute</h1>
          </div>
          <p className='text-slate-500 text-sm'>Review the dispute details and resolve if you are the client</p>
        </div>

        <div className='flex flex-col gap-6'>

          {/* Dispute Info */}
          <div className='bg-white rounded-2xl p-6 flex flex-col gap-4'>
            <div className='flex items-center justify-between'>
              <h2 className='font-semibold text-slate-900'>Dispute Details</h2>
              <span className={`text-xs px-3 py-1 rounded-full font-medium ${statusColors[dispute.status]}`}>
                {dispute.status.replace('_', ' ')}
              </span>
            </div>
            <div className='flex flex-col gap-3'>
              <div className='flex items-center justify-between'>
                <span className='text-slate-400 text-xs'>Contract</span>
                <span className='text-slate-900 text-sm font-medium'>{dispute.contract.title}</span>
              </div>
              <div className='flex items-center justify-between'>
                <span className='text-slate-400 text-xs'>Reason</span>
                <span className='text-slate-900 text-sm font-medium'>{dispute.reason.replace('_', ' ')}</span>
              </div>
              <div className='flex flex-col gap-1 mt-1'>
                <span className='text-slate-400 text-xs'>Description</span>
                <p className='text-slate-600 text-sm'>{dispute.description}</p>
              </div>
            </div>
          </div>

          {/* Resolution — only show if dispute is open and user is client */}
          {dispute.status === 'OPEN' && user?.role === 'CLIENT' && (
            <div className='bg-white rounded-2xl p-6 flex flex-col gap-4'>
              <h2 className='font-semibold text-slate-900'>Resolve Dispute</h2>
              <p className='text-slate-400 text-xs'>
                Resolving in favor of the freelancer releases payment. Resolving in favor of the client refunds the milestone amount.
              </p>

              <div className='flex flex-col gap-1'>
                <Label>Resolution</Label>
                <Select onValueChange={setResolution}>
                  <SelectTrigger>
                    <SelectValue placeholder='Who wins the dispute?' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='RESOLVED_FREELANCER'>Freelancer wins — release payment</SelectItem>
                    <SelectItem value='RESOLVED_CLIENT'>Client wins — refund payment</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className='flex flex-col gap-1'>
                <Label>Resolution Notes</Label>
                <Textarea
                  placeholder='Explain your decision...'
                  rows={4}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </div>

              <div className='flex items-center justify-end gap-3'>
                <Button variant='outline' onClick={() => navigate(`/contracts/${dispute.contractId}`)}>
                  Cancel
                </Button>
                <Button onClick={handleResolve}>
                  Resolve Dispute
                </Button>
              </div>
            </div>
          )}

          {/* Already resolved */}
          {dispute.status !== 'OPEN' && (
            <div className='bg-green-50 border border-green-100 rounded-2xl p-6 flex flex-col gap-2'>
              <h2 className='font-semibold text-green-700 text-sm'>Dispute Resolved</h2>
              <p className='text-green-600 text-xs'>{dispute.resolution}</p>
              {dispute.resolvedAt && (
                <p className='text-green-400 text-xs'>
                  Resolved on {new Date(dispute.resolvedAt).toLocaleDateString()}
                </p>
              )}
            </div>
          )}

        </div>
      </main>
    </div>
  )
}

export default DisputeDetail