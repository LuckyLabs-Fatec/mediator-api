import { prisma } from '../../lib/prisma'

type CourseRecord = {
  id: string
  name: string
  description: string | null
}

const normalize = (value: string) => value.toLowerCase()

const tokenize = (text: string) =>
  text
    .toLowerCase()
    .split(/[^a-zA-ZÀ-ÿ0-9]+/)
    .filter((token) => token.length >= 3)

const scoreCourseAgainstIdea = (course: Pick<CourseRecord, 'name' | 'description'>, ideaDescription: string): number => {
  const haystack = normalize(`${course.name} ${course.description ?? ''}`)
  const tokens = tokenize(ideaDescription)

  return tokens.reduce((acc, token) => (haystack.includes(token) ? acc + 1 : acc), 0)
}

export type CourseSummary = Pick<CourseRecord, 'id' | 'name' | 'description'>

export const courseRepository = {
  async findBestByIdeaDescription(ideaDescription: string): Promise<CourseSummary | null> {
    const keywords = tokenize(ideaDescription).slice(0, 8)

    const courses: CourseSummary[] = await prisma.course.findMany({
      where: {
        description: { not: null },
        ...(keywords.length > 0
          ? {
              OR: keywords.flatMap((keyword) => [
                {
                  description: {
                    contains: keyword,
                    mode: 'insensitive'
                  }
                },
                {
                  name: {
                    contains: keyword,
                    mode: 'insensitive'
                  }
                }
              ])
            }
          : {})
      },
      take: 15
    })

    if (courses.length === 0) {
      return null
    }

    const sorted = courses
      .map((course: CourseSummary) => ({
        course,
        score: scoreCourseAgainstIdea(course, ideaDescription)
      }))
      .sort((a: { course: CourseSummary; score: number }, b: { course: CourseSummary; score: number }) => b.score - a.score)

    return sorted[0]?.course ?? null
  }
}
