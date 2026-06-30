import app from './app.js'
import config from './src/config/index.js'



app.listen(config.PORT, ()=>{
    console.log(`Server is running at ${config.PORT}`)
})