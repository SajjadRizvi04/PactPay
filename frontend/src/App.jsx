
import { Route, Routes } from 'react-router-dom'
import './App.css'
import Home from './pages/Home'
import LogIn from './pages/auth/Login'
import SignUp from './pages/auth/SignUp'
import Dashboard from './pages/Dashboard'
import ContractNew from './pages/ContractNew'

function App() {
  

  return (
    <>
      <Routes>
        <Route path='/' element={<Home/>}/>
        <Route path='/login' element={<LogIn/>}/>
        <Route path='/signup' element={<SignUp/>}/>
        <Route path='/dashboard' element={<Dashboard/>}/>
        <Route path='contracts/new' element={<ContractNew/>}/>
      </Routes>
      
    </>
  )
}

export default App
