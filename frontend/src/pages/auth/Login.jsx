import { useNavigate, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import Navbar from '../../shared/Navbar'
import { useState } from 'react'
import axios from 'axios'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async () => {
    setError('')
    setLoading(true)
    try {
        const {data} = await axios.post('http://localhost:5000/api/auth/login', {email,password})
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
        navigate('/dashboard')
    } catch (error) {
        setError(error.response?.data?.error || 'Something went Wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='min-h-screen bg-slate-50'>
      <Navbar />
      <div className='flex items-center justify-center min-h-screen'>
        <Card className='w-full max-w-md'>
          <CardHeader>
            <CardTitle>Welcome back</CardTitle>
            <CardDescription>Login to your PactPay account</CardDescription>
          </CardHeader>
          <CardContent className='flex flex-col gap-4'>
            {error && (
              <div className='bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg'>
                {error}
              </div>
            )}
            <div className='flex flex-col gap-1'>
              <Label>Email</Label>
              <Input
                type='email'
                placeholder='you@example.com'
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
            <div className='flex flex-col gap-1'>
              <Label>Password</Label>
              <Input
                type='password'
                placeholder='••••••••'
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
            <Button onClick={handleLogin} disabled={loading} className='w-full'>
              {loading ? 'Logging in...' : 'Login'}
            </Button>
            <p className='text-sm text-center text-slate-500'>
              Don't have an account?{' '}
              <Link to='/register' className='text-slate-900 font-medium hover:underline'>
                Register
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Login