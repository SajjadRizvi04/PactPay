import app from './app.js'
import config from './src/config/index.js'
import { scheduleGhostCheck } from './src/jobs/ghost.worker.js'
import './src/jobs/ai.worker.js'
import './src/jobs/deadletter.worker.js'



app.listen(config.PORT, async ()=>{
    console.log(`Server is running at ${config.PORT}`)
    await scheduleGhostCheck()
    console.log('Ghost detection Schedule')
    console.log('AI worker started')
    console.log('Dead letter worker started')
})