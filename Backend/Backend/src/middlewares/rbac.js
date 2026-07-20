import { AppError } from '../utils/app-error.js';

export function requireRole(...allowedRoles) {
  return async (request) => {
    if (!request.user) {
      throw new AppError('Authentication token is required', 401);
    }

    if (!allowedRoles.includes(request.user.role)) {
      throw new AppError('You do not have permission to access this resource', 403);
    }
  };
}
