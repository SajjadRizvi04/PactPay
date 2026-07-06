import {Router} from 'express'
import { fundEscrowHandler,verifyAndFundEscrowHandler,refundPaymentHandler,releasePaymentHandler } from './payment.controller.js'
import {authenticate} from '../../middleware/auth.middleware.js'
import { validate } from '../../middleware/validate.middleware.js'
import {fundEscrowSchema, releasePaymentSchema, refundSchema, verifyPaymentSchema} from './payment.schema.js'

const router = Router()

router.post('/fund',authenticate,validate(fundEscrowSchema),fundEscrowHandler)
router.post('/verify', authenticate, validate(verifyPaymentSchema),verifyAndFundEscrowHandler)
router.post('/release', authenticate, validate(releasePaymentSchema),releasePaymentHandler)
router.post('/refund', authenticate, validate(refundSchema), refundPaymentHandler)