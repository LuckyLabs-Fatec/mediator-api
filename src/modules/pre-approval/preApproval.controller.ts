import type { Request, Response } from 'express'
import { preApprovalService } from './preApproval.service.default'
import type { PreApproveBody } from './preApproval.types'

export const preApprovalController = {
  async create(req: Request<unknown, unknown, PreApproveBody>, res: Response) {
    try {
      const { ideaDescription } = req.body

      if (!ideaDescription || !ideaDescription.trim()) {
        return res.status(400).send({
          error: 'ideaDescription é obrigatória.'
        })
      }

      const result = await preApprovalService.evaluateIdea(ideaDescription)
      return res.status(200).send(result)
    } catch (error) {
      console.error(error)
      return res.status(500).send({
        error: 'Erro ao processar pré-aprovação.'
      })
    }
  }
}
