import { useParams, useNavigate } from 'react-router-dom'
import Sidebar from './dashboard/Sidebar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

const MilestoneDetail = () => {
  const { id, milestoneId } = useParams()
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user'))

  // mock data
  const milestone = {
    title: 'Design mockups',
    description: 'Create wireframes and design mockups for all 5 pages',
    amount: 8000,
    dueDate: '2026-08-01',
    status: 'PENDING'
  }

  return (
    <div className='min-h-screen bg-slate-50 flex'>
      <Sidebar user={user} />
      <main className='flex-1 ml-64 px-8 py-8 max-w-2xl'>

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

          {/* Submission Form */}
          <div className='bg-white rounded-2xl p-6 flex flex-col gap-4'>
            <h2 className='font-semibold text-slate-900'>Your Submission</h2>

            <div className='flex flex-col gap-1'>
              <Label>Submission Notes</Label>
              <Textarea
                placeholder='Describe what you completed, any decisions you made, and what the client should check...'
                rows={5}
              />
            </div>

            <div className='flex flex-col gap-1'>
              <Label>Submission URL</Label>
              <Input
                type='url'
                placeholder='https://github.com/your-repo or https://figma.com/file/...'
              />
              <p className='text-slate-400 text-xs mt-1'>Link to your GitHub repo, Figma file, deployed app, or any relevant resource</p>
            </div>
          </div>

          {/* Actions */}
          <div className='flex items-center justify-end gap-3 pb-8'>
            <Button variant='outline' onClick={() => navigate(`/contracts/${id}`)}>
              Cancel
            </Button>
            <Button>
              Submit for Review
            </Button>
          </div>

        </div>
      </main>
    </div>
  )
}

export default MilestoneDetail