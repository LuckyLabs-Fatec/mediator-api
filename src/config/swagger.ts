import swaggerJsdoc from 'swagger-jsdoc'
import type { Options } from 'swagger-jsdoc'

const options: Options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Mediator API',
      version: '1.0.0',
      description: 'API de pré-aprovação de ideias com validação por curso e Gemini.'
    },
    servers: [
      {
        url: '/'
      }
    ],
    components: {
      schemas: {
        PreApproveRequest: {
          type: 'object',
          properties: {
            ideaDescription: {
              type: 'string',
              description: 'Descrição detalhada da ideia de projeto',
              example: 'Sistema para rastreamento de projetos comunitários conectados a necessidades sociais e ambientais.'
            }
          },
          required: ['ideaDescription']
        },
        PreApproveResponse: {
          type: 'object',
          properties: {
            approved: { 
              type: 'boolean',
              description: 'Se a ideia foi aprovada no pré-approval',
              example: true
            },
            compatible: { 
              type: 'boolean',
              description: 'Se a ideia é compatível com algum curso',
              example: true
            },
            opinion: {
              type: 'string',
              description: 'Parecer técnico do Gemini sobre a viabilidade',
              example: 'A ideia é aderente ao curso e pode ser implementada com escopo viável.'
            },
            course: {
              type: 'object',
              nullable: true,
              description: 'Curso mais compatível com a ideia ou null se nenhum foi encontrado',
              properties: {
                id: { type: 'string', format: 'uuid' },
                name: { type: 'string' },
                description: { type: 'string', nullable: true }
              }
            }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    }
  },
  apis: ['src/modules/**/*.ts']
}

export const swaggerSpec = swaggerJsdoc(options)
