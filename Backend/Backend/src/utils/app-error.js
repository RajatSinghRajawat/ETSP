export class AppError extends Error {
  constructor(message, statusCode = 500, details = undefined, code = undefined) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.details = details;
    // Machine-readable error code (e.g. PLAN_LIMIT_REACHED) so clients can
    // react to specific failures without parsing messages.
    this.code = code;
  }
}
