import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import authRouter from './src/modules/auth/auth.routes.js'
import contractRouter from './src/modules/contracts/contract.routes.js'
import paymentRouter from './src/modules/payments/payment.routes.js'
import aiRouter from './src/modules/ai/ai.routes.js'
import disputeRouter from './src/modules/disputes/dispute.routes.js'
import userRouter from './src/modules/users/user.route.js'

const app = express()

app.use(helmet())
app.use(cors({
    origin: [
        'http://localhost:5173',
        'https://pactpay-frpntend.onrender.com'
    ],
    credentials: true
}))
app.use(express.json())

app.get('/health', (req,res) => {
    res.json({status: 'ok'})
})

app.use('/api/auth', authRouter)
app.use('/api/contracts', contractRouter)
app.use('/api/payments', paymentRouter)
app.use('/api/ai', aiRouter)
app.use('/api/disputes', disputeRouter)
app.use('/api/users', userRouter);

export default app