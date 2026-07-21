import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Navbar from '../components/Navbar.jsx'

const Register = () => {
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
            <div className='flex flex-col gap-1'>
              <Label>Name</Label>
              <Input type='text' placeholder='Sajjad Ali' />
            </div>
            <div className='flex flex-col gap-1'>
              <Label>Email</Label>
              <Input type='email' placeholder='you@example.com' />
            </div>
            <div className='flex flex-col gap-1'>
              <Label>Password</Label>
              <Input type='password' placeholder='••••••••' />
            </div>
            <div className='flex flex-col gap-1'>
              <Label>I am a</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder='Select your role' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='CLIENT'>Client</SelectItem>
                  <SelectItem value='FREELANCER'>Freelancer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className='w-full'>Create account</Button>
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