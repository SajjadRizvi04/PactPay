import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import Sidebar from '../pages/dashboard/Sidebar'
import StatsCard from '../pages/dashboard/StatsCard'
import ContractsList from '../pages/dashboard/ContractsList.jsx'

const Dashboard = () => {
  const [contracts, setContracts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user'))
  const token = localStorage.getItem('token')

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
      <main className='flex-1 ml-64 px-8 py-8 flex flex-col gap-6'>

        {/* Header */}
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-2xl font-bold text-slate-900'>Dashboard</h1>
            <p className='text-slate-500 text-sm mt-1'>
              {user?.role === 'CLIENT'
                ? 'Manage your contracts and track milestone progress'
                : 'View your active contracts and submit milestone work'}
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
          <div className='bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg'>
            {error}
          </div>
        )}

        {/* Stats */}
        <StatsCard contracts={contracts} role={user?.role} />

        {/* Contracts */}
        <ContractsList contracts={contracts} loading={loading} role={user?.role} />

      </main>
    </div>
  )
}

export default Dashboard