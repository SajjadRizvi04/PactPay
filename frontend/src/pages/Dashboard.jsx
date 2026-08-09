import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { Button } from '@/components/ui/button'
import { Plus, Menu } from 'lucide-react'
import Sidebar from '../pages/dashboard/Sidebar'
import StatsCard from '../pages/dashboard/StatsCard'
import ContractsList from '../pages/dashboard/ContractsList.jsx'
import { motion } from 'framer-motion'

const Dashboard = () => {
  const [contracts, setContracts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user'))
  const token = localStorage.getItem('token')

  useEffect(() => {
    const fetchContracts = async () => {
      try {
        const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/contracts`, {
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
    <div className='min-h-screen bg-slate-50 flex overflow-x-hidden'>
      <Sidebar user={user} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className='flex-1  px-4 sm:px-8 py-6 sm:py-8 flex flex-col gap-6 w-full min-w-0'>

        {/* Header */}
        <motion.div 
          className='flex items-center justify-between'
          initial={{opacity:0, y:-10}}
          animate={{opacity:1,y:0}}
          transition={{duration: 0.4}}
        >
          <div className='flex items-center gap-3'>

            {/* Hamburger — mobile only */}
            <button
              className='lg:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200'
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className='w-5 h-5 text-slate-600' />
            </button>

            <div>
              <h1 className='text-xl sm:text-2xl font-bold text-slate-900'>Dashboard</h1>
              <p className='text-slate-500 text-xs sm:text-sm mt-0.5 hidden sm:block'>
                {user?.role === 'CLIENT'
                  ? 'Manage your contracts and track milestone progress'
                  : 'View your active contracts and submit milestone work'}
              </p>
            </div>
          </div>

          
        </motion.div>

        {/* Error */}
        {error && (
          <div className='bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg'>
            {error}
          </div>
        )}

        {/* Stats */}
        <motion.div
          initial={{opacity:0,y:20}}
          animate={{opacity:1,y:0}}
          transition={{duration: 0.4, delay: 0.2}}  
        >
          <StatsCard contracts={contracts} role={user?.role} />

        </motion.div>

        {/* Contracts */}
        <motion.div
          initial={{opacity:0,x:20}}
          animate={{opacity:1,x:0}}
          transition={{duration: 0.4, delay: 0.2}}  
        >
          <ContractsList contracts={contracts} loading={loading} role={user?.role} />

        </motion.div>

      </main>
    </div>
  )
}

export default Dashboard