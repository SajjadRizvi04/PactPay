import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'

const statusColors = {
  DRAFT: 'text-slate-400',
  ACTIVE: 'text-blue-500',
  IN_PROGRESS: 'text-yellow-500',
  COMPLETED: 'text-green-500',
  DISPUTED: 'text-red-500',
  CANCELLED: 'text-slate-400'
}

const progressPercent = (milestones = []) => {
  if (milestones.length === 0) return 0
  const approved = milestones.filter(m => m.status === 'APPROVED').length
  return Math.round((approved / milestones.length) * 100)
}

const ContractsList = ({ contracts, loading, role }) => {
  const navigate = useNavigate()

  return (
    <div className='flex flex-col gap-4'>

      {/* Header */}
      <div className='flex items-center justify-between'>
        <h2 className='text-lg font-bold text-slate-900'>
          {role === 'CLIENT' ? 'Your Contracts' : 'Assigned Contracts'}
        </h2>
        {role === 'CLIENT' && (
          <Button size='sm' variant='outline' onClick={() => navigate('/contracts/new')}>
            New Contract
          </Button>
        )}
      </div>

      {loading && <p className='text-slate-400 text-sm'>Loading...</p>}

      {!loading && contracts.length === 0 && (
        <div className='flex flex-col items-center py-12 gap-3'>
          <p className='text-slate-400 text-sm'>
            {role === 'CLIENT' ? "No contracts yet" : "No contracts assigned yet"}
          </p>
          {role === 'CLIENT' && (
            <Button onClick={() => navigate('/contracts/new')}>
              Create your first contract
            </Button>
          )}
        </div>
      )}

      {!loading && contracts.length > 0 && (
        <div className='flex flex-col gap-2'>
          {contracts.map(contract => {
            const progress = progressPercent(contract.milestones)
            return (
              <div
                key={contract.id}
                onClick={() => navigate(`/contracts/${contract.id}`)}
                className='bg-white rounded-2xl px-5 py-4 flex flex-col gap-3 cursor-pointer hover:shadow-sm transition'
              >
                <div className='flex items-center justify-between'>
                  <div className='flex flex-col gap-0.5'>
                    <p className='text-slate-900 font-medium text-sm'>{contract.title}</p>
                    <p className={`text-xs font-medium ${statusColors[contract.status]}`}>
                      {contract.status.replace('_', ' ')}
                    </p>
                  </div>
                  <p className='text-slate-900 font-bold'>
                    ₹{Number(contract.totalAmount).toLocaleString()}
                  </p>
                </div>

                {/* Progress bar — only show if in progress */}
                {contract.status === 'IN_PROGRESS' && (
                  <div className='w-full bg-slate-100 rounded-full h-1.5'>
                    <div
                      className='bg-green-500 h-1.5 rounded-full transition-all'
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

    </div>
  )
}

export default ContractsList