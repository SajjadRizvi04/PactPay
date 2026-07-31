import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import Sidebar from './dashboard/Sidebar'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

const statusColors = {
  DRAFT: 'text-slate-400',
  ACTIVE: 'text-blue-500',
  IN_PROGRESS: 'text-yellow-500',
  COMPLETED: 'text-green-500',
  DISPUTED: 'text-red-500',
  CANCELLED: 'text-slate-400'
}

const Contracts = () => {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user'))
  const token = localStorage.getItem('token')

  const [contracts, setContracts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchContracts = async () => {
      try {
        const { data } = await axios.get('http://localhost:5000/api/contracts', {
          headers: { Authorization: `Bearer ${token}` }
        })
        setContracts(data)
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load contracts')
      } finally {
        setLoading(false)
      }
    }
    fetchContracts()
  }, [])

  return (
    <div className='min-h-screen bg-slate-50 flex'>
      <Sidebar user={user} />
      <main className='flex-1 ml-64 px-8 py-8'>

        {/* Header */}
        <div className='flex items-center justify-between mb-8'>
          <div>
            <h1 className='text-2xl font-bold text-slate-900'>Contracts</h1>
            <p className='text-slate-500 text-sm mt-1'>
              {user?.role === 'CLIENT' ? 'Contracts you created' : 'Contracts you are working on'}
            </p>
          </div>
          {user?.role === 'CLIENT' && (
            <Button onClick={() => navigate('/contracts/new')}>
              <Plus className='w-4 h-4 mr-2' />
              New Contract
            </Button>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className='bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg mb-6'>
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && <p className='text-slate-400 text-sm'>Loading contracts...</p>}

        {/* Empty */}
        {!loading && contracts.length === 0 && (
          <div className='flex flex-col items-center py-24 gap-4'>
            <p className='text-slate-400 text-sm'>No contracts yet</p>
            {user?.role === 'CLIENT' && (
              <Button onClick={() => navigate('/contracts/new')}>
                Create your first contract
              </Button>
            )}
          </div>
        )}

        {/* List */}
        {!loading && contracts.length > 0 && (
          <div className='flex flex-col gap-2'>
            {contracts.map(contract => (
              <div
                key={contract.id}
                onClick={() => navigate(`/contracts/${contract.id}`)}
                className='bg-white rounded-2xl px-5 py-4 flex items-center justify-between cursor-pointer hover:shadow-sm transition'
              >
                <div className='flex flex-col gap-0.5'>
                  <p className='text-slate-900 font-medium text-sm'>{contract.title}</p>
                  <p className='text-slate-400 text-xs'>{contract.milestones?.length || 0} milestones</p>
                </div>
                <div className='flex items-center gap-6'>
                  <p className='text-slate-900 font-bold text-sm'>
                    ₹{Number(contract.totalAmount).toLocaleString()}
                  </p>
                  <p className={`text-xs font-medium ${statusColors[contract.status]}`}>
                    {contract.status.replace('_', ' ')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

      </main>
    </div>
  )
}

export default Contracts