import { Router } from 'express'
import { preApprovalController } from './preApproval.controller'

const preApprovalRouter = Router()

/**
 * @openapi
 * /pre-approve:
 *   post:
 *     tags:
 *       - Pre-approval
 *     summary: Avalia ideia com base na descrição do curso e parecer do Gemini
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PreApproveRequest'
 *     responses:
 *       200:
 *         description: Resultado da avaliação
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PreApproveResponse'
 *       400:
 *         description: Entrada inválida
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Erro interno
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
preApprovalRouter.post('/pre-approve', (req, res) => preApprovalController.create(req, res))

export { preApprovalRouter }
