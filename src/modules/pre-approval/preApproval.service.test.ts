import { describe, expect, it, vi } from 'vitest'
import { createPreApprovalService } from './preApproval.service'

describe('preApprovalService.evaluateIdea', () => {
  it('retorna rejeição quando não encontra curso compatível', async () => {
    const service = createPreApprovalService({
      findCourseByIdeaDescription: vi.fn().mockResolvedValue(null),
      reviewCourseIdea: vi.fn()
    })

    const result = await service.evaluateIdea('Ideia sem correspondência')

    expect(result.approved).toBe(false)
    expect(result.compatible).toBe(false)
    expect(result.course).toBeNull()
    expect(result.opinion).toContain('Não foi encontrado curso')
  })

  it('retorna aprovação quando o Gemini classifica como compatível', async () => {
    const service = createPreApprovalService({
      findCourseByIdeaDescription: vi.fn().mockResolvedValue({
        id: 'course-1',
        name: 'Engenharia de Software',
        description: 'Curso focado em desenvolvimento de sistemas.'
      }),
      reviewCourseIdea: vi.fn().mockResolvedValue({
        compatible: true,
        opinion: 'A ideia está alinhada ao curso e é viável.'
      })
    })

    const result = await service.evaluateIdea('Plataforma para gerenciar projetos acadêmicos')

    expect(result.approved).toBe(true)
    expect(result.compatible).toBe(true)
    expect(result.course?.name).toBe('Engenharia de Software')
    expect(result.opinion).toBe('A ideia está alinhada ao curso e é viável.')
  })
})
