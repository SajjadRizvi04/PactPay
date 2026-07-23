import {Router} from 'express'
import {create,get,updateStatus, submit, getAll} from './contract.controller.js'
import {authenticate} from '../../middleware/auth.middleware.js'
import {validate} from '../../middleware/validate.middleware.js'
import { createContractSchema, updateContractStatusSchema} from './contract.schema.js'

const router = Router()

router.post('/', authenticate,validate(createContractSchema), create)
router.get('/:id', authenticate, get)
router.patch('/:id/status', authenticate, validate(updateContractStatusSchema),updateStatus)
router.post('/:contractId/milestones/:milestoneId/submit', authenticate,submit)
router.get('/',authenticate,getAll)
export default router