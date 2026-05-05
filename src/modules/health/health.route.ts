import { Router } from 'express'
import https from 'https'
import { env } from '../../config/env'

const healthRouter = Router()

const maskKey = (key?: string | null) => {
  if (!key) return null
  if (key.length <= 8) return '****'
  return `${key.slice(0, 4)}...${key.slice(-4)}`
}

const httpGet = (url: string, timeout = 3000) =>
  new Promise<{ ok: boolean; status: number; error?: string; duration: number }>((resolve) => {
    const start = Date.now()
    const req = https.get(url, (res) => {
      const duration = Date.now() - start
      // consume response to free socket
      res.resume()
      resolve({ ok: !!(res.statusCode && res.statusCode < 400), status: res.statusCode ?? 0, duration })
    })

    req.on('error', (err: Error) => {
      resolve({ ok: false, status: 0, error: err.message, duration: Date.now() - start })
    })

    req.setTimeout(timeout, () => {
      req.destroy(new Error('timeout'))
    })
  })

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

/**
 * Diagnostic endpoint to help debug network / env issues on hosting platforms.
 * - Verifies API key presence (masked)
 * - Performs an outbound HTTPS check to google.com
 */
healthRouter.get('/health/diagnostic', async (_req, res) => {
  const diagnostics: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    nodeEnv: env.nodeEnv,
    port: env.port,
    apiKeyPresent: Boolean(env.googleGenAiApiKey),
    apiKeyMasked: maskKey(env.googleGenAiApiKey),
    fetchAvailable: typeof fetch === 'function'
  }

  try {
    diagnostics.httpsGoogle = await httpGet('https://www.google.com/generate_204', 3000)
  } catch (err) {
    diagnostics.httpsGoogle = { ok: false, status: 0, error: (err as Error).message }
  }

  res.status(200).json(diagnostics)
})
