import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import authRouter from './src/modules/auth/auth.routes.js'

const app = express()

app.use(helmet())
app.use(cors())
app.use(express.json())

app.get('/health', (req,res) => {
    res.json({status: 'ok'})
})

app.use('/api/auth', authRouter)

export default app