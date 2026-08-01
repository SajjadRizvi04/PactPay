import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import axios from 'axios'
import Sidebar from './dashboard/Sidebar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Menu } from 'lucide-react'

const MilestoneDetail = () => {
  const { id, milestoneId } = useParams()
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user'))
  const token = localStorage.getItem('token')

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [milestone, setMilestone] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [submissionNotes, setSubmissionNotes] = useState('')
  const [submissionUrl, setSubmissionUrl] = useState('')

  useEffect(() => {
    const fetchMilestone = async () => {
      try {
        const { data } = await axios.get(`http://localhost:5000/api/contracts/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        const found = data.milestones.find(m => m.id === milestoneId)
        if (!found) throw new Error('Milestone not found')
        setMilestone(found)
      } catch (err) {
        setError(err.response?.data?.error || err.message || 'Failed to load milestone')
      } finally {
        setLoading(false)
      }
    }
    fetchMilestone()
  }, [id, milestoneId])

  const handleSubmit = async () => {
    if (!submissionNotes) {
      setError('Please add submission notes')
      return
    }
    setError('')
    setSubmitting(true)
    try {
      await axios.post(
        `http://localhost:5000/api/contracts/${id}/milestones/${milestoneId}/submit`,
        { submissionNotes, submissionUrl },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      navigate(`/contracts/${id}`)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit milestone')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
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
          <p className='text-slate-400'>Loading milestone...</p>
        </main>
      </div>
    )
  }

  if (error && !milestone) {
    return (
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
          <p className='text-red-400'>{error}</p>
        </main>
      </div>
    )
  }

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
            onClick={() => navigate(`/contracts/${id}`)}
            className='text-slate-400 text-sm hover:text-slate-600 transition w-fit'
          >
            ← Back to Contract
          </button>
          <h1 className='text-2xl font-bold text-slate-900'>Submit Milestone</h1>
          <p className='text-slate-500 text-sm'>Provide proof of completion for this milestone</p>
        </div>

        <div className='flex flex-col gap-6'>

          {/* Milestone Info */}
          <div className='bg-white rounded-2xl p-6 flex flex-col gap-3'>
            <h2 className='font-semibold text-slate-900'>Milestone Details</h2>
            <div className='flex flex-col gap-2'>
              <div className='flex items-center justify-between'>
                <span className='text-slate-400 text-xs'>Title</span>
                <span className='text-slate-900 text-sm font-medium'>{milestone.title}</span>
              </div>
              <div className='flex items-center justify-between'>
                <span className='text-slate-400 text-xs'>Amount</span>
                <span className='text-slate-900 text-sm font-medium'>₹{Number(milestone.amount).toLocaleString()}</span>
              </div>
              <div className='flex items-center justify-between'>
                <span className='text-slate-400 text-xs'>Due Date</span>
                <span className='text-slate-900 text-sm font-medium'>{new Date(milestone.dueDate).toLocaleDateString()}</span>
              </div>
              <div className='flex flex-col gap-1 mt-2'>
                <span className='text-slate-400 text-xs'>Requirements</span>
                <p className='text-slate-600 text-sm'>{milestone.description}</p>
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className='bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg'>
              {error}
            </div>
          )}

          {/* Submission Form */}
          <div className='bg-white rounded-2xl p-6 flex flex-col gap-4'>
            <h2 className='font-semibold text-slate-900'>Your Submission</h2>

            <div className='flex flex-col gap-1'>
              <Label>Submission Notes</Label>
              <Textarea
                placeholder='Describe what you completed, any decisions you made, and what the client should check...'
                rows={5}
                value={submissionNotes}
                onChange={e => setSubmissionNotes(e.target.value)}
              />
            </div>

            <div className='flex flex-col gap-1'>
              <Label>Submission URL</Label>
              <Input
                type='url'
                placeholder='https://github.com/your-repo or https://figma.com/file/...'
                value={submissionUrl}
                onChange={e => setSubmissionUrl(e.target.value)}
              />
              <p className='text-slate-400 text-xs mt-1'>Link to your GitHub repo, Figma file, deployed app, or any relevant resource</p>
            </div>
          </div>

          {/* Actions */}
          <div className='flex items-center justify-end gap-3 pb-8'>
            <Button variant='outline' onClick={() => navigate(`/contracts/${id}`)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit for Review'}
            </Button>
          </div>

        </div>
      </main>
    </div>
  )
}

export default MilestoneDetail