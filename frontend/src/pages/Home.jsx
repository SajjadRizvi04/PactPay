import { Button } from '@/components/ui/button'
import Navbar from '@/shared/Navbar'
import React from 'react'
import { Handshake, Lock, Bot, CheckCircle, Banknote, Ghost, BookOpen, Scale, Zap } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faGithub,
  faLinkedin,
} from "@fortawesome/free-brands-svg-icons";

const Home = () => {
  const features = [
    {
      icon: <Bot className='w-6 h-6 text-green-700' />,
      title: 'AI Milestone Assessment',
      desc: 'Gemini AI reads the milestone requirements and the freelancer\'s submission and gives an honest verdict — not just a rubber stamp.'
    },
    {
      icon: <Ghost className='w-6 h-6 text-green-700' />,
      title: 'Ghost Detection',
      desc: 'If a client goes silent for 14 days after a submission, funds auto-release to the freelancer. If a freelancer abandons, payments lock automatically.'
    },
    {
      icon: <BookOpen className='w-6 h-6 text-green-700' />,
      title: 'Full Audit Trail',
      desc: 'Every payment, AI verdict, and dispute is permanently recorded. Nothing gets deleted, nothing gets edited.'
    },
    {
      icon: <Lock className='w-6 h-6 text-green-700' />,
      title: 'Secure Escrow',
      desc: 'Funds are held securely via Razorpay until milestones are verified and approved. No risk for either party.'
    },
    {
      icon: <Scale className='w-6 h-6 text-green-700' />,
      title: 'Dispute Resolution',
      desc: 'When AI escalates or parties disagree, a structured dispute process kicks in with clear resolution paths.'
    },
    {
      icon: <Zap className='w-6 h-6 text-green-700' />,
      title: 'Instant Releases',
      desc: 'Once a milestone is approved, payment releases immediately. No waiting, no manual processing delays.'
    }
  ]
  const steps = [
    {
      icon: <Handshake className='w-6 h-6' />,
      title: 'Create a Contract',
      desc: 'Client defines milestones, payment amounts, and deadlines. Freelancer reviews and accepts the terms.'
    },
    {
      icon: <Lock className='w-6 h-6' />,
      title: 'Fund Escrow',
      desc: 'Client deposits funds securely via Razorpay. Money is held in escrow until work is verified.'
    },
    {
      icon: <Bot className='w-6 h-6' />,
      title: 'AI Assesses Work',
      desc: 'Freelancer submits the milestone. Gemini AI reviews the submission against the requirements.'
    },
    {
      icon: <CheckCircle className='w-6 h-6' />,
      title: 'You Decide',
      desc: 'AI gives a recommendation. The client makes the final call — approve, request changes, or dispute.'
    },
    {
      icon: <Banknote className='w-6 h-6' />,
      title: 'Payment Released',
      desc: 'Once approved, payment is instantly released to the freelancer from escrow.'
    }
  ]

  const navigate = useNavigate()
  return (
    <div className='min-h-screen bg-slate-50'>
      <Navbar />
      {/* Hero */}
      <section className='flex flex-col lg:flex-row items-center justify-between px-8 pt-40 pb-24 gap-12 max-w-7xl mx-auto mb-10'>

        {/* Left side - Text */}
        <div className='flex flex-col gap-6 max-w-xl'>
          <Badge variant='outline' className='w-fit'>AI-Powered Escrow</Badge>
          <h1 className='text-5xl font-bold text-slate-900 leading-tight'>
            Freelance work, without the trust issues
          </h1>
          <p className='text-lg text-slate-500'>
            PactPay holds funds in escrow and uses AI to assess milestone completion before any payment is released. Clients and freelancers both stay protected.
          </p>
          <div className='flex gap-3'>
            <Button size='lg' onClick={() => navigate('/register')}>Start for free</Button>
            <Button size='lg' variant='outline' onClick={() => navigate('/login')}>Login</Button>
          </div>
        </div>

        <div className='w-full max-w-lg'>
          <img
            src='/src/assets/hero.png'
            alt='PactPay dashboard'
            className='w-full rounded-2xl shadow-2xl border border-slate-200'
          />
        </div>

      </section>
      {/* How it works */}
      <section className='bg-primary py-24 px-8 '>
        <div className='max-w-7xl mx-auto flex flex-col gap-16'>

          {/* Heading */}
          <div className='text-center flex flex-col gap-3'>
            <h2 className='text-3xl font-bold text-white'>How it Works</h2>
            <p className='text-white/60 max-w-xl mx-auto text-sm'>
              From contract to payment in five simple steps. No chasing invoices, no trust issues.
            </p>
          </div>

          {/* Steps */}
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6'>
            {steps.map((step, i) => (
              <div key={i} className='flex flex-col gap-4'>

                {/* Number + Icon */}
                <div className='flex items-center gap-3'>
                  <div className='w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/50 text-xs font-bold flex-shrink-0'>
                    {i + 1}
                  </div>
                  {i < steps.length - 1 && (
                    <div className='hidden lg:block flex-1 h-px bg-white/10'></div>
                  )}
                </div>

                {/* Icon Box */}
                <div className='w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-white'>
                  {step.icon}
                </div>

                {/* Text */}
                <div className='flex flex-col gap-1'>
                  <h3 className='text-white font-semibold text-sm'>{step.title}</h3>
                  <p className='text-white/60 text-xs leading-relaxed'>{step.desc}</p>
                </div>

              </div>
            ))}
          </div>

        </div>
      </section>


      {/* Features */}
      <section className='bg-slate-50 py-24 px-8'>
        <div className='max-w-7xl mx-auto flex flex-col gap-12'>

          <div className='text-center flex flex-col gap-3'>
            <h2 className='text-3xl font-bold text-slate-900'>Why PactPay</h2>
            <p className='text-slate-500 max-w-xl mx-auto text-sm'>
              Built for freelancers and clients who want to work together without the usual trust problems.
            </p>
          </div>

          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
            {features.map((feature, i) => (
              <div
                key={i}
                className='bg-green-50 border border-green-100 rounded-2xl p-6 flex flex-col gap-4 hover:shadow-md hover:border-green-200 transition'
              >
                <div className='w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center'>
                  {feature.icon}
                </div>
                <div className='flex flex-col gap-1'>
                  <h3 className='font-semibold text-slate-900'>{feature.title}</h3>
                  <p className='text-slate-500 text-sm leading-relaxed'>{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>
      {/* Footer */}
      <footer className='bg-primary border-t border-white/10 py-4 px-8'>
        <div className='max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4'>

          <p className='text-white/40 text-sm'>
            © {new Date().getFullYear()} PactPay.
          </p>
          <p className='text-white'>
            Built by <span className='text-accent'>Sajjad Ali</span>
          </p>

          <div className='flex items-center gap-3'>
            <a href='https://github.com/SajjadRizvi04' target='_blank' className='w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition'>
              <FontAwesomeIcon color='white' icon={faGithub} />
            </a>
            <a href='https://www.linkedin.com/in/sajjad-ali-42a27028b/' target='_blank' className='w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition'>
            <FontAwesomeIcon color='white' icon={faLinkedin} />
            </a>
          </div>

        </div>
      </footer>
    </div>
  )
}

export default Home