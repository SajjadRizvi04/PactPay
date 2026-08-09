import { useNavigate } from 'react-router-dom'
import { LayoutDashboard, FileText, AlertCircle, LogOut, X } from 'lucide-react'

const Sidebar = ({ user, open, onClose }) => {
  const navigate = useNavigate()

  const handleNavigate = (path) => {
    navigate(path)
    onClose?.()
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
    onClose?.()
  }

  return (
    <>
      {/* Overlay — mobile only */}
      {open && (
        <div
          className='fixed inset-0 bg-black/50 z-40 lg:hidden'
          onClick={onClose}
        />
      )}

      <aside className={`
        h-full fixed lg:h-auto
        w-64 bg-primary flex flex-col self-stretch 
        transition-transform duration-300
        ${open ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto z-50
      `}>

        {/* Logo */}
        <div className='px-6 py-6 border-b border-white/10 flex items-center justify-between'>
          <h1 className='text-xl font-bold text-white cursor-pointer' onClick={() => handleNavigate('/')}>
            Pact<span className='text-accent'>Pay</span>
          </h1>
          <button onClick={onClose} className='lg:hidden text-white/50 hover:text-white'>
            <X className='w-5 h-5' />
          </button>
        </div>
        <p className='text-white/50 text-xs px-6 pt-2'>{user?.role}</p>

        {/* Nav Links */}
        <nav className='flex flex-col gap-1 px-3 py-4 flex-1'>
          {[
            { label: 'Dashboard', icon: <LayoutDashboard className='w-4 h-4' />, path: '/dashboard' },
            { label: 'Contracts', icon: <FileText className='w-4 h-4' />, path: '/contracts' },
            { label: 'Disputes', icon: <AlertCircle className='w-4 h-4' />, path: '/disputes' },
          ].map(item => (
            <button
              key={item.label}
              onClick={() => handleNavigate(item.path)}
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
    </>
  )
}

export default Sidebar