import dotenv from 'dotenv'

dotenv.config()

const requiredEnv = ['API_KEY_GOOGLEGENAI', 'DATABASE_URL'] as const

for (const key of requiredEnv) {
  if (!process.env[key]) {
    throw new Error(`Variável de ambiente obrigatória ausente: ${key}`)
  }
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 3000),
  googleGenAiApiKey: process.env.API_KEY_GOOGLEGENAI as string,
  databaseUrl: process.env.DATABASE_URL as string,
  corsOrigin: process.env.CORS_ORIGIN?.trim() || null
}
