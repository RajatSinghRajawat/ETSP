import { AppError } from '../utils/app-error.js';

export function validateBody(schema) {
  return async (request) => {
    const parsed = schema.safeParse(request.body);

    if (!parsed.success) {
      throw new AppError('Validation failed', 400, parsed.error.flatten().fieldErrors);
    }

    request.body = parsed.data;
  };
}
