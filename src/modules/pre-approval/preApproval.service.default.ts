import { geminiClient } from '../../lib/gemini'
import { courseRepository } from '../course/course.repository'
import { createPreApprovalService } from './preApproval.service'

export const preApprovalService = createPreApprovalService({
  findCourseByIdeaDescription: courseRepository.findBestByIdeaDescription,
  reviewCourseIdea: geminiClient.reviewCourseIdea
})
