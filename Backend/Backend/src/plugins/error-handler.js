import { ZodError } from 'zod';
import { AppError } from '../utils/app-error.js';
import { logger } from '../utils/logger.js';

export async function errorHandlerPlugin(app) {
  app.setNotFoundHandler((request, reply) => {
    reply.code(404).send({
      success: false,
      message: `Route not found: ${request.method} ${request.url}`,
    });
  });

  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof AppError) {
      return reply.code(error.statusCode).send({
        success: false,
        message: error.message,
        ...(error.code ? { code: error.code } : {}),
        ...(error.details !== undefined ? { errors: error.details } : {}),
      });
    }

    if (error.statusCode && error.statusCode >= 400 && error.statusCode < 500) {
      return reply.code(error.statusCode).send({
        success: false,
        message: error.message,
      });
    }

    if (error instanceof ZodError) {
      return reply.code(400).send({
        success: false,
        message: 'Validation failed',
        errors: error.flatten().fieldErrors,
      });
    }

    logger.error(error.message, { stack: error.stack });
    return reply.code(500).send({
      success: false,
      message: 'Internal server error',
    });
  });
}
