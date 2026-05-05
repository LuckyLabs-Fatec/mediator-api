import { describe, it, expect } from 'vitest'
import { createPreApprovalService } from './preApproval.service'

describe('preApproval integration (mocked deps)', () => {
  it('returns approved true when course found and gemini approves', async () => {
    const mockCourse = {
      id: 'e1111111-1111-4111-8111-111111111111',
      name: 'Systems Analysis',
      description: 'Technology projects connected to community needs.'
    }

    const service = createPreApprovalService({
      findCourseByIdeaDescription: async (_idea) => mockCourse,
      reviewCourseIdea: async (_params) => ({ compatible: true, opinion: 'Mocked: Parece viável.' })
    })

    const result = await service.evaluateIdea('Desenvolver plataforma de gerenciamento de demandas tecnológicas para projetos comunitários')

    expect(result.approved).toBe(true)
    expect(result.compatible).toBe(true)
    expect(result.course).toEqual(mockCourse)
    expect(typeof result.opinion).toBe('string')
  })
})
