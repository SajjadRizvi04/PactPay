import {Router} from 'express'
import {authenticate} from '../../middleware/auth.middleware.js'
import prisma from '../../db/client.js'

const router = Router()

router.get('/search', authenticate, async (req,res)=> {
    try {
        const { email } = req.query
        if(!email) return res.status(400).json({error: 'Email is required'})

        const user = await prisma.user.findUnique({
            where: { email },
            select: {id: true, name: true, email: true, role: true}
        })
        if(!user) return res.status(404).json({error: 'User not found'})
        if(user.role !== 'FREELANCER') return res.status(400).json({error: 'User is not a freelancer'})

        res.json(user)
    } catch (error) {
        res.status(400).json({error: error.message})
    }
})

export default router