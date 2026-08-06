import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import Sidebar from './dashboard/Sidebar'
import { Button } from '@/components/ui/button'
import { Menu, Plus } from 'lucide-react'
import { motion } from 'framer-motion'

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 }
}

const stagger = {
  visible: { transition: { staggerChildren: 0.06 } }
}
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
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const user = JSON.parse(localStorage.getItem('user'))
  const token = localStorage.getItem('token')

  const [contracts, setContracts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchContracts = async () => {
      try {
        const { data } = await axios.get(`${VITE_API_URL}/api/contracts`, {
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
      <Sidebar user={user} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className='flex-1  px-8 py-8'>

        {/* Hamburger */}
        <button
          className='lg:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 mb-6'
          onClick={() => setSidebarOpen(true)}
        >
          <Menu className='w-5 h-5 text-slate-600' />
        </button>
        {/* Header */}
        <motion.div
          className='flex items-center justify-between mb-8'
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >

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
        </motion.div>

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
          <motion.div
            className='flex flex-col gap-2'
            variants={stagger}
            initial='hidden'
            animate='visible'
          >
            {contracts.map(contract => (
              <motion.div
                key={contract.id}
                variants={fadeUp}
                transition={{ duration: 0.3 }}
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
              </motion.div>
            ))}
          </motion.div>
        )
        }

      </main >
    </div >
  )
}

export default Contracts