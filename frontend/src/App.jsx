
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

function App() {
  

  return (
    <>
      <Routes>
        <Route path='/' element={<Home/>}/>
        <Route path='/login' element={<LogIn/>}/>
        <Route path='/signup' element={<SignUp/>}/>
        <Route path='/dashboard' element={<Dashboard/>}/>
        <Route path='/contracts/new' element={<ContractNew/>}/>
        <Route path= '/contracts/:id' element={<ContractDetail/>}/>
        <Route path='/contracts/:id/milestones/:milestoneId' element={<MilestoneDetail />} />
        <Route path='/contracts/:id/payment' element={<ContractPayment />} />
        <Route path='/disputes/:id' element={<DisputeDetail />} />
      </Routes>
      
    </>
  )
}

export default App
