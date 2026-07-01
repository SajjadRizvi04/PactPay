import {Router} from 'express'
import { register,login } from './auth.controller.js'
import {validate} from '../../middleware/validate.middleware.js'
import { registerSchema, loginSchema } from './auth.schema.js'

const router = Router();

router.post('/register', validate(registerSchema), register)
router.post('/login', validate(loginSchema), login)

export default router