
import { Route, Routes } from 'react-router-dom'
import './App.css'
import Home from './pages/Home'
import LogIn from './pages/auth/Login'
import SignUp from './pages/auth/SignUp'
import Dashboard from './pages/Dashboard'
import ContractNew from './pages/ContractNew'
import ContractDetail from './pages/ContractDetail'
import MilestoneDetail from './pages/MilestoneDetail'
import ContractPayment from './pages/ContractPayment'
import DisputeDetail from './pages/DisputeDetail'
import Disputes from './pages/Disputes'
import Contracts from './pages/Contracts'

import { Navigate } from 'react-router-dom'

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token')
  if (!token) return <Navigate to='/login' />
  return children
}
function App() {
  

  return (
    <>
      <Routes>
        <Route path='/' element={<Home/>}/>
        <Route path='/login' element={<LogIn/>}/>
        <Route path='/signup' element={<SignUp/>}/>
        <Route path='/dashboard' element={<ProtectedRoute><Dashboard/></ProtectedRoute>}/>
        <Route path='/contracts/new' element={<ProtectedRoute><ContractNew/></ProtectedRoute>}/>
        <Route path= '/contracts/:id' element={<ProtectedRoute><ContractDetail/></ProtectedRoute>}/>
        <Route path='/contracts/:id/milestones/:milestoneId' element={<ProtectedRoute><MilestoneDetail /></ProtectedRoute>} />
        <Route path='/contracts/:id/payment' element={<ProtectedRoute><ContractPayment /></ProtectedRoute>} />
        <Route path='/disputes/:id' element={<ProtectedRoute><DisputeDetail /></ProtectedRoute>} />
        <Route path='/disputes' element={<ProtectedRoute><Disputes/></ProtectedRoute>}/>
        <Route path='/contracts' element={<ProtectedRoute><Contracts/></ProtectedRoute>}/>
        <Route path='*' element={<Navigate to='/' />}/>
      </Routes>
      
    </>
  )
}

export default App
