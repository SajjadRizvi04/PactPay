import app from './app.js'
import config from './src/config/index.js'
import { scheduleGhostCheck } from './src/jobs/ghost.worker.js'



app.listen(config.PORT, async ()=>{
    console.log(`Server is running at ${config.PORT}`)
    await scheduleGhostCheck()
    console.log('Ghost detection Schedule')
})