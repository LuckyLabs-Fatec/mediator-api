import { app } from './app'
import { env } from './config/env'

app.listen(env.port, () => {
  console.log(`Mediator API listening on port ${env.port}`)
  console.log(`Swagger docs available at http://localhost:${env.port}/docs`)
})
