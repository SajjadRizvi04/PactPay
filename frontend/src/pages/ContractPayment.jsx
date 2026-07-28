import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import axios from 'axios'
import Sidebar from './dashboard/Sidebar'
import { Button } from '@/components/ui/button'

const ContractPayment = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user'))
  const token = localStorage.getItem('token')

  const [contract, setContract] = useState(null)
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState('')

  // Step 1 — fetch contract details so we know the amount to charge
  useEffect(() => {
    const fetchContract = async () => {
      try {
        const { data } = await axios.get(`http://localhost:5000/api/contracts/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        setContract(data)
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load contract')
      } finally {
        setLoading(false)
      }
    }
    fetchContract()
  }, [id])

  // Step 2 — load Razorpay script from CDN
  // We do this dynamically because Razorpay is not an npm package
  // It needs to be loaded as a script tag at runtime
  const loadRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.onload = () => resolve(true)
      script.onerror = () => resolve(false)
      document.body.appendChild(script)
    })
  }

  // Step 3 — main payment handler
  const handlePayment = async () => {
    setError('')
    setPaying(true)

    try {
      // load the razorpay script first
      // if it fails we stop here
      const loaded = await loadRazorpay()
      if (!loaded) {
        setError('Failed to load payment gateway. Check your internet connection.')
        setPaying(false)
        return
      }

      // call your backend to create a Razorpay order
      // backend returns { id, amount, currency } from Razorpay
      const { data: order } = await axios.post(
        'http://localhost:5000/api/payments/fund',
        {
          contractId: id,
          amount: Number(contract.totalAmount)
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      // configure the Razorpay popup
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,       // already in paise from backend
        currency: order.currency,
        name: 'PayPact',
        description: contract.title,
        order_id: order.id,

        // this function runs automatically when payment succeeds
        // Razorpay passes back three values needed for verification
        handler: async (response) => {
          try {
            // send the three values to your backend for verification
            // backend checks the HMAC signature to confirm payment is real
            // if valid, writes ESCROW_FUNDED to ledger and sets contract to ACTIVE
            await axios.post(
              'http://localhost:5000/api/payments/verify',
              {
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                contractId: id,
                amount: Number(contract.totalAmount)
              },
              { headers: { Authorization: `Bearer ${token}` } }
            )
            // payment verified — go back to contract page
            navigate(`/contracts/${id}`)
          } catch (err) {
            setError(err.response?.data?.error || 'Payment verification failed')
            setPaying(false)
          }
        },

        // this runs if user closes the popup without paying
        modal: {
          ondismiss: () => {
            setPaying(false)
          }
        },

        // pre-fill user details in the popup
        prefill: {
          name: user?.name,
          email: user?.email
        },

        theme: {
          color: '#0f172a'  // slate-900 to match your UI
        }
      }

      // create the Razorpay instance and open the popup
      const rzp = new window.Razorpay(options)
      rzp.open()

    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong')
      setPaying(false)
    }
  }

  if (loading) {
    return (
      <div className='min-h-screen bg-slate-50 flex'>
        <Sidebar user={user} />
        <main className='flex-1 ml-64 px-8 py-8 flex items-center justify-center'>
          <p className='text-slate-400'>Loading...</p>
        </main>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-slate-50 flex'>
      <Sidebar user={user} />
      <main className='flex-1 ml-64 px-8 py-8 max-w-xl'>

        {/* Header */}
        <div className='mb-8 flex flex-col gap-2'>
          <button
            onClick={() => navigate(`/contracts/${id}`)}
            className='text-slate-400 text-sm hover:text-slate-600 transition w-fit'
          >
            ← Back to Contract
          </button>
          <h1 className='text-2xl font-bold text-slate-900'>Fund Escrow</h1>
          <p className='text-slate-500 text-sm'>Deposit funds to activate this contract</p>
        </div>

        <div className='flex flex-col gap-4'>

          {/* Contract Summary */}
          <div className='bg-white rounded-2xl p-6 flex flex-col gap-3'>
            <h2 className='font-semibold text-slate-900'>Contract Summary</h2>
            <div className='flex flex-col gap-2'>
              <div className='flex items-center justify-between'>
                <span className='text-slate-400 text-xs'>Contract</span>
                <span className='text-slate-900 text-sm font-medium'>{contract.title}</span>
              </div>
              <div className='flex items-center justify-between'>
                <span className='text-slate-400 text-xs'>Milestones</span>
                <span className='text-slate-900 text-sm font-medium'>{contract.milestones.length} total</span>
              </div>
              <div className='flex items-center justify-between'>
                <span className='text-slate-400 text-xs'>Status</span>
                <span className='text-slate-900 text-sm font-medium'>{contract.status}</span>
              </div>
            </div>
          </div>

          {/* Amount */}
          <div className='bg-slate-900 rounded-2xl p-6 flex flex-col gap-2'>
            <p className='text-slate-400 text-xs'>Amount to deposit</p>
            <p className='text-white text-4xl font-bold'>₹{Number(contract.totalAmount).toLocaleString()}</p>
            <p className='text-slate-400 text-xs'>Held securely in escrow until milestones are approved</p>
            <div className='flex items-center gap-1.5 mt-2'>
              <div className='w-2 h-2 rounded-full bg-green-400'></div>
              <span className='text-green-400 text-xs'>Protected by PayPact</span>
            </div>
          </div>

          {/* How it works */}
          <div className='bg-white rounded-2xl p-6 flex flex-col gap-3'>
            <h2 className='font-semibold text-slate-900 text-sm'>How escrow works</h2>
            <div className='flex flex-col gap-2'>
              {[
                'You deposit the full contract amount now',
                'Funds are held securely — neither party can access them',
                'As each milestone is approved, that portion is released to the freelancer',
                'If a dispute arises, funds remain locked until resolved'
              ].map((item, i) => (
                <div key={i} className='flex items-start gap-3'>
                  <div className='w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 text-xs font-bold shrink-0 mt-0.5'>
                    {i + 1}
                  </div>
                  <p className='text-slate-500 text-xs'>{item}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className='bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg'>
              {error}
            </div>
          )}

          {/* Actions */}
          <div className='flex items-center justify-end gap-3 pb-8'>
            <Button variant='outline' onClick={() => navigate(`/contracts/${id}`)}>
              Cancel
            </Button>
            <Button onClick={handlePayment} disabled={paying}>
              {paying ? 'Processing...' : `Pay ₹${Number(contract.totalAmount).toLocaleString()}`}
            </Button>
          </div>

        </div>
      </main>
    </div>
  )
}

export default ContractPayment