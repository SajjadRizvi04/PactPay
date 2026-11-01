import {Queue} from 'bullmq'
import { connection } from './connection.js'

export const ghostQueue = new Queue('ghost', { connection })
export const aiQueue = new Queue('ai', { connection })
export const disputeQueue = new Queue('dispute', { connection })
