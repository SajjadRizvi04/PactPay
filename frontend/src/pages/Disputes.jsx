import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import Sidebar from './dashboard/Sidebar'
import { AlertCircle, Menu } from 'lucide-react'
import { motion } from 'framer-motion'

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 }
}

const stagger = {
  visible: { transition: { staggerChildren: 0.06 } }
}

const statusColors = {
  OPEN: 'text-red-500',
  UNDER_REVIEW: 'text-yellow-500',
  RESOLVED_CLIENT: 'text-green-500',
  RESOLVED_FREELANCER: 'text-green-500'
}

const Disputes = () => {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user'))
  const token = localStorage.getItem('token')

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [disputes, setDisputes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchDisputes = async () => {
      try {
        const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/disputes`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        setDisputes(data)
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load disputes')
      } finally {
        setLoading(false)
      }
    }
    fetchDisputes()
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
          className='mb-8'
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className='text-2xl font-bold text-slate-900'>Disputes</h1>
          <p className='text-slate-500 text-sm mt-1'>All disputes related to your contracts</p>
        </motion.div>

        {/* Error */}
        {
          error && (
            <div className='bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg mb-6'>
              {error}
            </div>
          )
        }

        {/* Loading */}
        {loading && <p className='text-slate-400 text-sm'>Loading disputes...</p>}

        {/* Empty */}
        {
          !loading && disputes.length === 0 && (
            <div className='flex flex-col items-center py-24 gap-2'>
              <AlertCircle className='w-8 h-8 text-slate-300' />
              <p className='text-slate-400 text-sm'>No disputes found</p>
            </div>
          )
        }

        {/* List */}
        {
          !loading && disputes.length > 0 && (
            <motion.div
              className='flex flex-col gap-2'
              variants={stagger}
              initial='hidden'
              animate='visible'
            >
              {disputes.map(dispute => (
                <motion.div
                variants={fadeUp}
                key={dispute.id}
                onClick={() => navigate(`/disputes/${dispute.id}`)}
                transition={{ duration: 0.3 }}
                className='bg-white rounded-2xl px-5 py-4 flex items-center justify-between cursor-pointer hover:shadow-sm transition'
                >
                
            <div className='flex flex-col gap-0.5'>
              <p className='text-slate-900 font-medium text-sm'>{dispute.contract?.title}</p>
              <p className='text-slate-400 text-xs'>{dispute.reason.replace('_', ' ')}</p>
            </div>
            <div className='flex items-center gap-6'>
              <p className='text-slate-400 text-xs'>
                {new Date(dispute.createdAt).toLocaleDateString()}
              </p>
              <p className={`text-xs font-medium ${statusColors[dispute.status]}`}>
                {dispute.status.replace('_', ' ')}
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

export default Disputes