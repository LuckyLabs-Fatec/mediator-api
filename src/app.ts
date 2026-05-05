import express from 'express'
import swaggerUi from 'swagger-ui-express'
import { router } from './routes'
import { swaggerSpec } from './config/swagger'

const app = express()

app.use(express.json())
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))
app.use(router)

export { app }
