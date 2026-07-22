
import { Route, Routes } from 'react-router-dom'
import './App.css'
import Home from './pages/Home'
import LogIn from './pages/auth/Login'
import SignUp from './pages/auth/SignUp'

function App() {
  

  return (
    <>
      <Routes>
        <Route path='/' element={<Home/>}/>
        <Route path='/login' element={<LogIn/>}/>
        <Route path='/signup' element={<SignUp/>}/>
      </Routes>
      
    </>
  )
}

export default App
