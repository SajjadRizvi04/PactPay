import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Navbar from '../../shared/Navbar'
import { useState } from 'react'
import axios from 'axios'

const Register = () => {
  const [userName, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate();

  const submitHandler = async () => {
    setError('')
    setLoading(true)
    try {
      const res = await axios.post('http://localhost:5000/api/auth/register', {
        name: userName, email, password, role
      })

      navigate('/login')

    } catch (error) {
      setError(error.response?.data?.error || 'Something went wrong')
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
            <CardTitle>Create an account</CardTitle>
            <CardDescription>Join PayPact as a client or freelancer</CardDescription>
          </CardHeader>
          <CardContent className='flex flex-col gap-4'>
            {error && (
              <div className='bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg'>
                {error}
              </div>
            )}
            <div className='flex flex-col gap-1'>
              <Label>Name</Label>
              <Input type='text' placeholder='Sajjad Ali' value={userName}
                onChange={(e) => setUsername(e.target.value)} />
            </div>
            <div className='flex flex-col gap-1'>
              <Label>Email</Label>
              <Input type='email' placeholder='you@example.com' value={email}
                onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className='flex flex-col gap-1'>
              <Label>Password</Label>
              <Input type='password' placeholder='••••••••' value={password}
                onChange={(e) => setPassword(e.target.value)} />
            </div>
            <div className='flex flex-col gap-1'>
              <Label>I am a</Label>
              <Select value={role} onValueChange={(value) => setRole(value)}>
                <SelectTrigger>
                  <SelectValue placeholder='Select your role' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='CLIENT'>Client</SelectItem>
                  <SelectItem value='FREELANCER'>Freelancer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className='w-full' onClick={submitHandler} disabled={loading} > {loading ? 'Creating an account' : 'Create account'}</Button>
            <p className='text-sm text-center text-slate-500'>
              Already have an account?{' '}
              <Link to='/login' className='text-slate-900 font-medium hover:underline'>
                Login
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Register