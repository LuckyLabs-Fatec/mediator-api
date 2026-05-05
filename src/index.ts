import { GoogleGenAI } from '@google/genai'
import express, { Request, Response } from 'express'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
app.use(express.json())

const port = 3000

const apiKey = process.env.API_KEY_GOOGLEGENAI
if (!apiKey) {
  throw new Error('API_KEY_GOOGLEGENAI não definida no ambiente.')
}

const clientAI = new GoogleGenAI({ apiKey })

type PreApproveBody = {
  ideaDescription?: string
}

app.post('/pre-approve', async (req: Request<unknown, unknown, PreApproveBody>, res: Response) => {
  try {
    const { ideaDescription } = req.body

    if (!ideaDescription || !ideaDescription.trim()) {
      return res.status(400).send({
        error: 'ideaDescription é obrigatória.'
      })
    }

    const prompt = `Analise se a ideia a seguir é possível de ser programada:
Responda apenas
1) APROVADO ou REPROVADO
${ideaDescription}`

    const response = await clientAI.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt
    })

    const approved = response.text?.toUpperCase().includes('APROVADO') ?? false

    return res.send({ approved })
  } catch (error) {
    console.error(error)
    return res.status(500).send({ error: 'Erro ao processar pré-aprovação.' })
  }
})

app.listen(port, () => {
  console.log(`Mediator API listening on port ${port}`)
})
