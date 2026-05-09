import express from 'express'
import swaggerUi from 'swagger-ui-express'
import { router } from './routes'
import { swaggerSpec } from './config/swagger'
import { env } from './config/env'

const app = express()

app.use(express.json())

app.use((req, res, next) => {
  const requestOrigin = req.headers.origin
  const allowedOrigin = env.corsOrigin ?? requestOrigin ?? '*'

  if (requestOrigin) {
    res.header('Access-Control-Allow-Origin', allowedOrigin)
    res.header('Vary', 'Origin')
  } else if (allowedOrigin === '*') {
    res.header('Access-Control-Allow-Origin', '*')
  }

  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204)
  }

  return next()
})

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))
app.use(router)

export { app }
