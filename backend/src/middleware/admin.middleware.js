import prisma from '../db/client.js'

// Role is read from the DB, never from the JWT (tokens live 7 days and can be stale)
export const requireAdmin = async (req, res, next) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: { role: true }
        })
        if (user?.role !== 'ADMIN') return res.status(403).json({ error: 'Admin only' })
        next()
    } catch (error) {
        res.status(500).json({ error: 'Authorization check failed' })
    }
}