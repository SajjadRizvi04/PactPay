import app from './app.js'
import config from './src/config/index.js'
import { scheduleGhostCheck } from './src/jobs/ghost.worker.js'
import './src/jobs/ai.worker.js'
import './src/jobs/deadletter.worker.js'
// import { scheduleDisputeSweep } from './src/jobs/dispute.worker.js'



app.listen(config.PORT, async ()=>{
    console.log(`Server is running at ${config.PORT}`)
    await scheduleGhostCheck()
    console.log('Ghost detection Schedule')
    // await scheduleDisputeSweep()
    // console.log('Dispute sweep scheduled')
    console.log('AI worker started')
    console.log('Dead letter worker started')
})