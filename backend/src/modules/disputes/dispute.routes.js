import { Router } from 'express'
import { create, get, resolve } from './dispute.controller.js'
import { authenticate } from '../../middleware/auth.middleware.js'
import { validate } from '../../middleware/validate.middleware.js'
import { createDisputeSchema, resolveDisputeSchema } from './dispute.schema.js'

const router = Router()

router.post('/', authenticate, validate(createDisputeSchema), create)
router.get('/:id', authenticate, get)
router.patch('/:id/resolve', authenticate, validate(resolveDisputeSchema), resolve)

export default router