import dotenv from 'dotenv'
import {z} from 'zod'

dotenv.config()

const envSchema = z.object({
    DATABASE_URL: z.string(),
    JWT_SECRET: z.string(),
    PORT: z.string().default('3000'),
    RAZORPAY_KEY_ID: z.string(),
    RAZORPAY_KEY_SECRET: z.string()
})

const parsed = envSchema.safeParse(process.env)

if(!parsed.success) {
    console.error('Invalid environment variable')
    console.error(parsed.error.format())
    process.exit(1)
}

export default parsed.data