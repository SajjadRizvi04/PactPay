import { useNavigate } from 'react-router-dom'
import { LayoutDashboard, FileText, AlertCircle, LogOut } from 'lucide-react'

const Sidebar = ({ user }) => {
  const navigate = useNavigate()

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  return (
    <aside className='w-64 bg-primary min-h-screen flex flex-col fixed left-0 top-0'>

      {/* Logo */}
      <div className='px-6 py-6 border-b border-white/10'>
        <h1 className='text-xl font-bold text-white cursor-pointer' onClick={() => navigate('/')}>
          Pact<span className='text-accent'>Pay</span>
        </h1>
        <p className='text-white/50 text-xs mt-1'>{user?.role}</p>
      </div>

      {/* Nav Links */}
      <nav className='flex flex-col gap-1 px-3 py-4 flex-1'>
        {[
          { label: 'Dashboard', icon: <LayoutDashboard className='w-4 h-4' />, path: '/dashboard' },
          { label: 'Contracts', icon: <FileText className='w-4 h-4' />, path: '/contracts' },
          { label: 'Disputes', icon: <AlertCircle className='w-4 h-4' />, path: '/disputes' },
        ].map(item => (
          <button
            key={item.label}
            onClick={() => navigate(item.path)}
            className='flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition text-sm font-medium w-full text-left'
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </nav>

      {/* User + Logout */}
      <div className='px-3 py-4 border-t border-white/10 flex flex-col gap-2'>
        <div className='px-3 py-2'>
          <p className='text-white text-sm font-medium'>{user?.name}</p>
          <p className='text-white/40 text-xs'>{user?.email}</p>
        </div>
        <button
          onClick={handleLogout}
          className='flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition text-sm font-medium w-full text-left'
        >
          <LogOut className='w-4 h-4' />
          Logout
        </button>
      </div>

    </aside>
  )
}

export default Sidebar