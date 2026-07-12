import IORedis from 'ioredis'
import config from '../config/index.js'

export const connection = new IORedis(config.REDIS_URL, {
    maxRetriesPerRequest: null
})