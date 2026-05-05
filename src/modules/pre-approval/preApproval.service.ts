import type { GeminiReviewResult, PreApprovalResult } from './preApproval.types'

type CourseSummary = {
  id: string
  name: string
  description: string | null
}

export type PreApprovalDependencies = {
  findCourseByIdeaDescription: (ideaDescription: string) => Promise<CourseSummary | null>
  reviewCourseIdea: (params: { ideaDescription: string; courseName: string; courseDescription: string }) => Promise<GeminiReviewResult>
}

export const createPreApprovalService = (dependencies: PreApprovalDependencies) => ({
  async evaluateIdea(ideaDescription: string): Promise<PreApprovalResult> {
    const trimmedDescription = ideaDescription.trim()

    const course = await dependencies.findCourseByIdeaDescription(trimmedDescription)

    if (!course) {
      const opinion = 'Não foi encontrado curso com descrição compatível para realizar a validação.'
      return {
        approved: false,
        compatible: false,
        opinion,
        course: null
      }
    }

    const review = await dependencies.reviewCourseIdea({
      ideaDescription: trimmedDescription,
      courseName: course.name,
      courseDescription: course.description ?? 'Sem descrição cadastrada.'
    })

    return {
      approved: review.compatible,
      compatible: review.compatible,
      opinion: review.opinion,
      course
    }
  }
})
