import { Router } from 'express'

const healthRouter = Router()

/**
 * @openapi
 * /health:
 *   get:
 *     tags:
 *       - Health
 *     summary: Verifica disponibilidade da API
 *     responses:
 *       200:
 *         description: API saudável
 */
healthRouter.get('/health', (_req, res) => {
  res.status(200).send({ status: 'ok' })
})

export { healthRouter }
