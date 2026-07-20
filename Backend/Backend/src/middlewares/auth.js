import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AppError } from '../utils/app-error.js';

export async function authenticate(request) {
  const authorizationHeader = request.headers.authorization;

  if (!authorizationHeader?.startsWith('Bearer ')) {
    throw new AppError('Authentication token is required', 401);
  }

  try {
    request.user = jwt.verify(authorizationHeader.replace('Bearer ', '').trim(), env.JWT_SECRET);
  } catch {
    throw new AppError('Invalid or expired authentication token', 401);
  }
}

// Attaches request.user when a valid token is present, but never blocks the
// request. Use for public endpoints that behave differently for signed-in users
// (e.g. annotating jobs with the candidate's application status).
export async function authenticateOptional(request) {
  const authorizationHeader = request.headers.authorization;

  if (!authorizationHeader?.startsWith('Bearer ')) {
    return;
  }

  try {
    request.user = jwt.verify(authorizationHeader.replace('Bearer ', '').trim(), env.JWT_SECRET);
  } catch {
    // Ignore invalid/expired tokens for optional auth — treat as anonymous.
  }
}
