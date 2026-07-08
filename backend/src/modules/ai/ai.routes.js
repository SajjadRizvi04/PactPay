import { Router } from "express"
import { assess } from "./ai.controller.js"
import { authenticate } from "../../middleware/auth.middleware.js"
import { validate } from "../../middleware/validate.middleware.js"
import { z } from 'zod'

const router = Router()

const assessSchema = z.object({
    contractId: z.string().uuid(),
    milestoneId: z.string().uuid()
})

router.post('/assess', authenticate, validate(assessSchema), assess)
export default router