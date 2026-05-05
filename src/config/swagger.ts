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
        url: 'http://localhost:3000'
      }
    ],
    components: {
      schemas: {
        PreApproveRequest: {
          type: 'object',
          properties: {
            ideaDescription: {
              type: 'string',
              example: 'Aplicativo para organizar monitorias por disciplina.'
            }
          },
          required: ['ideaDescription']
        },
        PreApproveResponse: {
          type: 'object',
          properties: {
            approved: { type: 'boolean', example: true },
            compatible: { type: 'boolean', example: true },
            opinion: {
              type: 'string',
              example: 'A ideia é aderente ao curso e pode ser implementada com escopo viável.'
            },
            course: {
              type: 'object',
              nullable: true,
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
