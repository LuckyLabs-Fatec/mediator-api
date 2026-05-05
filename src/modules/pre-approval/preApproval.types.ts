export type PreApproveBody = {
  ideaDescription?: string
}

export type GeminiReviewResult = {
  compatible: boolean
  opinion: string
}

export type PreApprovalResult = {
  approved: boolean
  compatible: boolean
  opinion: string
  course: {
    id: string
    name: string
    description: string | null
  } | null
}
