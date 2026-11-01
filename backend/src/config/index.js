import dotenv from 'dotenv'
import {z} from 'zod'

dotenv.config()

const envSchema = z.object({
    DATABASE_URL: z.string(),
    JWT_SECRET: z.string(),
    PORT: z.string().default('3000'),
    RAZORPAY_KEY_ID: z.string(),
    RAZORPAY_KEY_SECRET: z.string(),
    GEMINI_API_KEY: z.string(),
    REDIS_URL: z.string(),
    DISPUTE_EVIDENCE_HOURS: z.coerce.number().positive().default(72),
    DISPUTE_APPEAL_HOURS: z.coerce.number().positive().default(48),
    DISPUTE_AUTO_CONFIDENCE: z.coerce.number().min(0).max(1).default(0.8),
    DISPUTE_AUTO_MAX_AMOUNT: z.coerce.number().positive().default(50000),
    DISPUTE_AI_MODEL: z.string().default('gemini-3.5-flash')
})

const parsed = envSchema.safeParse(process.env)

if(!parsed.success) {
    console.error('Invalid environment variable')
    console.error(parsed.error.format())
    process.exit(1)
}

export default parsed.data