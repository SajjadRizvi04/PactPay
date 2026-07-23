import { TrendingUp, Wallet, CheckCircle, FileText, Clock, DollarSign } from 'lucide-react'

const StatsCard = ({ contracts, role }) => {
  const totalContracts = contracts.length
  const activeContracts = contracts.filter(c => c.status === 'ACTIVE' || c.status === 'IN_PROGRESS').length
  const completedContracts = contracts.filter(c => c.status === 'COMPLETED').length
  const totalInEscrow = contracts
    .filter(c => c.status === 'ACTIVE' || c.status === 'IN_PROGRESS')
    .reduce((sum, c) => sum + Number(c.totalAmount), 0)
  const pendingSubmissions = contracts
    .reduce((sum, c) => sum + (c.milestones?.filter(m => m.status === 'PENDING').length || 0), 0)
  const completedMilestones = contracts
    .reduce((sum, c) => sum + (c.milestones?.filter(m => m.status === 'APPROVED').length || 0), 0)
  const totalEarned = contracts
    .filter(c => c.status === 'COMPLETED')
    .reduce((sum, c) => sum + Number(c.totalAmount), 0)

  const clientStats = [
    { title: 'Total Contracts', value: totalContracts, icon: <FileText className='w-4 h-4' />, color: 'bg-green-100 text-green-600' },
    { title: 'Active Contracts', value: activeContracts, icon: <TrendingUp className='w-4 h-4' />, color: 'bg-yellow-100 text-yellow-600' },
    { title: 'Total in Escrow', value: `₹${totalInEscrow.toLocaleString()}`, icon: <Wallet className='w-4 h-4' />, color: 'bg-green-100 text-green-600' },
    { title: 'Completed', value: completedContracts, icon: <CheckCircle className='w-4 h-4' />, color: 'bg-purple-100 text-purple-600' },
  ]

  const freelancerStats = [
    { title: 'Active Contracts', value: activeContracts, icon: <TrendingUp className='w-4 h-4' />, color: 'bg-yellow-100 text-yellow-600' },
    { title: 'Pending Submissions', value: pendingSubmissions, icon: <Clock className='w-4 h-4' />, color: 'bg-orange-100 text-orange-600' },
    { title: 'Completed Milestones', value: completedMilestones, icon: <CheckCircle className='w-4 h-4' />, color: 'bg-green-100 text-green-600' },
    { title: 'Total Earned', value: `₹${totalEarned.toLocaleString()}`, icon: <DollarSign className='w-4 h-4' />, color: 'bg-purple-100 text-purple-600' },
  ]

  const stats = role === 'CLIENT' ? clientStats : freelancerStats

  return (
    <div className='grid grid-cols-2 gap-3'>
      {stats.map((stat, i) => (
        <div key={i} className='bg-white rounded-2xl p-5 flex flex-col gap-3'>
          <div className='flex items-center justify-between'>
            <p className='text-slate-500 text-sm'>{stat.title}</p>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${stat.color}`}>
              {stat.icon}
            </div>
          </div>
          <p className='text-3xl font-bold text-slate-900'>{stat.value}</p>
        </div>
      ))}
    </div>
  )
}

export default StatsCard