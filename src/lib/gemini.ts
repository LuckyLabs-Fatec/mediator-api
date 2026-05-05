import { GoogleGenAI } from '@google/genai'
import { env } from '../config/env'
import type { GeminiReviewResult } from '../modules/pre-approval/preApproval.types'

const clientAI = new GoogleGenAI({ apiKey: env.googleGenAiApiKey })

const tokenize = (text: string) =>
  text
    .toLowerCase()
    .split(/[^a-zA-ZÀ-ÿ0-9]+/)
    .filter((token) => token.length >= 3)

const buildFallbackReview = (params: { ideaDescription: string; courseName: string; courseDescription: string }): GeminiReviewResult => {
  const ideaTokens = tokenize(params.ideaDescription)
  const courseText = `${params.courseName} ${params.courseDescription}`.toLowerCase()
  const matchedTokens = ideaTokens.filter((token) => courseText.includes(token))

  if (matchedTokens.length > 0) {
    return {
      compatible: true,
      opinion: `Análise automática: a ideia apresenta correspondência com o curso (${matchedTokens.slice(0, 3).join(', ')}). A consulta ao Gemini não pôde ser concluída, então esta resposta foi gerada com fallback local.`
    }
  }

  return {
    compatible: false,
    opinion: 'A consulta ao Gemini não pôde ser concluída e não houve correspondência textual suficiente para um fallback confiável.'
  }
}

const parseGeminiJson = (rawText: string): GeminiReviewResult | null => {
  const cleaned = rawText
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim()

  const firstBrace = cleaned.indexOf('{')
  const lastBrace = cleaned.lastIndexOf('}')

  if (firstBrace === -1 || lastBrace === -1 || firstBrace >= lastBrace) {
    return null
  }

  const jsonCandidate = cleaned.slice(firstBrace, lastBrace + 1)

  try {
    const parsed = JSON.parse(jsonCandidate) as Partial<GeminiReviewResult>
    if (typeof parsed.compatible !== 'boolean' || typeof parsed.opinion !== 'string') {
      return null
    }

    return {
      compatible: parsed.compatible,
      opinion: parsed.opinion
    }
  } catch {
    return null
  }
}

export const geminiClient = {
  async reviewCourseIdea(params: { ideaDescription: string; courseName: string; courseDescription: string }): Promise<GeminiReviewResult> {
    const prompt = `
Você é um avaliador técnico de ideias de projeto para cursos.

Contexto do curso:
- Nome: ${params.courseName}
- Descrição: ${params.courseDescription}

Ideia submetida:
${params.ideaDescription}

Tarefa:
1) Avalie se a ideia é compatível com o contexto do curso.
2) Considere viabilidade de implementação de forma objetiva.
3) Retorne SOMENTE JSON válido no formato:
{"compatible": true|false, "opinion": "texto curto e claro com justificativa"}
`.trim()

    try {
      const response = await clientAI.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
      })

      const text = response.text?.trim() ?? ''
      const parsed = parseGeminiJson(text)

      if (parsed) {
        return parsed
      }

      return {
        compatible: /\b(compatível|compativel|aprovad[ao]|viável|viavel)\b/i.test(text),
        opinion: text || 'Não foi possível extrair parecer estruturado do Gemini.'
      }
    } catch (error) {
      console.error('Gemini review failed, using local fallback.', error)
      return buildFallbackReview(params)
    }
  }
}
