import Sidebar from '../pages/dashboard/Sidebar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Menu, Plus, Trash2, CheckCircle } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const ContractNew = () => {
  const user = JSON.parse(localStorage.getItem('user'))
  const token = localStorage.getItem('token')

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [totalAmount, setTotalAmount] = useState('')
  const [freelancer, setFreelancer] = useState('')
  const [freelancerEmail, setFreelancerEmail] = useState('')
  const [foundFreelancer, setFoundFreelancer] = useState(null)
  const [freelancerError, setFreelancerError] = useState('')
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const [milestones, setMilestones] = useState([
    { title: '', description: '', amount: '', dueDate: '' }
  ])
  const addMilestone = () => {
    setMilestones([...milestones, { title: '', description: '', amount: '', dueDate: '' }])
  }
  const removeMilestone = (index) => {
    if (milestones.length === 1) return
    setMilestones(milestones.filter((_, i) => i !== index))
  }
  const updateMilestone = (index, field, value) => {
    const updated = [...milestones]
    updated[index][field] = value
    setMilestones(updated)
  }
  const milestonesTotal = milestones.reduce((sum, m) => sum + (Number(m.amount) || 0), 0)
  const totalMatches = milestonesTotal === Number(totalAmount)


  const handleSubmit = async () => {
    setError('')

    if (!title || !description || !totalAmount || !freelancer) {
      setError('Please fill in all contract fields')
      return
    }

    if (!totalMatches) {
      setError(`Milestone amounts (₹${milestonesTotal.toLocaleString()}) must equal total amount (₹${Number(totalAmount).toLocaleString()})`)
      return
    }

    for (const m of milestones) {
      if (!m.title || !m.description || !m.amount || !m.dueDate) {
        setError('Please fill in all milestone fields')
        return
      }
    }

    setLoading(true)
    try {
      const { data } = await axios.post(`${VITE_API_URL}/api/contracts/`, {
        title,
        description,
        totalAmount,
        freelancerId: freelancer,
        milestones: milestones.map(m => ({
          title: m.title,
          description: m.description,
          amount: Number(m.amount),
          dueDate: new Date(m.dueDate).toISOString()
        }))
      },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      navigate(`/contracts/${data.id}`)
    } catch (error) {
      setError(error.response?.data?.error || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }
  const handleSearchFreelancer = async () => {
    setFreelancerError('')
    setFoundFreelancer(null)
    setSearching(true)
    try {
      const { data } = await axios.get(`${VITE_API_URL}/api/users/search?email=${freelancerEmail}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setFoundFreelancer(data)
      setFreelancer(data.id)
    } catch (err) {
      setFreelancerError(err.response?.data?.error || 'User not found')
    } finally {
      setSearching(false)
    }
  }
  return (
    <div className='min-h-screen bg-slate-50 flex'>
      <Sidebar user={user} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className='flex-1  px-8 py-8 max-w-3xl mx-auto'>

        {/* Header */}

        <div className='mb-8'>
          {/* Hamburger */}
          <button
            className='lg:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 mb-6'
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className='w-5 h-5 text-slate-600' />
          </button>
          <h1 className='text-2xl font-bold text-slate-900'>New Contract</h1>
          <p className='text-slate-500 text-sm mt-1'>Fill in the details and define your milestones</p>
        </div>
        {/* Error */}
        {error && (
          <div className='bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg mb-6'>
            {error}
          </div>
        )}


        <div className='flex flex-col gap-8'>

          {/* Contract Details */}
          <div className='bg-white rounded-2xl p-6 flex flex-col gap-4'>
            <h2 className='font-semibold text-slate-900'>Contract Details</h2>

            <div className='flex flex-col gap-1'>
              <Label>Title</Label>
              <Input placeholder='Build a portfolio website' value={title} onChange={e => setTitle(e.target.value)} />
            </div>

            <div className='flex flex-col gap-1'>
              <Label>Description</Label>
              <Textarea
                placeholder='Describe the project scope and deliverables...'
                rows={3}
                value={description}
                onChange={e => setDescription(e.target.value)}

              />
            </div>

            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
              <div className='flex flex-col gap-1'>
                <Label>Total Amount (₹)</Label>
                <Input
                  type='number'
                  placeholder='10000'
                  value={totalAmount}
                  onChange={e => setTotalAmount(Number(e.target.value))}
                />
              </div>
              <div className='flex flex-col gap-1'>
                <Label>Freelancer Email</Label>
                <div className='flex gap-2'>
                  <Input
                    placeholder='freelancer@email.com'
                    value={freelancerEmail}
                    onChange={e => setFreelancerEmail(e.target.value)}
                  />
                  <Button
                    type='button'
                    variant='outline'
                    onClick={handleSearchFreelancer}
                    disabled={searching}
                  >
                    {searching ? 'Searching...' : 'Search'}
                  </Button>
                </div>
                {freelancerError && (
                  <p className='text-red-400 text-xs mt-1'>{freelancerError}</p>
                )}
                {foundFreelancer && (
                  <div className='flex items-center gap-2 mt-1 bg-green-50 border border-green-100 rounded-lg px-3 py-2'>
                    <CheckCircle className='w-4 h-4 text-green-500 flex-shrink-0' />
                    <div>
                      <p className='text-sm font-medium text-slate-900'>{foundFreelancer.name}</p>
                      <p className='text-xs text-slate-400'>{foundFreelancer.email}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Milestones */}
          <div className='bg-white rounded-2xl p-6 flex flex-col gap-4'>
            <div className='flex items-center justify-between'>
              <div>
                <h2 className='font-semibold text-slate-900'>Milestones</h2>
                <p className='text-xs text-slate-400 mt-0.5'>Amounts must add up to total contract amount</p>
                Total: ₹{milestonesTotal.toLocaleString()}
                {totalAmount && (
                  <span className={totalMatches ? 'text-green-500 ml-2' : 'text-red-400 ml-2'}>
                    {totalMatches ? 'Matches total' : `₹${Number(totalAmount).toLocaleString()} required`}
                  </span>
                )}
              </div>
              <Button size='sm' variant='outline' onClick={addMilestone}>
                <Plus className='w-4 h-4 mr-1' />
                Add Milestone
              </Button>
            </div>

            <div className='flex flex-col gap-4'>
              {milestones.map((milestone, index) => (
                <div key={index} className='border border-slate-100 rounded-xl p-4 flex flex-col gap-3'>
                  <div className='flex items-center justify-between'>
                    <p className='text-sm font-medium text-slate-700'>Milestone {index + 1}</p>
                    {milestones.length > 1 && (
                      <button onClick={() => removeMilestone(index)}>
                        <Trash2 className='w-4 h-4 text-slate-400 hover:text-red-400 transition' />
                      </button>

                    )}

                  </div>

                  <div className='flex flex-col gap-1'>
                    <Label>Title</Label>
                    <Input
                      placeholder='Design mockups'
                      value={milestone.title}
                      onChange={e => updateMilestone(index, 'title', e.target.value)}
                    />
                  </div>

                  <div className='flex flex-col gap-1'>
                    <Label>Description</Label>
                    <Textarea
                      placeholder='What needs to be delivered...'
                      rows={2}
                      value={milestone.description}
                      onChange={e => updateMilestone(index, 'description', e.target.value)}
                    />
                  </div>

                  <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
                    <div className='flex flex-col gap-1'>
                      <Label>Amount (₹)</Label>
                      <Input
                        type='number'
                        placeholder='5000'
                        value={milestone.amount}
                        onChange={e => updateMilestone(index, 'amount', e.target.value)}
                      />
                    </div>
                    <div className='flex flex-col gap-1'>
                      <Label>Due Date</Label>
                      <Input
                        type='date'
                        value={milestone.dueDate}
                        onChange={e => updateMilestone(index, 'dueDate', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className='flex items-center justify-end gap-3 pb-8'>
            <Button variant='outline' onClick={() => navigate('/dashboard')}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? 'Creating...' : 'Create Contract'}
            </Button>
          </div>

        </div>
      </main>
    </div>
  )
}

export default ContractNew