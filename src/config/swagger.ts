import swaggerJsdoc from 'swagger-jsdoc';
import { PORT } from './env';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'User Authentication API',
    version: '1.0.0',
    description: 'API documentation for the User Authentication Service',
  },
  servers: [
    {
      url: `http://localhost:${PORT}`,
      description: 'Development server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      CreateUser: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: {
            type: 'string',
            format: 'email',
          },
          password: {
            type: 'string',
            format: 'password',
            minLength: 6,
          },
          roles: {
            type: 'array',
            items: {
              type: 'string',
            },
          },
        },
      },
      UpdateUserRoles: {
        type: 'object',
        required: ['roles'],
        properties: {
          roles: {
            type: 'array',
            items: {
              type: 'string',
            },
          },
        },
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
};

const options = {
  swaggerDefinition,
  apis: ['./src/routes/*.ts'], // Path to the API docs
};

export const swaggerSpec = swaggerJsdoc(options);
